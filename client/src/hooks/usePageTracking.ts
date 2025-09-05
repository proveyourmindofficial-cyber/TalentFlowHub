import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../services/activityTracker';

export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Track page view when location changes
    const title = document.title;
    trackPageView(location, title);
  }, [location]);
}

// Hook for tracking specific page views with custom data
export function usePageTrackingWithData(pageData?: { title?: string; category?: string }) {
  const [location] = useLocation();

  useEffect(() => {
    const title = pageData?.title || document.title;
    trackPageView(location, title);
  }, [location, pageData?.title]);
}