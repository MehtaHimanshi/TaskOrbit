import { AppState, Board, List, Card, Label, User, ActivityEntry } from '@/types/kanban';

const STORAGE_KEY = 'taskorbit-data';

const DUMMY_USERS: User[] = [
  { id: 'u1', name: 'Alex Chen', avatar: 'AC', color: 'hsl(262, 83%, 58%)' },
  { id: 'u2', name: 'Sara Miller', avatar: 'SM', color: 'hsl(200, 80%, 55%)' },
  { id: 'u3', name: 'Jordan Lee', avatar: 'JL', color: 'hsl(142, 71%, 45%)' },
  { id: 'u4', name: 'Taylor Kim', avatar: 'TK', color: 'hsl(25, 95%, 55%)' },
];

const DEFAULT_LABELS: Label[] = [
  { id: 'lb1', name: 'Bug', color: 'red' },
  { id: 'lb2', name: 'Feature', color: 'blue' },
  { id: 'lb3', name: 'Urgent', color: 'orange' },
  { id: 'lb4', name: 'Design', color: 'purple' },
  { id: 'lb5', name: 'Backend', color: 'green' },
  { id: 'lb6', name: 'Frontend', color: 'teal' },
  { id: 'lb7', name: 'Documentation', color: 'yellow' },
  { id: 'lb8', name: 'Enhancement', color: 'pink' },
];

function createSeedData(): AppState {
  const boards: Board[] = [
    { id: 'b1', title: 'Product Launch ', background: { type: 'gradient', value: 'linear-gradient(135deg, #a78bfa, #67e8f9)' }, createdAt: new Date().toISOString() },
    { id: 'b2', title: 'Marketing Campaign ', background: { type: 'gradient', value: 'linear-gradient(135deg, #f0abfc, #c4b5fd)' }, createdAt: new Date().toISOString() },
    { id: 'b3', title: 'Bug Tracker ', background: { type: 'gradient', value: 'linear-gradient(135deg, #86efac, #67e8f9)' }, createdAt: new Date().toISOString() },
  ];

  const lists: List[] = [
    { id: 'l1', boardId: 'b1', title: "ToDo's", position: 0 },
    { id: 'l2', boardId: 'b1', title: 'In Progress', position: 1 },
    { id: 'l3', boardId: 'b1', title: 'Review', position: 2 },
    { id: 'l4', boardId: 'b1', title: 'Done', position: 3 },
    { id: 'l5', boardId: 'b2', title: 'Ideas', position: 0 },
    { id: 'l6', boardId: 'b2', title: 'In Progress', position: 1 },
    { id: 'l7', boardId: 'b2', title: 'Completed', position: 2 },
    { id: 'l8', boardId: 'b3', title: 'Open', position: 0 },
    { id: 'l9', boardId: 'b3', title: 'Investigating', position: 1 },
    { id: 'l10', boardId: 'b3', title: 'Fixed', position: 2 },
  ];

  const cards: Card[] = [
    { id: 'c1', listId: 'l1', title: 'Design landing page mockups', description: 'Create high-fidelity mockups for the new landing page with hero section, features, and CTA.', position: 0, labels: ['lb4', 'lb6'], dueDate: '2026-04-05', checklist: [{ id: 'ck1', text: 'Hero section', completed: true }, { id: 'ck2', text: 'Features grid', completed: false }, { id: 'ck3', text: 'Footer', completed: false }], memberIds: ['u1', 'u2'], comments: [{ id: 'cm1', userId: 'u1', text: 'Started on the hero section', createdAt: new Date().toISOString() }], archived: false, createdAt: new Date().toISOString() },
    { id: 'c2', listId: 'l1', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', position: 1, labels: ['lb5'], dueDate: null, checklist: [], memberIds: ['u3'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c3', listId: 'l2', title: 'Implement user authentication', description: 'Add login, signup, and password reset functionality.', position: 0, labels: ['lb2', 'lb5'], dueDate: '2026-04-10', checklist: [{ id: 'ck4', text: 'Login form', completed: true }, { id: 'ck5', text: 'Signup form', completed: true }, { id: 'ck6', text: 'Password reset', completed: false }], memberIds: ['u3', 'u4'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c4', listId: 'l2', title: 'Create API documentation', description: 'Write comprehensive API docs using Swagger/OpenAPI.', position: 1, labels: ['lb7'], dueDate: '2026-04-08', checklist: [], memberIds: ['u2'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c5', listId: 'l3', title: 'Performance optimization', description: 'Optimize bundle size and lazy loading.', position: 0, labels: ['lb8'], dueDate: null, checklist: [], memberIds: ['u1'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c6', listId: 'l4', title: 'Project setup & boilerplate', description: 'Initialize project with proper folder structure.', position: 0, labels: ['lb5', 'lb6'], dueDate: null, checklist: [], memberIds: ['u1', 'u3'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c7', listId: 'l5', title: 'Social media strategy', description: 'Plan social media posts for launch week.', position: 0, labels: ['lb2'], dueDate: '2026-04-15', checklist: [{ id: 'ck7', text: 'Twitter plan', completed: false }, { id: 'ck8', text: 'LinkedIn plan', completed: false }], memberIds: ['u2'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c8', listId: 'l6', title: 'Blog post draft', description: 'Write announcement blog post.', position: 0, labels: ['lb7'], dueDate: '2026-04-12', checklist: [], memberIds: ['u4'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c9', listId: 'l8', title: 'Login button not clickable on Safari', description: 'Users report the login button is unresponsive on Safari 16.', position: 0, labels: ['lb1', 'lb6'], dueDate: '2026-04-02', checklist: [], memberIds: ['u1'], comments: [], archived: false, createdAt: new Date().toISOString() },
    { id: 'c10', listId: 'l8', title: 'API timeout on large datasets', description: 'Requests time out when fetching >1000 records.', position: 1, labels: ['lb1', 'lb5'], dueDate: '2026-04-03', checklist: [], memberIds: ['u3'], comments: [], archived: false, createdAt: new Date().toISOString() },
  ];

  return { boards, lists, cards, labels: DEFAULT_LABELS, users: DUMMY_USERS, activities: [] };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const seed = createSeedData();
  saveState(seed);
  return seed;
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let uid = Date.now();
export function genId(prefix = 'id') {
  return `${prefix}_${++uid}`;
}

export const BACKGROUND_PRESETS = [
  { name: 'Aurora', value: 'linear-gradient(135deg, #a78bfa, #67e8f9)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #22c55e, #14b8a6)' },
  { name: 'Lavender', value: 'linear-gradient(135deg, #c4b5fd, #f0abfc)' },
  { name: 'Candy', value: 'linear-gradient(135deg, #f472b6, #fb923c)' },
  { name: 'Mint', value: 'linear-gradient(135deg, #86efac, #67e8f9)' },
  { name: 'Storm', value: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { name: 'Pearl', value: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)' },
  { name: 'Rose', value: 'linear-gradient(135deg, #fda4af, #fecdd3)' },
];
