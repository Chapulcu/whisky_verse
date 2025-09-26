import { useState, useEffect, useCallback } from 'react'
import { Achievement, ACHIEVEMENT_DEFINITIONS, UserAchievements, AchievementRequirement } from '@/types/achievements'
import { useAuth } from '@/contexts/AuthContext'
import { usePushNotifications } from './usePushNotifications'
import { useHapticFeedback } from './useHapticFeedback'
import toast from 'react-hot-toast'

interface UserProgress {
  whiskies_added: number
  photos_taken: number
  shares_made: number
  locations_visited: number
  ratings_made: number
  account_created: number
  daily_login: number
  current_streak: number
  last_login: Date | null
}

export function useAchievements() {
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
    last_login: null
  })

  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [level, setLevel] = useState(1)

  // Load user progress and achievements from localStorage
  useEffect(() => {
    if (!user) return

    const savedProgress = localStorage.getItem(`user-progress-${user.id}`)
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress)
        setUserProgress(progress)
      } catch (error) {
        console.error('Failed to load user progress:', error)
      }
    } else {
      // Initialize with account created achievement
      const initialProgress = {
        ...userProgress,
        account_created: 1
      }
      setUserProgress(initialProgress)
      localStorage.setItem(`user-progress-${user.id}`, JSON.stringify(initialProgress))
    }

    const savedAchievements = localStorage.getItem(`user-achievements-${user.id}`)
    if (savedAchievements) {
      try {
        const achievements = JSON.parse(savedAchievements)
        setUnlockedAchievements(achievements)
        const points = achievements.reduce((sum: number, ach: Achievement) => sum + ach.points, 0)
        setTotalPoints(points)
        setLevel(calculateLevel(points))
      } catch (error) {
        console.error('Failed to load user achievements:', error)
      }
    }
  }, [user])

  // Save progress and achievements when they change
  const saveProgress = useCallback((progress: UserProgress) => {
    if (!user) return

    setUserProgress(progress)
    localStorage.setItem(`user-progress-${user.id}`, JSON.stringify(progress))
  }, [user])

  const saveAchievements = useCallback((achievements: Achievement[]) => {
    if (!user) return

    setUnlockedAchievements(achievements)
    localStorage.setItem(`user-achievements-${user.id}`, JSON.stringify(achievements))

    const points = achievements.reduce((sum, ach) => sum + ach.points, 0)
    setTotalPoints(points)
    setLevel(calculateLevel(points))
  }, [user])

  // Calculate user level based on points
  const calculateLevel = (points: number): number => {
    if (points < 100) return 1
    if (points < 300) return 2
    if (points < 600) return 3
    if (points < 1000) return 4
    if (points < 1500) return 5
    if (points < 2500) return 6
    if (points < 4000) return 7
    if (points < 6000) return 8
    if (points < 9000) return 9
    return 10
  }

  // Get points required for next level
  const getNextLevelPoints = (): number => {
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000]
    return levelThresholds[level] || 15000
  }

  // Check if achievement requirement is met
  const checkRequirement = (requirement: AchievementRequirement, progress: UserProgress): boolean => {
    const value = progress[requirement.condition as keyof UserProgress]

    if (typeof value === 'number') {
      return value >= requirement.target
    }

    return false
  }

  // Check for newly unlocked achievements
  const checkAchievements = useCallback((progress: UserProgress) => {
    if (!user) return

    const newlyUnlocked: Achievement[] = []

    ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
      // Skip if already unlocked
      const alreadyUnlocked = unlockedAchievements.some((ach) => ach.id === achievement.id)
      if (alreadyUnlocked) return

      // Check if requirement is met
      if (checkRequirement(achievement.requirement, progress)) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date()
        }
        newlyUnlocked.push(unlockedAchievement)
      }
    })

    // Add newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newlyUnlocked]
      saveAchievements(updatedAchievements)

      // Show notifications and celebrations for each new achievement
      newlyUnlocked.forEach((achievement) => {
        showAchievementUnlocked(achievement)
      })
    }
  }, [user, unlockedAchievements, saveAchievements])

  // Show achievement unlocked celebration
  const showAchievementUnlocked = (achievement: Achievement) => {
    // Haptic feedback
    hapticCelebration()

    // Toast notification
    toast.success(
      `🎉 Başarım Kazanıldı!\n${achievement.icon} ${achievement.title}\n+${achievement.points} puan`,
      {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: '600'
        }
      }
    )

    // Push notification if supported
    showNotification({
      title: `🎉 Yeni Başarım: ${achievement.title}`,
      body: `${achievement.description} (+${achievement.points} puan)`,
      tag: `achievement-${achievement.id}`,
      data: { type: 'achievement', achievementId: achievement.id },
      vibrate: [200, 100, 200, 100, 200]
    })
  }

  // Progress tracking functions
  const addWhisky = useCallback(() => {
    const newProgress = {
      ...userProgress,
      whiskies_added: userProgress.whiskies_added + 1
    }
    saveProgress(newProgress)
    checkAchievements(newProgress)
  }, [userProgress, saveProgress, checkAchievements])

  const takePhoto = useCallback(() => {
    const newProgress = {
      ...userProgress,
      photos_taken: userProgress.photos_taken + 1
    }
    saveProgress(newProgress)
    checkAchievements(newProgress)
  }, [userProgress, saveProgress, checkAchievements])

  const makeShare = useCallback(() => {
    const newProgress = {
      ...userProgress,
      shares_made: userProgress.shares_made + 1
    }
    saveProgress(newProgress)
    checkAchievements(newProgress)
  }, [userProgress, saveProgress, checkAchievements])

  const visitLocation = useCallback(() => {
    const newProgress = {
      ...userProgress,
      locations_visited: userProgress.locations_visited + 1
    }
    saveProgress(newProgress)
    checkAchievements(newProgress)
  }, [userProgress, saveProgress, checkAchievements])

  const makeRating = useCallback(() => {
    const newProgress = {
      ...userProgress,
      ratings_made: userProgress.ratings_made + 1
    }
    saveProgress(newProgress)
    checkAchievements(newProgress)
  }, [userProgress, saveProgress, checkAchievements])

  const recordLogin = useCallback(() => {
    const today = new Date()
    const todayStr = today.toDateString()
    const lastLoginStr = userProgress.last_login ? new Date(userProgress.last_login).toDateString() : null

    if (lastLoginStr !== todayStr) {
      // Calculate streak
      let newStreak = 1
      if (lastLoginStr) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()

        if (lastLoginStr === yesterdayStr) {
          newStreak = userProgress.current_streak + 1
        }
      }

      const newProgress = {
        ...userProgress,
        daily_login: userProgress.daily_login + 1,
        current_streak: newStreak,
        last_login: today
      }

      saveProgress(newProgress)
      checkAchievements(newProgress)
    }
  }, [userProgress, saveProgress, checkAchievements])

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

  return {
    // User data
    userProgress,
    unlockedAchievements,
    totalPoints,
    level,
    nextLevelPoints: getNextLevelPoints(),

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

    // Data
    allAchievements: ACHIEVEMENT_DEFINITIONS
  }
}