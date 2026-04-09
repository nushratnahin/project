#!/bin/bash
set -e

# Write .env from environment variables
cat > /var/www/html/.env <<EOF
APP_NAME="${APP_NAME:-Library Management}"
APP_ENV=${APP_ENV:-local}
APP_KEY=${APP_KEY:-}
APP_DEBUG=${APP_DEBUG:-true}
APP_URL=${APP_URL:-http://localhost:8000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
LOG_LEVEL=${LOG_LEVEL:-debug}
DB_CONNECTION=${DB_CONNECTION:-sqlsrv}
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-1433}
DB_DATABASE=${DB_DATABASE:-library_management}
DB_USERNAME=${DB_USERNAME:-laravel_user}
DB_PASSWORD=${DB_PASSWORD:-Laravel@123}
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=true
FILESYSTEM_DISK=public
EOF

cd /var/www/html

# Fix storage permissions — the Docker volume mount overwrites the chown
# done at build time, so Apache (www-data) would otherwise be locked out.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Generate app key if missing
if grep -q "APP_KEY=$" .env; then
    php artisan key:generate --force
fi

# -C = trust server certificate (needed for ODBC Driver 18 + self-signed cert)
SQLCMD="sqlcmd -S ${DB_HOST},${DB_PORT:-1433} -C -No"

# Wait for SQL Server to be ready (60 attempts x 5s = 5 min)
echo "Waiting for SQL Server..."
for i in $(seq 1 60); do
    $SQLCMD -U sa -P "${DB_PASSWORD}" -Q "SELECT 1" > /dev/null 2>&1 && break
    echo "  attempt $i/60 - not ready yet..."
    sleep 5
done

# Create database if it doesn't exist
echo "Running DB init..."
$SQLCMD -U sa -P "${DB_PASSWORD}" -d master -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${DB_DATABASE}')
    CREATE DATABASE [${DB_DATABASE}];
"

# Create login if it doesn't exist
$SQLCMD -U sa -P "${DB_PASSWORD}" -d master -Q "
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = '${DB_USERNAME}')
    CREATE LOGIN [${DB_USERNAME}] WITH PASSWORD = '${DB_PASSWORD}';
"

# Create DB user and grant permissions
$SQLCMD -U sa -P "${DB_PASSWORD}" -d "${DB_DATABASE}" -Q "
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = '${DB_USERNAME}')
BEGIN
    CREATE USER [${DB_USERNAME}] FOR LOGIN [${DB_USERNAME}];
    ALTER ROLE db_owner ADD MEMBER [${DB_USERNAME}];
END
"

# Run migrations and seed
echo "Running migrations..."
php artisan migrate --force

echo "Running seeders..."
php artisan db:seed --force

# Storage symlink
php artisan storage:link --force 2>/dev/null || true

# Clear config cache
php artisan config:clear
php artisan cache:clear

echo "Starting Apache..."
exec "$@"