#!/bin/bash

# WhiskyVerse Deployment Script
# This script deploys the WhiskyVerse application using Docker
# Usage: ./deploy.sh [environment] [profile]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
PROFILE=${2:-basic}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.production.yml"
ENV_FILE="$SCRIPT_DIR/.env.production"
ENV_TEMPLATE="$SCRIPT_DIR/.env.production.template"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check available space
    AVAILABLE_SPACE=$(df -h "$SCRIPT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ ${AVAILABLE_SPACE%.*} -lt 5 ]]; then
        log_warning "Available disk space is less than 5GB. Deployment may fail."
    fi
    
    log_success "System requirements check passed"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_TEMPLATE" ]]; then
            cp "$ENV_TEMPLATE" "$ENV_FILE"
            log_warning "Environment file created from template. Please edit $ENV_FILE with your configuration."
            echo "Required variables to configure:"
            echo "  - VITE_SUPABASE_URL"
            echo "  - VITE_SUPABASE_ANON_KEY"
            echo "  - DOMAIN (if using custom domain)"
            echo "  - SSL certificates (if using HTTPS)"
            
            read -p "Press Enter to continue after configuring the environment file..."
        else
            log_error "Environment template file not found: $ENV_TEMPLATE"
            exit 1
        fi
    fi
    
    log_success "Environment configuration ready"
}

build_application() {
    log_info "Building WhiskyVerse application..."
    
    cd "$PROJECT_ROOT"
    
    # Build the Docker image
    docker build -t whiskyverse:latest -f Dockerfile . || {
        log_error "Failed to build Docker image"
        exit 1
    }
    
    log_success "Application build completed"
}

deploy_services() {
    log_info "Deploying services with profile: $PROFILE"
    
    cd "$SCRIPT_DIR"
    
    # Determine compose command
    COMPOSE_CMD="docker-compose"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    # Stop existing services
    $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true
    
    # Deploy based on profile
    case $PROFILE in
        "basic")
            log_info "Deploying basic application stack..."
            $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d whiskyverse-app nginx-proxy
            ;;
        "full-stack")
            log_info "Deploying full application stack with cache..."
            $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile full-stack up -d
            ;;
        "monitoring")
            log_info "Deploying application with monitoring stack..."
            $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile monitoring up -d
            ;;
        "all")
            log_info "Deploying complete stack with all services..."
            $COMPOSE_CMD -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile full-stack --profile monitoring up -d
            ;;
        *)
            log_error "Unknown profile: $PROFILE"
            log_info "Available profiles: basic, full-stack, monitoring, all"
            exit 1
            ;;
    esac
    
    log_success "Services deployed successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for services to be ready
    sleep 10
    
    # Check if main application is running
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "whiskyverse-frontend.*Up"; then
        log_success "WhiskyVerse application is running"
    else
        log_error "WhiskyVerse application is not running"
        docker ps --filter "name=whiskyverse"
        return 1
    fi
    
    # Check application health
    local port=$(grep "FRONTEND_PORT" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' "' || echo "3001")
    local max_attempts=30
    local attempt=1
    
    log_info "Checking application health on port $port..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$port/health" > /dev/null 2>&1; then
            log_success "Application health check passed"
            break
        else
            log_info "Attempt $attempt/$max_attempts: Waiting for application to be ready..."
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Application health check failed"
        log_info "Check application logs with: docker logs whiskyverse-frontend"
        return 1
    fi
    
    # Show running services
    log_info "Running services:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=whiskyverse"
    
    log_success "Deployment verification completed"
}

show_deployment_info() {
    local port=$(grep "FRONTEND_PORT" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' "' || echo "3001")
    local domain=$(grep "DOMAIN" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' "' || echo "localhost")
    
    echo ""
    log_success "🎉 WhiskyVerse deployment completed successfully!"
    echo ""
    echo -e "${GREEN}Access your application:${NC}"
    echo "  🌐 Application: http://$domain:$port"
    echo "  🔍 Health check: http://localhost:$port/health"
    
    if [[ "$PROFILE" == "monitoring" ]] || [[ "$PROFILE" == "all" ]]; then
        local grafana_port=$(grep "GRAFANA_PORT" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' "' || echo "3002")
        local prometheus_port=$(grep "PROMETHEUS_PORT" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' "' || echo "9090")
        echo ""
        echo -e "${BLUE}Monitoring dashboards:${NC}"
        echo "  📊 Grafana: http://localhost:$grafana_port (admin/admin123)"
        echo "  📈 Prometheus: http://localhost:$prometheus_port"
    fi
    
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo "  📋 View logs: docker logs whiskyverse-frontend"
    echo "  🔄 Restart: docker restart whiskyverse-frontend"
    echo "  ⏹️  Stop all: docker-compose -f $COMPOSE_FILE down"
    echo "  📊 Status: docker ps --filter name=whiskyverse"
    echo ""
}

cleanup_on_failure() {
    log_error "Deployment failed. Cleaning up..."
    cd "$SCRIPT_DIR"
    
    COMPOSE_CMD="docker-compose"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    $COMPOSE_CMD -f "$COMPOSE_FILE" down || true
}

# Main execution
main() {
    log_info "Starting WhiskyVerse deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Profile: $PROFILE"
    echo ""
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Execute deployment steps
    check_requirements
    setup_environment
    build_application
    deploy_services
    verify_deployment
    show_deployment_info
    
    log_success "Deployment completed successfully! 🚀"
}

# Help function
show_help() {
    echo "WhiskyVerse Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [profile]"
    echo ""
    echo "Environments:"
    echo "  production (default) - Production deployment"
    echo ""
    echo "Profiles:"
    echo "  basic (default)      - Application + Nginx proxy"
    echo "  full-stack          - Application + Nginx + Redis cache"
    echo "  monitoring          - Application + Nginx + Monitoring (Prometheus/Grafana)"
    echo "  all                 - Complete stack with all services"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy with default settings"
    echo "  $0 production basic          # Deploy basic production stack"
    echo "  $0 production monitoring     # Deploy with monitoring"
    echo "  $0 production all           # Deploy complete stack"
    echo ""
    echo "Prerequisites:"
    echo "  - Docker and Docker Compose installed"
    echo "  - Configure .env.production file"
    echo "  - Ensure ports are available (3001, 80, 443)"
}

# Check for help flag
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

# Execute main function
main "$@"