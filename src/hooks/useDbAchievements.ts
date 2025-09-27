import { useState, useEffect, useCallback } from 'react'
import { Achievement, ACHIEVEMENT_DEFINITIONS, AchievementRequirement } from '@/types/achievements'
import { useAuth } from '@/contexts/AuthContext'
import { usePushNotifications } from './usePushNotifications'
import { useHapticFeedback } from './useHapticFeedback'
import { supabase } from '@/lib/supabase'

interface UserProgress {
  whiskies_added: number
  photos_taken: number
  shares_made: number
  locations_visited: number
  ratings_made: number
  account_created: number
  daily_login: number
  current_streak: number
  max_streak: number
  last_login: Date | null
}

interface UserStatistics {
  user_id: string
  total_achievements: number
  total_points: number
  level: number
  next_level_points: number
}

export function useDbAchievements() {
  const { user } = useAuth()
  const { showNotification } = usePushNotifications()
  const { hapticCelebration, hapticSuccess } = useHapticFeedback()

  const [userProgress, setUserProgress] = useState<UserProgress>({
    whiskies_added: 0,
    photos_taken: 0,
    shares_made: 0,
    locations_visited: 0,
    ratings_made: 0,
    account_created: 0,
    daily_login: 0,
    current_streak: 0,
    max_streak: 0,
    last_login: null
  })

  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStatistics>({
    user_id: '',
    total_achievements: 0,
    total_points: 0,
    level: 1,
    next_level_points: 100
  })

  const [isLoading, setIsLoading] = useState(false)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [showAchievementModal, setShowAchievementModal] = useState(false)

  // Load user progress and achievements from database
  const loadUserData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading user progress:', progressError)
      } else if (progressData) {
        setUserProgress({
          ...progressData,
          last_login: progressData.last_login ? new Date(progressData.last_login) : null
        })
      }

      // Load user achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })

      if (achievementsError) {
        console.error('Error loading user achievements:', achievementsError)
      } else if (achievementsData) {
        const achievements = achievementsData.map(ach => ({
          id: ach.achievement_id,
          title: ach.achievement_title,
          description: ach.achievement_description,
          icon: ach.achievement_icon,
          category: ach.achievement_category,
          rarity: ach.achievement_rarity,
          points: ach.points,
          requirement: ACHIEVEMENT_DEFINITIONS.find(def => def.id === ach.achievement_id)?.requirement || { type: 'count', target: 1 },
          unlockedAt: new Date(ach.unlocked_at)
        })) as Achievement[]

        setUnlockedAchievements(achievements)
      }

      // Load user statistics
      const { data: statsData, error: statsError } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error loading user statistics:', statsError)
      } else if (statsData) {
        setUserStats(statsData)
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Initialize user data on component mount
  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  // Record daily login
  const recordLogin = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('record_daily_login', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error recording daily login:', error)
        return
      }

      // Reload user data to get updated stats
      await loadUserData()

      return data // New streak value
    } catch (error) {
      console.error('Error recording daily login:', error)
    }
  }, [user, loadUserData])

  // Check if achievement requirement is met
  const checkRequirement = (requirement: AchievementRequirement, progress: UserProgress): boolean => {
    const value = progress[requirement.condition as keyof UserProgress]

    if (typeof value === 'number') {
      return value >= requirement.target
    }

    return false
  }

  // Check for newly unlocked achievements
  const checkAchievements = useCallback(async () => {
    if (!user) return

    const newlyUnlocked: Achievement[] = []

    ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
      // Skip if already unlocked
      const alreadyUnlocked = unlockedAchievements.some((ach) => ach.id === achievement.id)
      if (alreadyUnlocked) return

      // Check if requirement is met
      if (checkRequirement(achievement.requirement, userProgress)) {
        newlyUnlocked.push(achievement)
      }
    })

    // Add newly unlocked achievements to database
    for (const achievement of newlyUnlocked) {
      try {
        const { data, error } = await supabase.rpc('add_achievement', {
          p_user_id: user.id,
          p_achievement_id: achievement.id,
          p_title: achievement.title,
          p_description: achievement.description,
          p_icon: achievement.icon,
          p_category: achievement.category,
          p_rarity: achievement.rarity,
          p_points: achievement.points
        })

        if (error) {
          console.error('Error adding achievement:', error)
          continue
        }

        if (data) { // Achievement was actually added (not duplicate)
          // Add to local state immediately to prevent duplicate checks
          setUnlockedAchievements(prev => [...prev, achievement])
          showAchievementUnlocked(achievement)
        }
      } catch (error) {
        console.error('Error adding achievement:', error)
      }
    }

    if (newlyUnlocked.length > 0) {
      // Reload user data to get updated achievements and stats
      await loadUserData()
    }
  }, [user, unlockedAchievements, userProgress, loadUserData])

  // Update user activity
  const updateActivity = useCallback(async (activityType: string, increment: number = 1) => {
    if (!user) return

    try {
      const { error } = await supabase.rpc('update_user_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_increment: increment
      })

      if (error) {
        console.error('Error updating user activity:', error)
        return
      }

      // Reload user data and check for new achievements
      await loadUserData()
      await checkAchievements()

    } catch (error) {
      console.error('Error updating user activity:', error)
    }
  }, [user, loadUserData, checkAchievements])

  // Show achievement unlocked celebration
  const showAchievementUnlocked = (achievement: Achievement) => {
    // Haptic feedback
    hapticCelebration()

    // Show glassmorphism modal instead of toast
    setNewAchievement(achievement)
    setShowAchievementModal(true)

    // Push notification if supported
    showNotification({
      title: `🎉 Yeni Başarım: ${achievement.title}`,
      body: `${achievement.description} (+${achievement.points} puan)`,
      tag: `achievement-${achievement.id}`,
      data: { type: 'achievement', achievementId: achievement.id },
      vibrate: [200, 100, 200, 100, 200]
    })
  }

  // Close achievement modal
  const closeAchievementModal = () => {
    setShowAchievementModal(false)
    setNewAchievement(null)
  }

  // Activity tracking functions
  const addWhisky = useCallback(() => {
    updateActivity('whisky_added')
  }, [updateActivity])

  const takePhoto = useCallback(() => {
    updateActivity('photo_taken')
  }, [updateActivity])

  const makeShare = useCallback(() => {
    updateActivity('share_made')
  }, [updateActivity])

  const visitLocation = useCallback(() => {
    updateActivity('location_visited')
  }, [updateActivity])

  const makeRating = useCallback(() => {
    updateActivity('rating_made')
  }, [updateActivity])

  // Get achievement progress for display
  const getAchievementProgress = (achievementId: string): { current: number; max: number; percentage: number } => {
    const achievement = ACHIEVEMENT_DEFINITIONS.find(ach => ach.id === achievementId)
    if (!achievement) return { current: 0, max: 1, percentage: 0 }

    const current = Math.min(
      userProgress[achievement.requirement.condition as keyof UserProgress] as number || 0,
      achievement.requirement.target
    )

    const max = achievement.requirement.target
    const percentage = (current / max) * 100

    return { current, max, percentage }
  }

  // Get achievements by category
  const getAchievementsByCategory = (category: string) => {
    return ACHIEVEMENT_DEFINITIONS.filter(ach => ach.category === category)
  }

  // Get unlocked achievements by rarity
  const getUnlockedByRarity = (rarity: string) => {
    return unlockedAchievements.filter(ach => ach.rarity === rarity)
  }

  // Get leaderboard
  const getLeaderboard = useCallback(async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('achievement_leaderboard')
        .select('*')
        .limit(limit)

      if (error) {
        console.error('Error loading leaderboard:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      return []
    }
  }, [])

  return {
    // User data
    userProgress,
    unlockedAchievements,
    totalPoints: userStats.total_points,
    level: userStats.level,
    nextLevelPoints: userStats.next_level_points,
    totalAchievements: userStats.total_achievements,
    isLoading,

    // Progress tracking
    addWhisky,
    takePhoto,
    makeShare,
    visitLocation,
    makeRating,
    recordLogin,

    // Utility functions
    getAchievementProgress,
    getAchievementsByCategory,
    getUnlockedByRarity,
    checkAchievements,
    getLeaderboard,
    loadUserData,

    // Data
    allAchievements: ACHIEVEMENT_DEFINITIONS,

    // Modal state
    newAchievement,
    showAchievementModal,
    closeAchievementModal
  }
}
