package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"pulsepoll-backend/internal/database"
	"pulsepoll-backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreatePoll(c *gin.Context) {
	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr, exists := c.Get("userID")
	var creatorID string
	if exists {
		creatorID = userIDStr.(string)
	}

	var pollOptions []models.PollOption
	for _, text := range req.Options {
		pollOptions = append(pollOptions, models.PollOption{
			ID:        uuid.New().String(),
			Text:      text,
			VoteCount: 0,
		})
	}

	expiresAt := time.Now().Add(time.Hour * 24 * 7)
	if req.ExpiresIn > 0 {
		expiresAt = time.Now().Add(time.Duration(req.ExpiresIn) * time.Minute)
	}

	poll := models.Poll{
		ID:            primitive.NewObjectID(),
		Title:         req.Title,
		Description:   req.Description,
		Options:       pollOptions,
		CreatorID:     creatorID,
		IsActive:      true,
		AllowMultiple: req.AllowMultiple,
		ExpiresAt:     expiresAt,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := database.MongoDB.Collection("polls").InsertOne(ctx, poll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create poll"})
		return
	}

	if err := database.InitPollCounters(poll.ID.Hex(), poll.Options); err != nil {
		c.Error(err)
	}

	c.JSON(http.StatusCreated, poll)
}

func GetPoll(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID format"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	err = database.MongoDB.Collection("polls").FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	counts, err := database.GetPollCounts(id)
	if err == nil && len(counts) > 0 {
		var totalVotes int
		for i, opt := range poll.Options {
			poll.Options[i].VoteCount = counts[opt.ID]
			totalVotes += counts[opt.ID]
		}
		
		response := models.PollResponse{
			ID:            poll.ID.Hex(),
			Title:         poll.Title,
			Description:   poll.Description,
			Options:       poll.Options,
			CreatorID:     poll.CreatorID,
			IsActive:      poll.IsActive,
			AllowMultiple: poll.AllowMultiple,
			ExpiresAt:     poll.ExpiresAt,
			CreatedAt:     poll.CreatedAt,
			UpdatedAt:     poll.UpdatedAt,
			TotalVotes:    totalVotes,
		}
		c.JSON(http.StatusOK, response)
		return
	}

	c.JSON(http.StatusOK, poll)
}

func GetMyPolls(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	creatorID := userIDStr.(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := database.MongoDB.Collection("polls").Find(ctx, bson.M{"creator_id": creatorID}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls"})
		return
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err = cursor.All(ctx, &polls); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode polls"})
		return
	}

	if polls == nil {
		polls = []models.Poll{}
	}

	// Enrich polls with vote counts from Redis
	var pollResponses []models.PollResponse
	for _, poll := range polls {
		counts, _ := database.GetPollCounts(poll.ID.Hex())
		var totalVotes int
		for i, opt := range poll.Options {
			poll.Options[i].VoteCount = counts[opt.ID]
			totalVotes += counts[opt.ID]
		}

		pollResponses = append(pollResponses, models.PollResponse{
			ID:            poll.ID.Hex(),
			Title:         poll.Title,
			Description:   poll.Description,
			Options:       poll.Options,
			CreatorID:     poll.CreatorID,
			IsActive:      poll.IsActive,
			AllowMultiple: poll.AllowMultiple,
			ExpiresAt:     poll.ExpiresAt,
			CreatedAt:     poll.CreatedAt,
			UpdatedAt:     poll.UpdatedAt,
			TotalVotes:    totalVotes,
		})
	}

	c.JSON(http.StatusOK, pollResponses)
}

func TogglePollStatus(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID format"})
		return
	}

	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	creatorID := userIDStr.(string)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	err = database.MongoDB.Collection("polls").FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return
	}

	if poll.CreatorID != creatorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only modify your own polls"})
		return
	}

	newStatus := !poll.IsActive
	_, err = database.MongoDB.Collection("polls").UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"is_active": newStatus, "updated_at": time.Now()}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update poll status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_active": newStatus, "message": "Poll status updated"})
}

