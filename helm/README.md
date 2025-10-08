# Qayd POS Helm Chart

This Helm chart deploys the Qayd POS System on a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PostgreSQL (optional, can be enabled)
- Redis (optional, can be enabled)

## Installing the Chart

To install the chart with the release name `qayd-pos`:

```bash
helm install qayd-pos ./helm
```

## Uninstalling the Chart

To uninstall/delete the `qayd-pos` deployment:

```bash
helm delete qayd-pos
```

## Configuration

The following table lists the configurable parameters and their default values.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `3` |
| `image.repository` | Image repository | `qayd-pos` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Service target port | `3000` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `nginx` |
| `ingress.hosts` | Ingress hosts | `[{host: qayd-pos.example.com, paths: [{path: /, pathType: Prefix}]}]` |
| `ingress.tls` | Ingress TLS configuration | `[{secretName: qayd-pos-tls, hosts: [qayd-pos.example.com]}]` |
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `resources.requests.cpu` | CPU request | `250m` |
| `resources.requests.memory` | Memory request | `256Mi` |
| `autoscaling.enabled` | Enable autoscaling | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `3` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `70` |
| `autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization | `80` |
| `postgresql.enabled` | Enable PostgreSQL | `true` |
| `redis.enabled` | Enable Redis | `true` |
| `monitoring.enabled` | Enable monitoring | `true` |
| `backup.enabled` | Enable backup | `true` |
| `backup.schedule` | Backup schedule | `0 2 * * *` |
| `backup.retention` | Backup retention | `30d` |

## Secrets

The following secrets need to be configured:

| Secret Key | Description | Required |
|------------|-------------|----------|
| `database-url` | Database connection URL | Yes |
| `zatca-cert-pfx` | ZATCA certificate PFX (Base64) | Yes |
| `zatca-cert-password` | ZATCA certificate password | Yes |
| `firebase-api-key` | Firebase API key | Yes |
| `firebase-auth-domain` | Firebase auth domain | Yes |
| `firebase-project-id` | Firebase project ID | Yes |

## Examples

### Basic Installation

```bash
helm install qayd-pos ./helm \
  --set secrets.databaseUrl="postgresql://user:pass@host:5432/db" \
  --set secrets.zatcaCertPfx="base64-encoded-pfx" \
  --set secrets.zatcaCertPassword="password"
```

### Production Installation

```bash
helm install qayd-pos ./helm \
  --set replicaCount=5 \
  --set autoscaling.minReplicas=5 \
  --set autoscaling.maxReplicas=20 \
  --set resources.limits.cpu=1000m \
  --set resources.limits.memory=1Gi \
  --set ingress.hosts[0].host="pos.yourcompany.com" \
  --set ingress.tls[0].hosts[0]="pos.yourcompany.com" \
  --set ingress.tls[0].secretName="pos-tls"
```

### Development Installation

```bash
helm install qayd-pos-dev ./helm \
  --set replicaCount=1 \
  --set autoscaling.enabled=false \
  --set dev.enabled=true \
  --set dev.hotReload=true \
  --set dev.debugMode=true
```

## Monitoring

The chart includes monitoring configuration for Prometheus and Grafana.

### Prometheus Metrics

The application exposes metrics at `/metrics` endpoint.

### Grafana Dashboard

A Grafana dashboard is available for monitoring the application.

## Backup

The chart includes backup configuration for database and application data.

### Backup Schedule

Backups are scheduled using Cron expressions.

### Backup Retention

Backups are retained for the specified period.

## Security

The chart includes security configurations:

- Pod Security Context
- Network Policies
- Service Account
- RBAC

## Troubleshooting

### Common Issues

1. **Pod not starting**: Check resource limits and requests
2. **Ingress not working**: Verify ingress controller and TLS certificates
3. **Database connection failed**: Check database URL and credentials
4. **ZATCA integration failed**: Verify certificate and password

### Logs

View application logs:

```bash
kubectl logs -f deployment/qayd-pos
```

### Debug Mode

Enable debug mode:

```bash
helm upgrade qayd-pos ./helm --set dev.debugMode=true
```

## Support

For support, please contact:

- Email: support@qayd-pos.com
- GitHub: https://github.com/your-repo/qayd-pos/issues
- Documentation: https://docs.qayd-pos.com

