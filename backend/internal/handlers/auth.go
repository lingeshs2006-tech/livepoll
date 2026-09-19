package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"pulsepoll-backend/internal/database"
	"pulsepoll-backend/internal/middleware"
	"pulsepoll-backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		CreatedAt: time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = database.MongoDB.Collection("users").InsertOne(ctx, user)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	token, err := middleware.GenerateToken(user.ID.Hex(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	userResponse := models.User{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  &userResponse,
	})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := database.MongoDB.Collection("users").FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := middleware.GenerateToken(user.ID.Hex(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	userResponse := models.User{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  &userResponse,
	})
}

func GetMe(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	objID, err := primitive.ObjectIDFromHex(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = database.MongoDB.Collection("users").FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
