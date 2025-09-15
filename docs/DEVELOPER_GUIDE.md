# 👩‍💻 WhiskyVerse Developer Guide

Welcome to WhiskyVerse! This comprehensive guide will help you get started as a developer on this project.

## 🚀 Quick Start Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account (for full functionality)

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/whisky-community.git
   cd whisky-community
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your Supabase credentials
   ```

4. **Database Setup**
   - Follow `SUPABASE_SETUP.md` for local Supabase
   - Or use cloud Supabase instance
   - Run migrations in `/database/` folder

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   - Open `http://localhost:5173`
   - Create test account
   - Access admin panel (if admin role assigned)

## 🏗️ Project Architecture

### Technology Stack

**Frontend:**
- **React 18.3.1** - UI framework
- **TypeScript 5.6.2** - Type safety
- **Vite 6.0.1** - Build tool & dev server
- **Tailwind CSS 3.4.16** - Styling
- **Framer Motion 12.23.12** - Animations

**Backend:**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Supabase Storage** - File storage
- **Row Level Security** - Data security

**Additional Tools:**
- **React Router** - Client-side routing
- **i18next** - Internationalization (TR/EN)
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Project Structure Explained

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   │   ├── BackgroundManager.tsx    # Background management UI
│   │   ├── VideoBackgroundSection.tsx # Video background support
│   │   └── AddWhiskyModal.tsx       # Whisky creation modal
│   ├── ui/             # Basic UI components (buttons, inputs, etc.)
│   ├── Layout.tsx      # Main app layout wrapper
│   ├── Navigation.tsx  # Top navigation bar
│   └── ScrollToTop.tsx # Scroll to top button
├── pages/              # Route components (one per page)
│   ├── HomePage.tsx    # Landing page
│   ├── AdminPage.tsx   # Admin dashboard
│   ├── WhiskiesPage.tsx # Whisky browsing
│   ├── ProfilePage.tsx # User profile management
│   ├── EventsPage.tsx  # Community events
│   └── GroupsPage.tsx  # Community groups
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication logic
│   ├── useBackgroundManagement.ts # Background system
│   ├── useMultilingualWhiskies.ts # Whisky data with i18n
│   └── useAdminOperations.ts # Admin CRUD operations
├── contexts/           # React context providers
│   └── AuthContext.tsx # Global auth state
├── lib/               # Utilities and configuration
│   ├── supabase.ts    # Supabase client setup
│   └── i18n.ts        # Internationalization config
└── types/             # TypeScript type definitions
```

## 🔧 Development Workflows

### Adding a New Feature

1. **Plan the Feature**
   - Identify required database changes
   - Plan component structure
   - Consider security implications

2. **Database First**
   - Create migration SQL file
   - Test schema changes locally
   - Update RLS policies if needed

3. **Create Custom Hook** (if needed)
   ```typescript
   // hooks/useMyFeature.ts
   export function useMyFeature() {
     const [state, setState] = useState()
     
     const myOperation = async () => {
       // Supabase operations here
     }
     
     return { state, myOperation }
   }
   ```

4. **Build Components**
   ```typescript
   // components/MyFeature.tsx
   export function MyFeature() {
     const { state, myOperation } = useMyFeature()
     
     return (
       <div className="card p-6">
         {/* Component JSX */}
       </div>
     )
   }
   ```

5. **Add to Routes** (if new page)
   ```typescript
   // App.tsx
   <Route path="/my-feature" element={<MyFeaturePage />} />
   ```

6. **Update Navigation** (if needed)
   ```typescript
   // components/Navigation.tsx
   <NavLink to="/my-feature">My Feature</NavLink>
   ```

### Code Style Guidelines

#### TypeScript Best Practices
```typescript
// ✅ Good: Explicit interfaces
interface WhiskyData {
  id: number
  name: string
  brand: string
  age?: number
}

// ✅ Good: Proper error handling
const { data, error } = await supabase.from('whiskies').select()
if (error) {
  console.error('Database error:', error)
  toast.error('Failed to load whiskies')
  return
}

