package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"pulsepoll-backend/internal/config"
	"pulsepoll-backend/internal/database"
	"pulsepoll-backend/internal/handlers"
	"pulsepoll-backend/internal/middleware"
)

func main() {
	cfg := config.LoadConfig()

	database.ConnectMongo(cfg.MongoURI, cfg.DBName)
	database.ConnectRedis(cfg.RedisAddr, cfg.RedisPassword)

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/signup", handlers.Signup)
			auth.POST("/login", handlers.Login)
			auth.GET("/me", middleware.AuthRequired(), handlers.GetMe)
		}

		polls := api.Group("/polls")
		{
			polls.GET("/:id", handlers.GetPoll)
			polls.POST("/:id/vote", handlers.CastVote)

			protected := polls.Group("")
			protected.Use(middleware.AuthRequired())
			{
				protected.POST("", handlers.CreatePoll)
				protected.GET("", handlers.GetMyPolls)
				protected.PUT("/:id/toggle", handlers.TogglePollStatus)
			}
		}
	}

	r.GET("/ws/polls/:id", handlers.HandleWebSocket)

	log.Printf("Server starting on port %s...", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
