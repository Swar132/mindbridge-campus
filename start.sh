#!/usr/bin/env bash
set -o errexit

echo "Starting MindBridge Campus on port ${PORT:-8000}..."
cd backend
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
