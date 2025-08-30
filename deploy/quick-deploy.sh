#!/bin/bash

# WhiskyVerse Quick Deployment Script
# One-click deployment for remote servers
# Usage: ./quick-deploy.sh <server-ip> <username>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-}
USERNAME=${2:-root}
DEPLOY_DIR="/home/whiskyverse/whiskyverse"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

show_help() {
    echo "WhiskyVerse Quick Deployment Script"
    echo ""
    echo "Usage: $0 <server-ip> [username]"
    echo ""
    echo "Parameters:"
    echo "  server-ip    Target server IP address"
    echo "  username     SSH username (default: root)"
    echo ""
    echo "Examples:"
    echo "  $0 192.168.1.100"
    echo "  $0 192.168.1.100 ubuntu"
    echo "  $0 mydomain.com root"
    echo ""
    echo "Prerequisites:"
    echo "  - SSH key-based authentication to target server"
    echo "  - Target server accessible via SSH"
    echo "  - Configured .env.production file"
}

validate_inputs() {
    if [[ -z "$SERVER_IP" ]]; then
        log_error "Server IP address is required"
        show_help
        exit 1
    fi
    
    # Validate IP or domain format
    if ! [[ "$SERVER_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && ! [[ "$SERVER_IP" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log_error "Invalid server IP or domain format: $SERVER_IP"
        exit 1
    fi
}

test_ssh_connection() {
    log_info "Testing SSH connection to $USERNAME@$SERVER_IP..."
    
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$USERNAME@$SERVER_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
        log_error "Cannot connect to $USERNAME@$SERVER_IP"
        log_info "Please ensure:"
        log_info "  1. Server is accessible"
        log_info "  2. SSH key-based authentication is configured"
        log_info "  3. Username is correct"
        exit 1
    fi
    
    log_success "SSH connection test passed"
}

check_local_files() {
    log_info "Checking local deployment files..."
    
    local required_files=(
        "$SCRIPT_DIR/deploy.sh"
        "$SCRIPT_DIR/docker-compose.production.yml"
        "$SCRIPT_DIR/.env.production.template"
        "$SCRIPT_DIR/nginx/nginx.conf"
        "$SCRIPT_DIR/server-setup.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    
    # Check if .env.production exists
    if [[ ! -f "$SCRIPT_DIR/.env.production" ]]; then
        log_warning ".env.production not found. Will use template."
        if [[ -f "$SCRIPT_DIR/.env.production.template" ]]; then
            cp "$SCRIPT_DIR/.env.production.template" "$SCRIPT_DIR/.env.production"
            log_warning "Created .env.production from template. Please configure it before deployment."
            read -p "Press Enter to continue after configuring .env.production..."
        fi
    fi
    
    log_success "Local files check passed"
}

setup_remote_server() {
    log_info "Setting up remote server..."
    
    # Copy server setup script
    scp "$SCRIPT_DIR/server-setup.sh" "$USERNAME@$SERVER_IP:/tmp/"
    
    # Run server setup
    ssh "$USERNAME@$SERVER_IP" "chmod +x /tmp/server-setup.sh && sudo /tmp/server-setup.sh"
    
    log_success "Remote server setup completed"
}

upload_project_files() {
    log_info "Uploading project files to remote server..."
    
    # Create target directory
    ssh "$USERNAME@$SERVER_IP" "sudo mkdir -p $DEPLOY_DIR && sudo chown -R whiskyverse:whiskyverse $DEPLOY_DIR"
    
    # Upload entire project
    log_info "Uploading application files..."
    rsync -avz --progress --exclude='node_modules' --exclude='dist' --exclude='.git' \
        "$PROJECT_ROOT/" "whiskyverse@$SERVER_IP:$DEPLOY_DIR/"
    
    # Upload deployment files
    log_info "Uploading deployment configuration..."
    rsync -avz --progress \
        "$SCRIPT_DIR/" "whiskyverse@$SERVER_IP:$DEPLOY_DIR/deploy/"
    
    # Set permissions
    ssh "whiskyverse@$SERVER_IP" "chmod +x $DEPLOY_DIR/deploy/*.sh"
    
    log_success "Project files uploaded successfully"
}

configure_environment() {
    log_info "Configuring remote environment..."
    
    # Check if environment is configured
    ssh "whiskyverse@$SERVER_IP" "
        cd $DEPLOY_DIR/deploy
        
        if grep -q 'your-project-id.supabase.co' .env.production 2>/dev/null; then
            echo 'WARNING: Environment file contains placeholder values!'
            echo 'Please configure the following in $DEPLOY_DIR/deploy/.env.production:'
            echo '  - VITE_SUPABASE_URL'
            echo '  - VITE_SUPABASE_ANON_KEY'
            echo '  - DOMAIN'
            echo ''
            read -p 'Press Enter to continue after configuration...'
        fi
    " || true
    
    log_success "Environment configuration completed"
}

deploy_application() {
    log_info "Deploying WhiskyVerse application..."
    
    # Run deployment on remote server
    ssh "whiskyverse@$SERVER_IP" "
        cd $DEPLOY_DIR/deploy
        ./deploy.sh production basic
    "
    
    log_success "Application deployment completed"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Get application port
    local app_port=$(ssh "whiskyverse@$SERVER_IP" "grep FRONTEND_PORT $DEPLOY_DIR/deploy/.env.production | cut -d'=' -f2 | tr -d ' \"'" | head -1)
    app_port=${app_port:-3001}
    
    # Test application health
    local max_attempts=30
    local attempt=1
    
    log_info "Testing application health on port $app_port..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if ssh "whiskyverse@$SERVER_IP" "curl -f -s http://localhost:$app_port/health" >/dev/null 2>&1; then
            log_success "Application is running and healthy"
            break
        else
            log_info "Attempt $attempt/$max_attempts: Waiting for application..."
            sleep 2
            ((attempt++))
        fi
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Application health check failed"
        log_info "Checking deployment status..."
        ssh "whiskyverse@$SERVER_IP" "cd $DEPLOY_DIR && docker ps --filter name=whiskyverse"
        return 1
    fi
    
    log_success "Deployment verification completed"
}

show_deployment_summary() {
    local app_port=$(ssh "whiskyverse@$SERVER_IP" "grep FRONTEND_PORT $DEPLOY_DIR/deploy/.env.production | cut -d'=' -f2 | tr -d ' \"'" | head -1)
    app_port=${app_port:-3001}
    
    echo ""
    log_success "🎉 WhiskyVerse deployment completed successfully!"
    echo ""
    echo -e "${GREEN}Access your application:${NC}"
    echo "  🌐 WhiskyVerse: http://$SERVER_IP:$app_port"
    echo "  🔍 Health check: http://$SERVER_IP:$app_port/health"
    echo ""
    echo -e "${BLUE}Remote management:${NC}"
    echo "  📡 SSH to server: ssh whiskyverse@$SERVER_IP"
    echo "  📁 App directory: $DEPLOY_DIR"
    echo "  📋 View logs: ssh whiskyverse@$SERVER_IP 'docker logs whiskyverse-frontend'"
    echo "  🔄 Restart app: ssh whiskyverse@$SERVER_IP 'cd $DEPLOY_DIR/deploy && docker restart whiskyverse-frontend'"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Configure SSL certificate for HTTPS (optional)"
    echo "  2. Set up domain name pointing to $SERVER_IP"
    echo "  3. Configure monitoring (run with 'monitoring' profile)"
    echo "  4. Set up automated backups"
    echo ""
    
    # Show running containers
    log_info "Running containers on remote server:"
    ssh "whiskyverse@$SERVER_IP" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' --filter name=whiskyverse" || true
    echo ""
}

cleanup_on_failure() {
    log_error "Deployment failed. Cleaning up..."
    
    # Try to clean up remote containers
    ssh "whiskyverse@$SERVER_IP" "
        cd $DEPLOY_DIR/deploy 2>/dev/null || exit 0
        docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    " 2>/dev/null || true
}

# Main execution
main() {
    log_info "Starting WhiskyVerse remote deployment..."
    log_info "Target server: $USERNAME@$SERVER_IP"
    echo ""
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Execute deployment steps
    validate_inputs
    test_ssh_connection
    check_local_files
    setup_remote_server
    upload_project_files
    configure_environment
    deploy_application
    verify_deployment
    show_deployment_summary
    
    log_success "Remote deployment completed successfully! 🚀"
}

# Check for help flag
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

# Execute main function
main "$@"