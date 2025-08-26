// Shared state manager using localStorage for cross-tab synchronization
// This provides a basic multi-user experience until real database is enabled

interface SharedCard {
  id: string;
  title: string;
  description: string;
  column_id: string;
  board_id: string;
  position: number;
  updated_at: string;
}

interface SharedBoard {
  id: string;
  title: string;
  cards: SharedCard[];
  updated_at: string;
}

const STORAGE_KEY = 'kanban_shared_state';
const SYNC_INTERVAL = 1000; // Check for updates every second

class SharedStateManager {
  private listeners: Set<() => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for storage changes from other tabs
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Start periodic sync
      this.startSync();
    }
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      console.log('📡 Detected changes from another tab');
      this.notifyListeners();
    }
  };

  private startSync() {
    this.syncInterval = setInterval(() => {
      const state = this.getSharedState();
      if (state.updated_at !== this.lastSyncTime) {
        console.log('🔄 State updated, notifying components');
        this.lastSyncTime = state.updated_at;
        this.notifyListeners();
      }
    }, SYNC_INTERVAL);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private getSharedState(): { boards: SharedBoard[]; updated_at: string } {
    if (typeof window === 'undefined') {
      return { boards: [], updated_at: '' };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultState = {
        boards: [{
          id: '9ecd54bf-c4db-4766-97dd-c6758c0d2f04',
          title: 'Project Alpha',
          cards: [
            {
              id: 'card-1',
              title: 'Sample Card 1',
              description: 'This is a sample card in the To Do column',
              column_id: 'col-1',
              board_id: '9ecd54bf-c4db-4766-97dd-c6758c0d2f04',
              position: 0,
              updated_at: new Date().toISOString()
            },
            {
              id: 'card-2',
              title: 'Sample Card 2', 
              description: 'This is a sample card in the In Progress column',
              column_id: 'col-2',
              board_id: '9ecd54bf-c4db-4766-97dd-c6758c0d2f04',
              position: 0,
              updated_at: new Date().toISOString()
            }
          ],
          updated_at: new Date().toISOString()
        }],
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    
    return JSON.parse(stored);
  }

  private saveSharedState(state: { boards: SharedBoard[]; updated_at: string }) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }

  getBoard(boardId: string): SharedBoard | null {
    const state = this.getSharedState();
    return state.boards.find(board => board.id === boardId) || null;
  }

  getBoards(): SharedBoard[] {
    const state = this.getSharedState();
    return state.boards;
  }

  updateCard(cardId: string, updates: Partial<SharedCard>) {
    const state = this.getSharedState();
    
    state.boards.forEach(board => {
      const cardIndex = board.cards.findIndex(card => card.id === cardId);
      if (cardIndex !== -1) {
        board.cards[cardIndex] = {
          ...board.cards[cardIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        board.updated_at = new Date().toISOString();
      }
    });
    
    state.updated_at = new Date().toISOString();
    this.saveSharedState(state);
    console.log('📡 Card updated in shared state');
  }

  createCard(boardId: string, card: Omit<SharedCard, 'id' | 'updated_at'>) {
    const state = this.getSharedState();
    const board = state.boards.find(b => b.id === boardId);
    
    if (board) {
      const newCard: SharedCard = {
        ...card,
        id: `shared-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        updated_at: new Date().toISOString()
      };
      
      board.cards.push(newCard);
      board.updated_at = new Date().toISOString();
      state.updated_at = new Date().toISOString();
      
      this.saveSharedState(state);
      console.log('📡 Card created in shared state');
      return newCard;
    }
    
    return null;
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const sharedStateManager = new SharedStateManager();
