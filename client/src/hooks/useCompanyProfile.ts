import { useQuery } from '@tanstack/react-query';
import type { CompanyProfile } from '@shared/schema';

export function useCompanyProfile() {
  return useQuery<CompanyProfile>({
    queryKey: ['/api/company-profile'],
    staleTime: 0, // Always fetch fresh data to ensure logo appears immediately
    gcTime: 0, // Don't cache the response
  });
}

export function useCompanyBranding(): {
  companyName: string;
  companyLogo?: string | null;
  tagline: string;
  isLoading: boolean;
} {
  const { data: profile, isLoading } = useCompanyProfile();
  
  return {
    companyName: profile?.companyName || 'ATS System',
    companyLogo: profile?.companyLogo || null,
    tagline: profile?.tagline || '⚡ Recruitment Platform',
    isLoading
  };
}