// ✅ Good: Custom hook pattern
export function useWhiskies() {
  const [whiskies, setWhiskies] = useState<WhiskyData[]>([])
  const [loading, setLoading] = useState(true)
  
  return { whiskies, loading, refetch: loadWhiskies }
}
```

#### CSS/Tailwind Guidelines
```typescript
// ✅ Good: Consistent class patterns
<div className="card p-6">                    {/* Card container */}
<div className="glass-card p-4">             {/* Glass morphism */}
<button className="btn btn-primary">         {/* Custom button classes */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive grid */}
```

#### Component Patterns
```typescript
// ✅ Good: Component structure
export function MyComponent({ prop1, prop2 }: Props) {
  // 1. Hooks at top
  const { data, loading } = useMyHook()
  const [state, setState] = useState()
  
  // 2. Event handlers
  const handleClick = () => {
    // Handler logic
  }
  
  // 3. Early returns
  if (loading) return <LoadingSpinner />
  if (!data) return <EmptyState />
  
  // 4. Main render
  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  )
}
```

### Database Development

#### Migration Best Practices
```sql
-- migrations/001_add_my_table.sql
-- Add new table
CREATE TABLE IF NOT EXISTS my_table (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" ON my_table
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Admins can manage all data" ON my_table
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

#### Testing Database Changes
```bash
# Apply migration
psql -U postgres -d whisky_community -f migrations/001_add_my_table.sql

# Test RLS policies
-- Set role context
SELECT auth.uid(); -- Should return user ID when authenticated

# Verify data access
SELECT * FROM my_table; -- Should respect RLS policies
```

## 🧪 Testing Guidelines

### Unit Testing with React Testing Library
```typescript
// __tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

test('renders component correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})

test('handles user interaction', () => {
  render(<MyComponent />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Updated Text')).toBeInTheDocument()
})
```

### Integration Testing with Supabase
```typescript
// utils/testHelpers.ts
export const createTestUser = async () => {
  const testEmail = `test-${Date.now()}@example.com`
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'testpassword123'
  })
  return { testEmail, data, error }
}

export const cleanupTestData = async (userId: string) => {
  await supabase.from('profiles').delete().eq('id', userId)
}
```

## 🔐 Security Considerations

### Row Level Security (RLS) Patterns

**User Data Access:**
```sql
-- Users can only access their own data
CREATE POLICY "own_data_only" ON user_table
    FOR ALL USING (auth.uid() = user_id);
```

**Admin Access:**
```sql
-- Admins can access all data
CREATE POLICY "admin_access" ON any_table
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

**Public Read Access:**
```sql
-- Anyone can read public data
CREATE POLICY "public_read" ON public_table
    FOR SELECT USING (is_public = true);
```

### Input Validation
```typescript
// ✅ Always validate user input
const validateWhiskyData = (data: any): WhiskyData | null => {
  if (!data.name || typeof data.name !== 'string') return null
  if (!data.brand || typeof data.brand !== 'string') return null
  if (data.age && (typeof data.age !== 'number' || data.age < 0)) return null
  
  return data as WhiskyData
}

// Use in components
const handleSubmit = (formData: FormData) => {
  const validatedData = validateWhiskyData(formData)
  if (!validatedData) {
    toast.error('Invalid data provided')
    return
  }
  
  // Proceed with valid data
  submitToDatabase(validatedData)
}
```

### File Upload Security
```typescript
// Validate file types and sizes
const validateFile = (file: File, maxSize: number, allowedTypes: string[]) => {
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`)
  }
  
  if (!allowedTypes.some(type => file.type.startsWith(type))) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
  }
  
  return true
}

// Usage
try {
  validateFile(file, 5 * 1024 * 1024, ['image/', 'video/'])
  // Proceed with upload
} catch (error) {
  toast.error(error.message)
}
```

## 🎨 UI/UX Guidelines

### Design System

**Color Palette:**
- Primary: Purple/Amber gradient
- Secondary: Slate grays
- Success: Green
- Error: Red
- Warning: Amber

**Typography:**
- Headings: Font weights 600-700
- Body: Font weight 400-500
- Small text: 14px, medium opacity

**Spacing:**
- Small: 4px (p-1)
- Medium: 16px (p-4)
- Large: 24px (p-6)
- XL: 32px (p-8)

### Component Design Patterns

**Card Pattern:**
```typescript
<div className="card p-6">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
    Card Title
  </h3>
  <div className="space-y-4">
    {/* Card content */}
  </div>
</div>
```

**Glass Morphism Pattern:**
```typescript
<div className="glass-card backdrop-blur-lg bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl p-6">
  {/* Glass card content */}
</div>
```

**Button Patterns:**
```typescript
// Primary action
<button className="btn btn-primary">Primary Action</button>

// Secondary action
<button className="btn btn-secondary">Secondary Action</button>

// Danger action
<button className="btn btn-danger">Delete</button>

// Loading state
<button className="btn btn-primary" disabled={loading}>
  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
</button>
```

## 🚀 Deployment Guidelines

### Environment Setup

**Development:**
```env
NODE_ENV=development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-key
VITE_APP_URL=http://localhost:5173
```

**Production:**
```env
NODE_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_URL=https://your-domain.com
```

### Build Process
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Docker Deployment
```bash
# Build Docker image
docker build -t whisky-community .

# Run with docker-compose
docker-compose up -d
```

## 🐛 Debugging Guide

### Common Issues & Solutions

**Database Connection Issues:**
```typescript
// Check Supabase connection
const testConnection = async () => {
  const { data, error } = await supabase.from('profiles').select('count').limit(1)
  if (error) {
    console.error('Connection failed:', error)
  } else {
    console.log('Connection successful')
  }
}
```

**Authentication Issues:**
```typescript
// Debug auth state
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event, 'Session:', session)
    }
  )
  
  return () => subscription.unsubscribe()
}, [])
```

**RLS Policy Issues:**
```sql
-- Check if policies are working
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy as specific user
SELECT auth.uid(); -- Should show user ID when authenticated
SELECT * FROM your_table; -- Should respect RLS
```

### Development Tools

**Browser DevTools:**
- React Developer Tools
- Supabase Auth Helper
- Network tab for API debugging

**VS Code Extensions:**
- TypeScript Importer
- Tailwind CSS IntelliSense
- ES7+ React/Redux Snippets
- GitLens

## 📚 Additional Resources

### Documentation Links
- [API Reference](./API_REFERENCE.md)
- [Background Setup](./BACKGROUND_SETUP.md)
- [Multilingual Setup](./MULTILINGUAL_SETUP.md)
- [Supabase Setup](./SUPABASE_SETUP.md)

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community & Support
- Project GitHub Issues
- Supabase Discord Community
- React Community Discord

---

**Happy Coding!** 🥃

This guide is a living document. Please update it as the project evolves and add your own discoveries and best practices.

**Last Updated:** September 15, 2025  
**Version:** 2.1.0