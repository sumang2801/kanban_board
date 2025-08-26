import { NextRequest, NextResponse } from 'next/server';
import { sseManager } from '@/lib/sseManager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    
    const { type, data } = body;

    // Validate the update
    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid update format' }, { status: 400 });
    }

    // Broadcast the update to all connected clients
    sseManager.broadcastToBoard(boardId, {
      type: 'board_update',
      boardId,
      updateType: type,
      data,
      timestamp: new Date().toISOString(),
      clientId: request.headers.get('x-client-id') || 'unknown'
    });

    return NextResponse.json({ 
      success: true, 
      connectedClients: sseManager.getConnectionCount(boardId)
    });
  } catch (error) {
    console.error('Error broadcasting update:', error);
    return NextResponse.json({ error: 'Failed to broadcast update' }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-client-id',
    },
  });
}
