import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'
import { ScrollToTop } from './ScrollToTop'
import { Toaster } from 'react-hot-toast'

export function Layout() {
  return (
    <div className="min-h-screen cyber-bg">
      <Navigation />
      
      {/* Main Content */}
      <main className="pt-20 md:pt-24 pb-8">
        <div className="container mx-auto mobile-padding">
          <Outlet />
        </div>
      </main>

      {/* Scroll To Top Button */}
      <ScrollToTop />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: '#1e293b',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  )
}