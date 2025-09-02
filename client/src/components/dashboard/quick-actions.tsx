import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, CalendarPlus, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const { toast } = useToast();

  const actions = [
    {
      title: "Post New Job",
      icon: Plus,
      bgColor: "bg-primary",
      href: "/jobs/new",
    },
    {
      title: "Add Candidate", 
      icon: UserPlus,
      bgColor: "bg-success",
      onClick: () => toast({ title: "Coming Soon", description: "Candidate management will be available in the next module." }),
    },
    {
      title: "Schedule Interview",
      icon: CalendarPlus,
      bgColor: "bg-accent",
      onClick: () => toast({ title: "Coming Soon", description: "Interview scheduling will be available in the next module." }),
    },
    {
      title: "Generate Report",
      icon: TrendingUp,
      bgColor: "bg-purple-500",
      onClick: () => toast({ title: "Coming Soon", description: "Reports feature will be available in the next module." }),
    },
  ];

  return (
    <Card className="animate-fade-in" data-testid="quick-actions">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => {
            const ActionButton = (
              <Button
                variant="ghost"
                className="w-full justify-start p-3 h-auto bg-gray-50 hover:bg-gray-100"
                onClick={action.onClick}
                data-testid={`button-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                  <action.icon className="text-white w-4 h-4" />
                </div>
                <span className="font-medium text-gray-900">{action.title}</span>
              </Button>
            );

            return action.href ? (
              <Link key={`link-${index}`} href={action.href}>
                {ActionButton}
              </Link>
            ) : (
              <div key={`div-${index}`}>
                {ActionButton}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
