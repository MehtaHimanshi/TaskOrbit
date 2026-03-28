import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { AppState, Board, List, Card, ChecklistItem, Comment, BoardBackground, ActivityEntry } from '@/types/kanban';
import { genId } from '@/store/kanbanStore';
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

    default:
      return state;
  }
}

const KanbanContext = createContext<any>(null);

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    boards: [],
    lists: [],
    cards: [],
    labels: [],
    users: [],
    activities: [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const [syncReady, setSyncReady] = useState(false);

  // 🚀 LOAD FROM DB ONLY
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchAppState();

        if (r.ok) {
          const data = await r.json();
          dispatch({ type: 'SET_STATE', payload: data });
        } else if (r.status === 404) {
          // first time → seed DB
          await saveAppState(stateRef.current);
        } else {
          throw new Error(`GET /api/state failed`);
        }
      } catch (e) {
        console.error("API ERROR:", e);
      } finally {
        setSyncReady(true);
      }
    })();
  }, []);

  // 🚀 SAVE TO DB (NO LOCAL STORAGE)
  useEffect(() => {
    if (!syncReady) return;

    const t = setTimeout(() => {
      saveAppState(state).catch(() => {});
    }, 300);

    return () => clearTimeout(t);
  }, [state, syncReady]);

  return (
    <KanbanContext.Provider value={{ state, dispatch }}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban must be used within KanbanProvider');
  return ctx;
}