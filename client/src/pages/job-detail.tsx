import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Edit, Download, Trash2, MapPin, Calendar, DollarSign, Clock, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/header";
import { type Job } from "@shared/schema";

export default function JobDetailPage() {
  const [, params] = useRoute("/jobs/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const jobId = params?.id;

  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

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
      setLocation("/jobs");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const handleDownloadJD = () => {
    if (!job) return;
    
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
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'on_hold': return 'outline';
      case 'closed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (error) {
    return (
      <div className="flex flex-col h-full" data-testid="job-detail-error">
        <Header title="Job Not Found" description="The requested job could not be found." />
        <div className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">This job may have been deleted or the ID is incorrect.</p>
                <Link href="/jobs">
                  <Button data-testid="button-back-to-jobs">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="job-detail-page">
      <Header 
        title={isLoading ? "Loading..." : job?.title || "Job Details"}
        description={isLoading ? "Please wait..." : "View complete job information and requirements."}
      />

      <div className="flex-1 overflow-auto p-6">
          {/* Back Navigation and Actions */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/jobs">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            
            {job && (
              <div className="flex gap-2">
                <Button onClick={handleDownloadJD} variant="outline" data-testid="button-download-jd">
                  <Download className="w-4 h-4 mr-2" />
                  Download JD
                </Button>
                <Link href={`/jobs/${job.id}/edit`}>
                  <Button variant="outline" data-testid="button-edit">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Job
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                      deleteMutation.mutate(job.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <Card data-testid="job-detail-loading">
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : job ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Overview */}
                <Card data-testid="job-overview">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                        <p className="text-gray-600 mt-1">{job.department}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={getStatusVariant(job.status)} data-testid="job-status">
                          {job.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`} data-testid="job-priority">
                          {job.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {job.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm capitalize">{job.jobType.replace('_', ' ')}</span>
                      </div>
                      {job.salaryMin && job.salaryMax && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}</span>
                        </div>
                      )}
                      {job.applicationDeadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{new Date(job.applicationDeadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {job.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Job Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap" data-testid="job-description">{job.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requirements */}
                {job.requirements && (
                  <Card data-testid="job-requirements">
                    <CardHeader>
                      <CardTitle>Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Responsibilities */}
                {job.responsibilities && (
                  <Card data-testid="job-responsibilities">
                    <CardHeader>
                      <CardTitle>Responsibilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Benefits */}
                {job.benefits && (
                  <Card data-testid="job-benefits">
                    <CardHeader>
                      <CardTitle>Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Quick Info */}
                <Card data-testid="job-quick-info">
                  <CardHeader>
                    <CardTitle>Job Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.experienceLevel && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                        <dd className="text-sm text-gray-900">{job.experienceLevel}</dd>
                      </div>
                    )}
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Remote Work</dt>
                      <dd className="text-sm text-gray-900">{job.isRemoteAvailable ? 'Available' : 'Not Available'}</dd>
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 mb-2">Required Skills</dt>
                        <div className="flex flex-wrap gap-1">
                          {job.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs" data-testid={`skill-${index}`}>
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Posted</dt>
                      <dd className="text-sm text-gray-900">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </CardContent>
                </Card>

                {/* Applications */}
                <Card data-testid="job-applications">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-gray-900">0</div>
                      <p className="text-sm text-gray-500">Total Applications</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
    </div>
  );
}