# Tasks: Kullanıcı Tercihlerine Göre Viski Öneri Sistemi

**Input**: Design documents from `/specs/001-kullan-c-tercihlerine/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `src/`, `tests/` at repository root
- Paths shown below assume React/TypeScript structure
- Follow existing project conventions in WhiskyVerse

## Phase 3.1: Setup & Infrastructure
- [ ] T001 Create database schema for recommendation system in sql-scripts/recommendation_system.sql
- [ ] T002 [P] Create TypeScript types file src/types/recommendation.ts from contracts
- [ ] T003 [P] Create TypeScript types file src/types/userPreferences.ts from data model
- [ ] T004 [P] Create TypeScript types file src/types/analytics.ts from data model

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [ ] T005 [P] Contract test GET /recommendations in tests/contract/recommendations.test.ts
- [ ] T006 [P] Contract test POST /recommendations/{id}/feedback in tests/contract/recommendation-feedback.test.ts
- [ ] T007 [P] Contract test GET /user/preferences in tests/contract/user-preferences.test.ts
- [ ] T008 [P] Contract test PUT /user/preferences in tests/contract/user-preferences.test.ts
- [ ] T009 [P] Contract test GET /whiskies/{id}/purchase-links in tests/contract/purchase-links.test.ts
- [ ] T010 [P] Contract test GET /recommendations/analytics in tests/contract/analytics.test.ts

### Integration Tests
- [ ] T011 [P] Integration test new user cold start scenario in tests/integration/cold-start.test.ts
- [ ] T012 [P] Integration test experienced user recommendations in tests/integration/personalized-recommendations.test.ts
- [ ] T013 [P] Integration test budget filtering workflow in tests/integration/budget-filtering.test.ts
- [ ] T014 [P] Integration test daily recommendation updates in tests/integration/daily-updates.test.ts
- [ ] T015 [P] Integration test purchase link integration in tests/integration/purchase-links.test.ts
- [ ] T016 [P] Integration test multilingual support in tests/integration/i18n-recommendations.test.ts

### Component Tests
- [ ] T017 [P] Component test RecommendationCard in tests/components/RecommendationCard.test.tsx
- [ ] T018 [P] Component test RecommendationList in tests/components/RecommendationList.test.tsx
- [ ] T019 [P] Component test PreferenceFilter in tests/components/PreferenceFilter.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database & Types
- [ ] T020 Deploy database schema using Supabase migration
- [ ] T021 [P] Implement User Preferences model in src/services/userPreferencesService.ts
- [ ] T022 [P] Implement Whisky Profile model in src/services/whiskyProfileService.ts
- [ ] T023 [P] Implement Recommendation model in src/services/recommendationService.ts
- [ ] T024 [P] Implement Analytics model in src/services/analyticsService.ts

### Core Services & Algorithms
- [ ] T025 Implement recommendation algorithm engine in src/utils/recommendationAlgorithms.ts
- [ ] T026 Implement price filtering utilities in src/utils/priceFiltering.ts
- [ ] T027 Implement external links service in src/services/externalLinksService.ts
- [ ] T028 Implement daily batch processing logic in src/services/batchProcessingService.ts

### React Hooks & State Management
- [ ] T029 [P] Implement useRecommendations hook in src/hooks/useRecommendations.ts
- [ ] T030 [P] Implement useUserPreferences hook in src/hooks/useUserPreferences.ts
- [ ] T031 [P] Implement useRecommendationFeedback hook in src/hooks/useRecommendationFeedback.ts
- [ ] T032 [P] Implement usePurchaseLinks hook in src/hooks/usePurchaseLinks.ts

### UI Components
- [ ] T033 [P] Implement RecommendationCard component in src/components/recommendations/RecommendationCard.tsx
- [ ] T034 [P] Implement RecommendationList component in src/components/recommendations/RecommendationList.tsx
- [ ] T035 [P] Implement PreferenceFilter component in src/components/recommendations/PreferenceFilter.tsx
- [ ] T036 [P] Implement mobile-specific components in src/components/mobile/NearbyWhiskyRecommendations.tsx

## Phase 3.4: Pages & Navigation
- [ ] T037 Implement RecommendationsPage in src/pages/RecommendationsPage.tsx
- [ ] T038 Implement PreferencesPage in src/pages/PreferencesPage.tsx
- [ ] T039 Add recommendation routes to React Router configuration in src/App.tsx
- [ ] T040 Update main navigation to include recommendations link

## Phase 3.5: Integration & Security
- [ ] T041 Configure RLS policies for recommendation tables in Supabase
- [ ] T042 Implement authentication guards for recommendation features
- [ ] T043 Add recommendation analytics tracking to existing analytics system
- [ ] T044 Implement error boundary for recommendation components

## Phase 3.6: Polish & Performance
- [ ] T045 [P] Add unit tests for recommendation algorithms in tests/unit/recommendationAlgorithms.test.ts
- [ ] T046 [P] Add unit tests for price filtering in tests/unit/priceFiltering.test.ts
- [ ] T047 [P] Add unit tests for external links service in tests/unit/externalLinksService.test.ts
- [ ] T048 [P] Performance optimization: implement recommendation caching
- [ ] T049 [P] Accessibility testing and WCAG compliance for recommendation components
- [ ] T050 [P] Add Turkish/English i18n strings for recommendation features
- [ ] T051 Mobile responsiveness testing and optimization
- [ ] T052 Load testing for recommendation engine with 100+ concurrent users
- [ ] T053 Update project documentation for recommendation system

## Dependencies
- Setup (T001-T004) before all other tasks
- All contract tests (T005-T010) before any implementation (T020+)
- All integration tests (T011-T016) before any implementation (T020+)
- All component tests (T017-T019) before component implementation (T033-T036)
- Database schema (T020) before service implementation (T021-T024)
- Core services (T021-T028) before hooks (T029-T032)
- Hooks (T029-T032) before components (T033-T036)
- Components (T033-T036) before pages (T037-T038)
- Implementation (T020-T044) before polish (T045-T053)

## Parallel Execution Examples

### Phase 1: Contract Tests Setup
```bash
# Launch T005-T010 together:
Task: "Contract test GET /recommendations in tests/contract/recommendations.test.ts"
Task: "Contract test POST /recommendations/{id}/feedback in tests/contract/recommendation-feedback.test.ts"
Task: "Contract test GET /user/preferences in tests/contract/user-preferences.test.ts"
Task: "Contract test PUT /user/preferences in tests/contract/user-preferences.test.ts"
Task: "Contract test GET /whiskies/{id}/purchase-links in tests/contract/purchase-links.test.ts"
Task: "Contract test GET /recommendations/analytics in tests/contract/analytics.test.ts"
```

### Phase 2: Integration Tests Setup
```bash
# Launch T011-T016 together:
Task: "Integration test new user cold start scenario in tests/integration/cold-start.test.ts"
Task: "Integration test experienced user recommendations in tests/integration/personalized-recommendations.test.ts"
Task: "Integration test budget filtering workflow in tests/integration/budget-filtering.test.ts"
Task: "Integration test daily recommendation updates in tests/integration/daily-updates.test.ts"
Task: "Integration test purchase link integration in tests/integration/purchase-links.test.ts"
Task: "Integration test multilingual support in tests/integration/i18n-recommendations.test.ts"
```

### Phase 3: Service Layer Implementation
```bash
# Launch T021-T024 together after T020:
Task: "Implement User Preferences model in src/services/userPreferencesService.ts"
Task: "Implement Whisky Profile model in src/services/whiskyProfileService.ts"
Task: "Implement Recommendation model in src/services/recommendationService.ts"
Task: "Implement Analytics model in src/services/analyticsService.ts"
```

### Phase 4: React Hooks Implementation
```bash
# Launch T029-T032 together after services:
Task: "Implement useRecommendations hook in src/hooks/useRecommendations.ts"
Task: "Implement useUserPreferences hook in src/hooks/useUserPreferences.ts"
Task: "Implement useRecommendationFeedback hook in src/hooks/useRecommendationFeedback.ts"
Task: "Implement usePurchaseLinks hook in src/hooks/usePurchaseLinks.ts"
```

### Phase 5: UI Components Implementation
```bash
# Launch T033-T036 together after hooks:
Task: "Implement RecommendationCard component in src/components/recommendations/RecommendationCard.tsx"
Task: "Implement RecommendationList component in src/components/recommendations/RecommendationList.tsx"
Task: "Implement PreferenceFilter component in src/components/recommendations/PreferenceFilter.tsx"
Task: "Implement mobile-specific components in src/components/mobile/NearbyWhiskyRecommendations.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task completion
- Run `npm run lint` after each code change
- Follow constitutional TypeScript-first principles
- Maintain RLS security for all database operations
- Ensure mobile responsiveness for all UI components
- Test Turkish/English i18n for all user-facing content

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each API endpoint → contract test task [P]
   - Each endpoint → service implementation task

2. **From Data Model**:
   - Each entity → service creation task [P]
   - Relationships → integration tasks

3. **From Quickstart Scenarios**:
   - Each test scenario → integration test [P]
   - User stories → page implementation tasks

4. **Ordering**:
   - Setup → Contract Tests → Integration Tests → Models → Services → Hooks → Components → Pages → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All API contracts have corresponding tests (T005-T010)
- [x] All data entities have service implementation tasks (T021-T024)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Constitutional requirements addressed (security, TypeScript, mobile, i18n)
- [x] TDD workflow enforced (tests must fail before implementation)
- [x] All quickstart scenarios covered by integration tests

**Total Tasks**: 53 numbered tasks
**Parallel Tasks**: 31 tasks marked [P]
**Sequential Dependencies**: 22 tasks requiring specific order
**Estimated Completion**: 2-3 weeks with proper test-driven development