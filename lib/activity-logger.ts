// Utility to log activities from the main agent
// Usage: Import and call logActivity() from anywhere

interface ActivityData {
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export async function logActivity(data: ActivityData): Promise<void> {
  try {
    const res = await fetch('http://localhost:3010/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.error('Failed to log activity:', await res.text());
    }
  } catch (error) {
    // Silently fail - don't break the main flow
    console.error('Error logging activity:', error);
  }
}

// Pre-defined activity types for consistency
export const ActivityTypes = {
  EMAIL: 'email',
  CALENDAR: 'calendar',
  SEARCH: 'search',
  TASK: 'task',
  COMMAND: 'command',
  DOCUMENT: 'document',
  INFO: 'info',
} as const;
