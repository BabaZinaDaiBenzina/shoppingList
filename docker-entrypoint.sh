#!/bin/sh
set -e

echo "🔄 Starting database migration check..."

# Apply database schema changes using node directly
echo "🚀 Applying database schema changes..."
if node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; then
    echo "✅ Database schema applied successfully"
else
    echo "❌ Failed to apply database schema"
    exit 1
fi

echo "🎉 Starting application..."
exec "$@"
