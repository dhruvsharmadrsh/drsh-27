import { create } from 'zustand';

// Unified AI state that all AI tools share
export interface BrandState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  ctaColor: string;
  headingFont: string;
  bodyFont: string;
  captionFont: string;
  brandTone: string;
  guidelines: string;
  logoUrl?: string;
  spacingUnit: number;
  borderRadius: number;
}

export interface TypographyScale {
  headline: number;
  subheadline: number;
  body: number;
  caption: number;
}

export interface TodoItem {
  id: string;
  label: string;
  status: 'done' | 'pending' | 'missing';
  category: 'colors' | 'typography' | 'layout' | 'content' | 'compliance';
}

export interface PlatformPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  safeZones: { top: number; bottom: number; left: number; right: number };
}

export interface UnifiedAIState {
  // Brand state shared across all AI tools
  brand: BrandState;
  
  // Typography scale with MAXIMUM sizes (18px cap)
  typographyScale: TypographyScale;
  
  // To-do checklist for brand compliance
  todos: TodoItem[];
  
  // Platform presets for different formats
  platformPresets: Record<string, PlatformPreset>;
  
  // Safe zone configurations for different platforms
  safeZones: {
    instagram: { top: number; bottom: number; left: number; right: number };
    facebook: { top: number; bottom: number; left: number; right: number };
    story: { top: number; bottom: number; left: number; right: number };
  };
  
  // Canvas positioning constraints
  canvasConstraints: {
    maxFontSize: number;
    centerAlign: boolean;
    respectSafeZones: boolean;
    autoCorrectOverflow: boolean;
    enableDragDrop: boolean;
  };
  
  // Actions
  setBrand: (brand: Partial<BrandState>) => void;
  setTypographyScale: (scale: Partial<TypographyScale>) => void;
  updateTodo: (id: string, status: TodoItem['status']) => void;
  addTodo: (todo: Omit<TodoItem, 'id'>) => void;
  removeTodo: (id: string) => void;
  resetTodos: () => void;
  setCanvasConstraints: (constraints: Partial<UnifiedAIState['canvasConstraints']>) => void;
  markTodosByCategory: (category: TodoItem['category'], status: TodoItem['status']) => void;
  syncFromVisualAuditor: (issues: Array<{ category: TodoItem['category']; label: string; status: TodoItem['status'] }>) => void;
}

// Default brand state
const defaultBrand: BrandState = {
  primaryColor: '#22C55E',
  secondaryColor: '#38BDF8',
  accentColor: '#F59E0B',
  ctaColor: '#DC2626',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  captionFont: 'Inter',
  brandTone: 'Professional',
  guidelines: '',
  spacingUnit: 8,
  borderRadius: 8,
};

// Typography scale with MAXIMUM 18px for AI-generated text
const defaultTypographyScale: TypographyScale = {
  headline: 18,
  subheadline: 16,
  body: 14,
  caption: 12,
};

// Default to-do items
const defaultTodos: TodoItem[] = [
  { id: '1', label: 'Brand colors applied', status: 'pending', category: 'colors' },
  { id: '2', label: 'Typography harmony set', status: 'pending', category: 'typography' },
  { id: '3', label: 'CTA text added', status: 'missing', category: 'content' },
  { id: '4', label: 'Visual hierarchy check', status: 'pending', category: 'layout' },
  { id: '5', label: 'Safe zones respected', status: 'pending', category: 'compliance' },
];

// Safe zone configurations for different platforms
const safeZones = {
  instagram: { top: 40, bottom: 40, left: 40, right: 40 },
  facebook: { top: 30, bottom: 30, left: 30, right: 30 },
  story: { top: 120, bottom: 180, left: 40, right: 40 }, // Extra space for UI overlays
};

// Platform presets
const defaultPlatformPresets: Record<string, PlatformPreset> = {
  'instagram-feed': { id: 'instagram-feed', name: 'Instagram Feed', width: 1080, height: 1080, safeZones: { top: 40, bottom: 40, left: 40, right: 40 } },
  'instagram-story': { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, safeZones: { top: 120, bottom: 180, left: 40, right: 40 } },
  'facebook-feed': { id: 'facebook-feed', name: 'Facebook Feed', width: 1200, height: 628, safeZones: { top: 30, bottom: 30, left: 30, right: 30 } },
  'facebook-ad': { id: 'facebook-ad', name: 'Facebook Ad', width: 1200, height: 1200, safeZones: { top: 40, bottom: 40, left: 40, right: 40 } },
};

export const useUnifiedAIState = create<UnifiedAIState>((set) => ({
  brand: defaultBrand,
  typographyScale: defaultTypographyScale,
  todos: defaultTodos,
  safeZones,
  platformPresets: defaultPlatformPresets,
  canvasConstraints: {
    maxFontSize: 18,
    centerAlign: true,
    respectSafeZones: true,
    autoCorrectOverflow: true,
    enableDragDrop: true,
  },
  
  setBrand: (brand) => set((state) => ({
    brand: { ...state.brand, ...brand },
    todos: state.todos.map(todo => 
      todo.category === 'colors' && brand.primaryColor
        ? { ...todo, status: 'done' as const }
        : todo
    ),
  })),
  
  setTypographyScale: (scale) => set((state) => ({
    typographyScale: { ...state.typographyScale, ...scale },
    todos: state.todos.map(todo => 
      todo.category === 'typography'
        ? { ...todo, status: 'done' as const }
        : todo
    ),
  })),
  
  updateTodo: (id, status) => set((state) => ({
    todos: state.todos.map(todo => 
      todo.id === id ? { ...todo, status } : todo
    ),
  })),
  
  addTodo: (todo) => set((state) => ({
    todos: [...state.todos, { ...todo, id: Date.now().toString() }],
  })),
  
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter(todo => todo.id !== id),
  })),
  
  resetTodos: () => set({ todos: defaultTodos }),
  
  setCanvasConstraints: (constraints) => set((state) => ({
    canvasConstraints: { ...state.canvasConstraints, ...constraints },
  })),
  
  markTodosByCategory: (category, status) => set((state) => ({
    todos: state.todos.map(todo => 
      todo.category === category ? { ...todo, status } : todo
    ),
  })),
  
  syncFromVisualAuditor: (issues) => set((state) => {
    const newTodos = [...state.todos];
    issues.forEach(issue => {
      const existing = newTodos.find(t => t.label === issue.label);
      if (existing) {
        existing.status = issue.status;
      } else {
        newTodos.push({
          id: Date.now().toString() + Math.random(),
          label: issue.label,
          status: issue.status,
          category: issue.category,
        });
      }
    });
    return { todos: newTodos };
  }),
}));
