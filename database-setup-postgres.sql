-- CompuCar Database Setup Script for postgres user
-- Run this script as postgres superuser

-- Create the CompuCar database if it doesn't exist
DROP DATABASE IF EXISTS compucar;
CREATE DATABASE compucar;

-- Connect to the compucar database
\c compucar

-- Grant full privileges to postgres user (since you're using postgres as the main user)
GRANT ALL PRIVILEGES ON DATABASE compucar TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Display confirmation
SELECT 'CompuCar database setup completed successfully for postgres user!' AS status;
