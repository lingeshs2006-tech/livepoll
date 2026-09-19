package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	Email     string             `bson:"email" json:"email"`
	Password  string             `bson:"password" json:"-"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type PollOption struct {
	ID        string `bson:"id" json:"id"`
	Text      string `bson:"text" json:"text"`
	VoteCount int    `bson:"vote_count" json:"vote_count"`
}

type Poll struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title         string             `bson:"title" json:"title"`
	Description   string             `bson:"description" json:"description"`
	Options       []PollOption       `bson:"options" json:"options"`
	CreatorID     string             `bson:"creator_id" json:"creator_id"`
	IsActive      bool               `bson:"is_active" json:"is_active"`
	AllowMultiple bool               `bson:"allow_multiple" json:"allow_multiple"`
	ExpiresAt     time.Time          `bson:"expires_at" json:"expires_at"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

type Vote struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID           string             `bson:"poll_id" json:"poll_id"`
	OptionID         string             `bson:"option_id" json:"option_id"`
	VoterIP          string             `bson:"voter_ip" json:"voter_ip"`
	VoterFingerprint string             `bson:"voter_fingerprint" json:"voter_fingerprint"`
	VotedAt          time.Time          `bson:"voted_at" json:"voted_at"`
}

type SignupRequest struct {
	Name     string `json:"name" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreatePollRequest struct {
	Title         string   `json:"title" binding:"required,min=3,max=200"`
	Description   string   `json:"description"`
	Options       []string `json:"options" binding:"required,min=2,dive,required"`
	AllowMultiple bool     `json:"allow_multiple"`
	ExpiresIn     int      `json:"expires_in"` // minutes
}

type CastVoteRequest struct {
	OptionID         string `json:"option_id" binding:"required"`
	VoterFingerprint string `json:"voter_fingerprint" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type PollResponse struct {
	ID            string       `json:"id"`
	Title         string       `json:"title"`
	Description   string       `json:"description"`
	Options       []PollOption `json:"options"`
	CreatorID     string       `json:"creator_id"`
	IsActive      bool         `json:"is_active"`
	AllowMultiple bool         `json:"allow_multiple"`
	ExpiresAt     time.Time    `json:"expires_at"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
	TotalVotes    int          `json:"total_votes"`
}

type VoteUpdate struct {
	PollID   string         `json:"poll_id"`
	OptionID string         `json:"option_id"`
	Counts   map[string]int `json:"counts"`
}
