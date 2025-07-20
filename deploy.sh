#!/bin/bash

# Gorbadome Deployment Script
# This script deploys the Solana program and optionally the frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="devnet"
PROGRAM_DIR="gorbadome-contracts/gorbadome"
FRONTEND_DIR="frontend"

echo -e "${BLUE}🎮 Gorbadome Deployment Script${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "$PROGRAM_DIR" ]; then
    print_error "Program directory not found: $PROGRAM_DIR"
    print_info "Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
print_info "Checking dependencies..."

if ! command_exists solana; then
    print_error "Solana CLI not found. Please install it first."
    exit 1
fi

if ! command_exists anchor; then
    print_error "Anchor CLI not found. Please install it first."
    exit 1
fi

if ! command_exists npm; then
    print_warning "npm not found. Frontend deployment will be skipped."
    SKIP_FRONTEND=true
fi

print_status "All dependencies found"

# Check Solana configuration
print_info "Checking Solana configuration..."
CURRENT_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')
WALLET_PATH=$(solana config get | grep "Keypair Path" | awk '{print $3}')

if [[ "$CURRENT_URL" != *"$NETWORK"* ]]; then
    print_warning "Current RPC URL: $CURRENT_URL"
    print_info "Setting Solana to $NETWORK..."
    solana config set --url $NETWORK
fi

print_status "Solana configured for $NETWORK"

# Check wallet balance
print_info "Checking wallet balance..."
BALANCE=$(solana balance 2>/dev/null | awk '{print $1}' | cut -d'.' -f1)

if [ -z "$BALANCE" ] || [ "$BALANCE" -lt 3 ]; then
    print_warning "Low SOL balance: $BALANCE SOL"
    print_info "Requesting airdrop..."
    solana airdrop 2
    sleep 5  # Wait for airdrop confirmation
fi

BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')
print_status "Wallet balance: $BALANCE SOL"

# Deploy Solana program
print_info "Building and deploying Solana program..."
cd "$PROGRAM_DIR"

# Clean and build
print_info "Cleaning previous builds..."
anchor clean

print_info "Building program..."
if ! CARGO_BUILD_JOBS=1 ANCHOR_HEAP_SIZE=32768 RUST_MIN_STACK=8388608 anchor build; then
    print_error "Failed to build program"
    exit 1
fi

print_status "Program built successfully"

# Deploy program
print_info "Deploying program to $NETWORK..."
if PROGRAM_ID=$(solana program deploy target/deploy/gorbadome.so --output json-compact | grep -o '"programId":"[^"]*"' | cut -d'"' -f4); then
    print_status "Program deployed successfully!"
    print_info "Program ID: $PROGRAM_ID"
    
    # Save program ID to file
    echo "$PROGRAM_ID" > deployed_program_id.txt
    print_info "Program ID saved to deployed_program_id.txt"
else
    print_error "Failed to deploy program"
    exit 1
fi

# Verify deployment
print_info "Verifying deployment..."
if solana program show "$PROGRAM_ID" >/dev/null 2>&1; then
    print_status "Program deployment verified"
else
    print_error "Failed to verify program deployment"
    exit 1
fi

cd ../..

# Update frontend with new program ID
if [ ! "$SKIP_FRONTEND" = true ] && [ -d "$FRONTEND_DIR" ]; then
    print_info "Updating frontend with new program ID..."
    
    # Update the program ID in App.js
    if [ -f "$FRONTEND_DIR/src/App.js" ]; then
        # Create backup
        cp "$FRONTEND_DIR/src/App.js" "$FRONTEND_DIR/src/App.js.backup"
        
        # Update program ID
        sed -i.tmp "s/const PROGRAM_ID = new PublicKey('.*');/const PROGRAM_ID = new PublicKey('$PROGRAM_ID');/" "$FRONTEND_DIR/src/App.js"
        rm "$FRONTEND_DIR/src/App.js.tmp" 2>/dev/null || true
        
        print_status "Frontend updated with new program ID"
    fi
    
    # Optional: Build frontend
    read -p "Do you want to build the frontend? (y/n): " BUILD_FRONTEND
    
    if [[ $BUILD_FRONTEND =~ ^[Yy]$ ]]; then
        print_info "Building frontend..."
        cd "$FRONTEND_DIR"
        
        if [ ! -d "node_modules" ]; then
            print_info "Installing frontend dependencies..."
            npm install
        fi
        
        print_info "Building frontend for production..."
        if npm run build; then
            print_status "Frontend built successfully!"
            print_info "Frontend build located in: $FRONTEND_DIR/build/"
        else
            print_error "Frontend build failed"
        fi
        
        cd ..
    fi
fi

# Summary
echo ""
echo "=================================="
print_status "Deployment Complete!"
echo "=================================="
print_info "Program ID: $PROGRAM_ID"
print_info "Network: $NETWORK"
print_info "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=$NETWORK"

if [ -f "$FRONTEND_DIR/build/index.html" ]; then
    print_info "Frontend: Built and ready for deployment"
    print_info "You can serve it with: cd $FRONTEND_DIR && npx serve -s build"
fi

echo ""
print_info "Next steps:"
echo "1. Test the program functions using the frontend"
echo "2. Deploy frontend to your hosting platform"
echo "3. Update any client applications with the new Program ID"
echo "4. Consider deploying to mainnet when ready"

echo ""
print_status "Happy gaming! 🎮" 