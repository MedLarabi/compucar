-- CompuCar Database Setup Script
-- Run this script as postgres superuser

-- Create the CompuCar database
CREATE DATABASE compucar;

-- Create a dedicated user for the CompuCar application
CREATE USER compucar_user WITH ENCRYPTED PASSWORD 'compucar_password_123';

-- Grant all privileges on the CompuCar database to our user
GRANT ALL PRIVILEGES ON DATABASE compucar TO compucar_user;

-- Connect to the compucar database and set up permissions
\c compucar

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO compucar_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO compucar_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO compucar_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO compucar_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO compucar_user;

-- Display confirmation
SELECT 'CompuCar database setup completed successfully!' AS status;

