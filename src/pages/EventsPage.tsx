import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  Calendar,
  Plus,
  Search,
  Crown,
  MapPin,
  Clock,
  Users,
  UserCheck,
  UserPlus,
  Settings,
  Trash2,
  Edit,
  Eye,
  Lock,
  CalendarPlus,
  ChevronDown,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generateCalendarLinks, downloadIcsFile, type CalendarEvent } from '@/utils/calendarUtils'

interface Event {
  id: number
  group_id: number
  title: string
  description: string | null
  start_date: string
  location: string | null
  max_participants: number
  created_by: string
  is_active: boolean
  created_at: string
  group_name?: string
  creator_name?: string
  participant_count?: number
  is_registered?: boolean
  can_register?: boolean
}

interface Group {
  id: number
  name: string
}

export function EventsPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [openCalendarDropdown, setOpenCalendarDropdown] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'discover' | 'my-events'>('discover')
  const [createForm, setCreateForm] = useState({
    group_id: '',
    title: '',
    description: '',
    start_date: '',
    location: '',
    max_participants: 20,
    is_active: true
  })
  const [editForm, setEditForm] = useState({
    group_id: '',
    title: '',
    description: '',
    start_date: '',
    location: '',
    max_participants: 20,
    is_active: true
  })

  const loadMyGroups = async () => {
    if (!user) return

    try {
      // Get groups where user is admin or moderator
      const { data: memberData, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          groups:group_id (id, name)
        `)
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])

      if (error) throw error

      const groups = memberData?.map(m => (m.groups as any)).filter(Boolean) as Group[] || []
      setMyGroups(groups)
    } catch (error) {
      console.error('Error loading my groups:', error)
    }
  }

  const loadEvents = async () => {
    try {
      // Load public events
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date')

      if (error) throw error

      // Get additional details
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get group name
          const { data: groupData } = await supabase
            .from('groups')
            .select('name')
            .eq('id', event.group_id)
            .maybeSingle()

          // Get creator name
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', event.created_by)
            .maybeSingle()

          // Get participant count
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          // Check if user is registered
          const { data: registrationData, error: regError } = await supabase
            .from('event_participants')
            .select('*')
            .eq('event_id', event.id)
            .eq('user_id', user?.id || '')
            .maybeSingle()

          if (regError) {
            console.error('❌ Registration check error:', regError)
          }

          console.log(`🔍 Event ${event.id}: registrationData =`, registrationData, 'is_registered =', !!registrationData)

          return {
            ...event,
            group_name: groupData?.name || 'Bilinmeyen Grup',
            creator_name: creatorData?.full_name || 'Bilinmeyen',
            participant_count: count || 0,
            is_registered: !!registrationData,
            can_register: (count || 0) < event.max_participants
          }
        })
      )

      setEvents(eventsWithDetails)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error(t('eventsPage.toasts.eventsLoadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadMyEvents = async () => {
    if (!user) return

    try {
      // Load events created by user
      const { data: myEventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user.id)
        .order('start_date')

      if (error) throw error

      // Get additional details
      const myEventsWithDetails = await Promise.all(
        (myEventsData || []).map(async (event) => {
          // Get group name
          const { data: groupData } = await supabase
            .from('groups')
            .select('name')
            .eq('id', event.group_id)
            .maybeSingle()

          // Get participant count
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          return {
            ...event,
            group_name: groupData?.name || 'Bilinmeyen Grup',
            creator_name: profile?.full_name || 'Ben',
            participant_count: count || 0,
            is_registered: true,
            can_register: false
          }
        })
      )

      setMyEvents(myEventsWithDetails)
    } catch (error) {
      console.error('Error loading my events:', error)
    }
  }

  useEffect(() => {
    loadEvents()
    loadMyEvents()
    loadMyGroups()
  }, [])

  // Redirect if not VIP
  if (!user || (profile?.role !== 'vip' && profile?.role !== 'admin')) {
    return <Navigate to="/upgrade" replace />
  }

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          group_id: parseInt(createForm.group_id),
          title: createForm.title,
          description: createForm.description || null,
          start_date: createForm.start_date,
          location: createForm.location || null,
          max_participants: createForm.max_participants,
          created_by: user.id,
          is_active: createForm.is_active
        })
        .select()
        .single()

      if (error) throw error

      // Register creator as participant
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: data.id,
          user_id: user.id,
          status: 'registered'
        })

      if (participantError) throw participantError

      toast.success(t('eventsPage.toasts.eventCreatedSuccess'))
      setShowCreateModal(false)
      setCreateForm({
        group_id: '',
        title: '',
        description: '',
        start_date: '',
        location: '',
        max_participants: 20,
        is_active: true
      })
      loadEvents()
      loadMyEvents()
    } catch (error: any) {
      console.error('Error creating event:', error)
      toast.error(error.message || t('eventsPage.toasts.eventCreateError'))
    }
  }

  const registerForEvent = async (eventId: number) => {
    if (!user) return

    console.log('🎯 Registering for event:', eventId, 'User:', user.id)

    // Optimistic update
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? {
              ...event,
              is_registered: true,
              participant_count: event.participant_count + 1
            }
          : event
      )
    )

    try {
      console.log('📡 Inserting to event_participants...')
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        })
        .select()

      if (error) {
        console.error('❌ Insert error:', error)
        throw error
      }

      console.log('✅ Successfully registered:', data)
      toast.success(t('eventsPage.toasts.registrationSuccess'))

      // Don't reload - trust optimistic update
      // The API call was successful, so our optimistic update is correct
    } catch (error: any) {
      console.error('❌ Error registering for event:', error)

      // Revert optimistic update on error
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? {
                ...event,
                is_registered: false,
                participant_count: event.participant_count - 1
              }
            : event
        )
      )

      if (error.code === '23505') {
        toast.error(t('eventsPage.toasts.alreadyRegistered'))
      } else {
        toast.error(t('eventsPage.toasts.registrationError'))
      }
    }
  }

  const unregisterFromEvent = async (eventId: number) => {
    if (!user) return

    // Optimistic update
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? {
              ...event,
              is_registered: false,
              participant_count: Math.max(0, event.participant_count - 1)
            }
          : event
      )
    )

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success(t('eventsPage.toasts.registrationCancelled'))
      // Don't reload - trust optimistic update
    } catch (error) {
      console.error('Error unregistering from event:', error)

      // Revert optimistic update on error
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? {
                ...event,
                is_registered: true,
                participant_count: event.participant_count + 1
              }
            : event
        )
      )

      toast.error(t('eventsPage.toasts.cancelRegistrationError'))
    }
  }

  const deleteEvent = async (eventId: number) => {
    if (!user) return
    
    if (!confirm(t('eventsPage.toasts.deleteConfirm'))) return

    try {
      // Delete participants first
      const { error: participantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)

      if (participantsError) throw participantsError

      // Delete event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('created_by', user.id)

      if (error) throw error

      toast.success(t('eventsPage.toasts.eventDeletedSuccess'))
      loadEvents()
      loadMyEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error(t('eventsPage.toasts.deleteError'))
    }
  }

  const openEditModal = (event: Event) => {
    console.log('🎯 Opening edit modal for event:', event.id, event.title)
    setEditingEvent(event)
    setEditForm({
      group_id: event.group_id.toString(),
      title: event.title,
      description: event.description || '',
      start_date: event.start_date.slice(0, 16), // Format for datetime-local
      location: event.location || '',
      max_participants: event.max_participants,
      is_active: event.is_active
    })
    setShowEditModal(true)
    console.log('✅ Edit modal state set to true')
  }

  const updateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !editingEvent) return

    try {
      const { error } = await supabase
        .from('events')
        .update({
          group_id: parseInt(editForm.group_id),
          title: editForm.title,
          description: editForm.description || null,
          start_date: editForm.start_date,
          location: editForm.location || null,
          max_participants: editForm.max_participants,
          is_active: editForm.is_active
        })
        .eq('id', editingEvent.id)
        .eq('created_by', user.id)

      if (error) throw error

      toast.success(t('eventsPage.toasts.eventUpdatedSuccess'))
      setShowEditModal(false)
      setEditingEvent(null)
      loadEvents()
      loadMyEvents()
    } catch (error: any) {
      console.error('Error updating event:', error)
      toast.error(error.message || t('eventsPage.toasts.eventUpdateError'))
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('tr-TR'),
      time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const isEventPast = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  const handleAddToCalendar = (event: Event, type: 'google' | 'apple' | 'outlook' | 'ics') => {
    const calendarEvent: CalendarEvent = {
      title: event.title,
      description: event.description || `WhiskyVerse etkinliği: ${event.title}`,
      location: event.location || '',
      startDate: event.start_date,
    }

    const links = generateCalendarLinks(calendarEvent)

    switch (type) {
      case 'google':
        window.open(links.google, '_blank')
        break
      case 'apple':
        window.open(links.apple, '_blank')
        break
      case 'outlook':
        window.open(links.outlook, '_blank')
        break
      case 'ics':
        downloadIcsFile(calendarEvent)
        break
    }

    setOpenCalendarDropdown(null)
  }

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading-spinner w-8 h-8 text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-cyber font-bold text-gradient mb-4 flex items-center justify-center gap-2 sm:gap-3">
          <Calendar className="w-8 h-8 sm:w-10 sm:h-10" />
          {t('eventsPage.title')}
          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('eventsPage.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                activeTab === 'discover'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {t('eventsPage.tabs.discover')}
            </button>
            <button
              onClick={() => setActiveTab('my-events')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                activeTab === 'my-events'
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {t('eventsPage.tabs.myEvents')} ({myEvents.length})
            </button>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
            disabled={myGroups.length === 0}
            title={myGroups.length === 0 ? t('eventsPage.groupRequiredTitle') : ''}
          >
            <Plus className="w-4 h-4" />
            {t('eventsPage.createButton')}
          </button>
        </div>

        {/* Search */}
        {activeTab === 'discover' && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('eventsPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10"
            />
          </div>
        )}
      </div>

      {/* No Groups Warning */}
      {myGroups.length === 0 && (
        <div className="glass-cardbg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
            <Crown className="w-5 h-5" />
            <div>
              <h3 className="font-medium">{t('eventsPage.groupRequired.title')}</h3>
              <p className="text-sm mt-1">{t('eventsPage.groupRequired.description')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {(activeTab === 'discover' ? filteredEvents : myEvents).map((event, index) => {
          const { date, time } = formatDateTime(event.start_date)
          const isPast = isEventPast(event.start_date)
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`card group hover:scale-105 ${isPast ? 'opacity-75' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {event.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                      {event.group_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {event.is_active ? (
                    <div title={t('eventsPage.publicTooltip')}>
                      <Eye className="w-4 h-4 text-green-500" />
                    </div>
                  ) : (
                    <div title={t('eventsPage.privateTooltip')}>
                      <Lock className="w-4 h-4 text-orange-500" />
                    </div>
                  )}
                  
                  {activeTab === 'my-events' && !isPast && (
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 text-red-500 hover:text-red-600 transition-colors"
                      title={t('eventsPage.deleteTooltip')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                  {event.description}
                </p>
              )}

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="truncate">{date} - {time}</span>
                  {isPast && <span className="text-red-500 text-xs">{t('eventsPage.pastLabel')}</span>}
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="truncate">{event.participant_count}/{event.max_participants} {t('eventsPage.participantsLabel')}</span>
                </div>
              </div>

              {/* Calendar & Actions */}
              <div className="space-y-3">
                {/* Add to Calendar */}
                <div className="relative">
                  <button
                    onClick={() => setOpenCalendarDropdown(openCalendarDropdown === event.id ? null : event.id)}
                    className="w-full btn-glass flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <CalendarPlus className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Takvime Ekle</span>
                    <span className="sm:hidden">Takvim</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${openCalendarDropdown === event.id ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Calendar Dropdown */}
                  {openCalendarDropdown === event.id && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleAddToCalendar(event, 'google')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Google Calendar
                        </button>
                        <button
                          onClick={() => handleAddToCalendar(event, 'apple')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-gray-600" />
                          Apple Calendar
                        </button>
                        <button
                          onClick={() => handleAddToCalendar(event, 'outlook')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Outlook Calendar
                        </button>
                        <button
                          onClick={() => handleAddToCalendar(event, 'ics')}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2"
                        >
                          <Download className="w-4 h-4 text-green-600" />
                          .ics Dosyası İndir
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                {activeTab === 'discover' && !isPast && (
                  event.is_registered ? (
                    <button
                      onClick={() => unregisterFromEvent(event.id)}
                      className="btn-glass flex-1 text-red-600 dark:text-red-400 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <UserCheck className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{t('eventsPage.cancelRegistrationButton')}</span>
                      <span className="sm:hidden">İptal</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => registerForEvent(event.id)}
                      className="btn-primary flex-1 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                      disabled={!event.can_register}
                    >
                      <UserPlus className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">
                        {!event.can_register ? t('eventsPage.fullLabel') : t('eventsPage.joinButton')}
                      </span>
                      <span className="sm:hidden">
                        {!event.can_register ? 'Dolu' : 'Katıl'}
                      </span>
                    </button>
                  )
                )}
                
                {activeTab === 'my-events' && !isPast && (
                  <button
                    onClick={() => openEditModal(event)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('eventsPage.manageButton')}</span>
                    <span className="sm:hidden">Yönet</span>
                  </button>
                )}
                
                {isPast && (
                  <button className="btn-glass flex-1 cursor-not-allowed" disabled>
                    Event Ended
                  </button>
                )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {((activeTab === 'discover' && filteredEvents.length === 0) || 
        (activeTab === 'my-events' && myEvents.length === 0)) && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
            {activeTab === 'discover' ? t('eventsPage.emptyStates.noEventsFound') : t('eventsPage.emptyStates.noEventsCreated')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {activeTab === 'discover' 
              ? t('eventsPage.emptyStates.tryDifferentSearch')
              : t('eventsPage.emptyStates.createFirstEvent')
            }
          </p>
          {activeTab === 'my-events' && myGroups.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('eventsPage.createButton')}
            </button>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gradient">{t('eventsPage.createModal.title')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grup *
                </label>
                <select
                  value={createForm.group_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, group_id: e.target.value }))}
                  className="input-glass"
                  required
                >
                  <option value="">{t('eventsPage.createModal.selectGroup')}</option>
                  {myGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('eventsPage.createModal.eventTitle')} *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-glass"
                  placeholder={t('eventsPage.createModal.eventTitlePlaceholder')}
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('eventsPage.createModal.description')}
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-glass min-h-[100px] resize-none"
                  placeholder={t('eventsPage.createModal.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tarih ve Saat *
                </label>
                <input
                  type="datetime-local"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="input-glass"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Konum
                </label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  className="input-glass"
                  placeholder={t('eventsPage.createModal.locationPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('eventsPage.createModal.maxParticipants')}
                </label>
                <input
                  type="number"
                  value={createForm.max_participants}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 20 }))}
                  className="input-glass"
                  min={2}
                  max={500}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="event_is_active"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="event_is_active" className="text-sm text-slate-700 dark:text-slate-300">
                  {t('eventsPage.createModal.publicEvent')}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-glass flex-1"
                >
                  {t('eventsPage.createModal.cancelButton')}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!createForm.title.trim() || !createForm.group_id || !createForm.start_date}
                >
                  {t('eventsPage.createModal.createButton')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div>
          {console.log('🎭 Rendering edit modal:', showEditModal, editingEvent?.title)}
        </div>) &&
      (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-strong max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gradient">Etkinlik Düzenle</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={updateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Grup *
                </label>
                <select
                  value={editForm.group_id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, group_id: e.target.value }))}
                  className="input-glass"
                  required
                >
                  <option value="">Grup seçin</option>
                  {myGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Etkinlik Başlığı *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-glass"
                  placeholder="Etkinlik başlığını girin"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-glass min-h-[100px] resize-none"
                  placeholder="Etkinlik açıklamasını girin"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tarih ve Saat *
                </label>
                <input
                  type="datetime-local"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="input-glass"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Konum
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="input-glass"
                  placeholder="Etkinlik konumunu girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Maksimum Katılımcı
                </label>
                <input
                  type="number"
                  value={editForm.max_participants}
                  onChange={(e) => setEditForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 20 }))}
                  className="input-glass"
                  min={editingEvent.participant_count || 2}
                  max={500}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit_event_is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="edit_event_is_active" className="text-sm text-slate-700 dark:text-slate-300">
                  Etkinlik aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-glass flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!editForm.title.trim() || !editForm.group_id || !editForm.start_date}
                >
                  Güncelle
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}