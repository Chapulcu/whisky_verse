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
          duration: 6000,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '12px',
            color: '#f8fafc',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            fontWeight: '500',
            fontSize: '14px',
            maxWidth: '400px',
          },
          success: {
            style: {
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
            },
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