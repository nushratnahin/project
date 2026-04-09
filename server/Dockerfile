FROM php:8.3-apache

# ─── System deps ───────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl apt-transport-https gnupg2 lsb-release \
    git zip unzip libpng-dev libonig-dev libxml2-dev \
    libzip-dev libgd-dev

# ─── Microsoft ODBC Driver 18 + sqlcmd tools ───────────────────
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
        > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 mssql-tools18 unixodbc-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="$PATH:/opt/mssql-tools18/bin"

# ─── PHP extensions ────────────────────────────────────────────
RUN docker-php-ext-install pdo mbstring exif pcntl bcmath gd zip \
    && pecl install sqlsrv pdo_sqlsrv \
    && docker-php-ext-enable sqlsrv pdo_sqlsrv

# ─── Apache: explicit VirtualHost — hardcoded paths, no env tricks ─
RUN a2enmod rewrite headers

# Write a complete VirtualHost. Uses printf + escaped % to avoid shell issues.
# Hardcoded DocumentRoot so there is zero ambiguity about what Apache serves.
# CORS headers are set at the Apache layer — they appear even on PHP error pages.
RUN printf '<VirtualHost *:80>\n\
    ServerAdmin webmaster@localhost\n\
    DocumentRoot /var/www/html/public\n\
\n\
    Header always set Access-Control-Allow-Origin  "http://localhost:5173"\n\
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"\n\
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, X-Requested-With"\n\
    Header always set Access-Control-Allow-Credentials "true"\n\
    Header always set Access-Control-Max-Age "86400"\n\
\n\
    RewriteEngine On\n\
    RewriteCond %%{REQUEST_METHOD} OPTIONS\n\
    RewriteRule .* - [R=204,L]\n\
\n\
    <Directory /var/www/html/public>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
        DirectoryIndex index.php index.html\n\
    </Directory>\n\
\n\
    ErrorLog  ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>\n' > /etc/apache2/sites-available/000-default.conf

# ─── Composer ──────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ─── App code ──────────────────────────────────────────────────
COPY . /var/www/html
WORKDIR /var/www/html

# Remove leftover static files that must not live in the Laravel public dir
RUN rm -f /var/www/html/public/index.html \
    && rm -f /var/www/html/public/vite.svg \
    && rm -rf /var/www/html/public/assets

RUN composer install --optimize-autoloader --no-dev

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ─── Entrypoint ────────────────────────────────────────────────
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Strip Windows CRLF line endings (\r\n → \n) in case the file was
# cloned on Windows before being built. Without this the shebang line
# becomes "#!/bin/bash\r" which Linux cannot resolve.
RUN apt-get install -y dos2unix 2>/dev/null || true \
    && dos2unix /usr/local/bin/docker-entrypoint.sh 2>/dev/null || \
       sed -i 's/\r//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]