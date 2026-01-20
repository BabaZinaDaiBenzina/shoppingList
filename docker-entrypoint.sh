#!/bin/sh
set -e

echo "🔄 Starting database migration check..."

# Wait for database to be ready
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1 || \
       pg_isready -d "${DATABASE_URL:-postgres:shoppinglist@localhost:5432/shoppinglist}" >/dev/null 2>&1; then
        echo "✅ Database is ready"
        break
    fi

    attempt=$((attempt + 1))
    echo "⏳ Waiting for database... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Database connection failed after $max_attempts attempts"
    exit 1
fi

# Apply database schema changes
echo "🚀 Applying database schema changes..."
if npx prisma db push --skip-generate --accept-data-loss; then
    echo "✅ Database schema applied successfully"
else
    echo "❌ Failed to apply database schema"
    exit 1
fi

echo "🎉 Starting application..."
exec "$@"
