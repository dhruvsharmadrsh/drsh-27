import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ArrowRight, ArrowLeft, Sparkles, Layers, 
  Palette, Wand2, Download, MousePointer2, Type, 
  Square, Image, Zap, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  position: "center" | "left" | "right" | "top" | "bottom";
}

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Creato-Sphere! 🎨",
    description: "Your AI-powered creative studio for stunning ad designs. Let's take a quick tour of the powerful features at your fingertips.",
    icon: <Sparkles className="w-8 h-8 text-accent" />,
    position: "center",
  },
  {
    id: "tools",
    title: "Shape & Text Tools",
    description: "Use the toolbar to add rectangles, circles, triangles, stars, arrows, and text. Each shape has unique styling options you can customize.",
    icon: <Square className="w-8 h-8 text-indigo-400" />,
    highlight: "toolbar",
    position: "left",
  },
  {
    id: "assets",
    title: "Assets Panel",
    description: "Upload your product images and logos, or use our AI tools to generate backgrounds, copy, and more. Your brand assets are always just a click away.",
    icon: <Image className="w-8 h-8 text-amber-400" />,
    highlight: "left-panel",
    position: "left",
  },
  {
    id: "layers",
    title: "Layer Management",
    description: "Organize your design with the layers panel. Drag to reorder, toggle visibility, lock elements, and keep your canvas tidy.",
    icon: <Layers className="w-8 h-8 text-cyan-400" />,
    highlight: "layers",
    position: "left",
  },
  {
    id: "ai-tools",
    title: "AI-Powered Tools",
    description: "Generate backgrounds, write compelling copy, create variations, and let AI analyze your design for maximum impact.",
    icon: <Wand2 className="w-8 h-8 text-accent" />,
    highlight: "ai-tools",
    position: "left",
  },
  {
    id: "properties",
    title: "Object Properties",
    description: "Select any element to customize colors, fonts, sizes, and styles. The right panel shows all available options for the selected object.",
    icon: <Palette className="w-8 h-8 text-violet-400" />,
    highlight: "right-panel",
    position: "right",
  },
  {
    id: "compliance",
    title: "Compliance Checker",
    description: "Our AI automatically checks your design for platform compliance, safe zones, and best practices. One-click auto-fix keeps you on track.",
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    highlight: "compliance",
    position: "right",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    description: "Speed up your workflow! Ctrl+Z to undo, Ctrl+S to save, Ctrl+D to duplicate. Click the keyboard icon in the toolbar for the full list.",
    icon: <MousePointer2 className="w-8 h-8 text-pink-400" />,
    position: "center",
  },
  {
    id: "export",
    title: "Export & Share",
    description: "When you're done, export in multiple formats (PNG, JPG, WebP, PDF) at any resolution. Share directly or download for later.",
    icon: <Download className="w-8 h-8 text-emerald-400" />,
    highlight: "export",
    position: "top",
  },
  {
    id: "complete",
    title: "You're All Set! 🚀",
    description: "Start creating amazing designs. Remember, you can always access help and tutorials from the settings menu. Happy designing!",
    icon: <CheckCircle className="w-8 h-8 text-accent" />,
    position: "center",
  },
];

export const OnboardingTutorial = ({ isOpen, onClose, onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/90 backdrop-blur-md"
          onClick={handleSkip}
        />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight/5 rounded-full blur-3xl"
          />
        </div>

        {/* Content Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative max-w-lg w-full mx-4"
        >
          {/* Progress Bar */}
          <div className="absolute -top-8 left-0 right-0 h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent to-highlight"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-border/50">
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-highlight/20 flex items-center justify-center"
                >
                  {step.icon}
                </motion.div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {currentStep + 1} / {steps.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full hover:bg-muted/50"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-bold text-foreground"
              >
                {step.title}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground leading-relaxed"
              >
                {step.description}
              </motion.p>
            </div>

            {/* Step Indicators */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-center gap-1.5">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentStep 
                        ? "bg-accent w-6" 
                        : index < currentStep 
                          ? "bg-accent/50" 
                          : "bg-muted/50"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Tutorial
              </Button>
              
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                <Button
                  variant="ai"
                  size="sm"
                  onClick={handleNext}
                  className="gap-2 min-w-[100px]"
                >
                  {isLastStep ? "Get Started" : "Next"}
                  {!isLastStep && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Keyboard Hint */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground/60 mt-4"
          >
            Use arrow keys to navigate • Press Escape to close
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
