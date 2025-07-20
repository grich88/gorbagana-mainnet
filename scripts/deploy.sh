#!/bin/bash

# GorbaDome Arcade Platform - Deployment Script
# This script automates the build and deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAME_DIR="$PROJECT_ROOT/gorbadome-game"
CONTRACTS_DIR="$PROJECT_ROOT/gorbadome-contracts/gorbadome"
BUILD_DIR="$PROJECT_ROOT/builds"
WEBGL_DIR="$BUILD_DIR/webgl"

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if Unity is available
    if ! command -v unity &> /dev/null; then
        log_warning "Unity CLI not found. Please ensure Unity is installed and unity command is available."
    fi
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        exit 1
    fi
    
    # Check if Anchor is available
    if ! command -v anchor &> /dev/null; then
        log_error "Anchor CLI is required but not installed."
        log_info "Install with: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
        exit 1
    fi
    
    log_success "Dependencies check completed"
}

build_contracts() {
    log_info "Building smart contracts..."
    
    cd "$CONTRACTS_DIR"
    
    # Install dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Build contracts
    anchor build
    
    log_success "Smart contracts built successfully"
}

test_contracts() {
    log_info "Running contract tests..."
    
    cd "$CONTRACTS_DIR"
    anchor test
    
    log_success "Contract tests passed"
}

deploy_contracts() {
    local network=${1:-"gorganus-devnet"}
    
    log_info "Deploying contracts to $network..."
    
    cd "$CONTRACTS_DIR"
    
    # Deploy to specified network
    anchor deploy --provider.cluster "$network"
    
    log_success "Contracts deployed to $network"
}

build_game() {
    log_info "Building Unity game..."
    
    # Create build directory
    mkdir -p "$BUILD_DIR"
    
    # Build WebGL version
    if command -v unity &> /dev/null; then
        unity -quit -batchmode -projectPath "$GAME_DIR" -buildTarget WebGL -buildPath "$WEBGL_DIR"
        log_success "Unity WebGL build completed"
    else
        log_warning "Unity CLI not available. Please build manually in Unity Editor."
        log_info "Build target: WebGL"
        log_info "Build path: $WEBGL_DIR"
    fi
}

build_all() {
    log_info "Starting full build process..."
    
    check_dependencies
    build_contracts
    test_contracts
    build_game
    
    log_success "Full build completed successfully!"
}

deploy_all() {
    local network=${1:-"gorganus-devnet"}
    
    log_info "Starting full deployment process..."
    
    build_all
    deploy_contracts "$network"
    
    log_success "Full deployment completed!"
}

clean_builds() {
    log_info "Cleaning build directories..."
    
    rm -rf "$BUILD_DIR"
    rm -rf "$CONTRACTS_DIR/target"
    
    log_success "Build directories cleaned"
}

show_help() {
    echo "GorbaDome Arcade Platform - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build-contracts    Build smart contracts"
    echo "  test-contracts     Run contract tests"
    echo "  deploy-contracts   Deploy contracts to network (default: gorganus-devnet)"
    echo "  build-game         Build Unity game to WebGL"
    echo "  build-all          Build everything (contracts + game)"
    echo "  deploy-all         Build and deploy everything"
    echo "  clean              Clean build directories"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build-all"
    echo "  $0 deploy-contracts gorganus-mainnet"
    echo "  $0 deploy-all gorganus-devnet"
}

# Main script logic
case "${1:-help}" in
    "build-contracts")
        build_contracts
        ;;
    "test-contracts")
        test_contracts
        ;;
    "deploy-contracts")
        deploy_contracts "$2"
        ;;
    "build-game")
        build_game
        ;;
    "build-all")
        build_all
        ;;
    "deploy-all")
        deploy_all "$2"
        ;;
    "clean")
        clean_builds
        ;;
    "help"|*)
        show_help
        ;;
esac 