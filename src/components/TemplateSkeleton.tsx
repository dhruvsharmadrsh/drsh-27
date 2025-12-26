import { motion } from "framer-motion";

interface TemplateSkeletonProps {
  count?: number;
}

export const TemplateSkeleton = ({ count = 8 }: TemplateSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="space-y-3"
        >
          {/* Thumbnail skeleton with shimmer */}
          <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border/30">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 animate-shimmer"
              style={{
                backgroundSize: "200% 100%",
              }}
            />
            {/* Icon placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-muted/40 animate-pulse" />
            </div>
            {/* Format badge skeleton */}
            <div className="absolute top-2 right-2 w-16 h-5 rounded bg-muted/40 animate-pulse" />
          </div>
          
          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-muted/40 rounded-md w-3/4 animate-pulse" />
            <div className="h-3 bg-muted/30 rounded-md w-1/2 animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TemplateSkeleton;
