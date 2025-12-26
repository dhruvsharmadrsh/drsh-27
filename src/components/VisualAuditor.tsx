import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Eye, Sparkles, Loader2, AlertTriangle, CheckCircle, Lightbulb, Zap, Target, X, Wrench, Type, AlignCenter, Shield, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnifiedAIState } from "@/hooks/useUnifiedAIState";
import { MAX_FONT_SIZE, SAFE_ZONES } from "@/utils/canvasUtils";

interface AuditCategory {
  name: string;
  score: number;
  strengths: string[];
  improvements: string[];
  actionable: string;
  fixable?: boolean;
}

interface DesignAudit {
  overallScore: number;
  summary: string;
  categories: AuditCategory[];
  priorityFixes: string[];
  quickWins: string[];
  advancedTips: string[];
}

interface LocalViolation {
  id: string;
  type: 'font-size' | 'off-center' | 'outside-safe-zone' | 'hidden';
  element: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
}

interface VisualAuditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasState: any;
  canvas?: any;
  formatId?: string;
  onApplyFixes?: (fixes: { type: string; action: string }[]) => void;
  onEnforceConstraints?: () => void;
}

export const VisualAuditor = ({
  open,
  onOpenChange,
  canvasState,
  canvas,
  formatId = 'instagram-feed',
  onApplyFixes,
  onEnforceConstraints,
}: VisualAuditorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [designGoal, setDesignGoal] = useState("");
  const [audit, setAudit] = useState<DesignAudit | null>(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  
  const { syncFromVisualAuditor, markTodosByCategory } = useUnifiedAIState();

  // Local constraint checking
  const localViolations = useMemo((): LocalViolation[] => {
    if (!canvas || !canvasState?.objects) return [];
    
    const violations: LocalViolation[] = [];
    const safeZone = SAFE_ZONES[formatId] || SAFE_ZONES['instagram-feed'];
    const canvasWidth = canvas.getWidth?.() || 1080;
    const canvasHeight = canvas.getHeight?.() || 1080;
    
    canvasState.objects.forEach((obj: any, index: number) => {
      const elementName = obj.text?.substring(0, 20) || obj.type || `Element ${index + 1}`;
      
      // Check font size violations (must be ≤ 18px)
      if ((obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') && obj.fontSize > MAX_FONT_SIZE) {
        violations.push({
          id: `font-${index}`,
          type: 'font-size',
          element: elementName,
          message: `Font size ${obj.fontSize}px exceeds max ${MAX_FONT_SIZE}px`,
          severity: 'error',
          fixable: true,
        });
      }
      
      // Check center alignment (check if not horizontally centered)
      const objCenter = (obj.left || 0) + (obj.width || 0) / 2;
      const canvasCenter = canvasWidth / 2;
      const centerThreshold = 20;
      
      if (obj.originX !== 'center' && Math.abs(objCenter - canvasCenter) > centerThreshold) {
        violations.push({
          id: `center-${index}`,
          type: 'off-center',
          element: elementName,
          message: `Not centered (${Math.round(Math.abs(objCenter - canvasCenter))}px off)`,
          severity: 'warning',
          fixable: true,
        });
      }
      
      // Check safe zone violations
      const objLeft = obj.left || 0;
      const objTop = obj.top || 0;
      const objRight = objLeft + (obj.width || 0);
      const objBottom = objTop + (obj.height || 0);
      
      if (objLeft < safeZone.left || 
          objRight > canvasWidth - safeZone.right ||
          objTop < safeZone.top ||
          objBottom > canvasHeight - safeZone.bottom) {
        violations.push({
          id: `safe-${index}`,
          type: 'outside-safe-zone',
          element: elementName,
          message: 'Element crosses safe zone boundary',
          severity: 'warning',
          fixable: true,
        });
      }
    });
    
    return violations;
  }, [canvas, canvasState, formatId]);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-visual-auditor', {
        body: {
          canvasState,
          designGoal,
        }
      });

      if (error) throw error;
      
      if (data?.audit) {
        setAudit(data.audit);
        
        // Sync issues to unified AI state todo list
        const issues = data.audit.categories.map((cat: AuditCategory) => ({
          category: getCategoryType(cat.name),
          label: cat.improvements[0] || `${cat.name} check`,
          status: cat.score >= 8 ? 'done' as const : cat.score >= 5 ? 'pending' as const : 'missing' as const,
        }));
        syncFromVisualAuditor(issues);
        
        toast.success("Design audit complete!");
      }
    } catch (error) {
      console.error('Error running visual audit:', error);
      toast.error('Failed to audit design');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getCategoryType = (name: string): 'colors' | 'typography' | 'layout' | 'content' | 'compliance' => {
    const lower = name.toLowerCase();
    if (lower.includes('color') || lower.includes('contrast')) return 'colors';
    if (lower.includes('typo') || lower.includes('font')) return 'typography';
    if (lower.includes('layout') || lower.includes('align') || lower.includes('balance')) return 'layout';
    if (lower.includes('content') || lower.includes('cta') || lower.includes('hierarchy')) return 'content';
    return 'compliance';
  };
  
  const handleFixAll = () => {
    setIsApplyingFixes(true);
    
    // Call the enforceConstraints callback which uses enforceAllConstraints
    if (onEnforceConstraints) {
      onEnforceConstraints();
      toast.success(`Fixed ${localViolations.length} violations with enforceAllConstraints`);
    } else if (onApplyFixes && audit) {
      const fixes = audit.categories
        .filter(cat => cat.score < 8)
        .map(cat => ({
          type: getCategoryType(cat.name),
          action: cat.actionable,
        }));
      
      onApplyFixes(fixes);
      toast.success(`Applied ${fixes.length} automatic fixes!`);
    }
    
    // Mark relevant todos as done
    markTodosByCategory('layout', 'done');
    markTodosByCategory('compliance', 'done');
    
    setIsApplyingFixes(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    return "from-orange-500 to-red-500";
  };

  const getViolationIcon = (type: LocalViolation['type']) => {
    switch (type) {
      case 'font-size': return <Type className="w-4 h-4" />;
      case 'off-center': return <AlignCenter className="w-4 h-4" />;
      case 'outside-safe-zone': return <Shield className="w-4 h-4" />;
      case 'hidden': return <Eye className="w-4 h-4" />;
    }
  };

  if (!open) return null;

  // Calculate local score based on violations
  const localScore = Math.max(0, 100 - (localViolations.filter(v => v.severity === 'error').length * 15) - (localViolations.filter(v => v.severity === 'warning').length * 5));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-foreground">Visual Improvement Auditor</h2>
                  <p className="text-sm text-muted-foreground">AI-powered design feedback & constraint enforcement</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* Local Violations Section - Always visible */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      <h3 className="font-semibold">Constraint Check</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${getScoreColor(localScore)}`}>
                        {localScore}
                      </div>
                      {localViolations.length > 0 && onEnforceConstraints && (
                        <Button 
                          variant="ai" 
                          size="sm"
                          onClick={handleFixAll}
                          disabled={isApplyingFixes}
                        >
                          <Wrench className="w-3 h-3 mr-1" />
                          Fix All ({localViolations.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {localViolations.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      All constraints satisfied! (Max {MAX_FONT_SIZE}px font, centered, within safe zones)
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {localViolations.map((violation) => (
                        <div 
                          key={violation.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border ${
                            violation.severity === 'error' 
                              ? 'bg-red-500/10 border-red-500/30 text-red-600'
                              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'
                          }`}
                        >
                          {getViolationIcon(violation.type)}
                          <div className="flex-1">
                            <span className="text-sm font-medium">{violation.element}</span>
                            <span className="text-xs opacity-75 ml-2">{violation.message}</span>
                          </div>
                          {violation.fixable && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-background/50">Auto-fixable</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!audit ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 space-y-6"
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                      <Eye className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold">AI Design Critique</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Get expert-level feedback on your design with actionable suggestions for improvement
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Design Goal (optional)</label>
                      <Input
                        value={designGoal}
                        onChange={(e) => setDesignGoal(e.target.value)}
                        placeholder="e.g., Increase conversions, promote sale..."
                        className="bg-muted/30"
                      />
                    </div>

                    <Button 
                      onClick={runAudit}
                      disabled={isLoading}
                      variant="ai"
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing Design...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Run Full Design Audit
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Overall Score */}
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Overall Design Score</h3>
                            <p className="text-sm text-muted-foreground">{audit.summary}</p>
                          </div>
                          <div className={`text-5xl font-bold ${getScoreColor(audit.overallScore)}`}>
                            {audit.overallScore}
                          </div>
                        </div>
                        <Progress 
                          value={audit.overallScore} 
                          className="h-3"
                        />
                      </div>

                      {/* Priority Fixes */}
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h4 className="font-semibold text-red-500">Priority Fixes</h4>
                          </div>
                          {onApplyFixes && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={handleFixAll}
                              disabled={isApplyingFixes}
                            >
                              <Wrench className="w-3 h-3 mr-1" />
                              Fix All
                            </Button>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {audit.priorityFixes.map((fix, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Quick Wins */}
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-5 h-5 text-green-500" />
                          <h4 className="font-semibold text-green-500">Quick Wins</h4>
                        </div>
                        <ul className="space-y-2">
                          {audit.quickWins.map((win, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <span>{win}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Category Breakdown */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Detailed Analysis
                        </h4>
                        
                        {audit.categories.map((category, i) => (
                          <motion.div
                            key={category.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl bg-muted/30 border border-border/30"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium">{category.name}</h5>
                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getScoreGradient(category.score * 10)} text-white`}>
                                  {category.score}/10
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs font-medium text-green-500 mb-1">✓ Strengths</p>
                                <ul className="space-y-1">
                                  {category.strengths.map((s, j) => (
                                    <li key={j} className="text-xs text-muted-foreground">{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-amber-500 mb-1">△ Improvements</p>
                                <ul className="space-y-1">
                                  {category.improvements.map((s, j) => (
                                    <li key={j} className="text-xs text-muted-foreground">{s}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                              <p className="text-xs">
                                <span className="font-medium text-accent">💡 Action:</span>{" "}
                                {category.actionable}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Advanced Tips */}
                      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-5 h-5 text-violet-500" />
                          <h4 className="font-semibold text-violet-500">Advanced Recommendations</h4>
                        </div>
                        <ul className="space-y-2">
                          {audit.advancedTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </ScrollArea>
              )}
              </div>
            </ScrollArea>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 flex justify-end gap-3 p-6 pt-4 border-t border-border/50">
              {audit && (
                <Button 
                  variant="outline" 
                  onClick={() => setAudit(null)}
                >
                  Run New Audit
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
