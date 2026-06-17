FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o catalog .

FROM gcr.io/distroless/static
WORKDIR /app
COPY --from=builder /app/catalog .
COPY --from=builder /app/repository/products.json ./repository/
COPY --from=builder /app/repository/tags.json ./repository/
EXPOSE 8080
USER nonroot
CMD ["/app/catalog"]
