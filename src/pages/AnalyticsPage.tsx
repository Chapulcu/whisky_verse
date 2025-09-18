import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { motion } from 'framer-motion'

interface AnalyticsPageProps {
  embedded?: boolean
}

interface CollectionAggregates {
  total_collection_items: number
  active_collectors: number
  avg_items_per_user: number
}

interface TopWhiskyRow {
  whisky_id: number
  collection_count: number
  whisky?: {
    id: number
    name: string
    country: string
    type: string
    image_url: string | null
  } | null
}

interface TrendRow {
  day: string
  items_added: number
}

interface SegmentRow {
  country: string
  type: string
  tasted_count: number
  avg_user_rating: number | null
  avg_global_rating: number | null
}

interface NotesStats {
  notes_count: number
  notes_ratio: number
  avg_note_length: number | null
}

export function AnalyticsPage({ embedded = false }: AnalyticsPageProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [aggregates, setAggregates] = useState<CollectionAggregates | null>(null)
  const [topWhiskies, setTopWhiskies] = useState<TopWhiskyRow[]>([])
  const [trends, setTrends] = useState<TrendRow[]>([])
  const [segments, setSegments] = useState<SegmentRow[]>([])
  const [notes, setNotes] = useState<NotesStats | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'top' | 'trends' | 'segments' | 'notes'>('overview')
  const [topN, setTopN] = useState<number>(10)
  const [dateRange, setDateRange] = useState<'7' | '30' | '60' | '90' | 'all'>('60')
  const [segmentCountry, setSegmentCountry] = useState<string>('all')
  const [segmentType, setSegmentType] = useState<string>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)

        // 1) Aggregates
        const { data: aggData, error: aggErr } = await supabase
          .from('collection_aggregates')
          .select('*')
          .single()
        if (aggErr) throw aggErr

        // 2) Top whiskies by collection
        const { data: topDataRaw, error: topErr } = await supabase
          .from('top_whiskies_by_collection')
          .select('whisky_id, collection_count')
          .order('collection_count', { ascending: false })
          .limit(topN)
        if (topErr) throw topErr

        const topData = (topDataRaw || []) as Array<{ whisky_id: number; collection_count: number }>

        // Fetch whisky details separately to avoid embedding issues from materialized view
        const whiskyIds = topData.map(r => r.whisky_id)
        const whiskyMap: Record<number, { id: number; name: string; country: string; type: string; image_url: string | null }> = {}
        if (whiskyIds.length > 0) {
          const { data: whiskyRows, error: wErr } = await supabase
            .from('whiskies')
            .select('id, name, country, type, image_url')
            .in('id', whiskyIds)
          if (wErr) throw wErr
          for (const w of whiskyRows || []) {
            whiskyMap[w.id as number] = {
              id: w.id as number,
              name: w.name as string,
              country: w.country as string,
              type: w.type as string,
              image_url: (w.image_url as string | null) ?? null,
            }
          }
        }

        // 3) Daily trends
        const { data: trendData, error: trendErr } = await supabase
          .from('trends_collection_daily')
          .select('*')
          .order('day', { ascending: true })
          .limit(60)
        if (trendErr) throw trendErr

        // 4) Segment stats
        const { data: segData, error: segErr } = await supabase
          .from('taste_and_rating_stats_by_segment')
          .select('*')
          .order('country', { ascending: true })
        if (segErr) throw segErr

        // 5) Notes stats
        const { data: notesData, error: notesErr } = await supabase
          .from('notes_basic_stats')
          .select('*')
          .single()
        if (notesErr) throw notesErr

        if (cancelled) return
        setAggregates(aggData as CollectionAggregates)
        const topWithDetails: TopWhiskyRow[] = topData.map(r => ({
          whisky_id: r.whisky_id,
          collection_count: r.collection_count,
          whisky: whiskyMap[r.whisky_id] ?? null,
        }))
        setTopWhiskies(topWithDetails)
        setTrends((trendData || []) as TrendRow[])
        setSegments((segData || []) as SegmentRow[])
        setNotes(notesData as NotesStats)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Veriler yüklenirken hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [topN])

  const trendMax = useMemo(() => Math.max(1, ...trends.map(t => t.items_added)), [trends])
  const filteredTrends = useMemo(() => {
    if (dateRange === 'all') return trends
    const days = parseInt(dateRange, 10)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return trends.filter(t => new Date(t.day) >= cutoff)
  }, [trends, dateRange])

  const countryOptions = useMemo(() => {
    const set = new Set<string>()
    segments.forEach(s => s.country && set.add(s.country))
    return Array.from(set).sort()
  }, [segments])

  const typeOptions = useMemo(() => {
    const set = new Set<string>()
    segments.forEach(s => s.type && set.add(s.type))
    return Array.from(set).sort()
  }, [segments])

  const filteredSegments = useMemo(() => {
    return segments.filter(s =>
      (segmentCountry === 'all' || s.country === segmentCountry) &&
      (segmentType === 'all' || s.type === segmentType)
    )
  }, [segments, segmentCountry, segmentType])

  // CSV helpers
  const downloadCSV = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportTopCSV = () => {
    const rows = topWhiskies.map((r, i) => ({
      rank: i + 1,
      whisky_id: r.whisky_id,
      name: r.whisky?.name ?? '',
      country: r.whisky?.country ?? '',
      type: r.whisky?.type ?? '',
      collection_count: r.collection_count,
    }))
    downloadCSV(rows, `top_whiskies_top_${topN}.csv`)
  }

  const exportTrendsCSV = () => {
    downloadCSV(filteredTrends, `collection_trends_${dateRange}d.csv`)
  }

  const exportSegmentsCSV = () => {
    const rows = filteredSegments.map(s => ({
      country: s.country,
      type: s.type,
      tasted_count: s.tasted_count,
      avg_user_rating: s.avg_user_rating,
      avg_global_rating: s.avg_global_rating,
    }))
    downloadCSV(rows, `segments_${segmentCountry}_${segmentType}.csv`)
  }

  return (
    <ErrorBoundary>
      <div className={embedded ? 'space-y-6' : 'space-y-8'}>
        {!embedded && (
          <div className="text-center mobile-card-spacing">
            <h1 className="mobile-heading font-cyber font-bold text-gradient mb-2">Analytics</h1>
            <p className="mobile-text-size text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Koleksiyon eğilimleri, segment dağılımları ve temel metrikler
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white/10 dark:bg-slate-800/30 rounded-lg p-1 backdrop-blur-md border border-white/20">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'top', label: 'Top Whiskies' },
            { key: 'trends', label: 'Trends' },
            { key: 'segments', label: 'Segments' },
            { key: 'notes', label: 'Notes' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === (tab.key as any)
                  ? 'bg-amber-500/30 text-amber-200 shadow-lg'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="card text-red-600 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="card animate-pulse h-24" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card animate-pulse h-64" />
              <div className="card animate-pulse h-64" />
            </div>
            <div className="card animate-pulse h-64" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card p-4">
                    <div className="text-slate-500 text-sm">Toplam Koleksiyon Öğesi</div>
                    <div className="text-2xl font-bold">{aggregates?.total_collection_items ?? 0}</div>
                  </div>
                  <div className="card p-4">
                    <div className="text-slate-500 text-sm">Aktif Koleksiyoner</div>
                    <div className="text-2xl font-bold">{aggregates?.active_collectors ?? 0}</div>
                  </div>
                  <div className="card p-4">
                    <div className="text-slate-500 text-sm">Kullanıcı Başına Ortalama</div>
                    <div className="text-2xl font-bold">{aggregates?.avg_items_per_user?.toFixed(2) ?? '0.00'}</div>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="mb-3 font-semibold">Günlük Koleksiyon Artışı (Son 60 gün)</div>
                  <div className="flex items-end gap-1 h-40">
                    {trends.map((t) => {
                      const h = Math.max(4, (t.items_added / trendMax) * 160)
                      return (
                        <motion.div
                          key={t.day}
                          initial={{ height: 0 }}
                          animate={{ height: h }}
                          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                          className="flex-1 bg-amber-500/40 hover:bg-amber-500/60 rounded"
                          title={`${t.day}: ${t.items_added}`}
                          style={{ minWidth: '4px' }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Top Whiskies Tab */}
            {activeTab === 'top' && (
              <div className="card">
                <div className="p-4 border-b border-white/10 dark:border-white/5 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">En Çok Koleksiyona Eklenen Whisky</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Top</span>
                    <select
                      className="input-glass text-sm px-2 py-1"
                      value={topN}
                      onChange={(e) => setTopN(Number(e.target.value))}
                      aria-label="Top N seçimi"
                    >
                      {[5,10,20,50].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <button className="btn-glass px-3 py-1" onClick={exportTopCSV} aria-label="Top CSV indir">CSV</button>
                  </div>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">İsim</th>
                        <th className="py-2 pr-4">Ülke</th>
                        <th className="py-2 pr-4">Tür</th>
                        <th className="py-2 pr-4">Adet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWhiskies.map((row, i) => (
                        <tr key={row.whisky_id} className="border-t border-white/5">
                          <td className="py-2 pr-4">{i + 1}</td>
                          <td className="py-2 pr-4">{row.whisky?.name ?? row.whisky_id}</td>
                          <td className="py-2 pr-4">{row.whisky?.country ?? '-'}</td>
                          <td className="py-2 pr-4">{row.whisky?.type ?? '-'}</td>
                          <td className="py-2 pr-4">{row.collection_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Günlük Koleksiyon Artışı</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Tarih</span>
                    <select
                      className="input-glass text-sm px-2 py-1"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      aria-label="Tarih aralığı"
                    >
                      <option value="7">7g</option>
                      <option value="30">30g</option>
                      <option value="60">60g</option>
                      <option value="90">90g</option>
                      <option value="all">Tümü</option>
                    </select>
                    <button className="btn-glass px-3 py-1" onClick={exportTrendsCSV} aria-label="Trends CSV indir">CSV</button>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-48">
                  {filteredTrends.map((t, idx) => {
                    const h = Math.max(4, (t.items_added / trendMax) * 200)
                    const colors = [
                      'from-fuchsia-400/70 to-cyan-400/70',
                      'from-emerald-300/70 to-sky-400/70',
                      'from-rose-300/70 to-amber-300/70',
                      'from-violet-300/70 to-indigo-300/70',
                    ]
                    const color = colors[idx % colors.length]
                    return (
                      <motion.div
                        key={t.day}
                        initial={{ height: 0 }}
                        animate={{ height: h }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        className={`flex-1 bg-gradient-to-t ${color} hover:opacity-90 rounded`}
                        title={`${t.day}: ${t.items_added}`}
                        style={{ minWidth: '4px' }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Segments Tab */}
            {activeTab === 'segments' && (
              <div className="card">
                <div className="p-4 border-b border-white/10 dark:border-white/5 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Segment İstatistikleri (Ülke x Tür)</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <select
                      className="input-glass text-sm px-2 py-1"
                      value={segmentCountry}
                      onChange={(e) => setSegmentCountry(e.target.value)}
                      aria-label="Ülke filtresi"
                    >
                      <option value="all">Tüm ülkeler</option>
                      {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      className="input-glass text-sm px-2 py-1"
                      value={segmentType}
                      onChange={(e) => setSegmentType(e.target.value)}
                      aria-label="Tür filtresi"
                    >
                      <option value="all">Tüm türler</option>
                      {typeOptions.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                    </select>
                    <button className="btn-glass px-3 py-1" onClick={exportSegmentsCSV} aria-label="Segments CSV indir">CSV</button>
                  </div>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-4">Ülke</th>
                        <th className="py-2 pr-4">Tür</th>
                        <th className="py-2 pr-4">Tasted</th>
                        <th className="py-2 pr-4">Kullanıcı Ort. Puan</th>
                        <th className="py-2 pr-4">Global Ort. Puan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSegments.map((s, idx) => (
                        <tr key={`${s.country}-${s.type}-${idx}`} className="border-t border-white/5">
                          <td className="py-2 pr-4">{s.country}</td>
                          <td className="py-2 pr-4">{s.type}</td>
                          <td className="py-2 pr-4">{s.tasted_count}</td>
                          <td className="py-2 pr-4">{s.avg_user_rating?.toFixed(2) ?? '-'}</td>
                          <td className="py-2 pr-4">{s.avg_global_rating?.toFixed(2) ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4">
                  <div className="text-slate-500 text-sm">Not Yazılmış Kayıt</div>
                  <div className="text-2xl font-bold">{notes?.notes_count ?? 0}</div>
                </div>
                <div className="card p-4">
                  <div className="text-slate-500 text-sm">Not Yazma Oranı</div>
                  <div className="text-2xl font-bold">{(((notes?.notes_ratio ?? 0) * 100)).toFixed(1)}%</div>
                </div>
                <div className="card p-4">
                  <div className="text-slate-500 text-sm">Ortalama Not Uzunluğu</div>
                  <div className="text-2xl font-bold">{notes?.avg_note_length?.toFixed(0) ?? '-'}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default AnalyticsPage
