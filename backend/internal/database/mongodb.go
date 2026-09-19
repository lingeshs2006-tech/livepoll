package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client
var MongoDB *mongo.Database

func ConnectMongo(uri, dbName string) *mongo.Client {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	MongoClient = client
	MongoDB = client.Database(dbName)

	createIndexes()

	log.Println("Connected to MongoDB successfully")
	return client
}

func createIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	usersCol := MongoDB.Collection("users")
	_, err := usersCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Failed to create users index: %v", err)
	}

	votesCol := MongoDB.Collection("votes")
	_, err = votesCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "poll_id", Value: 1},
			{Key: "voter_fingerprint", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Failed to create votes index: %v", err)
	}
}
