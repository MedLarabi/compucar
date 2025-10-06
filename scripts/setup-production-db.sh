#!/bin/bash

# Production Database Setup Script for CompuCar E-commerce Platform

echo "🚀 Setting up production database for CompuCar..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your production database URL:"
    echo "export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ Database URL found"

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗃️ Running database migrations..."
npx prisma db push

# Seed the database with initial data
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Production database setup complete!"
echo ""
echo "📊 Database Statistics:"
npx prisma db show

echo ""
echo "🎉 Your CompuCar production database is ready!"
echo "🔗 You can now deploy your application to production."
