import * as React from "react";
import { cn } from "@/lib/utils";

interface FormatBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  format: string;
  dimensions?: string;
  active?: boolean;
}

const FormatBadge = React.forwardRef<HTMLDivElement, FormatBadgeProps>(
  ({ format, dimensions, active = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
          active
            ? "bg-accent/15 border border-accent/50 text-accent shadow-glow-accent"
            : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/30",
          className
        )}
        {...props}
      >
        <span className="font-semibold">{format}</span>
        {dimensions && (
          <>
            <span className="w-px h-3 bg-border" />
            <span className="font-mono text-[10px] opacity-70">{dimensions}</span>
          </>
        )}
      </div>
    );
  }
);

FormatBadge.displayName = "FormatBadge";

export { FormatBadge };
