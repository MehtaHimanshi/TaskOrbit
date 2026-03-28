import { List, Card } from '@/types/kanban';
import { useKanban } from '@/context/KanbanContext';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import TaskCard from './TaskCard';

interface Props {
  list: List;
  cards: Card[];
  filteredCardIds: Set<string>;
  isFiltering: boolean;
}

export default function ListColumn({ list, cards, filteredCardIds, isFiltering }: Props) {
  const { dispatch } = useKanban();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: { type: 'list' },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
    data: { type: 'list' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    if (title.trim()) dispatch({ type: 'UPDATE_LIST', payload: { id: list.id, title: title.trim() } });
    setEditing(false);
  };

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    dispatch({ type: 'ADD_CARD', payload: { listId: list.id, title: newCardTitle.trim() } });
    setNewCardTitle('');
    setAddingCard(false);
  };

  const visibleCards = isFiltering ? cards.filter(c => filteredCardIds.has(c.id)) : cards;

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex-shrink-0 w-64 sm:w-72 glass-card rounded-xl shadow-card flex flex-col max-h-[calc(100vh-8rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-1" {...attributes} {...listeners}>
        {editing ? (
          <Input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setTitle(list.title); setEditing(false); } }}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <h3 className="text-sm font-semibold text-foreground cursor-grab">{list.title}</h3>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{cards.length}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted/60 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dispatch({ type: 'DELETE_LIST', payload: list.id })} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards */}
      <div ref={setDroppableRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[40px]">
        <SortableContext items={visibleCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {visibleCards.map(card => (
            <TaskCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="p-2 pt-0">
        {addingCard ? (
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="Card title..."
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCard(); if (e.key === 'Escape') setAddingCard(false); }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} className="gradient-primary text-primary-foreground text-xs">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingCard(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full text-left text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add a card
          </button>
        )}
      </div>
    </div>
  );
}
