package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"pulsepoll-backend/internal/database"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(c *gin.Context) {
	pollID := c.Param("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket: %v", err)
		return
	}
	defer conn.Close()

	pubsub := database.SubscribeToVotes(pollID)
	defer pubsub.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	counts, err := database.GetPollCounts(pollID)
	if err == nil && len(counts) > 0 {
		initialData, _ := json.Marshal(map[string]interface{}{
			"type":   "initial_counts",
			"counts": counts,
		})
		conn.WriteMessage(websocket.TextMessage, initialData)
	}

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			}
		}
	}()

	go func() {
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				cancel()
				break
			}
		}
	}()

	ch := pubsub.Channel()
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-ch:
			err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload))
			if err != nil {
				log.Printf("Error writing websocket message: %v", err)
				return
			}
		}
	}
}
