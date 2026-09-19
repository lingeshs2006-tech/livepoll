package database

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
	"pulsepoll-backend/internal/models"
)

var RedisClient *redis.Client
var ctx = context.Background()

func ConnectRedis(addr string, password string) *redis.Client {
    client := redis.NewClient(&redis.Options{
        Addr:     addr,
        Password: password,
    })

	_, err := client.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	RedisClient = client
	log.Println("Connected to Redis successfully")
	return client
}

func InitPollCounters(pollID string, options []models.PollOption) error {
	key := fmt.Sprintf("poll:%s:counts", pollID)
	pipe := RedisClient.Pipeline()
	for _, opt := range options {
		pipe.HSet(ctx, key, opt.ID, 0)
	}
	_, err := pipe.Exec(ctx)
	return err
}

func IncrementVote(pollID, optionID string) (int, error) {
	key := fmt.Sprintf("poll:%s:counts", pollID)
	val, err := RedisClient.HIncrBy(ctx, key, optionID, 1).Result()
	return int(val), err
}

func GetPollCounts(pollID string) (map[string]int, error) {
	key := fmt.Sprintf("poll:%s:counts", pollID)
	res, err := RedisClient.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	
	counts := make(map[string]int)
	for k, v := range res {
		var count int
		fmt.Sscanf(v, "%d", &count)
		counts[k] = count
	}
	return counts, nil
}

func PublishVoteUpdate(update models.VoteUpdate) error {
	channel := fmt.Sprintf("poll:%s:votes", update.PollID)
	data, err := json.Marshal(update)
	if err != nil {
		return err
	}
	return RedisClient.Publish(ctx, channel, data).Err()
}

func SubscribeToVotes(pollID string) *redis.PubSub {
	channel := fmt.Sprintf("poll:%s:votes", pollID)
	return RedisClient.Subscribe(ctx, channel)
}
