# 🏗️ WhiskyVerse Component Architecture

## Overview

WhiskyVerse follows a modern React architecture with TypeScript, focusing on reusability, maintainability, and performance. This document outlines the component structure, data flow, and architectural decisions.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│                   (Main Router)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Layout.tsx                                 │
│         (Main Layout + Background System)                   │
│  ┌─────────────────┬─────────────────┬─────────────────┐    │
│  │  Navigation.tsx │   Main Content  │  ScrollToTop    │    │
│  │                 │      Area       │                 │    │
│  └─────────────────┴─────────────────┴─────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼───┐               ┌────▼───┐
   │ Pages  │               │ Admin  │
   │        │               │ Pages  │
   └────┬───┘               └────┬───┘
        │                        │
   ┌────▼───┐               ┌────▼───┐
   │Custom  │               │Admin   │
   │Hooks   │               │Components│
   └────────┘               └────────┘
```

## 📁 Component Hierarchy

### 1. Core Layout Components

#### App.tsx
**Purpose:** Application root with routing
**Responsibilities:**
- Route configuration
- Global providers
- Error boundaries

```typescript
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/whiskies" element={<WhiskiesPage />} />
            {/* ... other routes */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}
```

#### Layout.tsx
**Purpose:** Main application layout wrapper
**Responsibilities:**
- Background management (NEW)
- Global navigation
- Main content area
- Theme detection

```typescript
function Layout() {
  const { getCurrentBackgroundUrl, getCurrentBackgroundVideoUrl, isVideoBackground } = useBackgroundManagement()
  
  return (
    <div className="min-h-screen cyber-bg relative" style={backgroundStyle}>
      {/* Video/Image Background */}
      <Navigation />
      <main className="pt-20 md:pt-24 pb-8">
        <Outlet />
      </main>
      <ScrollToTop />
    </div>
  )
}
```

#### Navigation.tsx
**Purpose:** Top navigation bar with auth-aware menu
**Responsibilities:**
- Route navigation
- User authentication status
- Mobile responsive menu
- Language switcher

### 2. Page Components

#### HomePage.tsx
**Purpose:** Landing page and whisky showcase
**Dependencies:**
- `useMultilingualWhiskies` hook
- Featured whiskies display
- Hero section

#### AdminPage.tsx
**Purpose:** Admin dashboard with tabbed interface
**Responsibilities:**
- User management
- Whisky CRUD operations
- Groups & Events management (NEW)
- Background management (NEW)

**Tab Structure:**
```typescript
type AdminTab = 'overview' | 'users' | 'whiskies' | 'groups' | 'events' | 'background'
```

#### WhiskiesPage.tsx
**Purpose:** Public whisky browsing with search and filters
**Features:**
- Multilingual whisky display
- Search functionality
- Category filtering
- Responsive grid layout

#### ProfilePage.tsx
**Purpose:** User profile management
**Features:**
- Profile information editing
- Collection management
- Language preferences
- Account settings

#### EventsPage.tsx (NEW)
**Purpose:** Community events display and management
**Features:**
- Event listings
- Join/leave events
- Event creation (authenticated users)
- Calendar view

#### GroupsPage.tsx (NEW)
**Purpose:** Community groups management
**Features:**
- Group discovery
- Join/leave groups
- Group creation
- Member management

### 3. Admin Components

#### BackgroundManager.tsx (NEW)
**Purpose:** Site background management interface
**Features:**
- Image/video toggle
- Theme-based uploads (light/dark)
- Preview functionality
- File validation

```typescript
function BackgroundManager() {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')
  
  return (
    <div className="space-y-6">
      {/* Media Type Toggle */}
      {/* Theme Preview Toggle */}
      {/* Upload Sections */}
    </div>
  )
}
```

#### VideoBackgroundSection.tsx (NEW)
**Purpose:** Video background upload and management
**Features:**
- Video preview with play/pause
- Upload progress indication
- File validation (50MB limit)
- Theme-specific handling

#### AddWhiskyModal.tsx
**Purpose:** Modal for adding new whiskies
**Features:**
- Form validation
- Image upload
- Multilingual input
- Category selection

### 4. UI Components

#### Card Components
**Purpose:** Consistent card layouts throughout the app

```typescript
// Basic card pattern
<div className="card p-6">
  <h3 className="card-title">Title</h3>
  <div className="card-content">Content</div>
</div>

// Glass morphism variant
<div className="glass-card p-6">
  <div className="backdrop-blur-lg">Content</div>
</div>
```

#### Button Components
**Purpose:** Consistent button styling and behavior

```typescript
// Button variants
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Danger</button>

// With loading state
<button className="btn btn-primary" disabled={loading}>
  {loading ? <Loader2 className="animate-spin" /> : 'Submit'}
