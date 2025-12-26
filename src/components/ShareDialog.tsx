import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Link2, Mail, Twitter, Linkedin, Facebook, QrCode, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { toast } from "sonner";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
}

export const ShareDialog = ({ isOpen, onClose, projectName, projectId }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");

  const shareUrl = projectId 
    ? `${window.location.origin}/builder?project=${projectId}` 
    : window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleEmailShare = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    const subject = encodeURIComponent(`Check out my design: ${projectName}`);
    const body = encodeURIComponent(`I wanted to share my creative design with you!\n\nView it here: ${shareUrl}`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Email client opened");
    setEmail("");
  };

  const handleSocialShare = (platform: "twitter" | "linkedin" | "facebook") => {
    const text = encodeURIComponent(`Check out my creative design: ${projectName}`);
    const url = encodeURIComponent(shareUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    };
    
    window.open(urls[platform], "_blank", "width=600,height=400");
    toast.success(`Opening ${platform}...`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-xl text-foreground">Share Design</h2>
                <p className="text-sm text-muted-foreground">Share "{projectName}" with others</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Copy Link */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Share Link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm bg-muted/30"
                  />
                  <Button
                    variant={copied ? "default" : "outline"}
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email Share */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Share via Email
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailShare()}
                    className="text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleEmailShare} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Social Share */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Share on Social</label>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSocialShare("twitter")}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="text-sm font-medium">Twitter</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSocialShare("linkedin")}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSocialShare("facebook")}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="text-sm font-medium">Facebook</span>
                  </motion.button>
                </div>
              </div>

              {/* QR Code hint */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">QR Code</span>
                  <p className="text-xs text-muted-foreground">Coming soon - share via QR code</p>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareDialog;
