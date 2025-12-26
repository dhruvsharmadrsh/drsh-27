import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ComplianceScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const ComplianceScore = React.forwardRef<HTMLDivElement, ComplianceScoreProps>(
  ({ score, size = "md", showLabel = true, className }, ref) => {
    const sizeClasses = {
      sm: "w-12 h-12 text-xs",
      md: "w-16 h-16 text-sm",
      lg: "w-24 h-24 text-lg",
    };

    const strokeWidth = size === "sm" ? 3 : size === "md" ? 4 : 5;
    const radius = size === "sm" ? 20 : size === "md" ? 26 : 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const getScoreColor = (score: number) => {
      if (score >= 80) return "hsl(142, 71%, 45%)"; // Green
      if (score >= 50) return "hsl(38, 92%, 50%)"; // Warning/Orange
      return "hsl(0, 72%, 51%)"; // Red
    };

    const getStatusText = (score: number) => {
      if (score >= 80) return "Compliant";
      if (score >= 50) return "Needs Work";
      return "Non-Compliant";
    };

    return (
      <div ref={ref} className={cn("flex flex-col items-center gap-2", className)}>
        <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(215, 28%, 15%)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={getScoreColor(score)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          {/* Score number */}
          <motion.span
            className="font-mono font-semibold text-foreground z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
        {showLabel && (
          <span
            className="text-xs font-medium"
            style={{ color: getScoreColor(score) }}
          >
            {getStatusText(score)}
          </span>
        )}
      </div>
    );
  }
);

ComplianceScore.displayName = "ComplianceScore";

export { ComplianceScore };
