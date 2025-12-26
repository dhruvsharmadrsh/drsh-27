import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield, Layers, Target, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ComplianceScore } from "@/components/ui/ComplianceScore";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { AIIndicator } from "@/components/ui/AIIndicator";
import { Link } from "react-router-dom";
import heroBackground from "@/assets/hero-background.jpg";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const features = [
  {
    icon: Sparkles,
    title: "18 AI Engines",
    description: "Specialized AI engines work together like a creative agency—from layout to compliance.",
  },
  {
    icon: Shield,
    title: "Auto-Compliance",
    description: "Real-time validation against retailer guidelines. No more rejections.",
  },
  {
    icon: Layers,
    title: "Multi-Format",
    description: "One design, infinite formats. Instagram, Facebook, in-store—all optimized.",
  },
  {
    icon: Zap,
    title: "Minutes, Not Days",
    description: "Generate campaign-ready creatives in under 5 minutes. 100x faster.",
  },
];

const stats = [
  { value: "100x", label: "Faster Production" },
  { value: "18", label: "AI Engines" },
  { value: "12+", label: "Ad Formats" },
  { value: "99%", label: "Compliance Rate" },
];

const formats = [
  { name: "Instagram Feed", dimensions: "1080×1080" },
  { name: "Instagram Story", dimensions: "1080×1920" },
  { name: "Facebook", dimensions: "1200×628" },
  { name: "In-Store", dimensions: "1920×1080" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl text-foreground">Creato-Sphere</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#engines" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Engines</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Sign In</Button>
            <Link to="/dashboard">
              <Button variant="ai" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroBackground})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <AIIndicator status="idle" label="AI Creative Platform" />
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-display text-5xl md:text-7xl leading-tight mb-6"
            >
              <span className="text-foreground">Your AI</span>{" "}
              <span className="text-gradient-ai">Creative Department</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Generate retailer-compliant, multi-format ad creatives in minutes. 
              18 specialized AI engines working as your creative team.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link to="/builder">
                <Button variant="hero" size="xl" className="group">
                  Start Creating
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="glass" size="xl">
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
            >
              {stats.map((stat, index) => (
                <GlassPanel key={index} padding="md" className="text-center">
                  <div className="font-display text-3xl text-gradient-ai mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </GlassPanel>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative"
          >
            <GlassPanel padding="lg" className="relative overflow-hidden">
              {/* Mock Editor UI */}
              <div className="flex gap-4">
                {/* Left Panel Mock */}
                <div className="hidden md:block w-48 space-y-3">
                  <div className="h-8 bg-muted/50 rounded-lg animate-pulse" />
                  <div className="h-24 bg-muted/30 rounded-lg" />
                  <div className="h-24 bg-muted/30 rounded-lg" />
                  <div className="h-16 bg-muted/30 rounded-lg" />
                </div>

                {/* Canvas Mock */}
                <div className="flex-1 aspect-video bg-canvas rounded-lg relative overflow-hidden">
                  <div className="absolute inset-4 border-2 border-dashed border-warning/30 rounded" />
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent/20 rounded-lg flex items-center justify-center">
                    <span className="text-canvas-foreground text-sm">Product</span>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8 h-12 bg-accent/30 rounded-lg flex items-center justify-center">
                    <span className="text-canvas-foreground text-sm font-medium">CTA Button</span>
                  </div>
                  <div className="absolute top-4 right-4 w-16 h-8 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Logo</span>
                  </div>
                </div>

                {/* Right Panel Mock */}
                <div className="hidden lg:block w-64 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Compliance</span>
                    <ComplianceScore score={92} size="sm" showLabel={false} />
                  </div>
                  <div className="space-y-2">
                    {[
                      { text: "Logo placement", ok: true },
                      { text: "Safe zones", ok: true },
                      { text: "Color contrast", ok: true },
                      { text: "Copy length", ok: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${item.ok ? 'text-accent' : 'text-warning'}`} />
                        <span className="text-muted-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-2">Formats</div>
                    <div className="flex flex-wrap gap-1">
                      {formats.slice(0, 3).map((f, i) => (
                        <FormatBadge key={i} format={f.name} active={i === 0} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating AI Chat Hint */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-4 right-4 max-w-xs"
              >
                <GlassPanel padding="sm" className="border-l-2 border-accent">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-xs text-foreground">"Make it more premium and festive"</p>
                      <p className="text-[10px] text-muted-foreground mt-1">AI will update your design...</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              <span className="text-gradient-ai">Intelligent</span> Creative Automation
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From brand analysis to compliant export, every step is AI-powered
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassPanel className="h-full hover-lift hover-glow group cursor-default">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-highlight/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              From Upload to <span className="text-gradient-ai">Campaign-Ready</span>
            </h2>
            <p className="text-muted-foreground text-lg">Complete workflow in under 5 minutes</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload & Configure",
                description: "Upload your product image, select campaign type, and let AI extract your brand DNA.",
                time: "30 sec",
              },
              {
                step: "02",
                title: "AI Generates Options",
                description: "18 AI engines create 20+ style variations with optimal layouts and copy.",
                time: "90 sec",
              },
              {
                step: "03",
                title: "Validate & Export",
                description: "Real-time compliance checking, multi-format export, all under 500KB.",
                time: "45 sec",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <GlassPanel className="relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 font-display text-8xl text-muted/20 -mt-4 -mr-4">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-xs font-mono text-accent">{item.time}</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Engines Preview */}
      <section id="engines" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              <span className="text-gradient-ai">18 AI Engines</span> Working Together
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Each engine is a specialist—together they form your autonomous creative department
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              "Brand DNA", "AutoLayout", "Compliance", "Copywriting",
              "Background Gen", "Format Transform", "Attention Sim", "Performance",
              "Typography", "Color Harmony", "Scene Builder", "Multiverse Gen",
            ].map((engine, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <GlassPanel 
                  padding="sm" 
                  className="text-center cursor-default hover:border-accent/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-accent/20 transition-colors">
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{engine}</span>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlassPanel padding="lg" className="text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-highlight/10" />
              <div className="relative z-10">
                <h2 className="font-display text-3xl md:text-4xl mb-4">
                  Ready to Transform Your Creative Workflow?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join brands creating campaign-ready creatives in minutes instead of days.
                </p>
                <Link to="/builder">
                  <Button variant="hero" size="xl" className="group">
                    Start Creating for Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-highlight flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg text-foreground">Creato-Sphere</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Creato-Sphere. AI-Powered Retail Media Creative Platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
