import { supabase } from '@/lib/supabase'
import { ACHIEVEMENT_DEFINITIONS } from '@/types/achievements'
import toast from 'react-hot-toast'

interface LocalStorageProgress {
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

interface LocalStorageAchievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  rarity: string
  points: number
  unlockedAt: Date
}

export async function migrateLocalStorageData(userId: string): Promise<{
  success: boolean
  progressMigrated: boolean
  achievementsMigrated: number
  error?: string
}> {
  try {
    console.log('🔄 Starting LocalStorage to Database migration for user:', userId)

    let progressMigrated = false
    let achievementsMigrated = 0

    // 1. Migrate progress data
    const progressKey = `user-progress-${userId}`
    const savedProgress = localStorage.getItem(progressKey)

    if (savedProgress) {
      try {
        const progress: LocalStorageProgress = JSON.parse(savedProgress)
        console.log('📊 Found LocalStorage progress data:', progress)

        // Insert or update progress data
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: userId,
            whiskies_added: progress.whiskies_added || 0,
            photos_taken: progress.photos_taken || 0,
            shares_made: progress.shares_made || 0,
            locations_visited: progress.locations_visited || 0,
            ratings_made: progress.ratings_made || 0,
            account_created: progress.account_created || 1,
            daily_login: progress.daily_login || 0,
            current_streak: progress.current_streak || 0,
            max_streak: progress.current_streak || 0, // Use current as max initially
            last_login: progress.last_login ? new Date(progress.last_login).toISOString() : null,
            updated_at: new Date().toISOString()
          })

        if (progressError) {
          console.error('❌ Error migrating progress:', progressError)
          throw progressError
        }

        progressMigrated = true
        console.log('✅ Progress data migrated successfully')

      } catch (error) {
        console.error('❌ Error parsing progress data:', error)
      }
    } else {
      console.log('📊 No LocalStorage progress data found, initializing default progress')

      // Initialize default progress
      const { error: initError } = await supabase.rpc('initialize_user_progress', {
        p_user_id: userId
      })

      if (initError) {
        console.error('❌ Error initializing progress:', initError)
      } else {
        progressMigrated = true
      }
    }

    // 2. Migrate achievements data
    const achievementsKey = `user-achievements-${userId}`
    const savedAchievements = localStorage.getItem(achievementsKey)

    if (savedAchievements) {
      try {
        const achievements: LocalStorageAchievement[] = JSON.parse(savedAchievements)
        console.log('🏆 Found LocalStorage achievements:', achievements.length, 'achievements')

        for (const achievement of achievements) {
          // Find achievement definition to get complete data
          const definition = ACHIEVEMENT_DEFINITIONS.find(def => def.id === achievement.id)

          if (!definition) {
            console.warn('⚠️ Achievement definition not found for:', achievement.id)
            continue
          }

          // Add achievement to database
          const { data, error } = await supabase.rpc('add_achievement', {
            p_user_id: userId,
            p_achievement_id: achievement.id,
            p_title: achievement.title || definition.title,
            p_description: achievement.description || definition.description,
            p_icon: achievement.icon || definition.icon,
            p_category: achievement.category || definition.category,
            p_rarity: achievement.rarity || definition.rarity,
            p_points: achievement.points || definition.points
          })

          if (error) {
            console.error(`❌ Error migrating achievement ${achievement.id}:`, error)
          } else if (data) {
            // Achievement was successfully added (not duplicate)
            achievementsMigrated++
            console.log(`✅ Migrated achievement: ${achievement.title}`)
          } else {
            // Achievement already exists, which is fine
            console.log(`ℹ️ Achievement already exists: ${achievement.title}`)
          }
        }

        console.log(`✅ ${achievementsMigrated} achievements migrated successfully`)

      } catch (error) {
        console.error('❌ Error parsing achievements data:', error)
      }
    } else {
      console.log('🏆 No LocalStorage achievements data found')
    }

    // 3. Clean up LocalStorage after successful migration
    if (progressMigrated || achievementsMigrated > 0) {
      try {
        localStorage.removeItem(progressKey)
        localStorage.removeItem(achievementsKey)
        console.log('🧹 LocalStorage cleaned up successfully')
      } catch (error) {
        console.warn('⚠️ Error cleaning up LocalStorage:', error)
      }
    }

    const result = {
      success: true,
      progressMigrated,
      achievementsMigrated
    }

    console.log('🎉 Migration completed successfully:', result)
    return result

  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      progressMigrated: false,
      achievementsMigrated: 0,
      error: error.message || 'Unknown error'
    }
  }
}

export function hasLocalStorageData(userId: string): boolean {
  const progressKey = `user-progress-${userId}`
  const achievementsKey = `user-achievements-${userId}`

  return !!(localStorage.getItem(progressKey) || localStorage.getItem(achievementsKey))
}

// Migration prompt will be handled by React component
// This function is kept for backwards compatibility
export async function showMigrationPrompt(userId: string): Promise<boolean> {
  if (!hasLocalStorageData(userId)) {
    return false
  }

  // This will be handled by the MigrationModal component
  // Return false to prevent the old confirm dialog
  return false
}

export async function autoMigrateWithToast(userId: string): Promise<void> {
  const shouldMigrate = await showMigrationPrompt(userId)

  if (!shouldMigrate) {
    return
  }

  // Show loading toast
  const loadingToast = toast.loading('🔄 Başarımlar veritabanına taşınıyor...', {
    duration: 0, // Don't auto-dismiss
  })

  try {
    const result = await migrateLocalStorageData(userId)

    toast.dismiss(loadingToast)

    if (result.success) {
      let message = '🎉 Başarımlar başarıyla taşındı!\n\n'

      if (result.progressMigrated) {
        message += '✅ Aktivite verileri taşındı\n'
      }

      if (result.achievementsMigrated > 0) {
        message += `✅ ${result.achievementsMigrated} başarım taşındı\n`
      }

      message += '\nArtık tüm cihazlarınızda aynı başarımları görebileceksiniz!'

      toast.success(message, {
        duration: 8000,
        style: {
          maxWidth: '400px'
        }
      })
    } else {
      toast.error(`❌ Taşıma işlemi başarısız: ${result.error}`, {
        duration: 8000
      })
    }
  } catch (error: any) {
    toast.dismiss(loadingToast)
    toast.error(`❌ Taşıma işlemi başarısız: ${error.message}`, {
      duration: 8000
    })
  }
}

// Utility to check if user needs migration on app start
export function checkMigrationOnAppStart(userId: string | null): boolean {
  if (!userId) return false

  // Check if user has both LocalStorage data and no recent database activity
  const hasLocal = hasLocalStorageData(userId)
  const migrationDone = localStorage.getItem(`migration-done-${userId}`)

  return hasLocal && !migrationDone
}

export function markMigrationDone(userId: string): void {
  localStorage.setItem(`migration-done-${userId}`, 'true')
}