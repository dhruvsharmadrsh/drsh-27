import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AIIndicatorProps {
  status?: "idle" | "thinking" | "generating" | "complete";
  label?: string;
  className?: string;
}

const AIIndicator = React.forwardRef<HTMLDivElement, AIIndicatorProps>(
  ({ status = "idle", label, className }, ref) => {
    const statusConfig = {
      idle: {
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        label: label || "AI Ready",
      },
      thinking: {
        color: "text-highlight",
        bgColor: "bg-highlight/10",
        label: label || "AI Thinking...",
      },
      generating: {
        color: "text-accent",
        bgColor: "bg-accent/10",
        label: label || "Generating...",
      },
      complete: {
        color: "text-success",
        bgColor: "bg-success/10",
        label: label || "Complete",
      },
    };

    const config = statusConfig[status];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
          config.bgColor,
          config.color,
          className
        )}
      >
        <motion.div
          animate={
            status === "thinking" || status === "generating"
              ? { rotate: 360 }
              : {}
          }
          transition={{
            duration: 2,
            repeat: status === "thinking" || status === "generating" ? Infinity : 0,
            ease: "linear",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>
        <span>{config.label}</span>
        {(status === "thinking" || status === "generating") && (
          <motion.div
            className="flex gap-0.5"
            initial="hidden"
            animate="visible"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-current"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

AIIndicator.displayName = "AIIndicator";

export { AIIndicator };
