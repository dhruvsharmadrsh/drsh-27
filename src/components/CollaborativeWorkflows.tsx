import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { 
  Users, MessageSquare, CheckCircle, Clock, Send, 
  UserPlus, AtSign, ThumbsUp, ThumbsDown, AlertCircle, X,
  Bell, History, Settings, Share2, Crown, Eye, Edit2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CollaborativeWorkflowsProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
  replies?: Comment[];
  likes?: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer" | "approver";
  avatar: string;
  status: "online" | "offline" | "away";
  lastActive?: string;
}

interface ApprovalRequest {
  id: string;
  requester: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewers: Array<{ name: string; status: "pending" | "approved" | "rejected"; comment?: string }>;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'edit' | 'comment' | 'approval' | 'share';
}

export function CollaborativeWorkflows({ isOpen, onClose, projectName, projectId }: CollaborativeWorkflowsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"team" | "comments" | "approvals" | "activity">("team");
  const [newComment, setNewComment] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [isLoading, setIsLoading] = useState(false);
  
  // Team state
  const [team, setTeam] = useState<TeamMember[]>([
    { id: "1", name: user?.email?.split('@')[0] || "You", email: user?.email || "", role: "owner", avatar: "YO", status: "online" },
  ]);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([
    { 
      id: "1", 
      author: "Sarah Chen", 
      avatar: "SC", 
      text: "Love the color scheme! Can we make the CTA button more prominent?", 
      timestamp: "2 hours ago",
      likes: 2
    },
    { 
      id: "2", 
      author: "Mike Johnson", 
      avatar: "MJ", 
      text: "The logo placement looks great. Approved for the next stage.", 
      timestamp: "1 hour ago",
      likes: 1
    },
  ]);

  // Approval state
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>({
    id: "1",
    requester: "You",
    status: "pending",
    createdAt: "Today at 2:30 PM",
    reviewers: [
      { name: "Mike Johnson", status: "approved", comment: "Looks good!" },
      { name: "Lisa Wong", status: "pending" },
    ]
  });
  
  // Activity state
  const [activity, setActivity] = useState<ActivityItem[]>([
    { id: "1", user: "Sarah Chen", action: "added a comment", timestamp: "2 hours ago", type: 'comment' },
    { id: "2", user: "Mike Johnson", action: "approved the design", timestamp: "1 hour ago", type: 'approval' },
    { id: "3", user: "You", action: "updated the CTA button", timestamp: "30 minutes ago", type: 'edit' },
  ]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: "You",
      avatar: "YO",
      text: newComment,
      timestamp: "Just now",
      likes: 0
    };
    setComments([...comments, comment]);
    setNewComment("");
    
    // Add to activity
    setActivity([
      { id: Date.now().toString(), user: "You", action: "added a comment", timestamp: "Just now", type: 'comment' },
      ...activity
    ]);
    
    toast.success("Comment added!");
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    ));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate invitation (in production, this would be a real API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        avatar: inviteEmail.substring(0, 2).toUpperCase(),
        status: "offline"
      };
      
      setTeam([...team, newMember]);
      
      // Add to activity
      setActivity([
        { id: Date.now().toString(), user: "You", action: `invited ${inviteEmail} as ${inviteRole}`, timestamp: "Just now", type: 'share' },
        ...activity
      ]);
      
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApprovalRequest({
        id: Date.now().toString(),
        requester: "You",
        status: "pending",
        createdAt: new Date().toLocaleString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true 
        }),
        reviewers: team
          .filter(m => m.role === "approver" || m.role === "owner")
          .filter(m => m.id !== "1") // Exclude self
          .map(m => ({ name: m.name, status: "pending" as const }))
      });
      
      setActivity([
        { id: Date.now().toString(), user: "You", action: "requested approval", timestamp: "Just now", type: 'approval' },
        ...activity
      ]);
      
      toast.success("Approval request sent to reviewers");
    } catch (error) {
      toast.error("Failed to request approval");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const member = team.find(m => m.id === memberId);
    if (member?.role === "owner") {
      toast.error("Cannot remove the project owner");
      return;
    }
    
    setTeam(team.filter(m => m.id !== memberId));
    toast.success("Member removed");
  };

  const handleChangeRole = (memberId: string, newRole: TeamMember['role']) => {
    setTeam(team.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    ));
    toast.success("Role updated");
  };

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 text-amber-500" />;
      case 'editor': return <Edit2 className="w-3 h-3 text-blue-500" />;
      case 'viewer': return <Eye className="w-3 h-3 text-slate-500" />;
      case 'approver': return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'edit': return <Edit2 className="w-4 h-4 text-blue-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'approval': return <CheckCircle className="w-4 h-4 text-amber-500" />;
      case 'share': return <Share2 className="w-4 h-4 text-violet-500" />;
    }
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col h-[85vh]">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-xl text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Collaborative Workflows
                </h2>
                <p className="text-sm text-muted-foreground">
                  Team co-editing, commenting, and approvals for "{projectName}"
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs - Fixed */}
            <div className="flex-shrink-0 px-6 pt-4 flex gap-2 border-b border-border/50 pb-4">
              {[
                { id: "team", label: "Team", icon: Users },
                { id: "comments", label: "Comments", icon: MessageSquare, count: comments.length },
                { id: "approvals", label: "Approvals", icon: CheckCircle },
                { id: "activity", label: "Activity", icon: History, count: activity.length },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-background/50">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* Team Tab */}
                {activeTab === "team" && (
                  <div className="space-y-4">
                    {/* Invite */}
                    <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-accent" />
                        Invite Team Member
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter email to invite..."
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                          className="flex-1"
                        />
                        <select 
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                          className="px-3 py-2 rounded-lg border bg-background text-sm"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button onClick={handleInvite} disabled={isLoading}>
                          {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Team Members ({team.length})</h4>
                      {team.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-medium">
                                {member.avatar}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                                member.status === "online" ? "bg-green-500" : 
                                member.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-2">
                                {member.name}
                                {member.role === "owner" && <Crown className="w-3 h-3 text-amber-500" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${
                              member.role === "owner" ? "bg-amber-500/10 text-amber-600" :
                              member.role === "editor" ? "bg-blue-500/10 text-blue-600" :
                              member.role === "approver" ? "bg-green-500/10 text-green-600" :
                              "bg-gray-500/10 text-gray-600"
                            }`}>
                              {getRoleIcon(member.role)}
                              {member.role}
                            </span>
                            {member.role !== "owner" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-7 h-7 text-destructive/60 hover:text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Tab */}
                {activeTab === "comments" && (
                  <div className="space-y-4">
                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment... Use @ to mention"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddComment}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No comments yet. Start the conversation!</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="p-4 rounded-lg bg-muted/50 border space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-medium">
                                  {comment.avatar}
                                </div>
                                <span className="text-sm font-medium">{comment.author}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.text}</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleLikeComment(comment.id)}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <ThumbsUp className="w-3 h-3" /> 
                                {comment.likes || 0}
                              </button>
                              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                                <AtSign className="w-3 h-3" /> Reply
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Approvals Tab */}
                {activeTab === "approvals" && (
                  <div className="space-y-4">
                    {/* Request Approval */}
                    <Button 
                      onClick={handleRequestApproval} 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Request Approval
                    </Button>

                    {/* Current Approval Status */}
                    {approvalRequest && (
                      <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {approvalRequest.status === "pending" && <Clock className="w-4 h-4 text-yellow-500" />}
                            {approvalRequest.status === "approved" && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {approvalRequest.status === "rejected" && <AlertCircle className="w-4 h-4 text-red-500" />}
                            <span className="font-medium capitalize">{approvalRequest.status}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{approvalRequest.createdAt}</span>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs text-muted-foreground">Reviewers</span>
                          {approvalRequest.reviewers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No approvers assigned. Add team members with approver role.</p>
                          ) : (
                            approvalRequest.reviewers.map((reviewer, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background">
                                <span className="text-sm">{reviewer.name}</span>
                                <span className={`flex items-center gap-1 text-xs ${
                                  reviewer.status === "approved" ? "text-green-600" :
                                  reviewer.status === "rejected" ? "text-red-600" :
                                  "text-yellow-600"
                                }`}>
                                  {reviewer.status === "approved" && <ThumbsUp className="w-3 h-3" />}
                                  {reviewer.status === "rejected" && <ThumbsDown className="w-3 h-3" />}
                                  {reviewer.status === "pending" && <Clock className="w-3 h-3" />}
                                  {reviewer.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <History className="w-4 h-4 text-accent" />
                      Recent Activity
                    </h4>
                    {activity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activity yet</p>
                      </div>
                    ) : (
                      activity.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {getActivityIcon(item.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{item.user}</span>
                              {" "}{item.action}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
