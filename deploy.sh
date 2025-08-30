#!/bin/bash

# LinkedIn Sourcing Agent - Frontend Deployment Script
echo "🚀 Starting deployment process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build directory 'dist' not found"
    exit 1
fi

echo "📁 Build files are ready in the 'dist' directory"

# Optional: Start preview server
read -p "🌐 Would you like to start the preview server? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting preview server..."
    npm run preview
else
    echo "✅ Deployment build completed!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Upload the 'dist' folder to your hosting provider"
    echo "   2. Or run 'npm run preview' to test locally"
    echo "   3. Or deploy to Vercel/Netlify by connecting your repository"
    echo ""
    echo "🔗 Useful commands:"
    echo "   - npm run dev     (development server)"
    echo "   - npm run build   (production build)"
    echo "   - npm run preview (preview production build)"
fi

echo "🎉 Deployment script completed!"