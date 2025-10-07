// Utility function to generate video thumbnail
export const generateVideoThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      reject(new Error('Thumbnail generation not available in server environment'));
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    let hasResolved = false;
    let objectUrl: string | null = null;

    // Set up timeout
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(new Error('Video thumbnail generation timeout'));
      }
    }, 8000); // 8 second timeout

    const cleanup = () => {
      clearTimeout(timeout);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      video.src = '';
      video.load();
    };

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      if (hasResolved) return;
      
      try {
        // Set canvas dimensions to match video (with reasonable limits)
        const maxWidth = 800;
        const maxHeight = 600;
        let { videoWidth, videoHeight } = video;
        
        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
          videoWidth *= ratio;
          videoHeight *= ratio;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Seek to 1 second (or 10% of video duration, whichever is smaller)
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      } catch (error) {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          reject(error);
        }
      }
    };

    video.onseeked = () => {
      if (hasResolved) return;
      
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to base64 image with quality control
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve(thumbnail);
        }
      } catch (error) {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          reject(error);
        }
      }
    };

    video.onerror = (error) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(new Error(`Video loading error: ${error}`));
      }
    };

    video.onloadstart = () => {
      console.log('Video loading started for thumbnail generation');
    };

    try {
      // Create object URL and load video
      objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;
      video.load();
    } catch (error) {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(error);
      }
    }
  });
};

// Utility function to get video metadata
export const getVideoMetadata = (videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      reject(new Error('Video metadata extraction not available in server environment'));
      return;
    }

    const video = document.createElement('video');
    let hasResolved = false;
    let objectUrl: string | null = null;

    // Set up timeout
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(new Error('Video metadata extraction timeout'));
      }
    }, 5000); // 5 second timeout

    const cleanup = () => {
      clearTimeout(timeout);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      video.src = '';
      video.load();
    };
    
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      if (hasResolved) return;
      
      try {
        const metadata = {
          duration: Math.floor(video.duration) || 0,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
        };
        
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve(metadata);
        }
      } catch (error) {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          reject(error);
        }
      }
    };

    video.onerror = (error) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(new Error(`Video metadata error: ${error}`));
      }
    };

    try {
      // Create object URL and load video
      objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;
      video.load();
    } catch (error) {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(error);
      }
    }
  });
};