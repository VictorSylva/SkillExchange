import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllUserProgress } from '../firebase/services';

export const useProgress = () => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await getAllUserProgress(currentUser.uid);
        
        if (result.success) {
          // Convert array to object keyed by courseId for easy lookup
          const progressMap = {};
          result.data.forEach(progressItem => {
            progressMap[progressItem.courseId] = {
              ...progressItem,
              percentage: calculateProgressPercentage(progressItem),
              isCompleted: progressItem.completedLessons?.length >= getTotalLessons(progressItem)
            };
          });
          
          setProgress(progressMap);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [currentUser]);

  const calculateProgressPercentage = (progressData) => {
    if (!progressData.completedLessons || progressData.completedLessons.length === 0) return 0;
    
    const completedCount = progressData.completedLessons.length;
    const totalLessons = progressData.totalLessons;
    
    // If totalLessons is not set or is 0, we can't calculate percentage accurately
    // In this case, we'll return 0 to avoid showing incorrect percentages like 200%
    if (!totalLessons || totalLessons <= 0) {
      console.warn('Progress calculation: totalLessons is missing or invalid for course:', progressData.courseId);
      return 0;
    }
    
    // Cap the percentage at 100% to prevent showing more than 100%
    const percentage = Math.round((completedCount / totalLessons) * 100);
    return Math.min(percentage, 100);
  };

  const getTotalLessons = (progressData) => {
    // This would need to be calculated based on the actual course structure
    // For now, return a default value
    return progressData.totalLessons || 1;
  };

  const getCourseProgress = (courseId) => {
    return progress[courseId] || null;
  };

  const refreshProgress = async () => {
    if (!currentUser) return;
    
    try {
      const result = await getAllUserProgress(currentUser.uid);
      
      if (result.success) {
        const progressMap = {};
        result.data.forEach(progressItem => {
          progressMap[progressItem.courseId] = {
            ...progressItem,
            percentage: calculateProgressPercentage(progressItem),
            isCompleted: progressItem.completedLessons?.length >= getTotalLessons(progressItem)
          };
        });
        
        setProgress(progressMap);
      }
    } catch (err) {
      console.error('Error refreshing progress:', err);
    }
  };

  return {
    progress,
    loading,
    error,
    getCourseProgress,
    refreshProgress
  };
};
