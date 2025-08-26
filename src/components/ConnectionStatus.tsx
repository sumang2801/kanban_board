import { useState, useEffect } from 'react';
import { multiClientSubscriptionManager } from '@/lib/multiClientSync';

export default function ConnectionStatus({ boardId }: { boardId: string }) {
  const [status, setStatus] = useState(multiClientSubscriptionManager.getConnectionStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(multiClientSubscriptionManager.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!status.connected) {
    return null; // Don't show anything if not connected
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"
        title={`Multi-Client Sync Active - Board: ${boardId.slice(0, 8)}...`}
      ></div>
    </div>
  );
}