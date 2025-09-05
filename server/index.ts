import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ActivityLogger } from "./activityLogger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure express-session
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", async () => {
    const duration = Date.now() - start;
    const userId = (req as any).session?.user?.id;
    
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);

      // Log API calls as user activities (excluding auth endpoints to avoid loops)
      if (userId && !path.includes('/auth') && !path.includes('/activity-logs')) {
        try {
          await ActivityLogger.logActivity({
            userId,
            action: 'api_call',
            entityType: 'api',
            entityId: path,
            metadata: {
              method: req.method,
              statusCode: res.statusCode,
              duration,
              path,
              userAgent: req.get('User-Agent')
            },
            req,
            userJourneyContext: {
              flow: 'daily_usage',
              stage: 'notification'
            }
          });
        } catch (error) {
          // Silent fail for activity logging to not interrupt app flow
        }
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use(async (err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log comprehensive error information
    try {
      await ActivityLogger.logActivity({
        userId: (req as any).session?.user?.id,
        action: 'api_error',
        entityType: 'system',
        entityId: req.path,
        metadata: {
          statusCode: status,
          errorMessage: message,
          errorStack: err.stack,
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          body: req.body,
          query: req.query,
          params: req.params,
        },
        req,
        userJourneyContext: {
          flow: 'daily_usage',
          stage: 'notification'
        }
      });
    } catch (logError) {
      console.error('Failed to log error activity:', logError);
    }

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
