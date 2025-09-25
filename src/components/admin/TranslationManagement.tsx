import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import {
  Languages,
  Download,
  Upload,
  Search,
  Filter,
  Edit,
  Save,
  X,
  Eye,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Bot
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface WhiskyTranslation {
  id: number
  whisky_id: number
  language_code: 'tr' | 'en' | 'ru'
  source_language_code: string
  name: string
  description: string | null
  aroma: string | null
  taste: string | null
  finish: string | null
  color: string | null
  region: string | null
  type: string | null
  country: string | null
  translation_status: 'human' | 'machine' | 'pending' | 'failed'
  quality_score?: number
  created_at: string
  updated_at: string
  whisky?: {
    id: number
    name: string
    country: string
  }
}

export function TranslationManagement() {
  const { t } = useTranslation()
  const [translations, setTranslations] = useState<WhiskyTranslation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLang, setFilterLang] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedLetter, setSelectedLetter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [editingTranslation, setEditingTranslation] = useState<WhiskyTranslation | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    loadTranslations()
  }, [])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterLang, filterStatus, selectedLetter])

  const loadTranslations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('whisky_translations')
        .select(`
          *,
          whisky:whiskies (
            id, name, country
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setTranslations(data || [])
    } catch (error: any) {
      console.error('Error loading translations:', error)
      toast.error('Çeviriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = !searchTerm ||
      translation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.whisky?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLang = filterLang === 'all' || translation.language_code === filterLang
    const matchesStatus = filterStatus === 'all' || translation.translation_status === filterStatus
    const matchesLetter = !selectedLetter || translation.name.toLowerCase().startsWith(selectedLetter.toLowerCase())

    return matchesSearch && matchesLang && matchesStatus && matchesLetter
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredTranslations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTranslations = filteredTranslations.slice(startIndex, endIndex)

  // Get unique letters for alphabet filter
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÇĞIİÖŞÜ'.split('')
  const letterCounts = alphabet.map((letter, index) => ({
    letter,
    key: `${letter}-${index}`, // Unique key to avoid React duplicate key warning
    count: translations.filter(t => t.name.toLowerCase().startsWith(letter.toLowerCase())).length
  }))

  const handleEdit = (translation: WhiskyTranslation) => {
    setEditingTranslation(translation)
    setIsEditModalOpen(true)
  }

  const handleSave = async (updatedTranslation: Partial<WhiskyTranslation>) => {
    if (!editingTranslation) return

    // Validate required fields
    if (!updatedTranslation.name?.trim()) {
      toast.error('İsim alanı zorunludur')
      return
    }

    try {
      console.log('🔄 Updating translation:', editingTranslation.id)

      // Prepare update data - only include non-empty fields
      const updateData = {
        name: updatedTranslation.name?.trim(),
        description: updatedTranslation.description?.trim() || null,
        aroma: updatedTranslation.aroma?.trim() || null,
        taste: updatedTranslation.taste?.trim() || null,
        finish: updatedTranslation.finish?.trim() || null,
        color: updatedTranslation.color?.trim() || null,
        region: updatedTranslation.region?.trim() || null,
        type: updatedTranslation.type?.trim() || null,
        country: updatedTranslation.country?.trim() || null,
        translation_status: updatedTranslation.translation_status,
        updated_at: new Date().toISOString()
      }

      // Use fetch API to bypass session issues
      const updateResponse = await fetch(`https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/whisky_translations?id=eq.${editingTranslation.id}&whisky_id=eq.${editingTranslation.whisky_id}&language_code=eq.${editingTranslation.language_code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Update failed: ${updateResponse.status} - ${errorText}`)
      }

      const data = await updateResponse.json()
      console.log('✅ Translation updated successfully:', data)

      if (!data || data.length === 0) {
        toast.error('Güncelleme yapılamadı - yetki sorunu olabilir')
        return
      }

      // Update translations state immediately
      setTranslations(prevTranslations =>
        prevTranslations.map(t =>
          t.id === editingTranslation.id ? { ...t, ...data[0] } : t
        )
      )

      toast.success('Çeviri başarıyla güncellendi')
      setIsEditModalOpen(false)
      setEditingTranslation(null)
      // Also reload as backup
      loadTranslations()
    } catch (error: any) {
      console.error('❌ Error updating translation:', error)
      toast.error(`Güncelleme hatası: ${error.message || 'Bilinmeyen hata'}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu çeviriyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('whisky_translations')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Çeviri silindi')
      loadTranslations()
    } catch (error: any) {
      console.error('Error deleting translation:', error)
      toast.error('Çeviri silinirken hata oluştu')
    }
  }

  const exportToCSV = () => {
    const headers = [
      'ID', 'Whisky ID', 'Whisky Name', 'Language', 'Source Lang', 'Name',
      'Description', 'Aroma', 'Taste', 'Finish', 'Color', 'Region', 'Type',
      'Country', 'Status', 'Quality Score', 'Created', 'Updated'
    ]

    const csvData = [
      headers.join(','),
      ...filteredTranslations.map(t => [
        t.id,
        t.whisky_id,
        `"${t.whisky?.name || ''}"`,
        t.language_code,
        t.source_language_code,
        `"${t.name}"`,
        `"${t.description || ''}"`,
        `"${t.aroma || ''}"`,
        `"${t.taste || ''}"`,
        `"${t.finish || ''}"`,
        `"${t.color || ''}"`,
        `"${t.region || ''}"`,
        `"${t.type || ''}"`,
        `"${t.country || ''}"`,
        t.translation_status,
        t.quality_score || '',
        t.created_at,
        t.updated_at
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `whisky_translations_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'human': return <User className="w-4 h-4 text-green-500" />
      case 'machine': return <Bot className="w-4 h-4 text-blue-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'tr': return '🇹🇷'
      case 'en': return '🇺🇸'
      case 'ru': return '🇷🇺'
      default: return '🌐'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Çeviriler yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Languages className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Çeviri Yönetimi</h2>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {translations.length} çeviri
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV Export
          </button>

          <button
            onClick={() => {/* TODO: Import functionality */}}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            CSV Import
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Çeviri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass pl-10 w-full"
            />
          </div>

          {/* Language Filter */}
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="input-glass"
          >
            <option value="all">Tüm Diller</option>
            <option value="tr">🇹🇷 Türkçe</option>
            <option value="en">🇺🇸 English</option>
            <option value="ru">🇷🇺 Русский</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="human">İnsan Çevirisi</option>
            <option value="machine">Makine Çevirisi</option>
            <option value="pending">Beklemede</option>
            <option value="failed">Başarısız</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['human', 'machine', 'pending', 'failed'].map(status => {
          const count = translations.filter(t => t.translation_status === status).length
          return (
            <div key={status} className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(status)}
              </div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          )
        })}
      </div>

      {/* Alphabet Filter */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLetter('')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              selectedLetter === ''
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-400'
            }`}
          >
            Tümü
          </button>
          {letterCounts.map(({ letter, key, count }) => (
            <button
              key={key}
              onClick={() => setSelectedLetter(letter)}
              disabled={count === 0}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 relative ${
                selectedLetter === letter
                  ? 'bg-amber-500 text-white shadow-lg'
                  : count > 0
                  ? 'bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-400'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {letter}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Results info */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {filteredTranslations.length > 0 ? (
              <>
                <span>{startIndex + 1} - {Math.min(endIndex, filteredTranslations.length)} arası, </span>
                <span className="font-medium">{filteredTranslations.length} çeviri</span>
              </>
            ) : (
              <span>0 çeviri</span>
            )}
          </div>

          {/* Page controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Sayfa:</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-600 dark:text-slate-400">/ {totalPages}</span>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Sayfa başına:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Önceki sayfa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = []
                    const maxVisible = 5
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                    const endPage = Math.min(totalPages, startPage + maxVisible - 1)

                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1)
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                            i === currentPage
                              ? 'bg-amber-500 text-white shadow-lg'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {i}
                        </button>
                      )
                    }
                    return pages
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Sonraki sayfa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Translations Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viski
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dil
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İsim
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTranslations.map((translation) => (
                <tr key={translation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {translation.whisky?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {translation.whisky_id}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getLanguageFlag(translation.language_code)}</span>
                      <span className="text-sm font-medium">
                        {translation.language_code.toUpperCase()}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {translation.name}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {translation.description || '-'}
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(translation.translation_status)}
                      <span className="text-sm capitalize">
                        {translation.translation_status}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(translation)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(translation.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTranslations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterLang !== 'all' || filterStatus !== 'all' || selectedLetter
              ? 'Filtreye uygun çeviri bulunamadı'
              : 'Henüz çeviri bulunmuyor'}
          </div>
        )}
      </div>

      {/* Edit Translation Modal */}
      {isEditModalOpen && editingTranslation && (
        <EditTranslationModal
          translation={editingTranslation}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingTranslation(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// Edit Translation Modal Component
interface EditTranslationModalProps {
  translation: WhiskyTranslation
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTranslation: Partial<WhiskyTranslation>) => void
}

function EditTranslationModal({ translation, isOpen, onClose, onSave }: EditTranslationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aroma: '',
    taste: '',
    finish: '',
    color: '',
    region: '',
    type: '',
    country: '',
    translation_status: 'pending' as const
  })

  // Update form data when translation changes
  useEffect(() => {
    setFormData({
      name: translation.name || '',
      description: translation.description || '',
      aroma: translation.aroma || '',
      taste: translation.taste || '',
      finish: translation.finish || '',
      color: translation.color || '',
      region: translation.region || '',
      type: translation.type || '',
      country: translation.country || '',
      translation_status: translation.translation_status || 'pending'
    })
  }, [translation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Çeviri Düzenle
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {translation.whisky?.name} - {translation.language_code.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İsim *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tip
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Single Malt, Blended, vb."
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bölge
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Islay, Speyside, vb."
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ülke
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="İskoçya, İrlanda, vb."
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Renk
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Altın sarısı, amber, vb."
              />
            </div>

            {/* Translation Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Çeviri Durumu
              </label>
              <select
                value={formData.translation_status}
                onChange={(e) => handleChange('translation_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="human">İnsan Çevirisi</option>
                <option value="machine">Makine Çevirisi</option>
                <option value="pending">Beklemede</option>
                <option value="failed">Başarısız</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Viski hakkında genel açıklama..."
            />
          </div>

          {/* Aroma */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aroma
            </label>
            <textarea
              value={formData.aroma}
              onChange={(e) => handleChange('aroma', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Aroma notları..."
            />
          </div>

          {/* Taste */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tat
            </label>
            <textarea
              value={formData.taste}
              onChange={(e) => handleChange('taste', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tat profili..."
            />
          </div>

          {/* Finish */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Final
            </label>
            <textarea
              value={formData.finish}
              onChange={(e) => handleChange('finish', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Final notları..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}