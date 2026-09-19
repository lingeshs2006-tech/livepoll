package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
    MongoURI      string
    RedisAddr     string
    RedisPassword string
    JWTSecret     string
    ServerPort    string
    DBName        string
}

func LoadConfig() *Config {

	// Load .env from backend folder
	_ = godotenv.Load("../.env")

	return &Config{
    MongoURI:      getEnv("MONGO_URI", "mongodb://localhost:27017"),
    RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
    RedisPassword: getEnv("REDIS_PASSWORD", ""),
    JWTSecret:     getEnv("JWT_SECRET", "pulsepoll-secret-key-change-in-production"),
    ServerPort:    getEnv("PORT", getEnv("SERVER_PORT", "8080")),
    DBName:        getEnv("DB_NAME", "livepoll"),
}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}

	return fallback
}