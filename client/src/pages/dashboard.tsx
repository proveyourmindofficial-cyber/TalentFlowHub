import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import PipelineOverview from "@/components/dashboard/pipeline-overview";
import UpcomingInterviews from "@/components/dashboard/upcoming-interviews";
import JobsTablePreview from "@/components/job/job-table";

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full" data-testid="dashboard">
      <Header 
        title="Dashboard"
        description="Welcome back! Here's what's happening with your recruitment pipeline."
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <StatsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineOverview />
          <UpcomingInterviews />
        </div>

        <JobsTablePreview />
      </div>
    </div>
  );
}