</button>
```

#### Form Components
**Purpose:** Form inputs with validation and styling

```typescript
<div className="form-group">
  <label className="form-label">Label</label>
  <input className="form-input" type="text" />
  <span className="form-error">Error message</span>
</div>
```

## 🔄 Data Flow Architecture

### 1. Authentication Flow

```
User Action → AuthContext → Supabase Auth → Database → UI Update
```

**Implementation:**
```typescript
// AuthContext provides global auth state
const AuthContext = createContext<AuthContextType>()

// Components consume auth state
const { user, signIn, signOut } = useAuth()

// Protected routes check auth status
<ProtectedRoute>
  <AdminPage />
</ProtectedRoute>
```

### 2. Data Fetching Flow

```
Component → Custom Hook → Supabase Client → PostgreSQL → UI Render
```

**Example:**
```typescript
// Custom hook handles data logic
function useWhiskies() {
  const [whiskies, setWhiskies] = useState([])
  const [loading, setLoading] = useState(true)
  
  const fetchWhiskies = async () => {
    const { data, error } = await supabase
      .from('whiskies')
      .select('*, whisky_translations(*)')
    
    if (!error) setWhiskies(data)
    setLoading(false)
  }
  
  return { whiskies, loading, refetch: fetchWhiskies }
}

// Component uses the hook
function WhiskiesPage() {
  const { whiskies, loading } = useWhiskies()
  
  if (loading) return <LoadingSpinner />
  return <WhiskeyGrid whiskies={whiskies} />
}
```

### 3. Background Management Flow (NEW)

```
Admin Upload → Storage Validation → Supabase Storage → Database Update → Layout Re-render
```

**Implementation:**
```typescript
// Background management hook
function useBackgroundManagement() {
  const [settings, setSettings] = useState(null)
  
  const uploadBackgroundVideo = async (file, theme) => {
    // 1. Validate file
    // 2. Upload to Supabase Storage
    // 3. Update database settings
    // 4. Refresh UI state
  }
  
  return { settings, uploadBackgroundVideo, isVideoBackground }
}

// Layout component responds to changes
function Layout() {
  const { getCurrentBackgroundVideoUrl, isVideoBackground } = useBackgroundManagement()
  
  return (
    <div>
      {isVideoBackground && (
        <video src={getCurrentBackgroundVideoUrl(isDark)} autoPlay loop muted />
      )}
    </div>
  )
}
```

## 🎣 Custom Hooks Architecture

### 1. Authentication Hooks

#### useAuth
**Purpose:** Global authentication state management
**Returns:** User data, auth methods, loading states

```typescript
interface UseAuthReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}
```

### 2. Data Management Hooks

#### useMultilingualWhiskies
**Purpose:** Fetch whiskies with current language translations
**Features:**
- Language-aware data fetching
- Real-time updates
- Error handling

```typescript
function useMultilingualWhiskies() {
  const { i18n } = useTranslation()
  
  const fetchWhiskies = useCallback(async () => {
    const { data, error } = await supabase
      .from('whiskies')
      .select(`
        *,
        whisky_translations!inner(name, description, language)
      `)
      .eq('whisky_translations.language', i18n.language)
      
    return { data, error }
  }, [i18n.language])
  
  return { whiskies, loading, refetch: fetchWhiskies }
}
```

#### useBackgroundManagement (NEW)
**Purpose:** Site background management
**Features:**
- Image and video upload
- Theme-based backgrounds
- Storage management
- Database synchronization

### 3. Admin Operation Hooks

#### useAdminOperations
**Purpose:** Admin-specific CRUD operations
**Features:**
- User management
- Content moderation
- System settings

### 4. UI State Hooks

#### useLocalStorage
**Purpose:** Persistent local storage state
**Usage:** Theme preferences, UI settings

#### useDebounce
**Purpose:** Debounced input handling
**Usage:** Search inputs, form validation

## 🔒 Security Architecture

### 1. Row Level Security (RLS)

**Database Level Security:**
```sql
-- Users can only access their own profiles
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Admins can access all data
CREATE POLICY "admin_access" ON profiles
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

