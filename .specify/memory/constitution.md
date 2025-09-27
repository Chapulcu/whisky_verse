<!--
Sync Impact Report:
- Version change: Template → v1.0.0 (initial constitution)
- New constitution created with 5 core principles
- Added sections: Security & Quality, Development Workflow
- Templates requiring updates: ✅ All templates reviewed for consistency
- Follow-up TODOs: None - all placeholders filled
-->

# WhiskyVerse Constitution

## Core Principles

### I. Security-First Development
Security is non-negotiable in WhiskyVerse. All development must prioritize user data protection and system security. Row Level Security (RLS) policies MUST be implemented for all database operations. Environment variables containing sensitive information MUST NEVER be committed to version control. JWT token-based authentication is required for all user operations. Input validation and sanitization are mandatory for all user inputs.

**Rationale**: WhiskyVerse handles personal user data including profiles, collections, and social interactions. Data breaches would destroy user trust and violate privacy expectations in a community platform.

### II. TypeScript-First, Type-Safe Development
All code MUST be written in TypeScript with strict type checking enabled. The `any` type is prohibited except in exceptional circumstances that must be documented. All API interfaces and data models MUST have corresponding TypeScript types. Type definitions MUST be maintained in sync between frontend and backend.

**Rationale**: Type safety prevents runtime errors, improves code maintainability, and enables better developer tooling. In a community platform with complex data relationships, type safety is critical for reliability.

### III. Component-Driven Architecture
Follow React best practices with component-based architecture. Components MUST be reusable, properly typed, and follow single responsibility principle. Custom hooks MUST be used for shared logic. State management MUST use appropriate patterns (Context for global state, local state for component-specific data).

**Rationale**: WhiskyVerse's UI complexity requires maintainable, testable components. Consistency across the platform improves user experience and developer productivity.

### IV. Database-First Design
All data operations MUST go through Supabase with properly configured RLS policies. Direct database access outside of Supabase client is prohibited. Database schema changes MUST be version controlled through SQL scripts. Real-time subscriptions should be used where appropriate for live updates.

**Rationale**: Supabase provides built-in security, real-time capabilities, and scalability. Centralized database management ensures data integrity and security across the platform.

### V. Responsive, Accessible Design
All UI components MUST be responsive across mobile, tablet, and desktop viewports. Tailwind CSS MUST be used for consistent styling. Components MUST be accessible following WCAG guidelines. Internationalization (i18n) MUST support Turkish and English languages consistently.

**Rationale**: WhiskyVerse serves a global community requiring access across all devices and languages. Accessibility ensures the platform is inclusive for all users.

## Security & Quality Standards

All features MUST implement proper error boundaries and loading states. Performance MUST be considered - aim for <200ms response times for typical operations. Code MUST pass ESLint validation before commit. Production builds MUST be optimized and tested in Docker containers. Environment-specific configurations MUST be properly managed without exposing sensitive data.

## Development Workflow

All changes MUST go through the specification → plan → tasks → implementation workflow. Code reviews are required for all changes. Tests MUST be written before implementation (TDD). Database migrations MUST be tested in staging before production. Deployment MUST use Docker containers with proper health checks.

## Governance

This constitution supersedes all other development practices. Amendments require documentation of rationale and impact analysis. All PRs MUST verify compliance with these principles. Complexity that violates these principles MUST be justified with clear rationale for why simpler alternatives are insufficient. The CLAUDE.md file provides runtime development guidance complementing these constitutional principles.

**Version**: 1.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-09-26