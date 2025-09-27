# Data Model: Whisky Recommendation System

**Feature**: Kullanıcı Tercihlerine Göre Viski Öneri Sistemi
**Date**: 2025-09-26
**Phase**: 1 (Data Model Design)

## Core Entities

### User Preferences
**Purpose**: Store and manage user-specific recommendation preferences and filters

**Fields**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users table)
- `taste_preferences` (JSONB) - Flavor profile preferences (sweet, smoky, peaty, etc.)
- `preferred_regions` (TEXT[]) - Scottish, Irish, American, Japanese, etc.
- `experience_level` (ENUM) - 'beginner', 'intermediate', 'expert'
- `min_price` (DECIMAL) - User-defined minimum price filter
- `max_price` (DECIMAL) - User-defined maximum price filter
- `preferred_age_range` (INT4RANGE) - Age preference range (e.g., [12, 25])
- `alcohol_tolerance` (ENUM) - 'low', 'medium', 'high' (for ABV preferences)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Belongs to User (user_id)
- One-to-one with User

**Validation Rules**:
- min_price must be >= 0
- max_price must be > min_price
- taste_preferences must be valid JSON object
- preferred_regions must contain valid region codes

**RLS Policies**:
- Users can only view/edit their own preferences
- Admin users can view all preferences for analytics

### Whisky Profile
**Purpose**: Extended whisky information for recommendation algorithms

**Fields**:
- `id` (UUID, Primary Key)
- `whisky_id` (UUID, Foreign Key to existing whiskies table)
- `taste_profile` (JSONB) - Structured taste characteristics
- `complexity_score` (INTEGER 1-10) - Algorithm-calculated complexity
- `similarity_vector` (VECTOR) - For cosine similarity calculations
- `popularity_score` (DECIMAL) - Platform-wide popularity metric
- `price_category` (ENUM) - 'budget', 'mid_range', 'premium', 'luxury'
- `recommendation_weight` (DECIMAL) - Algorithm weighting factor
- `region_category` (TEXT) - Standardized region classification
- `flavor_intensity` (JSONB) - Intensity scores for different flavors
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Belongs to Whisky (whisky_id)
- Has many Recommendations

**Validation Rules**:
- complexity_score between 1 and 10
- popularity_score between 0 and 100
- recommendation_weight between 0 and 1
- taste_profile must contain required flavor dimensions

### Recommendation
**Purpose**: Store generated recommendations and their metadata

**Fields**:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users table)
- `whisky_id` (UUID, Foreign Key to whiskies table)
- `recommendation_score` (DECIMAL) - Algorithm confidence score (0-1)
- `recommendation_reason` (JSONB) - Structured reasoning for recommendation
- `generation_algorithm` (ENUM) - 'content_based', 'collaborative', 'hybrid', 'popularity'
- `batch_id` (UUID) - Batch identifier for daily generation
- `is_active` (BOOLEAN) - Whether recommendation is currently shown
- `position_rank` (INTEGER) - Display order position
- `generated_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ) - When recommendation becomes stale
- `created_at` (TIMESTAMPTZ)

**Relationships**:
- Belongs to User (user_id)
- Belongs to Whisky (whisky_id)
- Has one Whisky Profile (through whisky_id)
- Has many Recommendation Feedback entries

**Validation Rules**:
- recommendation_score between 0 and 1
- position_rank must be unique per user per batch
- expires_at must be after generated_at

**RLS Policies**:
- Users can only view their own recommendations
- Admin users can view all for analytics

### Recommendation Feedback
**Purpose**: Capture user interactions and feedback on recommendations

**Fields**:
- `id` (UUID, Primary Key)
- `recommendation_id` (UUID, Foreign Key to recommendations table)
- `user_id` (UUID, Foreign Key to users table)
- `feedback_type` (ENUM) - 'like', 'dislike', 'already_tried', 'not_interested', 'purchased'
- `engagement_duration` (INTEGER) - Time spent viewing (seconds)
- `click_through` (BOOLEAN) - Whether user clicked for details
- `purchase_link_clicked` (BOOLEAN) - Whether purchase link was clicked
- `added_to_favorites` (BOOLEAN) - Whether added to favorites
- `feedback_text` (TEXT) - Optional user comment
- `implicit_feedback` (JSONB) - Automatically captured interaction data
- `created_at` (TIMESTAMPTZ)

**Relationships**:
- Belongs to Recommendation (recommendation_id)
- Belongs to User (user_id)

**Validation Rules**:
- feedback_type must be valid enum value
- engagement_duration must be >= 0
- At least one feedback indicator must be provided

**RLS Policies**:
- Users can only create feedback for their own recommendations
- Users can view their own feedback history

### Recommendation Analytics
**Purpose**: Aggregate metrics and performance tracking

**Fields**:
- `id` (UUID, Primary Key)
- `metric_type` (ENUM) - 'engagement', 'feedback', 'conversion'
- `metric_name` (TEXT) - Specific metric identifier
- `metric_value` (DECIMAL) - Calculated metric value
- `user_segment` (TEXT) - User categorization for analytics
- `algorithm_type` (ENUM) - Which algorithm generated the recommendations
- `time_period` (DATERANGE) - Measurement time range
- `batch_id` (UUID) - Related batch for tracking
- `metadata` (JSONB) - Additional context and dimensions
- `calculated_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

