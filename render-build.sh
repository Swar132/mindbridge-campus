#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "========================================="
echo "Building MindBridge Campus Web Platform"
echo "========================================="

echo "[1/3] Building React Frontend..."
cd frontend
npm install --no-audit --silent
npm run build
cd ..

echo "[2/3] Installing Python Backend Dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[3/3] Build finished successfully!"
echo "Ready for production startup."
