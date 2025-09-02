import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Building, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Download,
  Eye,
  LogOut
} from "lucide-react";
import { useCandidatePortalAuth } from "@/hooks/useCandidatePortalAuth";

interface CandidateDashboardProps {
  onLogout: () => void;
}

export default function CandidateDashboard({ onLogout }: CandidateDashboardProps) {
  const { candidate, token } = useCandidatePortalAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/candidate-portal/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/candidate-portal/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!token,
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/candidate-portal/applications"],
    queryFn: async () => {
      const response = await fetch("/api/candidate-portal/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !!token,
  });

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ["/api/candidate-portal/interviews"],
    queryFn: async () => {
      const response = await fetch("/api/candidate-portal/interviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch interviews");
      return response.json();
    },
    enabled: !!token,
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["/api/candidate-portal/offers"],
    queryFn: async () => {
      const response = await fetch("/api/candidate-portal/offers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch offers");
      return response.json();
    },
    enabled: !!token,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Interviewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Offered":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Joined":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Applied":
        return "bg-blue-100 text-blue-800";
      case "Shortlisted":
        return "bg-yellow-100 text-yellow-800";
      case "L1 Scheduled":
      case "L2 Scheduled":
      case "HR Scheduled":
      case "Final Scheduled":
        return "bg-orange-100 text-orange-800";
      case "Selected":
        return "bg-green-100 text-green-800";
      case "Offer Released":
        return "bg-purple-100 text-purple-800";
      case "Joined":
        return "bg-emerald-100 text-emerald-800";
      case "Rejected":
      case "No Show":
      case "Not Joined":
        return "bg-red-100 text-red-800";
      case "On Hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!candidate) {
    return <div>Loading...</div>;
  }

  const upcomingInterviews = interviews.filter((interview: any) => 
    interview.status === 'Scheduled' && new Date(interview.scheduledDate) > new Date()
  );

  const pendingOffers = offers.filter((offer: any) => 
    offer.status === 'draft' || offer.status === 'sent'
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {candidate.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your applications and manage your profile
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(candidate.status)} data-testid="candidate-status">
                {candidate.status}
              </Badge>
              <Button 
                variant="outline" 
                onClick={onLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-applications">
                    {statsLoading ? "..." : stats?.totalApplications || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Applications
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-active-applications">
                    {statsLoading ? "..." : stats?.activeApplications || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Scheduled Interviews
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-scheduled-interviews">
                    {statsLoading ? "..." : stats?.scheduledInterviews || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending Offers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-pending-offers">
                    {statsLoading ? "..." : stats?.offers || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>
                  Track the progress of your job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No applications found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((application: any) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        data-testid={`application-${application.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {application.job?.title || "Unknown Position"}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {application.job?.department || "N/A"}
                            </div>
                            {application.job?.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {application.job.location}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied on {new Date(application.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStageColor(application.stage)}>
                          {application.stage}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile & Quick Actions */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your candidate profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm" data-testid="profile-email">{candidate.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm" data-testid="profile-phone">{candidate.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm" data-testid="profile-skill">{candidate.primarySkill}</span>
                </div>
                {candidate.currentCompany && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm" data-testid="profile-company">{candidate.currentCompany}</span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    data-testid="button-edit-profile"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  {candidate.resumeUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(candidate.resumeUrl, '_blank')}
                      data-testid="button-view-resume"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Resume
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Interviews */}
            {upcomingInterviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Interviews</CardTitle>
                  <CardDescription>
                    Your scheduled interviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingInterviews.slice(0, 3).map((interview: any) => (
                      <div
                        key={interview.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        data-testid={`interview-${interview.id}`}
                      >
                        <h5 className="font-medium text-sm">
                          {interview.interviewRound} Round
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {interview.application?.job?.title}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(interview.scheduledDate).toLocaleDateString()}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {interview.mode}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Offers</CardTitle>
                  <CardDescription>
                    Offers awaiting your response
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingOffers.map((offer: any) => (
                      <div
                        key={offer.id}
                        className="p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20"
                        data-testid={`offer-${offer.id}`}
                      >
                        <h5 className="font-medium text-sm">
                          {offer.designation}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          CTC: ₹{offer.ctc}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs"
                            data-testid={`button-accept-offer-${offer.id}`}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            data-testid={`button-decline-offer-${offer.id}`}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}