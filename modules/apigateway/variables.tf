variable "service_name" {
  description = "Nombre base para la API Gateway"
  type        = string
}

variable "backend_dns_name" {
  description = "DNS del backend HTTP al que se va a enrutar la API"
  type        = string
}

variable "throttling_rate_limit" {
  description = "Límite de requests por segundo en el stage"
  type        = number
  default     = 1000
}

variable "throttling_burst_limit" {
  description = "Límite de burst en el stage"
  type        = number
  default     = 2000
}