**Component Level Security:**
```typescript
// Protected component wrapper
function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { profile, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!profile) return <Navigate to="/auth" />
  if (requiredRole && profile.role !== requiredRole) {
    return <UnauthorizedPage />
  }
  
  return children
}

// Usage
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

### 2. Input Validation

**Client-Side Validation:**
```typescript
const validateWhiskyData = (data: WhiskyFormData): ValidationResult => {
  const errors: string[] = []
  
  if (!data.name?.trim()) errors.push('Name is required')
  if (!data.brand?.trim()) errors.push('Brand is required')
  if (data.age && (data.age < 0 || data.age > 100)) {
    errors.push('Age must be between 0 and 100')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

**Server-Side Validation (Database Constraints):**
```sql
ALTER TABLE whiskies 
ADD CONSTRAINT age_range CHECK (age >= 0 AND age <= 100),
ADD CONSTRAINT alcohol_percentage CHECK (alcohol_percentage >= 0 AND alcohol_percentage <= 100);
```

## 🎨 Styling Architecture

### 1. Tailwind CSS Configuration

**Custom Classes:**
```css
/* Global styles */
.card {
  @apply bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700;
}

.glass-card {
  @apply backdrop-blur-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white;
}
```

### 2. Responsive Design Patterns

**Mobile-First Approach:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Responsive grid */}
</div>

<div className="px-4 sm:px-6 lg:px-8">
  {/* Responsive padding */}
</div>
```

### 3. Dark Mode Implementation

**System Theme Detection:**
```typescript
const [isDark, setIsDark] = useState(false)

useEffect(() => {
  const checkTheme = () => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }
  
  const observer = new MutationObserver(checkTheme)
  observer.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['class'] 
  })
  
  return () => observer.disconnect()
}, [])
```

## 📊 Performance Optimizations

### 1. Code Splitting

```typescript
// Lazy loading for admin pages
const AdminPage = lazy(() => import('./pages/AdminPage'))
const WhiskiesPage = lazy(() => import('./pages/WhiskiesPage'))

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <AdminPage />
</Suspense>
```

### 2. Memoization

```typescript
// Memoized expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// Memoized callback functions
const handleClick = useCallback((id: number) => {
  onItemClick(id)
}, [onItemClick])
```

### 3. Virtual Scrolling (Future Enhancement)

For large datasets like whisky collections:
```typescript
// Placeholder for future implementation
import { FixedSizeList as List } from 'react-window'

const VirtualizedWhiskyList = ({ whiskies }) => (
  <List
    height={600}
    itemCount={whiskies.length}
    itemSize={120}
    itemData={whiskies}
  >
    {WhiskyListItem}
  </List>
)
```

## 🧪 Testing Architecture

### 1. Component Testing

```typescript
// Component test example
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WhiskyCard } from '../WhiskyCard'

describe('WhiskyCard', () => {
  const mockWhisky = {
    id: 1,
    name: 'Test Whisky',
    brand: 'Test Brand',
    age: 12
  }
  
  test('renders whisky information', () => {
    render(<WhiskyCard whisky={mockWhisky} />)
    
    expect(screen.getByText('Test Whisky')).toBeInTheDocument()
    expect(screen.getByText('Test Brand')).toBeInTheDocument()
    expect(screen.getByText('12 years')).toBeInTheDocument()
  })
  
  test('handles add to collection', async () => {
    const mockOnAdd = jest.fn()
    render(<WhiskyCard whisky={mockWhisky} onAddToCollection={mockOnAdd} />)
    
    fireEvent.click(screen.getByText('Add to Collection'))
    
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(mockWhisky.id)
    })
  })
})
```

### 2. Hook Testing

```typescript
// Custom hook testing
import { renderHook, act } from '@testing-library/react'
import { useWhiskies } from '../useWhiskies'

describe('useWhiskies', () => {
  test('fetches whiskies on mount', async () => {
    const { result } = renderHook(() => useWhiskies())
    
    expect(result.current.loading).toBe(true)
    
    await act(async () => {
      // Wait for data loading
    })
    
    expect(result.current.loading).toBe(false)
    expect(result.current.whiskies).toHaveLength(0)
  })
})
```

## 🔄 State Management Patterns

### 1. Local State (useState)

**When to use:** Component-specific state, form inputs, UI toggles

```typescript
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState(initialFormData)
```

### 2. Context State (useContext)

**When to use:** Global state, user authentication, theme settings

```typescript
const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 3. Server State (Custom Hooks + Supabase)

**When to use:** Database operations, API calls, caching

```typescript
function useServerData(query) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchData(query)
  }, [query])
  
  return { data, loading, error, refetch }
}
```

## 📚 Future Architecture Considerations

### 1. State Management Evolution

**Current:** React Context + Custom Hooks  
**Future Options:**
- Zustand for complex client state
- React Query for server state management
- Redux Toolkit (if app complexity increases significantly)

### 2. Performance Enhancements

**Planned Improvements:**
- Virtual scrolling for large lists
- Image lazy loading optimization
- Bundle size analysis and optimization
- Service worker for offline functionality

### 3. Scalability Considerations

**Database Scaling:**
- Read replicas for improved performance
- Database indexing optimization
- Caching layer (Redis)

**Frontend Scaling:**
- Micro-frontend architecture consideration
- CDN integration for static assets
- Progressive Web App (PWA) features

---

**Last Updated:** September 15, 2025  
**Version:** 2.1.0  
**Maintainer:** WhiskyVerse Development Team

This architecture document evolves with the project. Please update it when making significant architectural changes.