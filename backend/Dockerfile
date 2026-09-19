# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy Go dependency files first
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o pulsepoll ./cmd

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install certificates for HTTPS connections to MongoDB Atlas
RUN apk --no-cache add ca-certificates

# Copy compiled application
COPY --from=builder /app/pulsepoll .

# Render will provide the PORT environment variable.
EXPOSE 8080

# Start the backend
CMD ["./pulsepoll"]