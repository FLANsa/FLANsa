# Terraform outputs for Qayd POS System

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.qayd_pos.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = aws_eks_cluster.qayd_pos.vpc_config[0].cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = aws_iam_role.eks_cluster.name
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.qayd_pos.certificate_authority[0].data
}

output "cluster_name" {
  description = "The name/id of the EKS cluster"
  value       = aws_eks_cluster.qayd_pos.name
}

output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.qayd_pos.endpoint
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.qayd_pos.port
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.qayd_pos.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.qayd_pos.id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.qayd_pos[*].id
}

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    eks_cluster = aws_security_group.eks_cluster.id
    eks_nodes   = aws_security_group.eks_nodes.id
    rds         = aws_security_group.rds.id
  }
}

output "route_table_ids" {
  description = "Route Table IDs"
  value = {
    public  = aws_route_table.public.id
    private = aws_route_table.private[*].id
  }
}

output "availability_zones" {
  description = "Availability Zones"
  value       = data.aws_availability_zones.available.names
}

output "region" {
  description = "AWS Region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment"
  value       = var.environment
}

output "project_name" {
  description = "Project Name"
  value       = var.project_name
}

output "tags" {
  description = "Common Tags"
  value       = var.tags
}

