// Calendar integration utilities for adding events to external calendars

export interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startDate: string
  endDate?: string
}

// Format date for calendar URLs (YYYYMMDDTHHMMSS format)
function formatDateForCalendar(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Calculate end date (start date + 2 hours by default)
function calculateEndDate(startDate: string, durationHours: number = 2): string {
  const date = new Date(startDate)
  date.setHours(date.getHours() + durationHours)
  return date.toISOString()
}

// Generate Google Calendar URL
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = formatDateForCalendar(event.endDate || calculateEndDate(event.startDate))

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
    location: event.location || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Generate Apple Calendar (iOS/macOS) URL
export function generateAppleCalendarUrl(event: CalendarEvent): string {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = formatDateForCalendar(event.endDate || calculateEndDate(event.startDate))

  const params = new URLSearchParams({
    title: event.title,
    startdt: startDate,
    enddt: endDate,
    location: event.location || '',
    notes: event.description || '',
  })

  return `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WhiskyVerse//Event//EN
BEGIN:VEVENT
UID:${Date.now()}@whiskyverse.com
DTSTAMP:${formatDateForCalendar(new Date().toISOString())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`
}

// Generate Outlook Calendar URL
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = formatDateForCalendar(event.endDate || calculateEndDate(event.startDate))

  const params = new URLSearchParams({
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    location: event.location || '',
    body: event.description || '',
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Generic calendar link generator
export function generateCalendarLinks(event: CalendarEvent) {
  return {
    google: generateGoogleCalendarUrl(event),
    apple: generateAppleCalendarUrl(event),
    outlook: generateOutlookCalendarUrl(event),
  }
}

// Download .ics file for calendar apps
export function downloadIcsFile(event: CalendarEvent) {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = formatDateForCalendar(event.endDate || calculateEndDate(event.startDate))

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WhiskyVerse//Event//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@whiskyverse.com
DTSTAMP:${formatDateForCalendar(new Date().toISOString())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}