**Relationships**:
- References Recommendation batches (batch_id)

**Validation Rules**:
- metric_value must be numeric
- time_period must be valid date range
- metric_type and metric_name combination must be valid

**RLS Policies**:
- Only admin users can view analytics data
- Public dashboard may access aggregated anonymized data

### Purchase Links
**Purpose**: External platform integration for whisky availability

**Fields**:
- `id` (UUID, Primary Key)
- `whisky_id` (UUID, Foreign Key to whiskies table)
- `platform_name` (TEXT) - e.g., 'Amazon', 'Master of Malt'
- `platform_type` (ENUM) - 'local', 'international'
- `product_url` (TEXT) - Direct link to product
- `current_price` (DECIMAL) - Last known price
- `currency` (TEXT) - Price currency code
- `availability_status` (ENUM) - 'available', 'out_of_stock', 'discontinued'
- `last_checked` (TIMESTAMPTZ) - When price/availability was last verified
- `affiliate_code` (TEXT) - For revenue tracking
- `is_verified` (BOOLEAN) - Manual verification status
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Belongs to Whisky (whisky_id)

**Validation Rules**:
- current_price must be > 0
- product_url must be valid URL format
- currency must be valid ISO currency code

**RLS Policies**:
- Public read access for all users
- Admin-only write access

## Database Indexes

**Performance Optimization**:
- `idx_recommendations_user_active` - (user_id, is_active, position_rank)
- `idx_recommendations_batch_algorithm` - (batch_id, generation_algorithm)
- `idx_whisky_profile_similarity` - GIN index on similarity_vector
- `idx_feedback_user_type_created` - (user_id, feedback_type, created_at)
- `idx_analytics_metric_period` - (metric_type, time_period)
- `idx_purchase_links_whisky_available` - (whisky_id, availability_status)

## Data Relationships Summary

```
User (existing)
  ├── User Preferences (1:1)
  ├── Recommendations (1:many)
  └── Recommendation Feedback (1:many)

Whisky (existing)
  ├── Whisky Profile (1:1)
  ├── Recommendations (1:many)
  └── Purchase Links (1:many)

Recommendation
  ├── User (many:1)
  ├── Whisky (many:1)
  └── Feedback (1:many)
```

## State Transitions

### Recommendation Lifecycle
1. **Generated** → Active recommendation created in daily batch
2. **Active** → Currently displayed to user
3. **Interacted** → User provided feedback
4. **Expired** → Past expiration date, eligible for cleanup

### User Preference Evolution
1. **Initial** → Basic preferences set during onboarding
2. **Learning** → System learns from user interactions
3. **Refined** → Preferences adjusted based on feedback patterns
4. **Stable** → Consistent preference profile established

---

**Data Model Complete**: All entities, relationships, and constraints defined
**Ready for**: API contract generation and database schema implementation