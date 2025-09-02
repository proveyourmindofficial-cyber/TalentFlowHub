import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BulkOperations, ItemCheckbox } from "@/components/ui/bulk-operations";
import { Search, Plus, Eye, Edit, MoreHorizontal, Download, Trash2, Upload } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { ImportExportButtons } from "@/components/ui/import-export-buttons";
import type { JobWithRelations, InsertJob } from "@shared/schema";
import { useState } from "react";

interface JobTableProps {
  showPreview?: boolean;
}

export default function JobTable({ showPreview = true }: JobTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: jobs, isLoading, error } = useQuery<JobWithRelations[]>({
    queryKey: ['/api/jobs'],
  });

  const filteredJobs = jobs?.filter(job => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.department.toLowerCase().includes(searchLower) ||
      (job.location && job.location.toLowerCase().includes(searchLower)) ||
      (job.skills && job.skills.some(skill => skill.toLowerCase().includes(searchLower)))
    );
  }) || [];

  const {
    selectedIds,
    selectedItems,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    hasSelection
  } = useBulkSelection(filteredJobs);

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("DELETE", `/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      clearSelection();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      return apiRequest("POST", "/api/jobs/bulk-delete", { ids: jobIds });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedIds.length} job${selectedIds.length !== 1 ? 's' : ''} deleted successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      clearSelection();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete jobs",
        variant: "destructive",
      });
    },
  });

  const handleDownloadJD = (job: JobWithRelations) => {
    const jdContent = `
JOB DESCRIPTION

Title: ${job.title}
Department: ${job.department}
Location: ${job.location || 'Not specified'}
Job Type: ${job.jobType.replace('_', ' ').toUpperCase()}
Experience Level: ${job.experienceLevel || 'Not specified'}

DESCRIPTION:
${job.description || 'Not provided'}

REQUIREMENTS:
${job.requirements || 'Not provided'}

RESPONSIBILITIES:
${job.responsibilities || 'Not provided'}

SKILLS:
${job.skills ? job.skills.join(', ') : 'Not specified'}

BENEFITS:
${job.benefits || 'Not provided'}

SALARY RANGE:
${job.salaryMin && job.salaryMax ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}` : 'Not specified'}

REMOTE WORK:
${job.isRemoteAvailable ? 'Available' : 'Not available'}

APPLICATION DEADLINE:
${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not specified'}

STATUS: ${job.status.replace('_', ' ').toUpperCase()}
PRIORITY: ${job.priority.toUpperCase()}
    `.trim();

    const blob = new Blob([jdContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_JD.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `Job description for "${job.title}" has been downloaded.`,
    });
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteMutation.mutate(jobId);
    }
  };



  const displayJobs = showPreview ? filteredJobs.slice(0, 3) : filteredJobs;

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleImport = async (importData: any[]) => {
    const mutation = useMutation({
      mutationFn: async (jobs: InsertJob[]) => {
        return apiRequest("POST", "/api/jobs/bulk-import", { jobs });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        clearSelection();
      }
    });
    
    // Transform imported data to match job schema
    const jobsToImport = importData.map(item => ({
      title: item.title,
      description: item.description,
      department: item.department,
      location: item.location,
      salaryMin: item.salaryMin ? parseInt(item.salaryMin) : undefined,
      salaryMax: item.salaryMax ? parseInt(item.salaryMax) : undefined,
      jobType: item.jobType || 'full_time',
      experienceLevel: item.experienceLevel,
      skills: item.skills ? item.skills.split(';') : [],
      benefits: item.benefits
    }));
    
    return mutation.mutateAsync(jobsToImport);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'closed':
        return 'destructive';
      case 'on_hold':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getJobTypeIcon = (department: string) => {
    const icons: Record<string, string> = {
      engineering: "💻",
      design: "🎨", 
      marketing: "📈",
      sales: "💼",
      hr: "👥",
      finance: "💰",
      operations: "⚙️",
    };
    return icons[department.toLowerCase()] || "📋";
  };

  if (error) {
    return (
      <Card className="animate-fade-in" data-testid="job-table-error">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-error">Failed to load jobs. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in" data-testid="job-table">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle>{showPreview ? "Active Jobs" : "All Jobs"}</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
                data-testid="input-search-jobs"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            {!showPreview && (
              <Link href="/jobs/new">
                <Button data-testid="button-new-job-table">
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Bulk Operations */}
        {!showPreview && (
          <div className="px-6 py-3">
            <BulkOperations
              selectedItems={selectedIds}
              totalItems={filteredJobs.length}
              onSelectAll={toggleAll}
              onBulkDelete={handleBulkDelete}
              itemName="job"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: showPreview ? 3 : 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  {!showPreview && <TableHead className="w-12"></TableHead>}
                  <TableHead className="text-left">Job Title</TableHead>
                  <TableHead className="text-left">Department</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                  <TableHead className="text-left">Applications</TableHead>
                  <TableHead className="text-left">Posted Date</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showPreview ? 6 : 7} className="text-center py-8" data-testid="no-jobs-message">
                      <div className="text-gray-500">
                        {searchQuery ? "No jobs found matching your search." : "No jobs posted yet."}
                      </div>
                      {!searchQuery && (
                        <Link href="/jobs/new">
                          <Button className="mt-4" data-testid="button-create-first-job">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Job
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayJobs.map((job) => (
                    <TableRow 
                      key={job.id} 
                      className="hover:bg-gray-50 transition-colors"
                      data-testid={`job-row-${job.id}`}
                    >
                      {!showPreview && (
                        <TableCell>
                          <ItemCheckbox
                            checked={isSelected(job.id)}
                            onChange={() => toggleItem(job.id, !isSelected(job.id))}
                            data-testid={`checkbox-${job.id}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center" data-testid={`job-title-${job.id}`}>
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-sm">{getJobTypeIcon(job.department)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500 capitalize">{job.jobType.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 capitalize" data-testid={`job-department-${job.id}`}>
                        {job.department}
                      </TableCell>
                      <TableCell data-testid={`job-status-${job.id}`}>
                        <Badge variant={getStatusVariant(job.status)} className="capitalize">
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900" data-testid={`job-applications-${job.id}`}>
                        0 {/* TODO: Add application count from relations */}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500" data-testid={`job-date-${job.id}`}>
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/jobs/${job.id}`}>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-view-job-${job.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/jobs/${job.id}/edit`}>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`button-edit-job-${job.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-more-actions-${job.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadJD(job)} data-testid={`menu-download-jd-${job.id}`}>
                                <Download className="mr-2 h-4 w-4" />
                                Download JD
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteJob(job.id)} 
                                className="text-red-600"
                                data-testid={`menu-delete-job-${job.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Job
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {showPreview && displayJobs.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {displayJobs.length} of {jobs?.length || 0} jobs
              </p>
              <Link href="/jobs">
                <Button variant="link" className="text-primary text-sm p-0" data-testid="button-view-all-jobs">
                  View All Jobs
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
