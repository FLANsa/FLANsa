# Terraform Infrastructure for Qayd POS System

This Terraform configuration deploys the complete infrastructure for the Qayd POS System on AWS.

## Architecture

The infrastructure includes:

- **EKS Cluster**: Kubernetes cluster for running the application
- **RDS PostgreSQL**: Managed database for application data
- **VPC**: Virtual Private Cloud with public and private subnets
- **Security Groups**: Network security rules
- **IAM Roles**: Access control and permissions
- **Monitoring**: CloudWatch logs and metrics
- **Backup**: Automated backups for database and application data

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl
- helm

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/qayd-pos.git
   cd qayd-pos/terraform
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```

3. **Plan the deployment**
   ```bash
   terraform plan -var="db_password=your_secure_password"
   ```

4. **Apply the configuration**
   ```bash
   terraform apply -var="db_password=your_secure_password"
   ```

5. **Configure kubectl**
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name qayd-pos-cluster
   ```

6. **Deploy the application**
   ```bash
   helm install qayd-pos ../helm
   ```

## Configuration

### Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region | `us-east-1` | No |
| `cluster_name` | EKS cluster name | `qayd-pos-cluster` | No |
| `node_instance_types` | EC2 instance types | `["t3.medium"]` | No |
| `min_size` | Minimum nodes | `3` | No |
| `max_size` | Maximum nodes | `10` | No |
| `desired_size` | Desired nodes | `3` | No |
| `db_password` | Database password | - | Yes |
| `db_instance_class` | RDS instance class | `db.t3.micro` | No |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` | No |

### Environment-specific Configuration

Create a `terraform.tfvars` file for environment-specific values:

```hcl
aws_region = "us-east-1"
environment = "production"
cluster_name = "qayd-pos-prod"
node_instance_types = ["t3.large"]
min_size = 5
max_size = 20
desired_size = 5
db_password = "your_secure_password"
db_instance_class = "db.t3.small"
vpc_cidr = "10.0.0.0/16"
```

## Security

### IAM Roles

The configuration creates the following IAM roles:

- **EKS Cluster Role**: For the EKS control plane
- **EKS Node Group Role**: For worker nodes

### Security Groups

- **EKS Cluster SG**: Allows communication between control plane and worker nodes
- **EKS Nodes SG**: Allows communication between worker nodes
- **RDS SG**: Allows database access from EKS nodes

### Network Security

- VPC with public and private subnets
- NAT Gateways for outbound internet access
- Security groups with least privilege access
- Network ACLs for additional security

## Monitoring

### CloudWatch

- Application logs
- System metrics
- Custom metrics
- Alarms and notifications

### Prometheus & Grafana

- Application metrics
- Infrastructure metrics
- Custom dashboards
- Alerting rules

## Backup

### Database Backup

- Automated daily backups
- Point-in-time recovery
- Cross-region backup replication
- Backup retention policies

### Application Backup

- Kubernetes persistent volumes
- Configuration backups
- Secret backups
- Disaster recovery procedures

## Scaling

### Horizontal Pod Autoscaler

- CPU-based scaling
- Memory-based scaling
- Custom metrics scaling
- Scaling policies

### Cluster Autoscaler

- Node group scaling
- Spot instance support
- Cost optimization
- Scaling policies

## Cost Optimization

### Resource Optimization

- Right-sizing instances
- Spot instance usage
- Reserved instances
- Savings plans

### Cost Monitoring

- Budget alerts
- Cost anomaly detection
- Resource tagging
- Cost allocation

## Disaster Recovery

### Backup Strategy

- Multi-region backups
- Cross-region replication
- Backup testing
- Recovery procedures

### High Availability

- Multi-AZ deployment
- Load balancing
- Health checks
- Failover procedures

## Troubleshooting

### Common Issues

1. **Cluster not accessible**
   - Check security groups
   - Verify IAM roles
   - Check VPC configuration

2. **Database connection failed**
   - Check RDS security groups
   - Verify database credentials
   - Check network connectivity

3. **Application not starting**
   - Check resource limits
   - Verify environment variables
   - Check logs

### Debugging Commands

```bash
# Check cluster status
kubectl get nodes
kubectl get pods -A

# Check logs
kubectl logs -f deployment/qayd-pos

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Check resources
kubectl top nodes
kubectl top pods
```

## Maintenance

### Updates

- Cluster version updates
- Node group updates
- Application updates
- Security patches

### Monitoring

- Health checks
- Performance monitoring
- Security monitoring
- Cost monitoring

## Support

For support and questions:

- Email: support@qayd-pos.com
- GitHub: https://github.com/your-repo/qayd-pos/issues
- Documentation: https://docs.qayd-pos.com

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

