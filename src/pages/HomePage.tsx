import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Search, Plus } from 'lucide-react';
import { useKanban } from '@/context/KanbanContext';
import { useState } from 'react';
import { BACKGROUND_PRESETS } from '@/store/kanbanStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { state, dispatch } = useKanban();
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [selectedBg, setSelectedBg] = useState(BACKGROUND_PRESETS[0].value);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredBoards = state.boards.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newBoardTitle.trim()) return;
    dispatch({
      type: 'ADD_BOARD',
      payload: { title: newBoardTitle.trim(), background: { type: 'gradient', value: selectedBg } },
    });
    setNewBoardTitle('');
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <img
                src={logo}
                alt="TaskOrbit Logo"
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain animate-float drop-shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-soft -z-10 scale-150" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-display bg-clip-text text-transparent gradient-primary" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                TaskOrbit
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5 hidden sm:block">Organize your tasks in motion</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-36 sm:w-56 bg-background/60 backdrop-blur-sm border-border/50"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          {/* Logo + circular glow — parent sirf logo jitna wide; glow absolute (layout pe extra height nahi) */}
          <div className="relative isolate z-0 mx-auto mb-4 sm:mb-6 inline-flex items-center justify-center overflow-visible">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[22rem] -translate-x-1/2 -translate-y-[52%] rounded-full blur-[40px] sm:w-[26rem] sm:blur-[48px] md:w-[30rem] md:blur-[54px] lg:w-[34rem] lg:blur-[60px] [mask-image:linear-gradient(to_bottom,black_0%,black_52%,transparent_82%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_52%,transparent_82%)] [mask-size:100%_100%] [-webkit-mask-size:100%_100%] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat]"
              style={{
                background:
                  'radial-gradient(circle at 50% 44%, hsl(22 48% 91% / 0.75) 0%, hsl(330 40% 92% / 0.42) 40%, hsl(275 38% 91% / 0.48) 54%, transparent 70%)',
              }}
            />
            <img
              src={logo}
              alt="TaskOrbit"
              className="relative z-10 h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-56 lg:w-56 object-contain animate-float drop-shadow-2xl"
            />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-foreground mb-2">
              Welcome to{' '}
              <span className="text-[hsl(265_48%_30%)]">TaskOrbit</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">Organize your tasks in motion</p>
          </div>
        </div>

        {/* Boards Grid */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold font-display text-foreground">Your Boards</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-soft hover:shadow-elevated transition-shadow">
                <Plus className="h-4 w-4 mr-1" /> New Board
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Board title..."
                  value={newBoardTitle}
                  onChange={e => setNewBoardTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Background</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BACKGROUND_PRESETS.map(bg => (
                      <button
                        key={bg.name}
                        onClick={() => setSelectedBg(bg.value)}
                        className={`h-10 rounded-lg border-2 transition-all ${selectedBg === bg.value ? 'border-primary scale-110 shadow-soft' : 'border-transparent hover:scale-105'}`}
                        style={{ background: bg.value }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground">
                  Create Board
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredBoards.map((board, i) => (
            <Link
              key={board.id}
              to={`/board/${board.id}`}
              className="group relative rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              <div
                className="h-32 sm:h-36 p-4 sm:p-5 flex flex-col justify-end"
                style={{ background: board.background.value }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
                <h4 className="relative text-base sm:text-lg font-bold font-display text-primary-foreground drop-shadow-md">
                  {board.title}
                </h4>
                <p className="relative text-xs text-primary-foreground/80 mt-0.5">
                  {state.lists.filter(l => l.boardId === board.id).length} lists · {state.cards.filter(c => state.lists.some(l => l.id === c.listId && l.boardId === board.id)).length} cards
                </p>
              </div>
            </Link>
          ))}

          {/* Create new board card */}
          <button
            onClick={() => setDialogOpen(true)}
            className="h-32 sm:h-36 rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all hover:shadow-soft group"
          >
            <Plus className="h-8 w-8 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Create new board</span>
          </button>
        </div>
      </main>
    </div>
  );
}
