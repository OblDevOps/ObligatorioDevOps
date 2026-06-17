FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o orders .

FROM gcr.io/distroless/static
WORKDIR /app
COPY --from=builder /app/orders .
EXPOSE 8080
USER nonroot
CMD ["/app/orders"]
