-- Add Vimeo support to ProductVideo table
-- Run this SQL script on your database to add Vimeo support

-- Add new columns to product_videos table
ALTER TABLE product_videos 
ADD COLUMN IF NOT EXISTS vimeo_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) DEFAULT 'DIRECT';

-- Update VideoType enum to include DIRECT
-- Note: This might require manual intervention depending on your PostgreSQL version
-- You may need to run: ALTER TYPE "VideoType" ADD VALUE 'DIRECT';

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

COMMENT ON COLUMN product_videos.vimeo_id IS 'Vimeo video ID for embedded videos';
COMMENT ON COLUMN product_videos.video_type IS 'Video hosting type: DIRECT, VIMEO, YOUTUBE, S3';
