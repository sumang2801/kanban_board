// Shared connection management for Server-Sent Events
export class SSEConnectionManager {
  private connections = new Map<string, Set<ReadableStreamDefaultController<string>>>();

  addConnection(boardId: string, controller: ReadableStreamDefaultController<string>) {
    if (!this.connections.has(boardId)) {
      this.connections.set(boardId, new Set());
    }
    this.connections.get(boardId)!.add(controller);
  }

  removeConnection(boardId: string, controller: ReadableStreamDefaultController<string>) {
    const boardConnections = this.connections.get(boardId);
    if (boardConnections) {
      boardConnections.delete(controller);
      if (boardConnections.size === 0) {
        this.connections.delete(boardId);
      }
    }
  }

  broadcastToBoard(boardId: string, data: any) {
    const boardConnections = this.connections.get(boardId);
    if (!boardConnections) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    // Send to all connected clients for this board
    const failedConnections: ReadableStreamDefaultController<string>[] = [];
    
    for (const controller of boardConnections) {
      try {
        controller.enqueue(message);
      } catch (error) {
        // Mark failed connections for removal
        failedConnections.push(controller);
      }
    }
    
    // Remove failed connections
    failedConnections.forEach(controller => {
      this.removeConnection(boardId, controller);
    });
  }

  getConnectionCount(boardId: string): number {
    return this.connections.get(boardId)?.size || 0;
  }

  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }
}

// Global instance
export const sseManager = new SSEConnectionManager();
