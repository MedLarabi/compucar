# PostgreSQL Database Migration Guide - Vimeo Support

## Overview
This guide will help you run the Vimeo support migration on your PostgreSQL database. The migration adds two new columns to the `product_videos` table to support Vimeo integration.

## What the Migration Does

1. **Adds new columns:**
   - `vimeo_id` (VARCHAR(255)) - Stores Vimeo video ID
   - `video_type` (VARCHAR(20)) - Stores video hosting type (DIRECT, VIMEO, etc.)

2. **Creates indexes** for better performance
3. **Updates existing records** to have DIRECT video type
4. **Adds comments** for documentation

## Migration Methods

### Method 1: Using psql Command Line (Recommended)

#### Step 1: Connect to your database
```bash
# If your database is local
psql -U your_username -d your_database_name

# If your database is remote (like your VPS at 72.60.95.142)
psql -h 72.60.95.142 -U your_username -d your_database_name -p 5432
```

#### Step 2: Run the migration script
```bash
# From psql command line
\i database-migration-vimeo.sql

# Or run it directly from command line
psql -h 72.60.95.142 -U your_username -d your_database_name -f database-migration-vimeo.sql
```

### Method 2: Using pgAdmin (GUI Tool)

1. **Open pgAdmin** and connect to your database
2. **Navigate** to your database → Schemas → public → Tables
3. **Right-click** on your database and select **"Query Tool"**
4. **Copy and paste** the migration SQL (see below)
5. **Click Execute** (F5)

### Method 3: Using Database Management Tool (DBeaver, etc.)

1. **Open your database tool** and connect to PostgreSQL
2. **Open a new SQL script**
3. **Copy and paste** the migration SQL
4. **Execute the script**

### Method 4: Using Node.js Script (Programmatic)

Create a temporary migration script:

```javascript
// run-migration.js
const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    host: '72.60.95.142',  // Your VPS IP
    port: 5432,
    database: 'your_database_name',
    user: 'your_username',
    password: 'your_password',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    const sql = fs.readFileSync('database-migration-vimeo.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
```

Then run: `node run-migration.js`

## Complete Migration SQL

Copy and paste this into your PostgreSQL client:

```sql
-- Add Vimeo support to ProductVideo table
-- Run this SQL script on your database to add Vimeo support

-- Add new columns to product_videos table
ALTER TABLE product_videos 
ADD COLUMN IF NOT EXISTS vimeo_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) DEFAULT 'DIRECT';

-- Create index for better performance on vimeo_id lookups
CREATE INDEX IF NOT EXISTS idx_product_videos_vimeo_id ON product_videos(vimeo_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_video_type ON product_videos(video_type);

-- Update existing records to have DIRECT video type if they don't have one
UPDATE product_videos 
SET video_type = 'DIRECT' 
WHERE video_type IS NULL;

-- Make video_type NOT NULL after setting default values
ALTER TABLE product_videos 
ALTER COLUMN video_type SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN product_videos.vimeo_id IS 'Vimeo video ID for embedded videos';
COMMENT ON COLUMN product_videos.video_type IS 'Video hosting type: DIRECT, VIMEO, YOUTUBE, S3';

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_videos' 
AND column_name IN ('vimeo_id', 'video_type');
```

## Step-by-Step Instructions

### For VPS Database (72.60.95.142)

1. **Open Terminal/Command Prompt**

2. **Connect to your VPS database:**
   ```bash
   psql -h 72.60.95.142 -U postgres -d tuning -p 5432
   ```
   
3. **Enter your password** when prompted

4. **Run the migration:**
   ```sql
   -- Copy and paste the complete SQL above
   ```

5. **Verify the migration:**
   ```sql
   -- Check if columns were added
   \d product_videos
   
   -- Or run this query
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'product_videos' 
   AND column_name IN ('vimeo_id', 'video_type');
   ```

## Expected Results

After successful migration, you should see:

```
ALTER TABLE
CREATE INDEX
CREATE INDEX
UPDATE 0  (or number of existing video records)
ALTER TABLE
COMMENT
COMMENT

     column_name     |     data_type     | is_nullable
--------------------+-------------------+-------------
 vimeo_id           | character varying | YES
 video_type         | character varying | NO
```

## Troubleshooting

### Common Issues:

1. **Permission Denied:**
   ```
   ERROR: permission denied for table product_videos
   ```
   **Solution:** Make sure you're connected as a user with ALTER TABLE permissions.

2. **Table doesn't exist:**
   ```
   ERROR: relation "product_videos" does not exist
   ```
   **Solution:** Check if your table is named differently or in a different schema.

3. **Connection refused:**
   ```
   psql: could not connect to server: Connection refused
   ```
   **Solution:** Check your database host, port, and firewall settings.

### Verification Commands:

```sql
-- Check table structure
\d product_videos

-- Check indexes
\d+ product_videos

-- Check existing data
SELECT id, url, video_type, vimeo_id FROM product_videos LIMIT 5;
```

## After Migration

Once the migration is complete:

1. **Test the admin interface** - Go to Admin → Products → Edit → Media tab
2. **Try adding a Vimeo video** - Use the VimeoVideoManager component
3. **Check the product page** - Verify videos display correctly
4. **Monitor for errors** - Check browser console and server logs

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the new columns (CAUTION: This will delete data!)
ALTER TABLE product_videos DROP COLUMN IF EXISTS vimeo_id;
ALTER TABLE product_videos DROP COLUMN IF EXISTS video_type;

-- Remove indexes
DROP INDEX IF EXISTS idx_product_videos_vimeo_id;
DROP INDEX IF EXISTS idx_product_videos_video_type;
```

## Next Steps

After successful migration:
1. ✅ Upload a video to Vimeo
2. ✅ Test adding it through the admin interface
3. ✅ Verify it displays correctly on the product page
4. ✅ Enjoy fast, professional video loading! 🚀
