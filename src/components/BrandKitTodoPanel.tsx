import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, AlertCircle, ListTodo, Plus, X, Trash2 } from "lucide-react";
import { useUnifiedAIState, type TodoItem } from "@/hooks/useUnifiedAIState";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface BrandKitTodoPanelProps {
  className?: string;
}

export function BrandKitTodoPanel({ className }: BrandKitTodoPanelProps) {
  const { todos, updateTodo, addTodo, removeTodo } = useUnifiedAIState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodoLabel, setNewTodoLabel] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<TodoItem['category']>("content");
  
  const getStatusIcon = (status: TodoItem['status']) => {
    switch (status) {
      case 'done':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'missing':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };
  
  const getStatusStyles = (status: TodoItem['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400';
      case 'missing':
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400';
    }
  };
  
  const getCategoryColor = (category: TodoItem['category']) => {
    switch (category) {
      case 'colors': return 'bg-violet-500/20 text-violet-600';
      case 'typography': return 'bg-blue-500/20 text-blue-600';
      case 'layout': return 'bg-emerald-500/20 text-emerald-600';
      case 'content': return 'bg-amber-500/20 text-amber-600';
      case 'compliance': return 'bg-rose-500/20 text-rose-600';
    }
  };
  
  const handleAddTodo = () => {
    if (!newTodoLabel.trim()) {
      toast.error("Please enter a task description");
      return;
    }
    
    addTodo({
      label: newTodoLabel.trim(),
      status: 'missing',
      category: newTodoCategory,
    });
    
    setNewTodoLabel("");
    setShowAddForm(false);
    toast.success("Task added to checklist");
  };
  
  const handleRemoveTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeTodo(id);
    toast.success("Task removed");
  };
  
  const completedCount = todos.filter(t => t.status === 'done').length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  return (
    <div className={cn("p-4 rounded-xl bg-muted/30 border border-border/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-semibold">Brand Checklist</h4>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer hover:scale-[1.02] group",
                getStatusStyles(todo.status)
              )}
              onClick={() => {
                const nextStatus: TodoItem['status'] = 
                  todo.status === 'missing' ? 'pending' :
                  todo.status === 'pending' ? 'done' : 'missing';
                updateTodo(todo.id, nextStatus);
              }}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(todo.status)}
              </div>
              <span className={cn(
                "text-xs font-medium flex-1",
                todo.status === 'done' && "line-through opacity-70"
              )}>
                {todo.label}
              </span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded capitalize",
                getCategoryColor(todo.category)
              )}>
                {todo.category}
              </span>
              <button 
                onClick={(e) => handleRemoveTodo(todo.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Add new todo form */}
        <AnimatePresence>
          {showAddForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Add New Task</span>
                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowAddForm(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <Input
                placeholder="Task description..."
                value={newTodoLabel}
                onChange={(e) => setNewTodoLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                className="h-8 text-xs bg-background/50"
              />
              <div className="flex gap-2">
                <Select value={newTodoCategory} onValueChange={(v) => setNewTodoCategory(v as TodoItem['category'])}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colors">Colors</SelectItem>
                    <SelectItem value="typography">Typography</SelectItem>
                    <SelectItem value="layout">Layout</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-8 text-xs" onClick={handleAddTodo}>
                  Add
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(true)}
              className="w-full p-2 rounded-lg border border-dashed border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-accent"
            >
              <Plus className="w-3 h-3" />
              Add custom task
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
