export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: AchievementRarity
  points: number
  requirement: AchievementRequirement
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

export type AchievementCategory =
  | 'collection'
  | 'social'
  | 'exploration'
  | 'expertise'
  | 'photography'
  | 'milestone'

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'

export interface AchievementRequirement {
  type: 'count' | 'visit' | 'share' | 'photo' | 'rating' | 'streak'
  target: number
  condition?: string
}

export interface UserAchievements {
  userId: string
  achievements: Achievement[]
  totalPoints: number
  level: number
  nextLevelPoints: number
}

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Collection Achievements
  {
    id: 'first_whisky',
    title: 'İlk Viski',
    description: 'Koleksiyonuna ilk viskini ekle',
    icon: '🥃',
    category: 'collection',
    rarity: 'common',
    points: 10,
    requirement: { type: 'count', target: 1, condition: 'whiskies_added' }
  },
  {
    id: 'whisky_collector_5',
    title: 'Viski Koleksiyoncusu',
    description: '5 viski koleksiyonuna ekle',
    icon: '📚',
    category: 'collection',
    rarity: 'common',
    points: 50,
    requirement: { type: 'count', target: 5, condition: 'whiskies_added' }
  },
  {
    id: 'whisky_collector_25',
    title: 'Viski Uzmanı',
    description: '25 viski koleksiyonuna ekle',
    icon: '🎓',
    category: 'collection',
    rarity: 'uncommon',
    points: 200,
    requirement: { type: 'count', target: 25, condition: 'whiskies_added' }
  },
  {
    id: 'whisky_collector_50',
    title: 'Viski Meraklısı',
    description: '50 viski koleksiyonuna ekle',
    icon: '🏆',
    category: 'collection',
    rarity: 'rare',
    points: 500,
    requirement: { type: 'count', target: 50, condition: 'whiskies_added' }
  },
  {
    id: 'whisky_collector_100',
    title: 'Viski Efendisi',
    description: '100 viski koleksiyonuna ekle',
    icon: '👑',
    category: 'collection',
    rarity: 'epic',
    points: 1000,
    requirement: { type: 'count', target: 100, condition: 'whiskies_added' }
  },

  // Photography Achievements
  {
    id: 'first_photo',
    title: 'İlk Fotoğraf',
    description: 'Kamera ile ilk viski fotoğrafını çek',
    icon: '📸',
    category: 'photography',
    rarity: 'common',
    points: 20,
    requirement: { type: 'count', target: 1, condition: 'photos_taken' }
  },
  {
    id: 'photographer',
    title: 'Fotoğrafçı',
    description: '10 viski fotoğrafı çek',
    icon: '📷',
    category: 'photography',
    rarity: 'uncommon',
    points: 100,
    requirement: { type: 'count', target: 10, condition: 'photos_taken' }
  },

  // Social Achievements
  {
    id: 'first_share',
    title: 'İlk Paylaşım',
    description: 'İlk koleksiyonunu sosyal medyada paylaş',
    icon: '📤',
    category: 'social',
    rarity: 'common',
    points: 25,
    requirement: { type: 'count', target: 1, condition: 'shares_made' }
  },
  {
    id: 'social_butterfly',
    title: 'Sosyal Kelebek',
    description: '5 kez paylaşım yap',
    icon: '🦋',
    category: 'social',
    rarity: 'uncommon',
    points: 100,
    requirement: { type: 'count', target: 5, condition: 'shares_made' }
  },

  // Exploration Achievements
  {
    id: 'first_location',
    title: 'Keşifci',
    description: 'İlk viski mekanını keşfet',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'common',
    points: 30,
    requirement: { type: 'visit', target: 1, condition: 'locations_visited' }
  },
  {
    id: 'location_hunter',
    title: 'Mekan Avcısı',
    description: '5 farklı viski mekanını ziyaret et',
    icon: '🎯',
    category: 'exploration',
    rarity: 'uncommon',
    points: 150,
    requirement: { type: 'visit', target: 5, condition: 'locations_visited' }
  },

  // Expertise Achievements
  {
    id: 'first_rating',
    title: 'Eleştirmen',
    description: 'İlk viski değerlendirmeni yap',
    icon: '⭐',
    category: 'expertise',
    rarity: 'common',
    points: 15,
    requirement: { type: 'rating', target: 1, condition: 'ratings_made' }
  },
  {
    id: 'expert_reviewer',
    title: 'Uzman Eleştirmen',
    description: '20 viski değerlendirmesi yap',
    icon: '🎖️',
    category: 'expertise',
    rarity: 'rare',
    points: 300,
    requirement: { type: 'rating', target: 20, condition: 'ratings_made' }
  },

  // Milestone Achievements
  {
    id: 'welcome',
    title: 'Hoş Geldin!',
    description: 'WhiskyVerse\'e katıldığın için teşekkürler',
    icon: '🎉',
    category: 'milestone',
    rarity: 'common',
    points: 5,
    requirement: { type: 'count', target: 1, condition: 'account_created' }
  },
  {
    id: 'one_week',
    title: 'Sadık Kullanıcı',
    description: '7 gün boyunca aktif kalma',
    icon: '🔥',
    category: 'milestone',
    rarity: 'uncommon',
    points: 75,
    requirement: { type: 'streak', target: 7, condition: 'daily_login' }
  },
  {
    id: 'one_month',
    title: 'Viski Tutkunu',
    description: '30 gün boyunca aktif kalma',
    icon: '💎',
    category: 'milestone',
    rarity: 'rare',
    points: 400,
    requirement: { type: 'streak', target: 30, condition: 'daily_login' }
  }
]