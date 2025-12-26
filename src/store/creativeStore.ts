import { create } from 'zustand';

// Types for the creative builder
export interface CreativeElement {
  id: string;
  type: 'image' | 'text' | 'shape' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  src?: string;
  style?: Record<string, string | number>;
  locked?: boolean;
  visible?: boolean;
}

export interface CreativeFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  platform: string;
}

export interface ComplianceIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  elementId?: string;
  autoFix?: () => void;
}

export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  format: CreativeFormat;
  elements: CreativeElement[];
  complianceScore: number;
}

interface CreativeStore {
  // Canvas state
  elements: CreativeElement[];
  selectedElementId: string | null;
  zoom: number;
  
  // Format
  currentFormat: CreativeFormat;
  availableFormats: CreativeFormat[];
  
  // Compliance
  complianceScore: number;
  complianceIssues: ComplianceIssue[];
  
  // AI State
  aiStatus: 'idle' | 'thinking' | 'generating' | 'complete';
  aiMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  // UI State
  leftPanelTab: 'assets' | 'layers' | 'templates';
  rightPanelOpen: boolean;
  
  // Actions
  setElements: (elements: CreativeElement[]) => void;
  addElement: (element: CreativeElement) => void;
  updateElement: (id: string, updates: Partial<CreativeElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setCurrentFormat: (format: CreativeFormat) => void;
  setComplianceScore: (score: number) => void;
  setComplianceIssues: (issues: ComplianceIssue[]) => void;
  setAIStatus: (status: 'idle' | 'thinking' | 'generating' | 'complete') => void;
  addAIMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  setLeftPanelTab: (tab: 'assets' | 'layers' | 'templates') => void;
  toggleRightPanel: () => void;
}

// Default formats
const defaultFormats: CreativeFormat[] = [
  { id: 'instagram-feed', name: 'Instagram Feed', width: 1080, height: 1080, platform: 'Instagram' },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, platform: 'Instagram' },
  { id: 'facebook-feed', name: 'Facebook Feed', width: 1200, height: 628, platform: 'Facebook' },
  { id: 'facebook-cover', name: 'Facebook Cover', width: 1640, height: 624, platform: 'Facebook' },
  { id: 'instore-banner', name: 'In-Store Banner', width: 1920, height: 1080, platform: 'Retail' },
  { id: 'instore-poster', name: 'In-Store Poster', width: 1080, height: 1920, platform: 'Retail' },
];

export const useCreativeStore = create<CreativeStore>((set) => ({
  // Initial state
  elements: [],
  selectedElementId: null,
  zoom: 1,
  
  currentFormat: defaultFormats[0],
  availableFormats: defaultFormats,
  
  complianceScore: 85,
  complianceIssues: [],
  
  aiStatus: 'idle',
  aiMessages: [],
  
  leftPanelTab: 'assets',
  rightPanelOpen: true,
  
  // Actions
  setElements: (elements) => set({ elements }),
  addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => 
      el.id === id ? { ...el, ...updates } : el
    ),
  })),
  removeElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),
  selectElement: (id) => set({ selectedElementId: id }),
  setZoom: (zoom) => set({ zoom }),
  setCurrentFormat: (format) => set({ currentFormat: format }),
  setComplianceScore: (score) => set({ complianceScore: score }),
  setComplianceIssues: (issues) => set({ complianceIssues: issues }),
  setAIStatus: (status) => set({ aiStatus: status }),
  addAIMessage: (message) => set((state) => ({ 
    aiMessages: [...state.aiMessages, message] 
  })),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
}));
