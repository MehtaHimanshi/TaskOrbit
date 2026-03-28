import { Card } from '@/types/kanban';
import { useKanban } from '@/context/KanbanContext';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckSquare, Clock, MessageSquare, Plus, Tag, Trash2, Users, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  card: Card;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardDetailDialog({ card, open, onOpenChange }: Props) {
  const { state, dispatch } = useKanban();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  const list = state.lists.find(l => l.id === card.listId);
  const labels = state.labels;
  const members = state.users;
  const cardLabels = labels.filter(l => card.labels.includes(l.id));
  const cardMembers = members.filter(m => card.memberIds.includes(m.id));

  const activities = useMemo(() =>
    state.activities
      .filter(a => a.cardId === card.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20),
    [state.activities, card.id]
  );

  const update = (updates: Partial<Card>) => {
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, updates } });
  };

  const handleSaveTitle = () => {
    if (title.trim()) update({ title: title.trim() });
    setEditingTitle(false);
  };

  const handleSaveDescription = () => {
    update({ description });
  };

  const toggleLabel = (labelId: string) => {
    const newLabels = card.labels.includes(labelId)
      ? card.labels.filter(id => id !== labelId)
      : [...card.labels, labelId];
    update({ labels: newLabels });
  };

  const toggleMember = (userId: string) => {
    const newMembers = card.memberIds.includes(userId)
      ? card.memberIds.filter(id => id !== userId)
      : [...card.memberIds, userId];
    update({ memberIds: newMembers });
  };

  const handleAddCheckItem = () => {
    if (!newCheckItem.trim()) return;
    dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { cardId: card.id, text: newCheckItem.trim() } });
    setNewCheckItem('');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    dispatch({ type: 'ADD_COMMENT', payload: { cardId: card.id, userId: 'u1', text: newComment.trim() } });
    setNewComment('');
  };

  const checkDone = card.checklist.filter(i => i.completed).length;
  const checkTotal = card.checklist.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-auto">
        <DialogHeader>
          <div className="flex items-start gap-2">
            {editingTitle ? (
              <Input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                className="text-lg font-bold font-display"
              />
            ) : (
              <DialogTitle
                className="text-lg font-bold font-display cursor-pointer hover:text-primary transition-colors flex-1"
                onClick={() => setEditingTitle(true)}
              >
                {card.title}
              </DialogTitle>
            )}
          </div>
          <p className="text-xs text-muted-foreground">in list <span className="font-medium text-foreground">{list?.title}</span></p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-6 mt-4">
          {/* Main content */}
          <div className="space-y-5">
            {/* Labels */}
            {cardLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cardLabels.map(l => (
                  <span
                    key={l.id}
                    className="text-xs font-medium px-2 py-1 rounded-md"
                    style={{ backgroundColor: `hsl(var(--label-${l.color}) / 0.15)`, color: `hsl(var(--label-${l.color}))` }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}

            {/* Members */}
            {cardMembers.length > 0 && (
              <div className="flex items-center gap-1.5">
                {cardMembers.map(m => (
                  <div
                    key={m.id}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                    style={{ backgroundColor: m.color }}
                    title={m.name}
                  >
                    {m.avatar}
                  </div>
                ))}
              </div>
            )}

            {/* Due date display */}
            {card.dueDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className={new Date(card.dueDate) < new Date() ? 'text-destructive font-medium' : 'text-foreground'}>
                  Due {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
              <Textarea
                placeholder="Add a description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={handleSaveDescription}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4" /> Checklist
                  {checkTotal > 0 && <span className="text-xs text-muted-foreground">({checkDone}/{checkTotal})</span>}
                </h4>
              </div>
              {checkTotal > 0 && (
                <div className="w-full h-1.5 rounded-full bg-muted mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0}%`,
                      background: checkDone === checkTotal ? 'hsl(var(--label-green))' : 'hsl(var(--primary))',
                    }}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                {card.checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { cardId: card.id, itemId: item.id } })}
                    />
                    <span className={`text-sm flex-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.text}</span>
                    <button
                      onClick={() => dispatch({ type: 'DELETE_CHECKLIST_ITEM', payload: { cardId: card.id, itemId: item.id } })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add item..."
                  value={newCheckItem}
                  onChange={e => setNewCheckItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCheckItem()}
                  className="text-sm h-8"
                />
                <Button size="sm" variant="outline" onClick={handleAddCheckItem} className="h-8 px-2">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Comments
              </h4>
              <div className="space-y-2 mb-3">
                {card.comments.map(c => {
                  const user = state.users.find(u => u.id === c.userId);
                  return (
                    <div key={c.id} className="flex gap-2">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: user?.color || 'hsl(var(--muted))' }}
                      >
                        {user?.avatar || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{user?.name || 'Unknown'} <span className="text-muted-foreground font-normal">{new Date(c.createdAt).toLocaleDateString()}</span></p>
                        <p className="text-sm text-foreground/80 mt-0.5 break-words">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  className="text-sm h-8"
                />
                <Button size="sm" onClick={handleAddComment} className="h-8 gradient-primary text-primary-foreground text-xs">
                  Send
                </Button>
              </div>
            </div>

            {/* Activity Log */}
            {activities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Activity
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.map(a => {
                    const user = state.users.find(u => u.id === a.userId);
                    return (
                      <div key={a.id} className="flex gap-2 items-start">
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[7px] font-bold text-primary-foreground flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: user?.color || 'hsl(var(--muted))' }}
                        >
                          {user?.avatar || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground">
                            <span className="font-medium">{user?.name || 'Unknown'}</span>{' '}
                            <span className="text-muted-foreground">{a.action}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 order-first sm:order-last">
            {/* Labels */}
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Tag className="h-3 w-3" /> Labels</h5>
              <div className="flex flex-wrap gap-1 sm:flex-col sm:space-y-1 sm:gap-0">
                {labels.map(l => (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={`text-left text-xs px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${card.labels.includes(l.id) ? 'ring-2 ring-primary' : 'hover:bg-muted/60'}`}
                    style={{ backgroundColor: `hsl(var(--label-${l.color}) / 0.12)`, color: `hsl(var(--label-${l.color}))` }}
                  >
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: `hsl(var(--label-${l.color}))` }} />
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Members */}
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Users className="h-3 w-3" /> Members</h5>
              <div className="flex flex-wrap gap-1 sm:flex-col sm:space-y-1 sm:gap-0">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`text-left text-xs px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${card.memberIds.includes(m.id) ? 'ring-2 ring-primary bg-muted/40' : 'hover:bg-muted/60'}`}
                  >
                    <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground flex-shrink-0" style={{ backgroundColor: m.color }}>
                      {m.avatar}
                    </div>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</h5>
              <Input
                type="date"
                value={card.dueDate || ''}
                onChange={e => update({ dueDate: e.target.value || null })}
                className="text-xs h-8"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-border space-y-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { update({ archived: true }); onOpenChange(false); }}
              >
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-destructive hover:text-destructive"
                onClick={() => { dispatch({ type: 'DELETE_CARD', payload: card.id }); onOpenChange(false); }}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
