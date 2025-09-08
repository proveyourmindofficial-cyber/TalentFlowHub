import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeedbackFormData {
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  page?: string;
  userAgent?: string;
}

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'bug',
    priority: 'medium',
    title: '',
    description: '',
    page: window.location.pathname,
    userAgent: navigator.userAgent,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted! 🎉",
        description: "Thank you for your feedback. Our team will review it shortly.",
      });
      setIsOpen(false);
      setFormData({
        type: 'bug',
        priority: 'medium',
        title: '',
        description: '',
        page: window.location.pathname,
        userAgent: navigator.userAgent,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }
    submitFeedbackMutation.mutate(formData);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800 border-red-300';
      case 'feature': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'improvement': return 'bg-green-100 text-green-800 border-green-300';
      case 'question': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
          "transform transition-all duration-300 hover:scale-110",
          "border-2 border-white/20"
        )}
        data-testid="button-feedback"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border-t-4 border-t-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                    Share Your Feedback
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Help us improve O2F ATS by reporting bugs, suggesting features, or asking questions.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-red-100 hover:text-red-600"
                  data-testid="button-close-feedback"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Feedback Type *
                    </label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: FeedbackFormData['type']) => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger data-testid="select-feedback-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">🐛 Bug Report</SelectItem>
                        <SelectItem value="feature">✨ Feature Request</SelectItem>
                        <SelectItem value="improvement">🔧 Improvement</SelectItem>
                        <SelectItem value="question">❓ Question</SelectItem>
                        <SelectItem value="other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={cn("text-xs", getTypeColor(formData.type))} variant="outline">
                      {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Priority *
                    </label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value: FeedbackFormData['priority']) => 
                        setFormData(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger data-testid="select-feedback-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="urgent">🔴 Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={cn("text-xs", getPriorityColor(formData.priority))}>
                      {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
                    </Badge>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <Input
                    placeholder="Brief summary of your feedback..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="focus:ring-2 focus:ring-blue-500"
                    data-testid="input-feedback-title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <Textarea
                    placeholder="Provide detailed information about your feedback. Include steps to reproduce if reporting a bug..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="focus:ring-2 focus:ring-blue-500 resize-none"
                    data-testid="textarea-feedback-description"
                  />
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Context Information */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    📋 Context Information (Auto-filled)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Current Page:</span> {formData.page}
                    </div>
                    <div>
                      <span className="font-medium">Browser:</span> {navigator.userAgent.split('(')[0].trim()}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-cancel-feedback"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitFeedbackMutation.isPending || !formData.title.trim() || !formData.description.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    data-testid="button-submit-feedback"
                  >
                    {submitFeedbackMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}