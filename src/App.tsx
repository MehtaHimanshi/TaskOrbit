import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KanbanProvider } from "@/context/KanbanContext";
import HomePage from "./pages/HomePage";
import BoardView from "./pages/BoardView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <KanbanProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/board/:boardId" element={<BoardView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </KanbanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
