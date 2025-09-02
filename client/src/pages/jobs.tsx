import Header from "@/components/layout/header";
import JobTable from "@/components/job/job-table";

export default function Jobs() {
  return (
    <div className="flex flex-col h-full" data-testid="jobs-page">
      <Header 
        title="Jobs"
        description="Manage all your job postings and recruitment positions."
        showNewJobButton={true}
      />

      <div className="flex-1 overflow-auto p-6">
        <JobTable showPreview={false} />
      </div>
    </div>
  );
}
