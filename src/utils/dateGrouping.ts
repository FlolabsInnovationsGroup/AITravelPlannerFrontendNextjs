/**
 * Date Grouping Utilities for Chat History
 * Provides ChatGPT-style date grouping: Today, Yesterday, Last 7 Days, etc.
 */

export type DateGroup = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Older';

export interface GroupedSessions<T> {
  group: DateGroup;
  sessions: T[];
}

/**
 * Determines which date group a given date belongs to
 */
export const getDateGroup = (date: Date | string): DateGroup => {
  const sessionDate = new Date(date);
  const now = new Date();
  
  // Reset time to midnight for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  
  const diffTime = today.getTime() - sessionDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 Days';
  if (diffDays <= 30) return 'Last 30 Days';
  return 'Older';
};

/**
 * Groups sessions by date categories (Today, Yesterday, etc.)
 */
export const groupSessionsByDate = <T extends { createdAt?: Date | string }>(
  sessions: T[]
): GroupedSessions<T>[] => {
  const groups: Record<DateGroup, T[]> = {
    'Today': [],
    'Yesterday': [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    'Older': []
  };
  
  // Group sessions
  sessions.forEach(session => {
    if (session.createdAt) {
      const group = getDateGroup(session.createdAt);
      groups[group].push(session);
    }
  });
  
  // Convert to array format, preserving order
  const orderedGroups: DateGroup[] = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older'];
  
  return orderedGroups
    .filter(group => groups[group].length > 0)
    .map(group => ({
      group,
      sessions: groups[group]
    }));
};

/**
 * Formats a date for display (e.g., "2 hours ago", "Yesterday at 3:45 PM")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const sessionDate = new Date(date);
  const now = new Date();
  
  const diffMs = now.getTime() - sessionDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Less than 1 hour ago
  if (diffMins < 60) {
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    return `${diffMins} minutes ago`;
  }
  
  // Less than 24 hours ago
  if (diffHours < 24) {
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }
  
  // Yesterday
  if (diffDays === 1) {
    const time = sessionDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `Yesterday at ${time}`;
  }
  
  // Less than 7 days ago
  if (diffDays < 7) {
    const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
    const time = sessionDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dayName} at ${time}`;
  }
  
  // Less than 30 days ago
  if (diffDays < 30) {
    return sessionDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Older - show full date
  return sessionDate.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
};

/**
 * Sorts sessions by date (newest first)
 */
export const sortSessionsByDate = <T extends { createdAt?: Date | string }>(
  sessions: T[]
): T[] => {
  return [...sessions].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return dateB - dateA; // Newest first
  });
};
