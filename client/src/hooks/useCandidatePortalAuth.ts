import { useState, useEffect } from 'react';

interface CandidatePortalUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  primarySkill: string;
  currentCompany?: string;
  resumeUrl?: string;
  status: string;
}

export function useCandidatePortalAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidatePortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('candidatePortalToken');
    const storedCandidate = localStorage.getItem('candidatePortalUser');
    
    if (storedToken && storedCandidate) {
      setToken(storedToken);
      setCandidate(JSON.parse(storedCandidate));
    }
    
    setIsLoading(false);
  }, []);

  const login = (authToken: string, candidateData: CandidatePortalUser) => {
    localStorage.setItem('candidatePortalToken', authToken);
    localStorage.setItem('candidatePortalUser', JSON.stringify(candidateData));
    setToken(authToken);
    setCandidate(candidateData);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/candidate-portal/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('candidatePortalToken');
    localStorage.removeItem('candidatePortalUser');
    setToken(null);
    setCandidate(null);
  };

  const updateCandidate = (updatedCandidate: CandidatePortalUser) => {
    localStorage.setItem('candidatePortalUser', JSON.stringify(updatedCandidate));
    setCandidate(updatedCandidate);
  };

  return {
    token,
    candidate,
    isLoading,
    isAuthenticated: !!token && !!candidate,
    login,
    logout,
    updateCandidate,
  };
}