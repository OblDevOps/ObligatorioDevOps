output "api_id" {
  description = "ID de la API Gateway HTTP"
  value       = aws_apigatewayv2_api.main.id
}

output "invoke_url" {
  description = "URL pública para invocar la API Gateway"
  value       = aws_apigatewayv2_stage.main.invoke_url
}