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
    if (!progressData.completedLessons) return 0;
    
    // This is a simplified calculation - in a real app, you'd need the course structure
    // For now, we'll assume each lesson is worth equal weight
    const totalLessons = progressData.totalLessons || 1;
    const completedCount = progressData.completedLessons.length;
    return Math.round((completedCount / totalLessons) * 100);
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
