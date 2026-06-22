output "redis_endpoint" {
  description = "DNS del NLB de Redis"
  value       = aws_lb.redis.dns_name
}
