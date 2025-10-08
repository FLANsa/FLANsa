# Terraform configuration for Qayd POS System
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

# AWS Provider
provider "aws" {
  region = var.aws_region
}

# Kubernetes Provider
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

# Helm Provider
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "qayd-pos-cluster"
}

variable "node_group_name" {
  description = "EKS node group name"
  type        = string
  default     = "qayd-pos-nodes"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "min_size" {
  description = "Minimum number of nodes"
  type        = number
  default     = 3
}

variable "max_size" {
  description = "Maximum number of nodes"
  type        = number
  default     = 10
}

variable "desired_size" {
  description = "Desired number of nodes"
  type        = number
  default     = 3
}

# Data sources
data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.cluster_name
}

# EKS Cluster
resource "aws_eks_cluster" "qayd_pos" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs    = ["0.0.0.0/0"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]

  tags = {
    Name        = var.cluster_name
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# EKS Node Group
resource "aws_eks_node_group" "qayd_pos" {
  cluster_name    = aws_eks_cluster.qayd_pos.name
  node_group_name = var.node_group_name
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id

  capacity_type  = "ON_DEMAND"
  instance_types = var.node_instance_types

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.max_size
    min_size     = var.min_size
  }

  update_config {
    max_unavailable_percentage = 25
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_readonly,
  ]

  tags = {
    Name        = var.node_group_name
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# IAM Roles
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role" "eks_node_group" {
  name = "${var.cluster_name}-node-group-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

# IAM Role Policy Attachments
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_readonly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# VPC
resource "aws_vpc" "qayd_pos" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "qayd-pos-vpc"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "qayd_pos" {
  vpc_id = aws_vpc.qayd_pos.id

  tags = {
    Name        = "qayd-pos-igw"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.qayd_pos.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "qayd-pos-public-${count.index + 1}"
    Environment = "production"
    Project     = "qayd-pos"
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.qayd_pos.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "qayd-pos-private-${count.index + 1}"
    Environment = "production"
    Project     = "qayd-pos"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.qayd_pos.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.qayd_pos.id
  }

  tags = {
    Name        = "qayd-pos-public-rt"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.qayd_pos.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.qayd_pos[count.index].id
  }

  tags = {
    Name        = "qayd-pos-private-rt-${count.index + 1}"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"

  tags = {
    Name        = "qayd-pos-nat-eip-${count.index + 1}"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

resource "aws_nat_gateway" "qayd_pos" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "qayd-pos-nat-${count.index + 1}"
    Environment = "production"
    Project     = "qayd-pos"
  }

  depends_on = [aws_internet_gateway.qayd_pos]
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# RDS Database
resource "aws_db_instance" "qayd_pos" {
  identifier = "qayd-pos-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "qayd_pos"
  username = "qayd_user"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.qayd_pos.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name        = "qayd-pos-db"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "qayd_pos" {
  name       = "qayd-pos-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "qayd-pos-db-subnet-group"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# Security Groups
resource "aws_security_group" "eks_cluster" {
  name_prefix = "qayd-pos-eks-cluster-"
  vpc_id      = aws_vpc.qayd_pos.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "qayd-pos-eks-cluster-sg"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "qayd-pos-eks-nodes-"
  vpc_id      = aws_vpc.qayd_pos.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "qayd-pos-eks-nodes-sg"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "qayd-pos-rds-"
  vpc_id      = aws_vpc.qayd_pos.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "qayd-pos-rds-sg"
    Environment = "production"
    Project     = "qayd-pos"
  }
}

# Variables
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Outputs
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

