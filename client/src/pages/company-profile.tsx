import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Save, Mail, Phone, MapPin, Globe, Calendar, Users, Briefcase, Upload, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanyProfileSchema, type CompanyProfile, type InsertCompanyProfile } from "@shared/schema";

const formSchema = insertCompanyProfileSchema;

export default function CompanyProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing company profile
  const { data: profile, isLoading } = useQuery<CompanyProfile>({
    queryKey: ['/api/company-profile'],
    retry: false,
  });

  // Initialize form with profile data or empty values
  const form = useForm<InsertCompanyProfile>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: profile?.companyName || "",
      companyLogo: profile?.companyLogo || "",
      website: profile?.website || "",
      industry: profile?.industry || "",
      foundedYear: profile?.foundedYear || undefined,
      companySize: profile?.companySize || "",
      description: profile?.description || "",
      tagline: profile?.tagline || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      addressLine1: profile?.addressLine1 || "",
      addressLine2: profile?.addressLine2 || "",
      city: profile?.city || "",
      state: profile?.state || "",
      postalCode: profile?.postalCode || "",
      country: profile?.country || "",
      linkedinUrl: profile?.linkedinUrl || "",
      twitterUrl: profile?.twitterUrl || "",
      facebookUrl: profile?.facebookUrl || "",
      emailFromName: profile?.emailFromName || "",
      emailFromAddress: profile?.emailFromAddress || "",
      emailSignature: profile?.emailSignature || "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset(profile);
    }
  }, [profile, form]);

  // Create/Update mutation
  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: async (data: InsertCompanyProfile) => {
      if (profile?.id) {
        return apiRequest("PUT", `/api/company-profile/${profile.id}`, data);
      } else {
        return apiRequest("POST", "/api/company-profile", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: profile?.id ? "Company profile updated successfully" : "Company profile created successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save company profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompanyProfile) => {
    saveProfile(data);
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (profile) {
      form.reset(profile);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      form.reset(profile);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Company Profile</h1>
        </div>
        
        {!isEditing ? (
          <Button onClick={handleEdit} data-testid="button-edit-profile">
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isPending}
              data-testid="button-save-profile"
            >
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  disabled={!isEditing}
                  data-testid="input-company-name"
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  {...form.register("tagline")}
                  disabled={!isEditing}
                  placeholder="Your company's tagline"
                  data-testid="input-tagline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...form.register("website")}
                  disabled={!isEditing}
                  placeholder="https://yourcompany.com"
                  data-testid="input-website"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select 
                  value={form.watch("industry") || ""} 
                  onValueChange={(value) => form.setValue("industry", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger data-testid="select-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="media">Media & Entertainment</SelectItem>
                    <SelectItem value="automotive">Automotive</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foundedYear">Founded Year</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  {...form.register("foundedYear", { valueAsNumber: true })}
                  disabled={!isEditing}
                  placeholder="e.g., 2020"
                  data-testid="input-founded-year"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select 
                  value={form.watch("companySize") || ""} 
                  onValueChange={(value) => form.setValue("companySize", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger data-testid="select-company-size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1001-5000">1001-5000 employees</SelectItem>
                    <SelectItem value="5000+">5000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                disabled={!isEditing}
                placeholder="Brief description of your company"
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLogo">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="companyLogo"
                    type="url"
                    {...form.register("companyLogo")}
                    disabled={!isEditing}
                    placeholder="https://yourcompany.com/logo.png"
                    data-testid="input-logo-url"
                  />
                </div>
                {form.watch("companyLogo") && (
                  <div className="w-20 h-20 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    <img 
                      src={form.watch("companyLogo") || ""} 
                      alt="Company Logo Preview" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const nextEl = target.nextElementSibling as HTMLElement;
                        if (nextEl) nextEl.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center w-full h-full">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  disabled={!isEditing}
                  placeholder="contact@yourcompany.com"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  disabled={!isEditing}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  {...form.register("addressLine1")}
                  disabled={!isEditing}
                  placeholder="123 Main Street"
                  data-testid="input-address1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  {...form.register("addressLine2")}
                  disabled={!isEditing}
                  placeholder="Suite 100"
                  data-testid="input-address2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    disabled={!isEditing}
                    placeholder="New York"
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    disabled={!isEditing}
                    placeholder="NY"
                    data-testid="input-state"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    {...form.register("postalCode")}
                    disabled={!isEditing}
                    placeholder="10001"
                    data-testid="input-postal-code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...form.register("country")}
                    disabled={!isEditing}
                    placeholder="United States"
                    data-testid="input-country"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  {...form.register("linkedinUrl")}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/company/yourcompany"
                  data-testid="input-linkedin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Input
                  id="twitterUrl"
                  type="url"
                  {...form.register("twitterUrl")}
                  disabled={!isEditing}
                  placeholder="https://twitter.com/yourcompany"
                  data-testid="input-twitter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  type="url"
                  {...form.register("facebookUrl")}
                  disabled={!isEditing}
                  placeholder="https://facebook.com/yourcompany"
                  data-testid="input-facebook"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailFromName">From Name</Label>
                <Input
                  id="emailFromName"
                  {...form.register("emailFromName")}
                  disabled={!isEditing}
                  placeholder="Your Company Name"
                  data-testid="input-email-from-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFromAddress">From Email Address</Label>
                <Input
                  id="emailFromAddress"
                  type="email"
                  {...form.register("emailFromAddress")}
                  disabled={!isEditing}
                  placeholder="noreply@yourcompany.com"
                  data-testid="input-email-from-address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailSignature">Email Signature</Label>
              <Textarea
                id="emailSignature"
                {...form.register("emailSignature")}
                disabled={!isEditing}
                placeholder="Best regards,&#10;Your Company Name&#10;contact@yourcompany.com"
                rows={4}
                data-testid="textarea-email-signature"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}