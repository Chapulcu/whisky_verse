import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AgeVerification } from '@/components/AgeVerification'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { AuthPage } from '@/pages/AuthPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { WhiskiesPage } from '@/pages/WhiskiesPage'
import { CollectionPage } from '@/pages/CollectionPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AdminPage } from '@/pages/AdminPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { EventsPage } from '@/pages/EventsPage'
import { UpgradePage } from '@/pages/UpgradePage'
import { CameraPage } from '@/pages/CameraPage'
import { NearbyPage } from '@/pages/NearbyPage'
import '@/lib/i18n'
import './index.css'

// CRITICAL FIX: Safe page wrapper to prevent hooks violations
function SafePage({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  
  return (
    <ErrorBoundary fallback={
      <div className="text-center py-8">
        <div className="glass-strong rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-600 dark:text-red-400 font-medium mb-4">
            {t('pageLoadError')}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary px-4 py-2"
          >
            {t('refreshPage')}
          </button>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  )
}

function App() {
  const [isAgeVerified, setIsAgeVerified] = useState(false)

  // Show age verification first, then the app
  if (!isAgeVerified) {
    return (
      <ErrorBoundary>
        <AgeVerification onVerified={() => setIsAgeVerified(true)} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <SafePage>
                  <HomePage />
                </SafePage>
              } />
              <Route path="auth" element={
                <SafePage>
                  <AuthPage />
                </SafePage>
              } />
              <Route path="auth/callback" element={
                <SafePage>
                  <AuthCallbackPage />
                </SafePage>
              } />
              <Route path="reset-password" element={
                <SafePage>
                  <ResetPasswordPage />
                </SafePage>
              } />
              <Route path="whiskies" element={
                <SafePage>
                  <WhiskiesPage />
                </SafePage>
              } />
              <Route path="collection" element={
                <SafePage>
                  <CollectionPage />
                </SafePage>
              } />
              <Route path="profile" element={
                <SafePage>
                  <ProfilePage />
                </SafePage>
              } />
              <Route path="camera" element={
                <SafePage>
                  <CameraPage />
                </SafePage>
              } />
              <Route path="nearby" element={
                <SafePage>
                  <NearbyPage />
                </SafePage>
              } />
              <Route path="admin" element={
                <SafePage>
                  <AdminPage />
                </SafePage>
              } />
              <Route path="groups" element={
                <SafePage>
                  <GroupsPage />
                </SafePage>
              } />
              <Route path="events" element={
                <SafePage>
                  <EventsPage />
                </SafePage>
              } />
              <Route path="upgrade" element={
                <SafePage>
                  <UpgradePage />
                </SafePage>
              } />
            </Route>
          </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
