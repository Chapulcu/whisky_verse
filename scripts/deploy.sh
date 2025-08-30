#!/bin/bash

# WhiskyVerse Docker Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}🥃 WhiskyVerse Docker Deployment${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    echo "🔍 Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

setup_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found, creating from template..."
        
        cat > .env << 'EOF'
# WhiskyVerse Environment Variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Database
POSTGRES_PASSWORD=secure-postgres-password
REDIS_PASSWORD=secure-redis-password

# N8N
N8N_PASSWORD=secure-n8n-password

# Monitoring
GRAFANA_PASSWORD=admin123
EOF
        
        print_warning "Please edit .env file with your actual values before running again"
        exit 1
    fi
    
    print_success ".env file found"
}

build_and_deploy() {
    echo "🏗️  Building and deploying WhiskyVerse..."
    
    # Build images
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    print_success "Services started"
}

wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    
    # Wait for frontend
    timeout 60 bash -c 'until curl -f http://localhost:3000/health &>/dev/null; do sleep 2; done' || {
        print_error "Frontend service failed to start"
        docker-compose logs whiskyverse-frontend
        exit 1
    }
    
    print_success "All services are ready"
}

show_status() {
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🌐 Access URLs:"
    echo "• WhiskyVerse App: http://localhost:3000"
    echo "• N8N Automation: http://localhost:5678"
    echo "• PostgreSQL: localhost:5432"
    echo "• Redis: localhost:6379"
    
    if docker-compose ps | grep grafana &>/dev/null; then
        echo "• Grafana Dashboard: http://localhost:3001"
    fi
    
    if docker-compose ps | grep prometheus &>/dev/null; then
        echo "• Prometheus: http://localhost:9090"
    fi
}

# Main deployment function
deploy() {
    print_header
    check_requirements
    setup_env
    build_and_deploy
    wait_for_services
    show_status
    
    echo ""
    print_success "WhiskyVerse deployment completed successfully!"
    echo ""
    echo "📖 For more information, check docs/deployment/DOCKER_DEPLOYMENT.md"
}

# Development deployment
deploy_dev() {
    print_header
    echo "🚧 Starting development environment..."
    
    check_requirements
    setup_env
    
    # Start development services
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "⏳ Waiting for development server..."
    timeout 60 bash -c 'until curl -f http://localhost:5173 &>/dev/null; do sleep 2; done' || {
        print_error "Development server failed to start"
        docker-compose -f docker-compose.dev.yml logs whiskyverse-dev
        exit 1
    }
    
    echo ""
    echo "🌐 Development URLs:"
    echo "• WhiskyVerse Dev: http://localhost:5173"
    echo "• Adminer (DB): http://localhost:8080"
    echo "• PostgreSQL: localhost:5433"
    echo "• Redis: localhost:6380"
    
    print_success "Development environment ready!"
}

# Stop services
stop() {
    echo "🛑 Stopping WhiskyVerse services..."
    docker-compose down
    print_success "Services stopped"
}

# Cleanup
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Logs
logs() {
    echo "📋 Showing logs..."
    docker-compose logs -f "${1:-}"
}

# Update
update() {
    echo "🔄 Updating WhiskyVerse..."
    git pull origin main
    docker-compose build --no-cache
    docker-compose up -d --remove-orphans
    print_success "Update completed"
}

# Backup
backup() {
    echo "💾 Creating backup..."
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups"
    
    mkdir -p $BACKUP_DIR
    
    # Database backup
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U postgres whiskyverse | gzip > "$BACKUP_DIR/db_backup_${DATE}.sql.gz"
        print_success "Database backup created: $BACKUP_DIR/db_backup_${DATE}.sql.gz"
    fi
    
    # Config backup
    tar -czf "$BACKUP_DIR/config_backup_${DATE}.tar.gz" .env docker-compose.yml
    print_success "Configuration backup created: $BACKUP_DIR/config_backup_${DATE}.tar.gz"
}

# Help
help() {
    echo "WhiskyVerse Docker Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy production environment (default)"
    echo "  dev        Deploy development environment"
    echo "  stop       Stop all services"
    echo "  cleanup    Stop services and cleanup Docker resources"
    echo "  logs       Show service logs (optional: service name)"
    echo "  update     Pull latest code and update services"
    echo "  backup     Create backup of database and configuration"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 dev"
    echo "  $0 logs whiskyverse-frontend"
    echo "  $0 stop"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    dev)
        deploy_dev
        ;;
    stop)
        stop
        ;;
    cleanup)
        cleanup
        ;;
    logs)
        logs $2
        ;;
    update)
        update
        ;;
    backup)
        backup
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac