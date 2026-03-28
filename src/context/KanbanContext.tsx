import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { AppState, Board, List, Card, ChecklistItem, Comment, BoardBackground, ActivityEntry } from '@/types/kanban';
import { genId } from '@/store/kanbanStore';
import { fetchAppState, saveAppState } from '@/lib/api';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'ADD_BOARD'; payload: { title: string; background: BoardBackground } }
  | { type: 'ADD_LIST'; payload: { boardId: string; title: string } }
  | { type: 'ADD_CARD'; payload: { listId: string; title: string } };

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

  // 🔥 LOAD ONCE FROM DB (SAFE)
  useEffect(() => {
    (async () => {
      let loaded = false;

      try {
        const res = await fetchAppState();

        if (res.ok) {
          const data = await res.json();
          dispatch({ type: 'SET_STATE', payload: data });
          loaded = true;
        } else if (res.status === 404) {
          await saveAppState(stateRef.current);
          loaded = true;
        } else {
          throw new Error(`API failed: ${res.status}`);
        }
      } catch (e) {
        console.error("LOAD ERROR:", e);
      }

      // ✅ only after successful load
      if (loaded) {
        setSyncReady(true);
      }
    })();
  }, []);

  // 🔥 SAVE (ONLY AFTER LOAD)
  useEffect(() => {
  if (!syncReady) return;

  // 🔥 VERY IMPORTANT FIX
  if (
    state.boards.length === 0 &&
    state.lists.length === 0 &&
    state.cards.length === 0
  ) {
    return; // ❌ empty state DB me save nahi hogi
  }

  const t = setTimeout(() => {
    saveAppState(state).catch(() => {});
  }, 400);

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