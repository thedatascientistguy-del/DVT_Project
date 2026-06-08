#!/bin/bash

# Energy Transition Dashboard - AWS Deployment Script
# This script automates the deployment to AWS ECS with Fargate

set -e  # Exit on error

echo "=========================================="
echo "Energy Dashboard AWS Deployment Script"
echo "=========================================="
echo ""

# Configuration
read -p "Enter your AWS Account ID: " AWS_ACCOUNT_ID
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

ECR_REPO_NAME="energy-dashboard"
ECS_CLUSTER_NAME="energy-dashboard-cluster"
ECS_SERVICE_NAME="energy-dashboard-service"
ECS_TASK_NAME="energy-dashboard-task"
LOG_GROUP="/ecs/energy-dashboard"

echo ""
echo "Configuration:"
echo "  AWS Account: $AWS_ACCOUNT_ID"
echo "  AWS Region: $AWS_REGION"
echo "  ECR Repository: $ECR_REPO_NAME"
echo ""

# Step 1: Create ECR Repository
echo "Step 1: Creating ECR repository..."
aws ecr create-repository \
  --repository-name $ECR_REPO_NAME \
  --region $AWS_REGION \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "  Repository already exists, continuing..."

# Step 2: Build Docker image
echo ""
echo "Step 2: Building Docker image..."
docker build -t $ECR_REPO_NAME .

# Step 3: Login to ECR
echo ""
echo "Step 3: Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Step 4: Tag and push image
echo ""
echo "Step 4: Pushing image to ECR..."
docker tag $ECR_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest

# Step 5: Create CloudWatch log group
echo ""
echo "Step 5: Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name $LOG_GROUP \
  --region $AWS_REGION \
  2>/dev/null || echo "  Log group already exists, continuing..."

# Step 6: Create ECS cluster
echo ""
echo "Step 6: Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name $ECS_CLUSTER_NAME \
  --region $AWS_REGION \
  2>/dev/null || echo "  Cluster already exists, continuing..."

# Step 7: Update task definition with account ID
echo ""
echo "Step 7: Updating task definition..."
sed "s/<your-account-id>/$AWS_ACCOUNT_ID/g" ecs-task-definition.json > ecs-task-definition-temp.json
sed -i "s/us-east-1/$AWS_REGION/g" ecs-task-definition-temp.json

# Step 8: Register task definition
echo ""
echo "Step 8: Registering ECS task definition..."
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-temp.json \
  --region $AWS_REGION

# Clean up temp file
rm ecs-task-definition-temp.json

# Step 9: Get default VPC and subnet
echo ""
echo "Step 9: Getting VPC and subnet information..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $AWS_REGION)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION | tr '\t' ',')
SUBNET_ID=$(echo $SUBNET_IDS | cut -d',' -f1)

echo "  VPC ID: $VPC_ID"
echo "  Subnet ID: $SUBNET_ID"

# Step 10: Create security group
echo ""
echo "Step 10: Creating security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name energy-dashboard-sg \
  --description "Security group for Energy Dashboard" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text 2>/dev/null) || SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=energy-dashboard-sg" \
  --query "SecurityGroups[0].GroupId" \
  --output text \
  --region $AWS_REGION)

echo "  Security Group ID: $SG_ID"

# Step 11: Allow HTTP traffic
echo ""
echo "Step 11: Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION \
  2>/dev/null || echo "  Security group rule already exists, continuing..."

# Step 12: Create or update ECS service
echo ""
echo "Step 12: Creating/updating ECS service..."

# Check if service exists
SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster $ECS_CLUSTER_NAME \
  --services $ECS_SERVICE_NAME \
  --region $AWS_REGION \
  --query 'services[0].serviceName' \
  --output text 2>/dev/null)

if [ "$SERVICE_EXISTS" == "$ECS_SERVICE_NAME" ]; then
  echo "  Service exists, updating..."
  aws ecs update-service \
    --cluster $ECS_CLUSTER_NAME \
    --service $ECS_SERVICE_NAME \
    --task-definition $ECS_TASK_NAME \
    --force-new-deployment \
    --region $AWS_REGION
else
  echo "  Creating new service..."
  aws ecs create-service \
    --cluster $ECS_CLUSTER_NAME \
    --service-name $ECS_SERVICE_NAME \
    --task-definition $ECS_TASK_NAME \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --region $AWS_REGION
fi

# Step 13: Wait for service to stabilize
echo ""
echo "Step 13: Waiting for service to become stable (this may take a few minutes)..."
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER_NAME \
  --services $ECS_SERVICE_NAME \
  --region $AWS_REGION

# Step 14: Get public IP
echo ""
echo "Step 14: Getting public IP address..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster $ECS_CLUSTER_NAME \
  --service-name $ECS_SERVICE_NAME \
  --region $AWS_REGION \
  --query 'taskArns[0]' \
  --output text)

ENI_ID=$(aws ecs describe-tasks \
  --cluster $ECS_CLUSTER_NAME \
  --tasks $TASK_ARN \
  --region $AWS_REGION \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $ENI_ID \
  --region $AWS_REGION \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your Energy Transition Dashboard is now live!"
echo ""
echo "Access URL: http://$PUBLIC_IP"
echo ""
echo "Cluster: $ECS_CLUSTER_NAME"
echo "Service: $ECS_SERVICE_NAME"
echo "Task Definition: $ECS_TASK_NAME"
echo ""
echo "To view logs:"
echo "  aws logs tail $LOG_GROUP --follow --region $AWS_REGION"
echo ""
echo "To update deployment:"
echo "  ./deploy-to-aws.sh"
echo ""
echo "To delete resources:"
echo "  aws ecs delete-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --force --region $AWS_REGION"
echo "  aws ecs delete-cluster --cluster $ECS_CLUSTER_NAME --region $AWS_REGION"
echo ""
