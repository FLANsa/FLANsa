# Production environment configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "qayd-pos"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "qayd-pos-prod-cluster"
}

variable "node_group_name" {
  description = "EKS node group name"
  type        = string
  default     = "qayd-pos-prod-nodes"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.large"]
}

variable "min_size" {
  description = "Minimum number of nodes"
  type        = number
  default     = 5
}

variable "max_size" {
  description = "Maximum number of nodes"
  type        = number
  default     = 20
}

variable "desired_size" {
  description = "Desired number of nodes"
  type        = number
  default     = 5
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 50
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage"
  type        = number
  default     = 200
}

variable "db_backup_retention_period" {
  description = "RDS backup retention period"
  type        = number
  default     = 30
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "qayd_user"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "qayd_pos_prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project     = "qayd-pos"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

variable "enable_monitoring" {
  description = "Enable monitoring"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable backup"
  type        = bool
  default     = true
}

variable "enable_autoscaling" {
  description = "Enable autoscaling"
  type        = bool
  default     = true
}

variable "enable_ingress" {
  description = "Enable ingress"
  type        = bool
  default     = true
}

variable "ingress_domain" {
  description = "Ingress domain"
  type        = string
  default     = "qayd-pos.example.com"
}

variable "ingress_class" {
  description = "Ingress class"
  type        = string
  default     = "nginx"
}

variable "certificate_arn" {
  description = "SSL certificate ARN"
  type        = string
  default     = ""
}

variable "enable_ssl" {
  description = "Enable SSL"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable CDN"
  type        = bool
  default     = true
}

variable "cdn_domain" {
  description = "CDN domain"
  type        = string
  default     = ""
}

variable "enable_waf" {
  description = "Enable WAF"
  type        = bool
  default     = true
}

variable "waf_rules" {
  description = "WAF rules"
  type        = list(string)
  default     = ["AWSManagedRulesCommonRuleSet", "AWSManagedRulesKnownBadInputsRuleSet"]
}

variable "enable_logging" {
  description = "Enable logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention days"
  type        = number
  default     = 90
}

variable "enable_alerts" {
  description = "Enable alerts"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Alert email"
  type        = string
  default     = "admin@example.com"
}

variable "enable_metrics" {
  description = "Enable metrics"
  type        = bool
  default     = true
}

variable "metrics_retention_days" {
  description = "Metrics retention days"
  type        = number
  default     = 30
}

variable "enable_tracing" {
  description = "Enable tracing"
  type        = bool
  default     = true
}

variable "tracing_sampling_rate" {
  description = "Tracing sampling rate"
  type        = number
  default     = 0.1
}

variable "enable_secrets_manager" {
  description = "Enable AWS Secrets Manager"
  type        = bool
  default     = true
}

variable "secrets_rotation_days" {
  description = "Secrets rotation days"
  type        = number
  default     = 30
}

variable "enable_parameter_store" {
  description = "Enable AWS Parameter Store"
  type        = bool
  default     = true
}

variable "parameter_store_tier" {
  description = "Parameter Store tier"
  type        = string
  default     = "Standard"
}

variable "enable_kms" {
  description = "Enable AWS KMS"
  type        = bool
  default     = true
}

variable "kms_key_rotation" {
  description = "KMS key rotation"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail"
  type        = bool
  default     = true
}

variable "cloudtrail_log_group" {
  description = "CloudTrail log group"
  type        = string
  default     = "qayd-pos-prod-cloudtrail"
}

variable "enable_config" {
  description = "Enable AWS Config"
  type        = bool
  default     = true
}

variable "config_rules" {
  description = "Config rules"
  type        = list(string)
  default     = ["s3-bucket-public-read-prohibited", "s3-bucket-public-write-prohibited"]
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty"
  type        = bool
  default     = true
}

variable "guardduty_finding_publishing_frequency" {
  description = "GuardDuty finding publishing frequency"
  type        = string
  default     = "FIFTEEN_MINUTES"
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub"
  type        = bool
  default     = true
}

variable "security_hub_standards" {
  description = "Security Hub standards"
  type        = list(string)
  default     = ["aws-foundational-security-best-practices", "cis-aws-foundations-benchmark"]
}

variable "enable_inspector" {
  description = "Enable AWS Inspector"
  type        = bool
  default     = true
}

variable "inspector_assessment_target" {
  description = "Inspector assessment target"
  type        = string
  default     = "qayd-pos-prod-assessment-target"
}

variable "enable_macie" {
  description = "Enable AWS Macie"
  type        = bool
  default     = true
}

variable "macie_finding_publishing_frequency" {
  description = "Macie finding publishing frequency"
  type        = string
  default     = "FIFTEEN_MINUTES"
}

variable "enable_access_analyzer" {
  description = "Enable AWS Access Analyzer"
  type        = bool
  default     = true
}

variable "access_analyzer_analyzer_name" {
  description = "Access Analyzer analyzer name"
  type        = string
  default     = "qayd-pos-prod-analyzer"
}

variable "enable_iam_access_analyzer" {
  description = "Enable IAM Access Analyzer"
  type        = bool
  default     = true
}

variable "iam_access_analyzer_analyzer_name" {
  description = "IAM Access Analyzer analyzer name"
  type        = string
  default     = "qayd-pos-prod-iam-analyzer"
}

variable "enable_iam_password_policy" {
  description = "Enable IAM password policy"
  type        = bool
  default     = true
}

variable "password_policy_minimum_length" {
  description = "Password policy minimum length"
  type        = number
  default     = 14
}

variable "password_policy_require_lowercase" {
  description = "Password policy require lowercase"
  type        = bool
  default     = true
}

variable "password_policy_require_uppercase" {
  description = "Password policy require uppercase"
  type        = bool
  default     = true
}

variable "password_policy_require_numbers" {
  description = "Password policy require numbers"
  type        = bool
  default     = true
}

variable "password_policy_require_symbols" {
  description = "Password policy require symbols"
  type        = bool
  default     = true
}

variable "password_policy_allow_users_to_change_password" {
  description = "Password policy allow users to change password"
  type        = bool
  default     = true
}

variable "password_policy_max_password_age" {
  description = "Password policy max password age"
  type        = number
  default     = 90
}

variable "password_policy_password_reuse_prevention" {
  description = "Password policy password reuse prevention"
  type        = number
  default     = 24
}

variable "password_policy_hard_expiry" {
  description = "Password policy hard expiry"
  type        = bool
  default     = false
}

variable "enable_mfa" {
  description = "Enable MFA"
  type        = bool
  default     = true
}

variable "mfa_policy_name" {
  description = "MFA policy name"
  type        = string
  default     = "qayd-pos-prod-mfa-policy"
}

variable "enable_sso" {
  description = "Enable SSO"
  type        = bool
  default     = true
}

variable "sso_provider_name" {
  description = "SSO provider name"
  type        = string
  default     = "qayd-pos-prod-sso"
}

variable "sso_provider_type" {
  description = "SSO provider type"
  type        = string
  default     = "SAML"
}

variable "sso_metadata_document" {
  description = "SSO metadata document"
  type        = string
  default     = ""
}

variable "enable_organizations" {
  description = "Enable AWS Organizations"
  type        = bool
  default     = true
}

variable "organization_feature_set" {
  description = "Organization feature set"
  type        = string
  default     = "ALL"
}

variable "organization_policy_type" {
  description = "Organization policy type"
  type        = string
  default     = "SERVICE_CONTROL_POLICY"
}

variable "organization_policy_name" {
  description = "Organization policy name"
  type        = string
  default     = "qayd-pos-prod-organization-policy"
}

variable "organization_policy_description" {
  description = "Organization policy description"
  type        = string
  default     = "Qayd POS Production Organization Policy"
}

variable "organization_policy_content" {
  description = "Organization policy content"
  type        = string
  default     = ""
}

variable "enable_budget" {
  description = "Enable AWS Budget"
  type        = bool
  default     = true
}

variable "budget_limit_amount" {
  description = "Budget limit amount"
  type        = number
  default     = 1000
}

variable "budget_limit_unit" {
  description = "Budget limit unit"
  type        = string
  default     = "USD"
}

variable "budget_time_unit" {
  description = "Budget time unit"
  type        = string
  default     = "MONTHLY"
}

variable "budget_time_period_start" {
  description = "Budget time period start"
  type        = string
  default     = "2024-01-01_00:00"
}

variable "budget_time_period_end" {
  description = "Budget time period end"
  type        = string
  default     = "2024-12-31_23:59"
}

variable "budget_notification_threshold" {
  description = "Budget notification threshold"
  type        = number
  default     = 80
}

variable "budget_notification_type" {
  description = "Budget notification type"
  type        = string
  default     = "ACTUAL"
}

variable "budget_notification_comparison_operator" {
  description = "Budget notification comparison operator"
  type        = string
  default     = "GREATER_THAN"
}

variable "budget_notification_subscriber_email_addresses" {
  description = "Budget notification subscriber email addresses"
  type        = list(string)
  default     = ["admin@example.com"]
}

variable "enable_cost_anomaly_detection" {
  description = "Enable cost anomaly detection"
  type        = bool
  default     = true
}

variable "cost_anomaly_detection_monitor_name" {
  description = "Cost anomaly detection monitor name"
  type        = string
  default     = "qayd-pos-prod-cost-monitor"
}

variable "cost_anomaly_detection_monitor_type" {
  description = "Cost anomaly detection monitor type"
  type        = string
  default     = "DIMENSIONAL"
}

variable "cost_anomaly_detection_monitor_dimension" {
  description = "Cost anomaly detection monitor dimension"
  type        = string
  default     = "SERVICE"
}

variable "cost_anomaly_detection_monitor_specification" {
  description = "Cost anomaly detection monitor specification"
  type        = string
  default     = "AWS_EC2_INSTANCE"
}

variable "cost_anomaly_detection_monitor_frequency" {
  description = "Cost anomaly detection monitor frequency"
  type        = string
  default     = "DAILY"

