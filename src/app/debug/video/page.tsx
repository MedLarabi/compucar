"use client";

import { useState } from 'react';

export default function VideoDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const testVideoUrl = 'https://carworkshop.org/products/video_1759872204671_316z1v.mov';
  const proxiedUrl = `/api/proxy/video?url=${encodeURIComponent(testVideoUrl)}`;

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectVideo = () => {
    addLog('Testing direct video URL...');
    const video = document.createElement('video');
    video.src = testVideoUrl;
    video.muted = true;
    video.preload = 'auto';
    
    video.oncanplaythrough = () => addLog('✅ Direct video loaded successfully');
    video.onerror = (e: string | Event) => {
      if (typeof e !== 'string') {
        const error = (e.target as HTMLVideoElement)?.error;
        addLog(`❌ Direct video failed: ${error?.code} - ${getErrorMessage(error?.code)}`);
      } else {
        addLog(`❌ Direct video failed: ${e}`);
      }
    };
    video.load();
  };

  const testProxiedVideo = () => {
    addLog('Testing proxied video URL...');
    const video = document.createElement('video');
    video.src = proxiedUrl;
    video.muted = true;
    video.preload = 'auto';
    
    video.oncanplaythrough = () => addLog('✅ Proxied video loaded successfully');
    video.onerror = (e: string | Event) => {
      if (typeof e !== 'string') {
        const error = (e.target as HTMLVideoElement)?.error;
        addLog(`❌ Proxied video failed: ${error?.code} - ${getErrorMessage(error?.code)}`);
      } else {
        addLog(`❌ Proxied video failed: ${e}`);
      }
    };
    video.load();
  };

  const testProxyAPI = async () => {
    addLog('Testing proxy API...');
    try {
      const response = await fetch(proxiedUrl, { method: 'HEAD' });
      addLog(`Proxy API response: ${response.status} ${response.statusText}`);
      addLog(`Content-Type: ${response.headers.get('content-type')}`);
      addLog(`Content-Length: ${response.headers.get('content-length')}`);
      addLog(`Accept-Ranges: ${response.headers.get('accept-ranges')}`);
    } catch (error) {
      addLog(`❌ Proxy API failed: ${error}`);
    }
  };

  const getErrorMessage = (code?: number): string => {
    switch (code) {
      case 1: return 'MEDIA_ERR_ABORTED';
      case 2: return 'MEDIA_ERR_NETWORK';
      case 3: return 'MEDIA_ERR_DECODE';
      case 4: return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
      default: return 'Unknown error';
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Video Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Controls</h2>
          <div className="space-y-2">
            <button 
              onClick={testDirectVideo}
              className="block w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Direct Video URL
            </button>
            <button 
              onClick={testProxiedVideo}
              className="block w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Proxied Video URL
            </button>
            <button 
              onClick={testProxyAPI}
              className="block w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Proxy API
            </button>
            <button 
              onClick={clearLogs}
              className="block w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>

          {/* Video Elements */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Direct Video:</h3>
              <video 
                src={testVideoUrl} 
                controls 
                muted 
                className="w-full max-w-sm border"
                onError={(e) => addLog(`Direct video element error: ${(e.target as HTMLVideoElement)?.error?.code}`)}
                onCanPlay={() => addLog('Direct video element can play')}
              />
            </div>
            
            <div>
              <h3 className="font-semibold">Proxied Video:</h3>
              <video 
                src={proxiedUrl} 
                controls 
                muted 
                className="w-full max-w-sm border"
                onError={(e) => addLog(`Proxied video element error: ${(e.target as HTMLVideoElement)?.error?.code}`)}
                onCanPlay={() => addLog('Proxied video element can play')}
              />
            </div>
          </div>
        </div>

        {/* Logs */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet. Click a test button to start.</div>
            )}
          </div>
        </div>
      </div>

      {/* URLs for reference */}
      <div className="mt-8 space-y-2 text-sm">
        <p><strong>Original URL:</strong> <code className="bg-gray-100 p-1 rounded">{testVideoUrl}</code></p>
        <p><strong>Proxied URL:</strong> <code className="bg-gray-100 p-1 rounded">{proxiedUrl}</code></p>
      </div>
    </div>
  );
}
