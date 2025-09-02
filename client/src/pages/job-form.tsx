import { useParams } from "wouter";
import Header from "@/components/layout/header";
import JobForm from "@/components/job/job-form";

export default function JobFormPage() {
  const params = useParams();
  const isEditing = !!params.id;

  return (
    <div className="flex flex-col h-full" data-testid="job-form-page">
      <Header 
        title={isEditing ? "Edit Job" : "Create New Job"}
        description={isEditing ? "Update job details and requirements." : "Post a new job opening to attract candidates."}
        showNewJobButton={false}
      />

      <div className="flex-1 overflow-auto p-6">
        <JobForm jobId={params.id} />
      </div>
    </div>
  );
}
