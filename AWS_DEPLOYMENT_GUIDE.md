# AWS Deployment Guide for Energy Transition Dashboard

This guide covers multiple AWS deployment options for the Energy Transition Analytics Dashboard.

## Table of Contents
1. [AWS ECS (Elastic Container Service) with Fargate](#option-1-aws-ecs-with-fargate)
2. [AWS EC2 with Docker](#option-2-aws-ec2-with-docker)
3. [AWS Elastic Beanstalk](#option-3-aws-elastic-beanstalk)
4. [AWS Amplify (Static Hosting)](#option-4-aws-amplify)

---

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Docker installed locally
- Git repository access

### Install AWS CLI
```bash
# Windows (PowerShell)
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Mac
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your default output format (json)
```

---

## Option 1: AWS ECS with Fargate (Recommended)

**Best for**: Production deployments, auto-scaling, managed infrastructure

### Step 1: Build and Push Docker Image to ECR

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name energy-dashboard --region us-east-1

# 2. Get ECR login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build Docker image
docker build -t energy-dashboard .

# 4. Tag the image
docker tag energy-dashboard:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/energy-dashboard:latest

# 5. Push to ECR
docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/energy-dashboard:latest
```

### Step 2: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name energy-dashboard-cluster --region us-east-1
```

### Step 3: Create Task Definition

Create a file named `ecs-task-definition.json`:

```json
{
  "family": "energy-dashboard-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "energy-dashboard",
      "image": "<your-account-id>.dkr.ecr.us-east-1.amazonaws.com/energy-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/energy-dashboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register the task definition:

```bash
# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/energy-dashboard --region us-east-1

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json --region us-east-1
```

### Step 4: Create ECS Service

```bash
# Create security group
aws ec2 create-security-group \
  --group-name energy-dashboard-sg \
  --description "Security group for Energy Dashboard" \
  --vpc-id <your-vpc-id> \
  --region us-east-1

# Allow HTTP traffic
aws ec2 authorize-security-group-ingress \
  --group-id <security-group-id> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Create ECS service
aws ecs create-service \
  --cluster energy-dashboard-cluster \
  --service-name energy-dashboard-service \
  --task-definition energy-dashboard-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-id>],securityGroups=[<security-group-id>],assignPublicIp=ENABLED}" \
  --region us-east-1
```

### Step 5: Access Your Dashboard

```bash
# Get the public IP of your task
aws ecs list-tasks --cluster energy-dashboard-cluster --region us-east-1
aws ecs describe-tasks --cluster energy-dashboard-cluster --tasks <task-arn> --region us-east-1
```

Access your dashboard at: `http://<public-ip>`

---

## Option 2: AWS EC2 with Docker

**Best for**: Full control, custom configurations

### Step 1: Launch EC2 Instance

```bash
# Launch EC2 instance (Amazon Linux 2)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name <your-key-pair> \
  --security-group-ids <security-group-id> \
  --region us-east-1 \
  --user-data file://ec2-user-data.sh
```

Create `ec2-user-data.sh`:

```bash
#!/bin/bash
yum update -y
yum install -y docker git
service docker start
usermod -a -G docker ec2-user

# Clone repository
cd /home/ec2-user
git clone https://github.com/thedatascientistguy-del/DVT_Project.git
cd DVT_Project

# Build and run Docker container
docker build -t energy-dashboard .
docker run -d -p 80:80 --name energy-dashboard --restart unless-stopped energy-dashboard
```

### Step 2: Configure Security Group

Allow inbound traffic on port 80 (HTTP):

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <security-group-id> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

### Step 3: Access Dashboard

Get your EC2 public IP and access at: `http://<ec2-public-ip>`

---

## Option 3: AWS Elastic Beanstalk

**Best for**: Quick deployment, auto-scaling

### Step 1: Install EB CLI

```bash
pip install awsebcli
```

### Step 2: Initialize Elastic Beanstalk

```bash
# Initialize EB application
eb init -p docker energy-dashboard --region us-east-1

# Create environment and deploy
eb create energy-dashboard-env --instance-type t2.micro

# Deploy
eb deploy
```

### Step 3: Access Dashboard

```bash
# Get environment URL
eb status

# Open in browser
eb open
```

---

## Option 4: AWS Amplify (Static Hosting - No Docker)

**Best for**: Simplest deployment, serverless

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Step 2: Deploy to Amplify

```bash
# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Choose options:
# - Select: Hosting with Amplify Console
# - Select: Manual deployment

# Publish
amplify publish
```

**Alternative: Deploy via AWS Console**

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: (leave empty)
   - Build output directory: `.` (root)
5. Click "Save and deploy"

---

## Deployment Comparison

| Option | Cost | Complexity | Scalability | Best For |
|--------|------|------------|-------------|----------|
| ECS Fargate | $$ | Medium | High | Production |
| EC2 | $ | Low | Medium | Development/Testing |
| Elastic Beanstalk | $$ | Low | High | Quick deployment |
| Amplify | $ | Very Low | High | Static hosting |

---

## Post-Deployment Steps

### 1. Set up Custom Domain (Optional)

**Using Route 53:**

```bash
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Create A record pointing to your service
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> --change-batch file://route53-change.json
```

### 2. Enable HTTPS with ACM

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 3. Set up CloudWatch Monitoring

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name energy-dashboard \
  --dashboard-body file://cloudwatch-dashboard.json
```

### 4. Enable Auto-Scaling (ECS)

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/energy-dashboard-cluster/energy-dashboard-service \
  --min-capacity 1 \
  --max-capacity 10
```

---

## Troubleshooting

### Container fails to start
```bash
# Check ECS logs
aws logs tail /ecs/energy-dashboard --follow
```

### Cannot access dashboard
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids <security-group-id>

# Verify service is running
aws ecs describe-services --cluster energy-dashboard-cluster --services energy-dashboard-service
```

### Update deployment
```bash
# ECS: Update task definition and service
aws ecs update-service --cluster energy-dashboard-cluster --service energy-dashboard-service --force-new-deployment

# EC2: SSH and rebuild
ssh -i <key-pair.pem> ec2-user@<ec2-ip>
cd DVT_Project
git pull
docker build -t energy-dashboard .
docker stop energy-dashboard
docker rm energy-dashboard
docker run -d -p 80:80 --name energy-dashboard energy-dashboard
```

---

## Estimated Monthly Costs

- **ECS Fargate (t2.micro equivalent)**: ~$15-20/month
- **EC2 t2.micro**: ~$8-10/month
- **Elastic Beanstalk (single instance)**: ~$10-15/month
- **Amplify Hosting**: ~$0-5/month (free tier available)

---

## Security Best Practices

1. **Enable HTTPS** - Use ACM for free SSL certificates
2. **Restrict Security Groups** - Limit access to specific IPs if needed
3. **Use IAM Roles** - Don't hardcode credentials
4. **Enable CloudWatch Logs** - Monitor application behavior
5. **Regular Updates** - Keep Docker images and dependencies updated
6. **Backup Data** - Store CSV files in S3

---

## Next Steps

After deployment:

1. Set up monitoring with CloudWatch
2. Configure auto-scaling based on traffic
3. Add custom domain with HTTPS
4. Set up CI/CD pipeline with GitHub Actions
5. Implement backup strategy

For CI/CD setup, see `CICD_SETUP.md`
