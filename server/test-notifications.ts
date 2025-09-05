import { storage } from './storage';

// Function to create sample notifications for testing
export async function createSampleNotifications(userId: string) {
  try {
    // Create sample notifications
    await storage.createNotification({
      userId,
      title: "Welcome to TalentFlowHub!",
      message: "Your account has been successfully set up. Explore the features and start managing your recruitment pipeline.",
      type: "success",
      isRead: false,
    });

    await storage.createNotification({
      userId,
      title: "New Application Received",
      message: "John Doe has applied for the Senior Developer position. Review the application in the Applications module.",
      type: "info",
      isRead: false,
    });

    await storage.createNotification({
      userId,
      title: "Interview Scheduled",
      message: "Interview with Sarah Johnson for Marketing Manager has been scheduled for tomorrow at 2:00 PM.",
      type: "info",
      isRead: false,
    });

    await storage.createNotification({
      userId,
      title: "System Maintenance",
      message: "Scheduled maintenance will occur this weekend from 2:00 AM to 4:00 AM. The system may be temporarily unavailable.",
      type: "warning",
      isRead: true,
    });

    console.log("✅ Sample notifications created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating sample notifications:", error);
    return false;
  }
}

// Function to create activity logs for testing
export async function createSampleActivityLogs(userId: string) {
  try {
    await storage.createActivityLog({
      userId,
      action: "login",
      resourceType: "user",
      resourceId: userId,
      resourceName: "User Login",
      description: "User logged into the system",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Chrome)",
      success: true,
    });

    await storage.createActivityLog({
      userId,
      action: "create",
      resourceType: "job",
      resourceId: "job-123",
      resourceName: "Senior Developer",
      description: "Created new job posting for Senior Developer",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Chrome)",
      success: true,
    });

    await storage.createActivityLog({
      userId,
      action: "email_sent",
      resourceType: "candidate",
      resourceId: "candidate-456",
      resourceName: "John Doe",
      description: "Sent welcome email to candidate John Doe",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Chrome)",
      success: true,
    });

    console.log("✅ Sample activity logs created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating sample activity logs:", error);
    return false;
  }
}