import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { AppState, Board, List, Card, ChecklistItem, Comment, BoardBackground, ActivityEntry } from '@/types/kanban';
import { loadState, saveState, genId } from '@/store/kanbanStore';
import { fetchAppState, saveAppState } from '@/lib/api';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'ADD_BOARD'; payload: { title: string; background: BoardBackground } }
  | { type: 'UPDATE_BOARD'; payload: { id: string; updates: Partial<Board> } }
  | { type: 'DELETE_BOARD'; payload: string }
  | { type: 'ADD_LIST'; payload: { boardId: string; title: string } }
  | { type: 'UPDATE_LIST'; payload: { id: string; title: string } }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'REORDER_LISTS'; payload: { boardId: string; listIds: string[] } }
  | { type: 'ADD_CARD'; payload: { listId: string; title: string } }
  | { type: 'UPDATE_CARD'; payload: { id: string; updates: Partial<Card> } }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'MOVE_CARD'; payload: { cardId: string; toListId: string; toPosition: number } }
  | { type: 'REORDER_CARDS'; payload: { listId: string; cardIds: string[] } }
  | { type: 'ADD_COMMENT'; payload: { cardId: string; userId: string; text: string } }
  | { type: 'TOGGLE_CHECKLIST_ITEM'; payload: { cardId: string; itemId: string } }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: { cardId: string; text: string } }
  | { type: 'DELETE_CHECKLIST_ITEM'; payload: { cardId: string; itemId: string } }
  | { type: 'ADD_ACTIVITY'; payload: { cardId: string; userId: string; action: string } };

function addActivity(state: AppState, cardId: string, userId: string, action: string): ActivityEntry[] {
  const entry: ActivityEntry = {
    id: genId('act'),
    cardId,
    userId,
    action,
    timestamp: new Date().toISOString(),
  };
  return [...state.activities, entry];
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'ADD_BOARD': {
      const board: Board = {
        id: genId('b'),
        title: action.payload.title,
        background: action.payload.background,
        createdAt: new Date().toISOString(),
      };
      return { ...state, boards: [...state.boards, board] };
    }

    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map(b => b.id === action.payload.id ? { ...b, ...action.payload.updates } : b),
      };

    case 'DELETE_BOARD': {
      const boardListIds = state.lists.filter(l => l.boardId === action.payload).map(l => l.id);
      return {
        ...state,
        boards: state.boards.filter(b => b.id !== action.payload),
        lists: state.lists.filter(l => l.boardId !== action.payload),
        cards: state.cards.filter(c => !boardListIds.includes(c.listId)),
      };
    }

    case 'ADD_LIST': {
      const maxPos = Math.max(-1, ...state.lists.filter(l => l.boardId === action.payload.boardId).map(l => l.position));
      const list: List = {
        id: genId('l'),
        boardId: action.payload.boardId,
        title: action.payload.title,
        position: maxPos + 1,
      };
      return { ...state, lists: [...state.lists, list] };
    }

    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map(l => l.id === action.payload.id ? { ...l, title: action.payload.title } : l),
      };

    case 'DELETE_LIST':
      return {
        ...state,
        lists: state.lists.filter(l => l.id !== action.payload),
        cards: state.cards.filter(c => c.listId !== action.payload),
      };

    case 'REORDER_LISTS':
      return {
        ...state,
        lists: state.lists.map(l => {
          if (l.boardId !== action.payload.boardId) return l;
          const idx = action.payload.listIds.indexOf(l.id);
          return idx >= 0 ? { ...l, position: idx } : l;
        }),
      };

    case 'ADD_CARD': {
      const maxPos = Math.max(-1, ...state.cards.filter(c => c.listId === action.payload.listId).map(c => c.position));
      const card: Card = {
        id: genId('c'),
        listId: action.payload.listId,
        title: action.payload.title,
        description: '',
        position: maxPos + 1,
        labels: [],
        dueDate: null,
        checklist: [],
        memberIds: [],
        comments: [],
        archived: false,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        cards: [...state.cards, card],
        activities: addActivity(state, card.id, 'u1', `created card "${action.payload.title}"`),
      };
    }

    case 'UPDATE_CARD': {
      const updates = action.payload.updates;
      const oldCard = state.cards.find(c => c.id === action.payload.id);
      let newActivities = state.activities;
      if (oldCard) {
        if (updates.archived && !oldCard.archived) {
          newActivities = addActivity(state, action.payload.id, 'u1', 'archived this card');
        }
        if (updates.title && updates.title !== oldCard.title) {
          newActivities = addActivity({ ...state, activities: newActivities }, action.payload.id, 'u1', `renamed to "${updates.title}"`);
        }
        if (updates.description !== undefined && updates.description !== oldCard.description) {
          newActivities = addActivity({ ...state, activities: newActivities }, action.payload.id, 'u1', 'updated description');
        }
        if (updates.dueDate !== undefined && updates.dueDate !== oldCard.dueDate) {
          newActivities = addActivity({ ...state, activities: newActivities }, action.payload.id, 'u1', updates.dueDate ? `set due date to ${updates.dueDate}` : 'removed due date');
        }
      }
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.id ? { ...c, ...updates } : c),
        activities: newActivities,
      };
    }

    case 'DELETE_CARD':
      return { ...state, cards: state.cards.filter(c => c.id !== action.payload) };

    case 'MOVE_CARD': {
      const { cardId, toListId, toPosition } = action.payload;
      const card = state.cards.find(c => c.id === cardId);
      if (!card) return state;

      const fromList = state.lists.find(l => l.id === card.listId);
      const toList = state.lists.find(l => l.id === toListId);
      
      let newCards = state.cards.filter(c => c.id !== cardId);
      const targetCards = newCards.filter(c => c.listId === toListId).sort((a, b) => a.position - b.position);
      targetCards.splice(toPosition, 0, { ...card, listId: toListId });
      const updatedTargetCards = targetCards.map((c, i) => ({ ...c, position: i }));
      newCards = newCards.filter(c => c.listId !== toListId);

      let newActivities = state.activities;
      if (card.listId !== toListId && fromList && toList) {
        newActivities = addActivity(state, cardId, 'u1', `moved from "${fromList.title}" to "${toList.title}"`);
      }

      return { ...state, cards: [...newCards, ...updatedTargetCards], activities: newActivities };
    }

    case 'REORDER_CARDS':
      return {
        ...state,
        cards: state.cards.map(c => {
          if (c.listId !== action.payload.listId) return c;
          const idx = action.payload.cardIds.indexOf(c.id);
          return idx >= 0 ? { ...c, position: idx } : c;
        }),
      };

    case 'ADD_COMMENT': {
      const comment: Comment = {
        id: genId('cm'),
        userId: action.payload.userId,
        text: action.payload.text,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.cardId ? { ...c, comments: [...c.comments, comment] } : c),
        activities: addActivity(state, action.payload.cardId, action.payload.userId, 'added a comment'),
      };
    }

    case 'TOGGLE_CHECKLIST_ITEM': {
      const card = state.cards.find(c => c.id === action.payload.cardId);
      const item = card?.checklist.find(i => i.id === action.payload.itemId);
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.cardId ? {
          ...c,
          checklist: c.checklist.map(i => i.id === action.payload.itemId ? { ...i, completed: !i.completed } : i),
        } : c),
        activities: addActivity(state, action.payload.cardId, 'u1', item ? (item.completed ? `unchecked "${item.text}"` : `checked "${item.text}"`) : 'toggled checklist item'),
      };
    }

    case 'ADD_CHECKLIST_ITEM': {
      const newItem: ChecklistItem = { id: genId('ck'), text: action.payload.text, completed: false };
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.cardId ? { ...c, checklist: [...c.checklist, newItem] } : c),
        activities: addActivity(state, action.payload.cardId, 'u1', `added checklist item "${action.payload.text}"`),
      };
    }

    case 'DELETE_CHECKLIST_ITEM':
      return {
        ...state,
        cards: state.cards.map(c => c.id === action.payload.cardId ? {
          ...c,
          checklist: c.checklist.filter(item => item.id !== action.payload.itemId),
        } : c),
      };

    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: addActivity(state, action.payload.cardId, action.payload.userId, action.payload.action),
      };

    default:
      return state;
  }
}

const KanbanContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  syncReady: boolean;
  syncError: string | null;
} | null>(null);

function normalizeRemoteState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.boards) || !Array.isArray(o.lists) || !Array.isArray(o.cards)) return null;
  if (!Array.isArray(o.labels) || !Array.isArray(o.users)) return null;
  return {
    boards: o.boards as AppState['boards'],
    lists: o.lists as AppState['lists'],
    cards: o.cards as AppState['cards'],
    labels: o.labels as AppState['labels'],
    users: o.users as AppState['users'],
    activities: Array.isArray(o.activities) ? (o.activities as AppState['activities']) : [],
  };
}

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadState();
    if (!loaded.activities) loaded.activities = [];
    return loaded;
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const [syncReady, setSyncReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load from MySQL (API); 404 → seed server. If user edits before response, keep client & PUT client.
  useEffect(() => {
    let cancelled = false;
    const snapshot = structuredClone(stateRef.current);
    (async () => {
      try {
        const r = await fetchAppState();
        if (cancelled) return;
        if (r.ok) {
          const data = await r.json();
          const next = normalizeRemoteState(data);
          if (!next) throw new Error('Invalid snapshot from server');
          const cur = stateRef.current;
          const unchanged = JSON.stringify(cur) === JSON.stringify(snapshot);
          if (unchanged) {
            dispatch({ type: 'SET_STATE', payload: next });
          } else {
            const put = await saveAppState(cur);
            if (!put.ok) throw new Error(`Sync failed: ${put.status}`);
          }
        } else if (r.status === 404) {
          const put = await saveAppState(stateRef.current);
          if (!put.ok) throw new Error(`Seed failed: ${put.status}`);
        } else {
          throw new Error(`GET /api/state: ${r.status}`);
        }
        setSyncError(null);
      } catch (e) {
        if (!cancelled) {
          console.warn('TaskOrbit: API sync unavailable, using browser data only', e);
          setSyncError(e instanceof Error ? e.message : 'sync failed');
        }
      } finally {
        if (!cancelled) setSyncReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!syncReady) return;
    const t = window.setTimeout(() => {
      saveAppState(state).catch(() => {
        /* offline or DB down — localStorage still has copy */
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [state, syncReady]);

  return (
    <KanbanContext.Provider value={{ state, dispatch, syncReady, syncError }}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban must be used within KanbanProvider');
  return ctx;
}

