#!/bin/bash

# WhiskyVerse Docker Network Diagnostic Script
# Bu script network sorunlarını tespit etmenize yardımcı olur

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🔍 WhiskyVerse Docker Network Diagnostics"
echo "========================================"

# 1. Docker Daemon Status
print_info "1. Docker Daemon Status"
if docker info &>/dev/null; then
    print_success "Docker daemon çalışıyor"
    DOCKER_VERSION=$(docker --version)
    print_info "Version: $DOCKER_VERSION"
else
    print_error "Docker daemon çalışmıyor!"
    exit 1
fi

echo ""

# 2. Docker Networks
print_info "2. Docker Networks"
echo "Mevcut networks:"
docker network ls

if docker network ls | grep -q whiskyverse; then
    print_success "WhiskyVerse network mevcut"
else
    print_warning "WhiskyVerse network bulunamadı"
fi

echo ""

# 3. Port Availability
print_info "3. Port Kontrolü"
PORTS=(80 443 3001 5432 6379 5678 9090)

for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        PROCESS=$(lsof -Pi :$port -sTCP:LISTEN -t | xargs ps -o comm= -p 2>/dev/null || echo "unknown")
        print_warning "Port $port kullanımda (Process: $PROCESS)"
    else
        print_success "Port $port müsait"
    fi
done

echo ""

# 4. Running Containers
print_info "4. Çalışan Container'lar"
CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
if [ -z "$CONTAINERS" ] || [ "$CONTAINERS" = "NAMES	STATUS	PORTS" ]; then
    print_info "Çalışan container yok"
else
    echo "$CONTAINERS"
fi

echo ""

# 5. WhiskyVerse Containers
print_info "5. WhiskyVerse Container Status"
if docker ps -a --filter name=whiskyverse --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tail -n +2 | grep -q whiskyverse; then
    docker ps -a --filter name=whiskyverse --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    print_info "WhiskyVerse container'ı bulunamadı"
fi

echo ""

# 6. Network Connectivity Test
print_info "6. Network Connectivity Test"

# Internet connectivity
if ping -c 1 8.8.8.8 &>/dev/null; then
    print_success "Internet bağlantısı çalışıyor"
else
    print_error "Internet bağlantısı yok!"
fi

# DNS resolution
if nslookup google.com &>/dev/null; then
    print_success "DNS çözümleme çalışıyor"
else
    print_error "DNS sorunu var!"
fi

echo ""

# 7. Docker Network Inspect
print_info "7. Docker Network Detayları"
if docker network ls | grep -q whiskyverse_whiskyverse-network; then
    echo "WhiskyVerse network detayları:"
    docker network inspect whiskyverse_whiskyverse-network --format '{{json .IPAM.Config}}' | jq -r '.[0] | "Subnet: \(.Subnet), Gateway: \(.Gateway)"' 2>/dev/null || echo "jq yüklü değil, ham veri:"
    docker network inspect whiskyverse_whiskyverse-network | grep -E '(Subnet|Gateway)' || echo "Network detayları alınamadı"
fi

echo ""

# 8. Firewall Status (Linux)
print_info "8. Firewall Status"
if command -v ufw &>/dev/null; then
    UFW_STATUS=$(ufw status 2>/dev/null | head -1)
    print_info "UFW Status: $UFW_STATUS"
elif command -v firewall-cmd &>/dev/null; then
    FIREWALLD_STATUS=$(firewall-cmd --state 2>/dev/null || echo "inactive")
    print_info "Firewalld Status: $FIREWALLD_STATUS"
elif command -v iptables &>/dev/null; then
    IPTABLES_RULES=$(iptables -L INPUT -n | wc -l)
    print_info "Iptables rules: $IPTABLES_RULES"
else
    print_info "Firewall durumu tespit edilemedi"
fi

echo ""

# 9. Docker Bridge Network
print_info "9. Docker Bridge Network"
BRIDGE_IP=$(docker network inspect bridge --format='{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null || echo "N/A")
print_info "Docker bridge subnet: $BRIDGE_IP"

echo ""

# 10. Common Issues Check
print_info "10. Yaygın Sorunları Kontrol Et"

# Check for Docker Desktop vs Docker Engine
if [[ "$OSTYPE" == "darwin"* ]]; then
    if pgrep -f "Docker Desktop" &>/dev/null; then
        print_success "Docker Desktop çalışıyor (macOS)"
    else
        print_warning "Docker Desktop çalışmıyor olabilir"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if systemctl is-active docker &>/dev/null; then
        print_success "Docker service aktif (Linux)"
    else
        print_warning "Docker service durumu belirsiz"
    fi
fi

# Check for SELinux (Linux)
if command -v getenforce &>/dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null)
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        print_warning "SELinux aktif - Docker volume mount sorunları olabilir"
    else
        print_info "SELinux status: $SELINUX_STATUS"
    fi
fi

echo ""
echo "🔧 Önerilen Çözümler:"
echo "===================="

print_info "Network sorunları için:"
echo "1. Docker network'ü yeniden oluştur: docker network prune"
echo "2. Container'ları yeniden başlat: docker-compose down && docker-compose up"
echo "3. Firewall'u kontrol et ve gerekli portları aç"
echo "4. Host IP'sini 0.0.0.0 olarak ayarla"
echo "5. DNS sorunları için: docker-compose down && docker system prune -f"

echo ""
print_info "Port çakışması için:"
echo "1. Farklı portlar kullan: docker-compose.yml'de port mapping'i değiştir"
echo "2. Çakışan servisleri durdur: sudo lsof -ti:PORT | xargs kill -9"

echo ""
print_info "Permission sorunları için:"
echo "1. Docker'ı root olmadan çalıştır: sudo usermod -aG docker \$USER"
echo "2. Logout/login yap veya: newgrp docker"

echo ""
print_info "Debug için log'ları kontrol et:"
echo "docker-compose logs -f"
echo "docker logs container_name"