import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, FolderOpen, Clock, TrendingUp, 
  Sparkles, LayoutGrid, Image, FileText,
  ArrowRight, MoreHorizontal, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ComplianceScore } from "@/components/ui/ComplianceScore";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  thumbnail_url: string | null;
  format_id: string;
  compliance_score: number;
  updated_at: string;
}

const quickActions = [
  { icon: Image, label: "Upload Product", description: "Start with a packshot" },
  { icon: Sparkles, label: "AI Generate", description: "Let AI create for you" },
  { icon: LayoutGrid, label: "Templates", description: "Browse templates" },
  { icon: FileText, label: "Brand Kit", description: "Manage brand assets" },
];

const formatLabels: Record<string, string> = {
  "instagram-feed": "Instagram Feed",
  "instagram-story": "Instagram Story",
  "facebook-feed": "Facebook Feed",
  "in-store": "In-Store Banner",
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl text-foreground">Creato-Sphere</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Link to="/builder">
              <Button variant="ai" size="sm" className="group">
                <Plus className="w-4 h-4" />
                New Creative
              </Button>
            </Link>
            <Button variant="ghost" size="icon-sm" onClick={handleSignOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl mb-2">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Pick up where you left off, or start something new.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link to="/builder" key={index}>
                <GlassPanel 
                  padding="md" 
                  className="group cursor-pointer hover-lift hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <action.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{action.label}</h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: FolderOpen, label: "Total Projects", value: String(projects.length) },
            { icon: TrendingUp, label: "This Week", value: String(projects.filter(p => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(p.updated_at) > weekAgo;
            }).length) },
            { icon: Clock, label: "Avg. Compliance", value: projects.length > 0 
              ? `${Math.round(projects.reduce((sum, p) => sum + p.compliance_score, 0) / projects.length)}%`
              : "N/A" },
            { icon: Sparkles, label: "AI Ready", value: "Yes" },
          ].map((stat, index) => (
            <GlassPanel key={index} padding="md" variant="subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-display text-2xl text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">Recent Projects</h2>
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Link to={`/builder?project=${project.id}`}>
                    <GlassPanel 
                      padding="none" 
                      className="overflow-hidden group cursor-pointer hover-lift"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square relative overflow-hidden bg-muted/30">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={project.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Compliance Badge */}
                        <div className="absolute top-3 right-3">
                          <ComplianceScore score={project.compliance_score} size="sm" showLabel={false} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-medium text-foreground text-sm mb-1 truncate">
                          {project.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <FormatBadge format={formatLabels[project.format_id] || project.format_id} />
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(project.updated_at)}
                          </span>
                        </div>
                      </div>
                    </GlassPanel>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : null}
        </motion.div>

        {/* Empty State / New Project CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <GlassPanel padding="lg" className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-highlight/20 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">
              Create Your Next Campaign
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Upload a product image and let our AI engines generate compliant, 
              campaign-ready creatives in minutes.
            </p>
            <Link to="/builder">
              <Button variant="ai" size="lg" className="group">
                Start New Creative
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </GlassPanel>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
