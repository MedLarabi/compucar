# PostgreSQL Database Setup Guide

## Installation Instructions for Windows

### Step 1: Download PostgreSQL

1. Go to the official PostgreSQL download page: https://www.postgresql.org/download/windows/
2. Click on "Download the installer" (this will take you to EDB's download page)
3. Choose the latest stable version (PostgreSQL 17.x is recommended)
4. Download the Windows x86-64 installer

### Step 2: Run the Installation

1. **Run the installer** with administrator privileges
2. **Installation directory**: Keep default `C:\Program Files\PostgreSQL\17` (or latest version)
3. **Select components**: Install all components:
   - PostgreSQL Server
   - pgAdmin 4
   - Stack Builder
   - Command Line Tools

### Step 3: Configuration During Installation

1. **Data directory**: Keep default `C:\Program Files\PostgreSQL\17\data`
2. **Password**: Set a strong password for the `postgres` superuser (REMEMBER THIS!)
3. **Port**: Keep default `5432` (or choose available port)
4. **Locale**: Select "Default locale" or your preferred locale

### Step 4: Complete Installation

1. Click "Next" through remaining steps
2. Launch Stack Builder if needed (optional)
3. Installation should complete successfully

### Step 5: Verify Installation

Open Command Prompt or PowerShell and run:
```bash
psql --version
```

If this doesn't work, you may need to add PostgreSQL to your PATH:
1. Go to System Properties > Environment Variables
2. Add `C:\Program Files\PostgreSQL\17\bin` to your PATH

## Quick Setup Commands

After installation, you can connect to PostgreSQL:

```bash
# Connect as postgres user
psql -U postgres

# Or connect with full details
psql -h localhost -p 5432 -U postgres -d postgres
```

## Creating CompuCar Database

Once PostgreSQL is installed, we'll create our project database:

```sql
-- Connect as postgres user and run these commands:
CREATE DATABASE compucar;
CREATE USER compucar_user WITH ENCRYPTED PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE compucar TO compucar_user;
```

## Environment Variables

We'll create a `.env.local` file with these database connection details:

```env
# Database Configuration
DATABASE_URL="postgresql://compucar_user:secure_password_123@localhost:5432/compucar"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="compucar"
POSTGRES_USER="compucar_user"
POSTGRES_PASSWORD="secure_password_123"
```

## Alternative: Using Docker (Optional)

If you prefer Docker, you can run PostgreSQL in a container:

```bash
# Run PostgreSQL in Docker
docker run --name compucar-postgres \
  -e POSTGRES_USER=compucar_user \
  -e POSTGRES_PASSWORD=secure_password_123 \
  -e POSTGRES_DB=compucar \
  -p 5432:5432 \
  -d postgres:17

# Connect to the container
docker exec -it compucar-postgres psql -U compucar_user -d compucar
```

## Next Steps

1. Install PostgreSQL using the instructions above
2. Create the CompuCar database and user
3. Set up environment variables
4. Test the connection
5. Proceed with Prisma ORM setup

## Troubleshooting

### Common Issues:

1. **Port 5432 already in use**: Choose a different port during installation
2. **Permission denied**: Run Command Prompt as Administrator
3. **psql not found**: Add PostgreSQL bin directory to PATH
4. **Connection refused**: Ensure PostgreSQL service is running

### Check PostgreSQL Service:

```bash
# Check if PostgreSQL service is running
sc query postgresql-x64-17

# Start PostgreSQL service if needed
net start postgresql-x64-17
```

## Security Notes

- Use strong passwords
- Don't use default passwords in production
- Consider restricting network access if not needed
- Regular backups are essential

