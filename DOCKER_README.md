# Docker Deployment Guide

## Quick Start

### Local Development

```bash
# Build the Docker image
docker build -t energy-dashboard .

# Run the container
docker run -d -p 8080:80 --name energy-dashboard energy-dashboard

# Access the dashboard
open http://localhost:8080
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Docker Commands Reference

### Building

```bash
# Build image
docker build -t energy-dashboard .

# Build with no cache
docker build --no-cache -t energy-dashboard .

# Build with specific tag
docker build -t energy-dashboard:v1.0.0 .
```

### Running

```bash
# Run in detached mode
docker run -d -p 8080:80 --name energy-dashboard energy-dashboard

# Run with auto-restart
docker run -d -p 8080:80 --restart unless-stopped --name energy-dashboard energy-dashboard

# Run with environment variables
docker run -d -p 8080:80 -e NGINX_HOST=localhost --name energy-dashboard energy-dashboard
```

### Managing

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View logs
docker logs energy-dashboard

# Follow logs
docker logs -f energy-dashboard

# Stop container
docker stop energy-dashboard

# Start container
docker start energy-dashboard

# Restart container
docker restart energy-dashboard

# Remove container
docker rm energy-dashboard

# Remove image
docker rmi energy-dashboard
```

### Debugging

```bash
# Execute bash inside container
docker exec -it energy-dashboard sh

# Check container stats
docker stats energy-dashboard

# Inspect container
docker inspect energy-dashboard

# View container processes
docker top energy-dashboard
```

## Container Details

- **Base Image**: nginx:alpine
- **Exposed Port**: 80
- **Working Directory**: /usr/share/nginx/html
- **Health Check**: Enabled (checks every 30s)
- **Auto-restart**: Configured in docker-compose

## Files Included in Container

```
/usr/share/nginx/html/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── dataLoader.js
│   ├── filters.js
│   ├── tooltip.js
│   ├── utils.js
│   └── charts/
│       └── (all 22 chart modules)
└── data/
    └── clean_energy.csv
```

## Environment Variables

The container supports the following environment variables:

- `NGINX_HOST`: Server hostname (default: localhost)
- `NGINX_PORT`: Server port (default: 80)

## Health Check

The container includes a health check that:
- Runs every 30 seconds
- Has a 3-second timeout
- Retries 3 times before marking as unhealthy
- Has a 5-second start period

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs energy-dashboard

# Check if port is already in use
netstat -ano | findstr :8080  # Windows
lsof -i :8080                  # Mac/Linux
```

### Cannot access dashboard

```bash
# Verify container is running
docker ps | grep energy-dashboard

# Check container health
docker inspect --format='{{.State.Health.Status}}' energy-dashboard

# Test from inside container
docker exec energy-dashboard wget -O- http://localhost:80
```

### Need to rebuild after changes

```bash
# Stop and remove old container
docker stop energy-dashboard
docker rm energy-dashboard

# Rebuild image
docker build -t energy-dashboard .

# Run new container
docker run -d -p 8080:80 --name energy-dashboard energy-dashboard
```

## Production Best Practices

1. **Use specific tags**: `docker build -t energy-dashboard:1.0.0 .`
2. **Enable auto-restart**: `--restart unless-stopped`
3. **Set resource limits**: `--memory="512m" --cpus="0.5"`
4. **Use volumes for logs**: `-v /var/log/nginx:/var/log/nginx`
5. **Monitor health**: Regular health check monitoring
6. **Update regularly**: Keep base image updated

## Multi-stage Builds (Future Enhancement)

For even smaller images, consider multi-stage builds:

```dockerfile
# Build stage
FROM node:alpine AS builder
WORKDIR /app
# ... build steps ...

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## Docker Hub Publishing

```bash
# Tag for Docker Hub
docker tag energy-dashboard:latest yourusername/energy-dashboard:latest

# Push to Docker Hub
docker push yourusername/energy-dashboard:latest
```
