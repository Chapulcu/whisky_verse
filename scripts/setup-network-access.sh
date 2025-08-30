#!/bin/bash

# WhiskyVerse Network Access Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🌐 WhiskyVerse Network Access Setup${NC}"
    echo -e "${BLUE}====================================${NC}"
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

get_host_ip() {
    # Get primary network interface IP
    HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    echo $HOST_IP
}

check_firewall() {
    echo "🔍 Checking firewall settings..."
    
    # Check if pfctl is active (macOS)
    if command -v pfctl &> /dev/null; then
        echo "macOS firewall detected"
        # Note: macOS Application Firewall usually allows Docker by default
        print_success "macOS firewall should allow Docker containers"
    fi
    
    # Check if ufw is active (Linux)
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "active"; then
            print_warning "UFW firewall is active. You may need to open ports:"
            echo "sudo ufw allow 3001/tcp"
            echo "sudo ufw allow 5678/tcp"
        fi
    fi
}

setup_hosts_entry() {
    local HOST_IP=$1
    echo "📝 Setting up hosts entries..."
    
    # Create hosts entries for easy access
    cat << EOF

Add these entries to /etc/hosts on client computers:
$HOST_IP    whiskyverse.local
$HOST_IP    n8n.local

Commands for client computers:
# Linux/macOS:
echo "$HOST_IP    whiskyverse.local" | sudo tee -a /etc/hosts
echo "$HOST_IP    n8n.local" | sudo tee -a /etc/hosts

# Windows (Run as Administrator):
echo $HOST_IP    whiskyverse.local >> C:\\Windows\\System32\\drivers\\etc\\hosts
echo $HOST_IP    n8n.local >> C:\\Windows\\System32\\drivers\\etc\\hosts
EOF
}

test_network_access() {
    local HOST_IP=$1
    echo "🔍 Testing network access..."
    
    # Test local access
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q "200"; then
        print_success "Local access working: http://localhost:3001"
    else
        print_error "Local access failed"
        return 1
    fi
    
    # Test network access
    if curl -s -o /dev/null -w "%{http_code}" http://$HOST_IP:3001/ | grep -q "200"; then
        print_success "Network access working: http://$HOST_IP:3001"
    else
        print_warning "Network access may be blocked by firewall"
    fi
}

restart_services() {
    echo "🔄 Restarting Docker services with network configuration..."
    docker-compose down
    docker-compose up -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 10
}

show_access_info() {
    local HOST_IP=$1
    echo ""
    echo -e "${BLUE}🌐 Network Access Information${NC}"
    echo -e "${BLUE}=============================${NC}"
    echo ""
    echo "📍 Host IP Address: $HOST_IP"
    echo ""
    echo "🌐 Access URLs from other computers:"
    echo "• WhiskyVerse App:    http://$HOST_IP:3001"
    echo "• N8N Automation:     http://$HOST_IP:5678"
    echo ""
    echo "📱 Mobile Access:"
    echo "• Ensure mobile device is on same WiFi network"
    echo "• Use: http://$HOST_IP:3001"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "• Check firewall settings on host computer"
    echo "• Ensure Docker containers are running: docker-compose ps"
    echo "• Test local access first: http://localhost:3001"
    echo "• Check network connectivity: ping $HOST_IP"
}

# Main execution
main() {
    print_header
    
    # Get host IP
    HOST_IP=$(get_host_ip)
    if [ -z "$HOST_IP" ]; then
        print_error "Could not determine host IP address"
        exit 1
    fi
    
    echo "🔍 Detected host IP: $HOST_IP"
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check firewall
    check_firewall
    
    # Restart services
    restart_services
    
    # Test access
    test_network_access $HOST_IP
    
    # Show hosts entry info
    setup_hosts_entry $HOST_IP
    
    # Show final access info
    show_access_info $HOST_IP
    
    print_success "Network access setup completed!"
}

# Run main function
main "$@"