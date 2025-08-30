#!/bin/bash

# WhiskyVerse Server Setup Script
# This script prepares a fresh server for WhiskyVerse deployment
# Run as root or with sudo privileges

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_VERSION="2.21.0"
USER_NAME="whiskyverse"

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        log_error "Cannot detect operating system"
        exit 1
    fi
    
    log_info "Detected OS: $OS $VER"
}

update_system() {
    log_info "Updating system packages..."
    
    case $OS in
        "ubuntu"|"debian")
            apt-get update
            apt-get upgrade -y
            apt-get install -y curl wget git unzip htop vim ufw fail2ban
            ;;
        "centos"|"rhel"|"fedora")
            if command -v dnf &> /dev/null; then
                dnf update -y
                dnf install -y curl wget git unzip htop vim firewalld fail2ban
            else
                yum update -y
                yum install -y curl wget git unzip htop vim firewalld fail2ban
            fi
            ;;
        *)
            log_error "Unsupported operating system: $OS"
            exit 1
            ;;
    esac
    
    log_success "System packages updated"
}

install_docker() {
    log_info "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        log_info "Docker is already installed"
        docker --version
        return 0
    fi
    
    case $OS in
        "ubuntu"|"debian")
            # Remove old versions
            apt-get remove -y docker docker-engine docker.io containerd runc || true
            
            # Install prerequisites
            apt-get update
            apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
            
            # Add Docker's official GPG key
            mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            
            # Set up repository
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
            
            # Install Docker
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        "centos"|"rhel"|"fedora")
            # Install Docker from repository
            if command -v dnf &> /dev/null; then
                dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
                dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            else
                yum install -y yum-utils
                yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            fi
            ;;
    esac
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Verify installation
    docker --version
    docker compose version
    
    log_success "Docker installed successfully"
}

create_user() {
    log_info "Creating application user: $USER_NAME"
    
    if id "$USER_NAME" &>/dev/null; then
        log_info "User $USER_NAME already exists"
    else
        useradd -m -s /bin/bash "$USER_NAME"
        usermod -aG docker "$USER_NAME"
        log_success "User $USER_NAME created and added to docker group"
    fi
    
    # Create application directory
    mkdir -p "/home/$USER_NAME/whiskyverse"
    chown -R "$USER_NAME:$USER_NAME" "/home/$USER_NAME/whiskyverse"
}

setup_firewall() {
    log_info "Setting up firewall..."
    
    case $OS in
        "ubuntu"|"debian")
            # Configure UFW
            ufw --force reset
            ufw default deny incoming
            ufw default allow outgoing
            
            # Allow SSH
            ufw allow ssh
            
            # Allow HTTP and HTTPS
            ufw allow 80/tcp
            ufw allow 443/tcp
            
            # Allow custom application port
            ufw allow 3001/tcp
            
            # Enable firewall
            ufw --force enable
            
            log_success "UFW firewall configured"
            ;;
        "centos"|"rhel"|"fedora")
            # Configure firewalld
            systemctl start firewalld
            systemctl enable firewalld
            
            # Allow HTTP and HTTPS
            firewall-cmd --permanent --add-service=http
            firewall-cmd --permanent --add-service=https
            firewall-cmd --permanent --add-port=3001/tcp
            
            # Reload firewall
            firewall-cmd --reload
            
            log_success "Firewalld configured"
            ;;
    esac
}

setup_fail2ban() {
    log_info "Configuring Fail2ban..."
    
    # Create jail configuration
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = auto

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

    # Start and enable fail2ban
    systemctl start fail2ban
    systemctl enable fail2ban
    
    log_success "Fail2ban configured"
}

install_monitoring_tools() {
    log_info "Installing monitoring tools..."
    
    case $OS in
        "ubuntu"|"debian")
            apt-get install -y htop iotop nethogs ncdu tree
            ;;
        "centos"|"rhel"|"fedora")
            if command -v dnf &> /dev/null; then
                dnf install -y htop iotop nethogs ncdu tree
            else
                yum install -y htop iotop nethogs ncdu tree
            fi
            ;;
    esac
    
    log_success "Monitoring tools installed"
}

optimize_system() {
    log_info "Optimizing system settings..."
    
    # Increase file descriptor limits
    cat >> /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
EOF

    # Optimize kernel parameters
    cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000

# File system optimization
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
EOF

    sysctl -p
    
    log_success "System optimized"
}

