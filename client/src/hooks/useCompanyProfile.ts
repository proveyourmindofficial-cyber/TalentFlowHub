import { useQuery } from '@tanstack/react-query';
import type { CompanyProfile } from '@shared/schema';

export function useCompanyProfile() {
  return useQuery<CompanyProfile>({
    queryKey: ['/api/company-profile'],
    staleTime: 5 * 60 * 1000, // 5 minutes - company data changes rarely
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