/**
 * Format duration from seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parse duration from various formats to seconds
 * @param input - Duration string (e.g., "4:13", "1:23:45", "253")
 * @returns Duration in seconds
 */
export function parseDuration(input: string): number {
  if (!input) return 0;
  
  // If it's just a number, treat as seconds
  if (/^\d+$/.test(input)) {
    return parseInt(input, 10);
  }
  
  // Parse MM:SS or HH:MM:SS format
  const parts = input.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  return 0;
}

/**
 * Convert YouTube duration format (PT4M13S) to seconds
 * @param duration - YouTube ISO 8601 duration format
 * @returns Duration in seconds
 */
export function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get total duration of multiple videos
 * @param videos - Array of videos with duration property
 * @returns Total duration in seconds
 */
export function getTotalDuration(videos: Array<{ duration?: number | null }>): number {
  return videos.reduce((total, video) => total + (video.duration || 0), 0);
}
