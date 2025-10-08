# Terraform Environments

This directory contains environment-specific configurations for the Qayd POS System.

## Environments

### Development (`development.tf`)
- **Purpose**: Local development and testing
- **Resources**: Minimal resources for cost optimization
- **Security**: Basic security settings
- **Monitoring**: Limited monitoring
- **Backup**: No automated backups
- **Scaling**: Manual scaling only

### Staging (`staging.tf`)
- **Purpose**: Pre-production testing and validation
- **Resources**: Moderate resources for testing
- **Security**: Production-like security settings
- **Monitoring**: Full monitoring enabled
- **Backup**: Automated backups enabled
- **Scaling**: Auto-scaling enabled

### Production (`production.tf`)
- **Purpose**: Live production environment
- **Resources**: Full resources for high availability
- **Security**: Maximum security settings
- **Monitoring**: Comprehensive monitoring
- **Backup**: Full backup strategy
- **Scaling**: Advanced auto-scaling

## Usage

### Deploy Development Environment
```bash
cd terraform/environments
terraform init
terraform plan -var-file="development.tfvars"
terraform apply -var-file="development.tfvars"
```

### Deploy Staging Environment
```bash
cd terraform/environments
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### Deploy Production Environment
```bash
cd terraform/environments
terraform init
terraform plan -var-file="production.tfvars"
terraform apply -var-file="production.tfvars"
```

## Configuration Files

Create environment-specific `.tfvars` files:

### `development.tfvars`
```hcl
aws_region = "us-east-1"
environment = "development"
cluster_name = "qayd-pos-dev-cluster"
node_instance_types = ["t3.small"]
min_size = 1
max_size = 3
desired_size = 1
db_instance_class = "db.t3.micro"
db_allocated_storage = 10
db_max_allocated_storage = 20
db_backup_retention_period = 1
db_password = "dev_password_here"
vpc_cidr = "10.1.0.0/16"
public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]
enable_monitoring = false
enable_backup = false
enable_autoscaling = false
enable_ingress = false
enable_ssl = false
enable_waf = false
enable_logging = true
log_retention_days = 7
enable_alerts = false
enable_metrics = false
enable_tracing = false
enable_secrets_manager = false
enable_parameter_store = false
enable_kms = false
enable_cloudtrail = false
enable_config = false
enable_guardduty = false
enable_security_hub = false
enable_inspector = false
enable_macie = false
enable_access_analyzer = false
enable_iam_access_analyzer = false
enable_iam_password_policy = false
enable_mfa = false
enable_sso = false
enable_organizations = false
enable_budget = false
enable_cost_anomaly_detection = false
```

### `staging.tfvars`
```hcl
aws_region = "us-east-1"
environment = "staging"
cluster_name = "qayd-pos-staging-cluster"
node_instance_types = ["t3.medium"]
min_size = 2
max_size = 5
desired_size = 2
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_max_allocated_storage = 50
db_backup_retention_period = 7
db_password = "staging_password_here"
vpc_cidr = "10.2.0.0/16"
public_subnet_cidrs = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24"]
enable_monitoring = true
enable_backup = true
enable_autoscaling = true
enable_ingress = true
enable_ssl = true
enable_waf = false
enable_logging = true
log_retention_days = 30
enable_alerts = true
enable_metrics = true
enable_tracing = false
enable_secrets_manager = true
enable_parameter_store = true
enable_kms = true
enable_cloudtrail = true
enable_config = true
enable_guardduty = true
enable_security_hub = true
enable_inspector = true
enable_macie = false
enable_access_analyzer = true
enable_iam_access_analyzer = true
enable_iam_password_policy = true
enable_mfa = true
enable_sso = true
enable_organizations = true
enable_budget = true
enable_cost_anomaly_detection = true
```

### `production.tfvars`
```hcl
aws_region = "us-east-1"
environment = "production"
cluster_name = "qayd-pos-prod-cluster"
node_instance_types = ["t3.large"]
min_size = 5
max_size = 20
desired_size = 5
db_instance_class = "db.t3.small"
db_allocated_storage = 50
db_max_allocated_storage = 200
db_backup_retention_period = 30
db_password = "production_password_here"
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
enable_monitoring = true
enable_backup = true
enable_autoscaling = true
enable_ingress = true
enable_ssl = true
enable_cdn = true
enable_waf = true
enable_logging = true
log_retention_days = 90
enable_alerts = true
enable_metrics = true
enable_tracing = true
enable_secrets_manager = true
enable_parameter_store = true
enable_kms = true
enable_cloudtrail = true
enable_config = true
enable_guardduty = true
enable_security_hub = true
enable_inspector = true
enable_macie = true
enable_access_analyzer = true
enable_iam_access_analyzer = true
enable_iam_password_policy = true
enable_mfa = true
enable_sso = true
enable_organizations = true
enable_budget = true
enable_cost_anomaly_detection = true
```

## Environment Differences

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Resources** | Minimal | Moderate | Full |
| **Security** | Basic | Production-like | Maximum |
| **Monitoring** | Limited | Full | Comprehensive |
| **Backup** | None | Automated | Full Strategy |
| **Scaling** | Manual | Auto | Advanced Auto |
| **SSL** | Disabled | Enabled | Enabled + CDN |
| **WAF** | Disabled | Disabled | Enabled |
| **Logging** | 7 days | 30 days | 90 days |
| **Alerts** | Disabled | Enabled | Enabled |
| **Tracing** | Disabled | Disabled | Enabled |
| **Macie** | Disabled | Disabled | Enabled |
| **Budget** | Disabled | $500/month | $1000/month |

## Security Considerations

### Development
- Basic security settings
- No WAF or advanced security features
- Limited monitoring and alerting
- No MFA or SSO requirements

### Staging
- Production-like security settings
- Basic WAF rules
- Full monitoring and alerting
- MFA and SSO enabled

### Production
- Maximum security settings
- Advanced WAF rules
- Comprehensive monitoring and alerting
- Full MFA, SSO, and organization policies

## Cost Optimization

### Development
- Use smallest instance types
- Disable unnecessary services
- No automated backups
- Manual scaling only

### Staging
- Use moderate instance types
- Enable essential services only
- Basic backup strategy
- Auto-scaling enabled

### Production
- Use appropriate instance types
- Enable all necessary services
- Full backup strategy
- Advanced auto-scaling

## Monitoring and Alerting

### Development
- Basic logging only
- No alerts
- No metrics collection
- No tracing

### Staging
- Full logging
- Basic alerts
- Metrics collection
- No tracing

### Production
- Comprehensive logging
- Full alerting
- Advanced metrics
- Distributed tracing

## Backup Strategy

### Development
- No automated backups
- Manual snapshots only
- No cross-region replication

### Staging
- Daily automated backups
- 7-day retention
- No cross-region replication

### Production
- Multiple daily backups
- 30-day retention
- Cross-region replication
- Point-in-time recovery

## Disaster Recovery

### Development
- No DR strategy
- Single AZ deployment
- No failover procedures

### Staging
- Basic DR strategy
- Multi-AZ deployment
- Basic failover procedures

### Production
- Comprehensive DR strategy
- Multi-region deployment
- Advanced failover procedures
- RTO/RPO targets

## Maintenance

### Development
- Manual updates
- No maintenance windows
- No change management

### Staging
- Automated updates
- Maintenance windows
- Basic change management

### Production
- Controlled updates
- Scheduled maintenance windows
- Full change management
- Rollback procedures

## Support

For questions about environment configuration:

- Email: support@qayd-pos.com
- GitHub: https://github.com/your-repo/qayd-pos/issues
- Documentation: https://docs.qayd-pos.com

