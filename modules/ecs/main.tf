# ECS Cluster - Agrupación lógica
resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  # Manda métricas a CloudWatch
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
  }
}