create_deployment_directory() {
    log_info "Creating deployment directory structure..."
    
    local deploy_dir="/home/$USER_NAME/whiskyverse"
    
    mkdir -p "$deploy_dir/"{deploy,logs,backups,ssl}
    chown -R "$USER_NAME:$USER_NAME" "$deploy_dir"
    
    # Create logs directory for containers
    mkdir -p "$deploy_dir/logs/"{nginx,app,redis}
    chown -R "$USER_NAME:$USER_NAME" "$deploy_dir/logs"
    
    log_success "Deployment directory structure created"
}

setup_log_rotation() {
    log_info "Setting up log rotation..."
    
    cat > /etc/logrotate.d/whiskyverse << EOF
/home/$USER_NAME/whiskyverse/logs/*/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 0644 $USER_NAME $USER_NAME
    postrotate
        docker kill --signal="USR1" whiskyverse-frontend whiskyverse-proxy 2>/dev/null || true
    endscript
}
EOF

    log_success "Log rotation configured"
}

install_ssl_tools() {
    log_info "Installing SSL certificate tools..."
    
    # Install Certbot for Let's Encrypt
    case $OS in
        "ubuntu"|"debian")
            apt-get install -y snapd
            snap install core; snap refresh core
            snap install --classic certbot
            ln -sf /snap/bin/certbot /usr/bin/certbot
            ;;
        "centos"|"rhel"|"fedora")
            if command -v dnf &> /dev/null; then
                dnf install -y epel-release
                dnf install -y certbot python3-certbot-nginx
            else
                yum install -y epel-release
                yum install -y certbot python3-certbot-nginx
            fi
            ;;
    esac
    
    log_success "SSL tools installed"
}

show_next_steps() {
    local deploy_dir="/home/$USER_NAME/whiskyverse"
    
    echo ""
    log_success "🎉 Server setup completed successfully!"
    echo ""
    echo -e "${GREEN}Server is ready for WhiskyVerse deployment!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Switch to the application user:"
    echo "   sudo su - $USER_NAME"
    echo ""
    echo "2. Upload your WhiskyVerse application files to:"
    echo "   $deploy_dir/"
    echo ""
    echo "3. Configure SSL certificates (optional):"
    echo "   certbot certonly --standalone -d yourdomain.com"
    echo ""
    echo "4. Run the deployment script:"
    echo "   cd $deploy_dir && ./deploy/deploy.sh"
    echo ""
    echo -e "${BLUE}System Information:${NC}"
    echo "  📁 Deployment directory: $deploy_dir"
    echo "  👤 Application user: $USER_NAME"
    echo "  🐳 Docker version: $(docker --version | cut -d' ' -f3 | tr -d ',')"
    echo "  🔥 Firewall: $(systemctl is-active ufw 2>/dev/null || systemctl is-active firewalld 2>/dev/null || echo 'not configured')"
    echo "  🛡️  Fail2ban: $(systemctl is-active fail2ban)"
    echo ""
    echo -e "${GREEN}Useful commands:${NC}"
    echo "  📊 System status: htop"
    echo "  🐳 Docker status: docker ps"
    echo "  🔥 Firewall status: ufw status (Ubuntu/Debian) or firewall-cmd --list-all (CentOS/RHEL)"
    echo "  📋 Application logs: tail -f $deploy_dir/logs/app/error.log"
    echo ""
}

# Main execution
main() {
    log_info "Starting WhiskyVerse server setup..."
    echo ""
    
    check_root
    detect_os
    update_system
    install_docker
    create_user
    setup_firewall
    setup_fail2ban
    install_monitoring_tools
    optimize_system
    create_deployment_directory
    setup_log_rotation
    install_ssl_tools
    show_next_steps
    
    log_success "Server setup completed successfully! 🚀"
}

# Help function
show_help() {
    echo "WhiskyVerse Server Setup Script"
    echo ""
    echo "This script prepares a fresh server for WhiskyVerse deployment."
    echo "It installs Docker, configures security, and sets up the environment."
    echo ""
    echo "Usage: sudo $0"
    echo ""
    echo "What this script does:"
    echo "  ✅ Updates system packages"
    echo "  ✅ Installs Docker and Docker Compose"
    echo "  ✅ Creates application user"
    echo "  ✅ Configures firewall (UFW/firewalld)"
    echo "  ✅ Sets up Fail2ban for security"
    echo "  ✅ Installs monitoring tools"
    echo "  ✅ Optimizes system settings"
    echo "  ✅ Creates deployment directory structure"
    echo "  ✅ Sets up log rotation"
    echo "  ✅ Installs SSL certificate tools"
    echo ""
    echo "Supported operating systems:"
    echo "  - Ubuntu 18.04+"
    echo "  - Debian 9+"
    echo "  - CentOS 7+"
    echo "  - RHEL 7+"
    echo "  - Fedora 30+"
    echo ""
}

# Check for help flag
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

# Execute main function
main "$@"