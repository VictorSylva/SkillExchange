// Simple event-based service for triggering course refreshes across components
class CourseRefreshService {
  constructor() {
    this.listeners = [];
  }

  // Subscribe to course refresh events
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Trigger course refresh
  triggerRefresh() {
    console.log('Course refresh triggered');
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in course refresh callback:', error);
      }
    });
  }
}

// Export singleton instance
export const courseRefreshService = new CourseRefreshService();
