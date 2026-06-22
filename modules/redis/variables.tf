variable "environment" {
  type = string
}
variable "vpc_id" {
  type = string
}
variable "vpc_cidr" {
  type = string
}
variable "private_subnet_ids" {
  type = list(string)
}
variable "cluster_id" {
  type = string
}
variable "execution_role_arn" {
  type = string
}
variable "cpu" {
  type    = number
  default = 256
}
variable "memory" {
  type    = number
  default = 512
}
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
