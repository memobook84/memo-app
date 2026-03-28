'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, Memo } from '@/lib/supabase'
import MemoList from '@/components/MemoList'
import MemoEditor from '@/components/MemoEditor'

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchMemos = useCallback(async () => {
    let query = supabase
      .from('memos')
      .select('*')
      .order('updated_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    const { data } = await query
    if (data) setMemos(data)
  }, [searchQuery])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  const selectedMemo = memos.find((m) => m.id === selectedId) ?? null

  const handleNew = async () => {
    const { data } = await supabase
      .from('memos')
      .insert({ title: '', content: '' })
      .select()
      .single()

    if (data) {
      setMemos((prev) => [data, ...prev])
      setSelectedId(data.id)
      setSidebarOpen(false)
    }
  }

  const handleUpdate = async (id: string, title: string, content: string) => {
    await supabase
      .from('memos')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)

    setMemos((prev) =>
      prev
        .map((m) =>
          m.id === id
            ? { ...m, title, content, updated_at: new Date().toISOString() }
            : m
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
    )
  }

  const handleDelete = async (id: string) => {
    await supabase.from('memos').delete().eq('id', id)
    setMemos((prev) => prev.filter((m) => m.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-gray-50 border-r border-gray-200 transform transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <MemoList
          memos={memos}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSelect={handleSelect}
          onNew={handleNew}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Editor */}
      <MemoEditor
        memo={selectedMemo}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  )
}
