import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface DropdownOption {
  id: string;
  category: string;
  label: string;
  value: string;
  isActive: boolean;
}

// Hook to fetch dropdown options for a specific category
export function useDropdownOptions(category: string) {
  return useQuery<DropdownOption[]>({
    queryKey: ['/api/dropdowns', category],
    enabled: !!category,
  });
}

// Alias for backward compatibility  
export const useDropdowns = useDropdownOptions;

// Hook to add new dropdown option dynamically
export function useAddDropdownOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { category: string; label: string; value: string }) => {
      const response = await apiRequest('POST', '/api/dropdowns', data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific category to refresh dropdown
      queryClient.invalidateQueries({
        queryKey: ['/api/dropdowns', variables.category]
      });
    },
  });
}