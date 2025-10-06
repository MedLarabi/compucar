// Utility function to generate video thumbnail
export const generateVideoThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Seek to 1 second (or 10% of video duration, whichever is smaller)
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        video.src = '';
        URL.revokeObjectURL(video.src);
        
        resolve(thumbnail);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = (error) => {
      reject(error);
    };

    video.onloadstart = () => {
      console.log('Video loading started for thumbnail generation');
    };

    // Create object URL and load video
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.load();
  });
};

// Utility function to get video metadata
export const getVideoMetadata = (videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      const metadata = {
        duration: Math.floor(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
      };
      
      // Clean up
      video.src = '';
      URL.revokeObjectURL(video.src);
      
      resolve(metadata);
    };

    video.onerror = (error) => {
      reject(error);
    };

    // Create object URL and load video
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.load();
  });
};