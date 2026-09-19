package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"pulsepoll-backend/internal/database"
	"pulsepoll-backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func CastVote(c *gin.Context) {
	pollID := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll ID format"})
		return
	}

	var req models.CastVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	clientIP := c.ClientIP()

	vote := models.Vote{
		ID:               primitive.NewObjectID(),
		PollID:           pollID,
		OptionID:         req.OptionID,
		VoterIP:          clientIP,
		VoterFingerprint: req.VoterFingerprint,
		VotedAt:          time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	err = database.MongoDB.Collection("polls").FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
	if err == nil {
		if !poll.IsActive || poll.ExpiresAt.Before(time.Now()) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Poll is no longer active"})
			return
		}
		
		validOption := false
		for _, opt := range poll.Options {
			if opt.ID == req.OptionID {
				validOption = true
				break
			}
		}
		if !validOption {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid option ID"})
			return
		}
	}

	_, err = database.MongoDB.Collection("votes").InsertOne(ctx, vote)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "You have already voted on this poll"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cast vote"})
		return
	}

	_, err = database.IncrementVote(pollID, req.OptionID)
	if err != nil {
		c.Error(err)
	}

	counts, err := database.GetPollCounts(pollID)
	if err == nil {
		update := models.VoteUpdate{
			PollID:   pollID,
			OptionID: req.OptionID,
			Counts:   counts,
		}
		database.PublishVoteUpdate(update)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote cast successfully"})
}
