/**
 * TypeScript type definitions for WhiskyVerse Recommendation System
 * Generated from OpenAPI specification
 * Date: 2025-09-26
 */

// Core recommendation types
export interface Recommendation {
  id: string;
  whisky_id: string;
  score: number; // 0-1 confidence score
  reason: RecommendationReason;
  position: number;
  algorithm_type: AlgorithmType;
  whisky_details: WhiskyDetails;
  generated_at: string;
}

export interface RecommendationReason {
  primary_factor: 'similar_taste' | 'user_rating_pattern' | 'popular_choice' | 'region_preference';
  explanation: string;
  similarity_score?: number;
}

export type AlgorithmType = 'content_based' | 'collaborative' | 'hybrid' | 'popularity';

export interface RecommendationMetadata {
  total_count: number;
  algorithm_mix: {
    content_based: number;
    collaborative: number;
    hybrid: number;
    popularity: number;
  };
  last_updated: string;
  next_update: string;
}

// Whisky details for recommendations
export interface WhiskyDetails {
  id: string;
  name: string;
  brand: string;
  age: number | null;
  region: string;
  abv: number;
  taste_profile: TasteProfile;
  image_url?: string;
  price_category: PriceCategory;
}

export interface TasteProfile {
  sweetness: number; // 1-10
  smokiness: number; // 1-10
  fruitiness: number; // 1-10
  spiciness: number; // 1-10
}

export type PriceCategory = 'budget' | 'mid_range' | 'premium' | 'luxury';

// User preferences
export interface UserPreferences {
  id: string;
  taste_preferences: UserTastePreferences;
  preferred_regions: string[];
  experience_level: ExperienceLevel;
  price_range: PriceRange;
  preferred_age_range: AgeRange;
  updated_at: string;
}

export interface UserTastePreferences {
  sweetness_preference: number; // 1-10
  smokiness_preference: number; // 1-10
  complexity_preference: number; // 1-10
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';

export interface PriceRange {
  min_price: number;
  max_price: number;
}

export interface AgeRange {
  min_age: number;
  max_age: number;
}

// Feedback types
export interface RecommendationFeedbackRequest {
  feedback_type: FeedbackType;
  engagement_duration?: number;
  purchase_link_clicked?: boolean;
  added_to_favorites?: boolean;
  feedback_text?: string;
}

export type FeedbackType = 'like' | 'dislike' | 'already_tried' | 'not_interested' | 'purchased';

export interface RecommendationFeedbackResponse {
  id: string;
  feedback_type: FeedbackType;
  processed_at: string;
  impact_on_future_recommendations: string;
}

// Purchase links
export interface PurchaseLink {
  platform_name: string;
  platform_type: 'local' | 'international';
  product_url: string;
  current_price: number;
  currency: string;
  availability_status: 'available' | 'out_of_stock' | 'discontinued';
  last_checked: string;
}

export interface PurchaseLinksResponse {
  whisky_id: string;
  purchase_links: PurchaseLink[];
}

// Analytics types
export interface AnalyticsMetric {
  metric_name: string;
  metric_value: number;
  metric_type: string;
  time_period: string;
}

export interface AnalyticsSummary {
  total_recommendations: number;
  avg_engagement_rate: number;
  avg_satisfaction_score: number;
}

export interface AnalyticsResponse {
  metrics: AnalyticsMetric[];
  summary: AnalyticsSummary;
}

// API response types
export interface RecommendationsResponse {
  recommendations: Recommendation[];
  metadata: RecommendationMetadata;
}

// Error handling
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Service interfaces
export interface RecommendationService {
  getRecommendations(params: GetRecommendationsParams): Promise<RecommendationsResponse>;
  submitFeedback(recommendationId: string, feedback: RecommendationFeedbackRequest): Promise<RecommendationFeedbackResponse>;
}

export interface UserPreferencesService {
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}

export interface PurchaseLinkService {
  getPurchaseLinks(whiskyId: string, region?: 'local' | 'international' | 'all'): Promise<PurchaseLinksResponse>;
}

export interface AnalyticsService {
  getAnalytics(params: GetAnalyticsParams): Promise<AnalyticsResponse>;
}

// API parameter types
export interface GetRecommendationsParams {
  limit?: number;
  min_price?: number;
  max_price?: number;
  refresh?: boolean;
}

export interface GetAnalyticsParams {
  metric_type?: 'engagement' | 'feedback' | 'conversion' | 'all';
  period?: 'day' | 'week' | 'month' | 'quarter';
}

// Hook return types for React
export interface UseRecommendationsReturn {
  recommendations: Recommendation[];
  metadata: RecommendationMetadata | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  submitFeedback: (recommendationId: string, feedback: RecommendationFeedbackRequest) => Promise<void>;
}

export interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: ApiError | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  hasPreferences: boolean;
}

export interface UsePurchaseLinksReturn {
  links: PurchaseLink[];
  loading: boolean;
  error: ApiError | null;
  fetchLinks: (whiskyId: string, region?: 'local' | 'international' | 'all') => Promise<void>;
}

// Component prop types
export interface RecommendationCardProps {
  recommendation: Recommendation;
  onFeedback: (feedback: RecommendationFeedbackRequest) => Promise<void>;
  onViewDetails: (whiskyId: string) => void;
  onPurchaseLinkClick: (link: PurchaseLink) => void;
}

export interface PreferenceFilterProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
  disabled?: boolean;
}

export interface RecommendationListProps {
  recommendations: Recommendation[];
  loading: boolean;
  error: ApiError | null;
  onFeedback: (recommendationId: string, feedback: RecommendationFeedbackRequest) => Promise<void>;
  onRefresh: () => Promise<void>;
}

// Analytics dashboard types
export interface DashboardMetrics {
  totalUsers: number;
  totalRecommendations: number;
  avgSatisfactionScore: number;
  topPerformingAlgorithm: AlgorithmType;
  conversionRate: number;
}

// State management types for Context
export interface RecommendationContextState {
  recommendations: Recommendation[];
  userPreferences: UserPreferences | null;
  loading: boolean;
  error: ApiError | null;
  lastUpdated: string | null;
}

export interface RecommendationContextActions {
  loadRecommendations: (params?: GetRecommendationsParams) => Promise<void>;
  submitFeedback: (recommendationId: string, feedback: RecommendationFeedbackRequest) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  clearError: () => void;
}

export interface RecommendationContextValue extends RecommendationContextState {
  actions: RecommendationContextActions;
}