#!/bin/bash

# WhiskyVerse Hızlı Deployment Script
# Bu script uygulamayı hızlıca Docker ile deploy etmenizi sağlar

set -e

echo "🐳 WhiskyVerse Hızlı Deployment Başlatılıyor..."

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonksiyonlar
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

# Environment dosyası kontrolü
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env dosyası bulunamadı. .env.example'dan kopyalanıyor..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_info ".env dosyasını düzenleyip Supabase bilgilerinizi girin:"
            print_info "  - VITE_SUPABASE_URL"
            print_info "  - VITE_SUPABASE_ANON_KEY"
            echo ""
            read -p "Devam etmek için Enter'a basın..."
        else
            print_error ".env.example dosyası bulunamadı!"
            exit 1
        fi
    fi
    
    # Supabase URL kontrolü
    if ! grep -q "VITE_SUPABASE_URL=https://" .env; then
        print_warning "Supabase URL ayarlanmamış. Lütfen .env dosyasını düzenleyin."
        return 1
    fi
    
    print_success "Environment dosyası kontrolü tamam"
}

# Docker kurulum kontrolü
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker kurulu değil. Lütfen Docker'ı kurun: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker çalışmıyor. Lütfen Docker'ı başlatın."
        exit 1
    fi
    
    print_success "Docker kontrolü tamam"
}

# Image build etme
build_image() {
    print_info "Docker image build ediliyor..."
    
    # Build zamanını kaydet
    BUILD_TIME=$(date +%s)
    IMAGE_TAG="whiskyverse:latest"
    
    if docker build -t $IMAGE_TAG .; then
        print_success "Docker image başarıyla build edildi: $IMAGE_TAG"
    else
        print_error "Docker image build edilemedi!"
        exit 1
    fi
}

# Container'ı çalıştırma
run_container() {
    print_info "Container çalıştırılıyor..."
    
    # Mevcut container'ı durdur ve sil
    if docker ps -a --format 'table {{.Names}}' | grep -q whiskyverse-app; then
        print_info "Mevcut container durduruluyor..."
        docker stop whiskyverse-app || true
        docker rm whiskyverse-app || true
    fi
    
    # Port kontrolü
    PORT=${1:-3001}
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port $PORT kullanımda. Başka port deneyin."
        PORT=$((PORT + 1))
        print_info "Port $PORT kullanılacak."
    fi
    
    # Container'ı başlat
    if docker run -d \
        --name whiskyverse-app \
        --env-file .env \
        -p $PORT:80 \
        --restart unless-stopped \
        --health-cmd="curl -f http://localhost:80/health || exit 1" \
        --health-interval=30s \
        --health-timeout=10s \
        --health-retries=3 \
        whiskyverse:latest; then
        
        print_success "Container başarıyla başlatıldı!"
        print_info "URL: http://localhost:$PORT"
        print_info "Container adı: whiskyverse-app"
        
        # Health check bekle
        print_info "Uygulama başlatılması bekleniyor..."
        sleep 10
        
        # Test et
        if curl -f http://localhost:$PORT &>/dev/null; then
            print_success "Uygulama çalışıyor! 🎉"
            print_info "Browser'da açmak için: http://localhost:$PORT"
        else
            print_warning "Uygulama henüz hazır değil. Birkaç saniye daha bekleyin."
        fi
        
    else
        print_error "Container başlatılamadı!"
        exit 1
    fi
}

# Logs gösterme
show_logs() {
    print_info "Son logları gösteriliyor... (Çıkmak için Ctrl+C)"
    docker logs -f whiskyverse-app
}

# Container durumunu gösterme
show_status() {
    echo ""
    print_info "Container Durumu:"
    docker ps --filter name=whiskyverse-app --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    print_info "Container Health Status:"
    docker inspect whiskyverse-app --format='{{.State.Health.Status}}' || echo "Health check bilgisi yok"
}

# Cleanup fonksiyonu
cleanup() {
    print_info "Container durduruluyor ve temizleniyor..."
    docker stop whiskyverse-app || true
    docker rm whiskyverse-app || true
    print_success "Temizlik tamamlandı"
}

# Ana menü
show_menu() {
    echo ""
    print_info "🐳 WhiskyVerse Docker Management"
    echo "1) 🚀 Hızlı Deploy (Build + Run)"
    echo "2) 🔨 Sadece Build"
    echo "3) ▶️  Sadece Run"
    echo "4) 📊 Status Görüntüle"
    echo "5) 📝 Logs Görüntüle"
    echo "6) 🔄 Restart"
    echo "7) 🗑️  Stop ve Temizle"
    echo "8) 🚪 Çıkış"
    echo ""
}

# Ana fonksiyon
main() {
    echo "🐳 WhiskyVerse Docker Deployment Tool"
    echo "======================================"
    
    # Eğer parametre verilmişse direkt çalıştır
    if [ $# -gt 0 ]; then
        case $1 in
            "quick"|"deploy")
                check_docker
                check_env || exit 1
                build_image
                run_container $2
                show_status
                ;;
            "build")
                check_docker
                build_image
                ;;
            "run")
                check_docker
                check_env || exit 1
                run_container $2
                show_status
                ;;
            "status")
                show_status
                ;;
            "logs")
                show_logs
                ;;
            "restart")
                cleanup
                check_docker
                check_env || exit 1
                run_container $2
                show_status
                ;;
            "clean")
                cleanup
                ;;
            *)
                echo "Kullanım: $0 [quick|build|run|status|logs|restart|clean] [port]"
                echo "Örnek: $0 quick 3001"
                exit 1
                ;;
        esac
        exit 0
    fi
    
    # Interaktif menü
    while true; do
        show_menu
        read -p "Seçiminiz (1-8): " choice
        
        case $choice in
            1)
                check_docker
                check_env || continue
                build_image
                read -p "Port (varsayılan 3001): " port
                run_container ${port:-3001}
                show_status
                ;;
            2)
                check_docker
                build_image
                ;;
            3)
                check_docker
                check_env || continue
                read -p "Port (varsayılan 3001): " port
                run_container ${port:-3001}
                show_status
                ;;
            4)
                show_status
                ;;
            5)
                show_logs
                ;;
            6)
                cleanup
                check_docker
                check_env || continue
                read -p "Port (varsayılan 3001): " port
                run_container ${port:-3001}
                show_status
                ;;
            7)
                cleanup
                ;;
            8)
                print_info "Çıkılıyor..."
                exit 0
                ;;
            *)
                print_error "Geçersiz seçim!"
                ;;
        esac
        
        echo ""
        read -p "Devam etmek için Enter'a basın..."
    done
}

# Script'i çalıştır
main "$@"