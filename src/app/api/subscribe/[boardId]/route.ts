import { NextRequest } from 'next/server';
import { sseManager } from '@/lib/sseManager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to the manager
      sseManager.addConnection(boardId, controller);

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ 
        type: 'connected', 
        boardId,
        timestamp: new Date().toISOString(),
        connectedClients: sseManager.getConnectionCount(boardId)
      })}\n\n`);

      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ 
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);
        } catch (error) {
          // Connection closed, clean up
          clearInterval(heartbeat);
          sseManager.removeConnection(boardId, controller);
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        sseManager.removeConnection(boardId, controller);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
