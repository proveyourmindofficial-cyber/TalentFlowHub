// Frontend Activity Tracking Service
// Tracks user interactions, page views, errors, and session activity

interface ActivityEvent {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  userJourneyContext?: {
    flow: 'onboarding' | 'daily_usage' | 'troubleshooting';
    stage: 'invitation' | 'password_setup' | 'notification' | 'reminder';
  };
}

interface SessionInfo {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  interactions: number;
}

class ActivityTracker {
  private session: SessionInfo | null = null;
  private userId: string | null = null;
  private isEnabled: boolean = true;
  private batchQueue: ActivityEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 5000; // 5 seconds

  constructor() {
    this.initSession();
    this.setupEventListeners();
    this.startHeartbeat();
  }

  private initSession() {
    this.session = {
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 0,
      interactions: 0
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId: string) {
    this.userId = userId;
    this.trackActivity({
      action: 'session_started',
      entityType: 'user',
      entityId: userId,
      metadata: {
        sessionId: this.session?.sessionId,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      userJourneyContext: {
        flow: 'daily_usage',
        stage: 'notification'
      }
    });
  }

  clearUser() {
    if (this.userId && this.session) {
      this.trackActivity({
        action: 'session_ended',
        entityType: 'user',
        entityId: this.userId,
        metadata: {
          sessionId: this.session.sessionId,
          duration: Date.now() - this.session.startTime.getTime(),
          pageViews: this.session.pageViews,
          interactions: this.session.interactions
        },
        userJourneyContext: {
          flow: 'daily_usage',
          stage: 'notification'
        }
      });
    }
    this.userId = null;
    this.initSession();
  }

  trackPageView(path: string, title?: string) {
    if (!this.isEnabled || !this.userId) return;

    if (this.session) {
      this.session.pageViews++;
      this.session.lastActivity = new Date();
    }

    this.trackActivity({
      action: 'page_view',
      entityType: 'page',
      entityId: path,
      metadata: {
        title,
        path,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        sessionId: this.session?.sessionId
      },
      userJourneyContext: {
        flow: 'daily_usage',
        stage: 'notification'
      }
    });
  }

  trackInteraction(element: string, action: string, metadata?: Record<string, any>) {
    if (!this.isEnabled || !this.userId) return;

    if (this.session) {
      this.session.interactions++;
      this.session.lastActivity = new Date();
    }

    this.trackActivity({
      action: `interaction_${action}`,
      entityType: 'ui_element',
      entityId: element,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        sessionId: this.session?.sessionId
      },
      userJourneyContext: {
        flow: 'daily_usage',
        stage: 'notification'
      }
    });
  }

  trackError(error: Error, context?: string) {
    if (!this.isEnabled) return;

    this.trackActivity({
      action: 'frontend_error',
      entityType: 'error',
      entityId: error.name,
      metadata: {
        message: error.message,
        stack: error.stack,
        context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: this.session?.sessionId
      },
      userJourneyContext: {
        flow: 'troubleshooting',
        stage: 'notification'
      }
    });
  }

  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>) {
    if (!this.isEnabled || !this.userId) return;

    this.trackActivity({
      action: `feature_${action}`,
      entityType: 'feature',
      entityId: feature,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        sessionId: this.session?.sessionId
      },
      userJourneyContext: {
        flow: 'daily_usage',
        stage: 'notification'
      }
    });
  }

  trackIssueReport(issueType: string, description: string, context?: Record<string, any>) {
    if (!this.isEnabled || !this.userId) return;

    this.trackActivity({
      action: 'issue_reported',
      entityType: 'user_report',
      entityId: `issue_${Date.now()}`,
      metadata: {
        issueType,
        description,
        context: {
          ...context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          sessionId: this.session?.sessionId
        }
      },
      userJourneyContext: {
        flow: 'troubleshooting',
        stage: 'notification'
      }
    });
  }

  // Convenience methods for common issue types
  reportBug(description: string, steps?: string[], expectedBehavior?: string) {
    this.trackIssueReport('bug_report', description, {
      steps,
      expectedBehavior,
      severity: 'medium'
    });
  }

  reportPerformanceIssue(description: string, pageLoadTime?: number, interactionDelay?: number) {
    this.trackIssueReport('performance_issue', description, {
      pageLoadTime,
      interactionDelay,
      connectionType: (navigator as any).connection?.effectiveType
    });
  }

  reportUIIssue(description: string, component?: string, action?: string) {
    this.trackIssueReport('ui_issue', description, {
      component,
      action,
      breakpoint: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
    });
  }

  reportAccessibilityIssue(description: string, element?: string, issue?: string) {
    this.trackIssueReport('accessibility_issue', description, {
      element,
      issue,
      screenReader: (window as any).speechSynthesis ? 'available' : 'unavailable'
    });
  }

  private trackActivity(event: ActivityEvent) {
    if (!this.isEnabled) return;

    // Add to batch queue
    this.batchQueue.push(event);

    // Send immediately for critical events
    if (event.action.includes('error') || event.action.includes('session_ended')) {
      this.sendBatch();
      return;
    }

    // Send when batch is full
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.sendBatch();
      return;
    }

    // Schedule batch send
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.batchTimeout = setTimeout(() => {
      this.sendBatch();
    }, this.BATCH_DELAY);
  }

  private async sendBatch() {
    if (this.batchQueue.length === 0) return;

    const events = [...this.batchQueue].map(event => ({
      ...event,
      userId: this.userId // Add userId to each event
    }));
    this.batchQueue = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/activity-logs/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        console.warn('Failed to send activity batch:', response.statusText);
      }
    } catch (error) {
      console.warn('Activity tracking error:', error);
      // Re-queue events for retry on network issues
      this.batchQueue.unshift(...events);
    }
  }

  private setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackActivity({
          action: 'page_hidden',
          entityType: 'page',
          entityId: window.location.pathname,
          metadata: { sessionId: this.session?.sessionId }
        });
      } else {
        this.trackActivity({
          action: 'page_visible',
          entityType: 'page',
          entityId: window.location.pathname,
          metadata: { sessionId: this.session?.sessionId }
        });
      }
    });

    // Track when user leaves page
    window.addEventListener('beforeunload', () => {
      if (this.batchQueue.length > 0) {
        // Add userId to events before sending
        const events = this.batchQueue.map(event => ({
          ...event,
          userId: this.userId
        }));
        // Send final batch synchronously
        navigator.sendBeacon('/api/activity-logs/batch', JSON.stringify({
          events
        }));
      }
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), `${event.filename}:${event.lineno}`);
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'unhandled_promise_rejection');
    });

    // Track performance issues
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'long-animation-frame' || entry.duration > 100) {
              this.trackActivity({
                action: 'performance_issue',
                entityType: 'performance',
                entityId: entry.name,
                metadata: {
                  duration: entry.duration,
                  type: entry.entryType,
                  sessionId: this.session?.sessionId
                },
                userJourneyContext: {
                  flow: 'troubleshooting',
                  stage: 'notification'
                }
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }

  private startHeartbeat() {
    // Send periodic heartbeat to track active sessions
    setInterval(() => {
      if (this.userId && this.session && !document.hidden) {
        this.trackActivity({
          action: 'session_heartbeat',
          entityType: 'session',
          entityId: this.session.sessionId,
          metadata: {
            duration: Date.now() - this.session.startTime.getTime(),
            pageViews: this.session.pageViews,
            interactions: this.session.interactions
          },
          userJourneyContext: {
            flow: 'daily_usage',
            stage: 'notification'
          }
        });
      }
    }, 30000); // Every 30 seconds
  }

  // Public methods for component usage
  disable() {
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
  }

  getSessionInfo() {
    return this.session;
  }
}

// Create global instance
export const activityTracker = new ActivityTracker();

// Export convenience functions
export const trackPageView = (path: string, title?: string) => activityTracker.trackPageView(path, title);
export const trackInteraction = (element: string, action: string, metadata?: Record<string, any>) => 
  activityTracker.trackInteraction(element, action, metadata);
export const trackError = (error: Error, context?: string) => activityTracker.trackError(error, context);
export const trackFeatureUsage = (feature: string, action: string, metadata?: Record<string, any>) => 
  activityTracker.trackFeatureUsage(feature, action, metadata);

// Issue reporting convenience functions
export const reportBug = (description: string, steps?: string[], expectedBehavior?: string) => 
  activityTracker.reportBug(description, steps, expectedBehavior);
export const reportPerformanceIssue = (description: string, pageLoadTime?: number, interactionDelay?: number) => 
  activityTracker.reportPerformanceIssue(description, pageLoadTime, interactionDelay);
export const reportUIIssue = (description: string, component?: string, action?: string) => 
  activityTracker.reportUIIssue(description, component, action);
export const reportAccessibilityIssue = (description: string, element?: string, issue?: string) => 
  activityTracker.reportAccessibilityIssue(description, element, issue);