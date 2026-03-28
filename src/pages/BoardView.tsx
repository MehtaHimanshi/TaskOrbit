import { useParams, Link, useNavigate } from 'react-router-dom';
import { useKanban } from '@/context/KanbanContext';
import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, Filter, Palette, Trash2, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BACKGROUND_PRESETS } from '@/store/kanbanStore';
import ListColumn from '@/components/kanban/ListColumn';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from '@/components/kanban/TaskCard';
import logo from '@/assets/logo.png';

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useKanban();
  const [newListTitle, setNewListTitle] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [mobileToolbar, setMobileToolbar] = useState(false);

  const board = state.boards.find(b => b.id === boardId);
  const lists = useMemo(() =>
    state.lists.filter(l => l.boardId === boardId).sort((a, b) => a.position - b.position),
    [state.lists, boardId]
  );

  const allCards = useMemo(() => {
    const listIds = new Set(lists.map(l => l.id));
    return state.cards.filter(c => listIds.has(c.listId) && !c.archived);
  }, [state.cards, lists]);

  const filteredCardIds = useMemo(() => {
    return new Set(
      allCards
        .filter(c => {
          if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (filterLabel && !c.labels.includes(filterLabel)) return false;
          if (filterMember && !c.memberIds.includes(filterMember)) return false;
          return true;
        })
        .map(c => c.id)
    );
  }, [allCards, search, filterLabel, filterMember]);

  const isFiltering = !!(search || filterLabel || filterMember);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Board not found</p>
          <Link to="/" className="text-primary hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  const handleAddList = () => {
    if (!newListTitle.trim()) return;
    dispatch({ type: 'ADD_LIST', payload: { boardId: boardId!, title: newListTitle.trim() } });
    setNewListTitle('');
    setAddingList(false);
  };

  const handleDragStart = (e: DragStartEvent) => {
    const { active } = e;
    if (active.data.current?.type === 'card') {
      setActiveCardId(active.id as string);
    }
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'card') {
      let toListId: string | null = null;
      let toPosition = 0;

      if (overType === 'card') {
        const overCard = state.cards.find(c => c.id === over.id);
        if (overCard && overCard.listId !== active.data.current?.listId) {
          toListId = overCard.listId;
          toPosition = overCard.position;
        }
      } else if (overType === 'list') {
        const currentCard = state.cards.find(c => c.id === active.id);
        if (currentCard && currentCard.listId !== over.id) {
          toListId = over.id as string;
          toPosition = state.cards.filter(c => c.listId === over.id && !c.archived).length;
        }
      }

      if (toListId) {
        dispatch({
          type: 'MOVE_CARD',
          payload: { cardId: active.id as string, toListId, toPosition },
        });
      }
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCardId(null);
    const { active, over } = e;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'list' && overType === 'list' && active.id !== over.id) {
      const oldIdx = lists.findIndex(l => l.id === active.id);
      const newIdx = lists.findIndex(l => l.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return;
      const newOrder = [...lists.map(l => l.id)];
      newOrder.splice(oldIdx, 1);
      newOrder.splice(newIdx, 0, active.id as string);
      dispatch({ type: 'REORDER_LISTS', payload: { boardId: boardId!, listIds: newOrder } });
    }

    if (activeType === 'card' && overType === 'card' && active.id !== over.id) {
      const activeCard = state.cards.find(c => c.id === active.id);
      const overCard = state.cards.find(c => c.id === over.id);
      if (!activeCard || !overCard || activeCard.listId !== overCard.listId) return;

      const listCards = state.cards
        .filter(c => c.listId === activeCard.listId && !c.archived)
        .sort((a, b) => a.position - b.position);
      const cardIds = listCards.map(c => c.id);
      const oldIdx = cardIds.indexOf(active.id as string);
      const newIdx = cardIds.indexOf(over.id as string);
      cardIds.splice(oldIdx, 1);
      cardIds.splice(newIdx, 0, active.id as string);
      dispatch({ type: 'REORDER_CARDS', payload: { listId: activeCard.listId, cardIds } });
    }
  };

  const activeCard = activeCardId ? state.cards.find(c => c.id === activeCardId) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: board.background.value }}>
      {/* Navbar */}
      <header className="glass-card border-b border-border/30 sticky top-0 z-50">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="p-1.5 sm:p-2 rounded-lg hover:bg-muted/60 transition-colors flex-shrink-0">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <img src={logo} alt="TaskOrbit" className="h-7 w-7 sm:h-8 sm:w-8 object-contain flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold font-display text-foreground truncate">{board.title}</h1>
          </div>

          {/* Desktop toolbar */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm w-44 bg-background/60 backdrop-blur-sm"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`h-8 bg-background/60 ${isFiltering ? 'border-primary text-primary' : ''}`}>
                  <Filter className="h-3.5 w-3.5 mr-1" /> Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Label</p>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setFilterLabel('')} className={`text-xs px-2 py-0.5 rounded-full border ${!filterLabel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                    {state.labels.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setFilterLabel(l.id)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${filterLabel === l.id ? 'ring-2 ring-primary' : 'hover:scale-105'}`}
                        style={{ backgroundColor: `hsl(var(--label-${l.color}))`, color: 'white' }}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Member</p>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setFilterMember('')} className={`text-xs px-2 py-0.5 rounded-full border ${!filterMember ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                    {state.users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setFilterMember(u.id)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${filterMember === u.id ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                      >
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>
                {isFiltering && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setSearch(''); setFilterLabel(''); setFilterMember(''); }}>
                    Clear filters
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-background/60">
                  <Palette className="h-3.5 w-3.5 mr-1" /> Background
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <p className="text-xs font-medium text-muted-foreground mb-2">Board Background</p>
                <div className="grid grid-cols-5 gap-2">
                  {BACKGROUND_PRESETS.map(bg => (
                    <button
                      key={bg.name}
                      onClick={() => dispatch({ type: 'UPDATE_BOARD', payload: { id: boardId!, updates: { background: { type: 'gradient', value: bg.value } } } })}
                      className={`h-8 rounded-md border-2 transition-all hover:scale-110 ${board.background.value === bg.value ? 'border-primary shadow-soft' : 'border-transparent'}`}
                      style={{ background: bg.value }}
                      title={bg.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => { dispatch({ type: 'DELETE_BOARD', payload: boardId! }); navigate('/'); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            onClick={() => setMobileToolbar(!mobileToolbar)}
          >
            {mobileToolbar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile toolbar */}
        {mobileToolbar && (
          <div className="md:hidden px-3 pb-3 space-y-2 border-t border-border/20 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-background/60 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-8 bg-background/60 ${isFiltering ? 'border-primary text-primary' : ''}`}>
                    <Filter className="h-3.5 w-3.5 mr-1" /> Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Label</p>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => setFilterLabel('')} className={`text-xs px-2 py-0.5 rounded-full border ${!filterLabel ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                      {state.labels.map(l => (
                        <button
                          key={l.id}
                          onClick={() => setFilterLabel(l.id)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${filterLabel === l.id ? 'ring-2 ring-primary' : 'hover:scale-105'}`}
                          style={{ backgroundColor: `hsl(var(--label-${l.color}))`, color: 'white' }}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Member</p>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => setFilterMember('')} className={`text-xs px-2 py-0.5 rounded-full border ${!filterMember ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                      {state.users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => setFilterMember(u.id)}
                          className={`text-xs px-2 py-0.5 rounded-full border ${filterMember === u.id ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isFiltering && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setSearch(''); setFilterLabel(''); setFilterMember(''); }}>
                      Clear filters
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 bg-background/60">
                    <Palette className="h-3.5 w-3.5 mr-1" /> BG
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Board Background</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUND_PRESETS.map(bg => (
                      <button
                        key={bg.name}
                        onClick={() => dispatch({ type: 'UPDATE_BOARD', payload: { id: boardId!, updates: { background: { type: 'gradient', value: bg.value } } } })}
                        className={`h-8 rounded-md border-2 transition-all hover:scale-110 ${board.background.value === bg.value ? 'border-primary shadow-soft' : 'border-transparent'}`}
                        style={{ background: bg.value }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() => { dispatch({ type: 'DELETE_BOARD', payload: boardId! }); navigate('/'); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto p-3 sm:p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 sm:gap-4 items-start h-full">
              {lists.map(list => (
                <ListColumn
                  key={list.id}
                  list={list}
                  cards={allCards
                    .filter(c => c.listId === list.id)
                    .sort((a, b) => a.position - b.position)}
                  filteredCardIds={filteredCardIds}
                  isFiltering={isFiltering}
                />
              ))}

              {/* Add list */}
              <div className="flex-shrink-0 w-64 sm:w-72">
                {addingList ? (
                  <div className="glass-card rounded-xl p-3 shadow-card space-y-2">
                    <Input
                      autoFocus
                      placeholder="List title..."
                      value={newListTitle}
                      onChange={e => setNewListTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setAddingList(false); }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddList} className="gradient-primary text-primary-foreground">Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingList(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingList(true)}
                    className="w-full glass-card rounded-xl p-3 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors shadow-card hover:shadow-soft"
                  >
                    <Plus className="h-4 w-4" /> Add another list
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard ? (
              <div className="rotate-3 opacity-90">
                <TaskCard card={activeCard} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
