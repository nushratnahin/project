-- Wait and create database + user for Laravel
-- This script is run manually via entrypoint script

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'library_management')
BEGIN
    CREATE DATABASE library_management;
END
GO

USE library_management;
GO

IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'laravel_user')
BEGIN
    CREATE LOGIN laravel_user WITH PASSWORD = 'Laravel@123';
END
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'laravel_user')
BEGIN
    CREATE USER laravel_user FOR LOGIN laravel_user;
    ALTER ROLE db_owner ADD MEMBER laravel_user;
END
GO
