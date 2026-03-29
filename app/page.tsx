'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, Memo, SortBy } from '@/lib/supabase'
import MemoHome from '@/components/MemoHome'
import dynamic from 'next/dynamic'
const MemoEditor = dynamic(() => import('@/components/MemoEditor'))

type View = 'home' | 'editor'

function sortMemos(memos: Memo[], sortBy: SortBy): Memo[] {
  return [...memos].sort((a, b) => {
    // ピン留め優先
    const pinA = a.is_pinned ? 1 : 0
    const pinB = b.is_pinned ? 1 : 0
    if (pinB !== pinA) return pinB - pinA

    if (sortBy === 'custom') {
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    }
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '', 'ja')
    }
    return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime()
  })
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<View>('home')
  const [deleteMode, setDeleteMode] = useState(false)
  const [pinMode, setPinMode] = useState(false)
  const [sortMode, setSortMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())
  const [selectedForPin, setSelectedForPin] = useState<Set<string>>(new Set())
  const [undoData, setUndoData] = useState<Memo[] | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('updated_at')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(16)

  // localStorage からフォントサイズ読み込み
  useEffect(() => {
    const saved = localStorage.getItem('memo-app-font-size')
    if (saved) setFontSize(Number(saved))
  }, [])

  const fetchMemos = useCallback(async () => {
    let query = supabase
      .from('memos')
      .select('*')

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    if (selectedTag) {
      query = query.contains('tags', [selectedTag])
    }

    const { data } = await query
    if (data) {
      setMemos(sortMemos(data, sortBy))
    }
  }, [searchQuery, sortBy, selectedTag])

  useEffect(() => {
    fetchMemos()
  }, [fetchMemos])

  const selectedMemo = memos.find((m) => m.id === selectedId) ?? null

  // 全メモからタグ一覧を取得
  const allTags = Array.from(
    new Set(memos.flatMap((m) => m.tags || []))
  ).sort()

  const handleNew = async () => {
    const { data } = await supabase
      .from('memos')
      .insert({ title: '', content: '' })
      .select()
      .single()

    if (data) {
      setMemos((prev) => [data, ...prev])
      setSelectedId(data.id)
      setView('editor')
    }
  }

  const handleUpdate = async (id: string, title: string, content: string) => {
    await supabase
      .from('memos')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)

    setMemos((prev) => {
      const updated = prev.map((m) =>
        m.id === id
          ? { ...m, title, content, updated_at: new Date().toISOString() }
          : m
      )
      return sortMemos(updated, sortBy)
    })
  }

  const showUndo = (deleted: Memo[]) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndoData(deleted)
    undoTimerRef.current = setTimeout(() => {
      setUndoData(null)
    }, 5000)
  }

  const handleUndo = async () => {
    if (!undoData) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    const rows = undoData.map(({ id, title, content, created_at, updated_at, is_pinned, tags, sort_order }) => ({
      id, title, content, created_at, updated_at, is_pinned: is_pinned || false, tags: tags || [], sort_order: sort_order ?? 0,
    }))
    const { data } = await supabase.from('memos').insert(rows).select()
    if (data) {
      setMemos((prev) => sortMemos([...prev, ...data], sortBy))
    }
    setUndoData(null)
  }

  const handleDelete = async (id: string) => {
    const target = memos.find((m) => m.id === id)
    await supabase.from('memos').delete().eq('id', id)
    setMemos((prev) => prev.filter((m) => m.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
    if (target) showUndo([target])
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setView('editor')
  }

  const handleBack = async () => {
    // 空のメモは自動削除
    if (selectedId) {
      const memo = memos.find((m) => m.id === selectedId)
      if (memo && !memo.title.trim() && !memo.content.trim()) {
        await supabase.from('memos').delete().eq('id', selectedId)
        setMemos((prev) => prev.filter((m) => m.id !== selectedId))
        setSelectedId(null)
      }
    }
    setView('home')
  }

  // 削除モード
  const handleToggleDeleteMode = () => {
    setDeleteMode((prev) => !prev)
    setPinMode(false)
    setSortMode(false)
    setSelectedForDelete(new Set())
  }

  const handleToggleDeleteItem = (id: string) => {
    setSelectedForDelete((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedForDelete.size === 0) return
    if (!confirm(`${selectedForDelete.size}件のメモを削除しますか？`)) return

    const targets = memos.filter((m) => selectedForDelete.has(m.id))
    const ids = Array.from(selectedForDelete)
    await supabase.from('memos').delete().in('id', ids)
    setMemos((prev) => prev.filter((m) => !selectedForDelete.has(m.id)))
    if (selectedId && selectedForDelete.has(selectedId)) {
      setSelectedId(null)
    }
    setSelectedForDelete(new Set())
    setDeleteMode(false)
    if (targets.length > 0) showUndo(targets)
  }

  // ピン留めモード
  const handleTogglePinMode = () => {
    setPinMode((prev) => !prev)
    setDeleteMode(false)
    setSortMode(false)
    setSelectedForPin(new Set())
  }

  const handleTogglePinItem = (id: string) => {
    setSelectedForPin((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePinSelected = async () => {
    if (selectedForPin.size === 0) return
    const ids = Array.from(selectedForPin)

    const updates = ids.map((id) => {
      const memo = memos.find((m) => m.id === id)
      return { id, is_pinned: !(memo?.is_pinned) }
    })

    for (const u of updates) {
      await supabase.from('memos').update({ is_pinned: u.is_pinned }).eq('id', u.id)
    }

    setMemos((prev) => {
      const updated = prev.map((m) => {
        const upd = updates.find((u) => u.id === m.id)
        return upd ? { ...m, is_pinned: upd.is_pinned } : m
      })
      return sortMemos(updated, sortBy)
    })
    setSelectedForPin(new Set())
    setPinMode(false)
  }

  // 並び替え
  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort)
  }

  // カスタム並び替えモード
  const handleToggleSortMode = () => {
    setSortMode((prev) => !prev)
    setDeleteMode(false)
    setPinMode(false)
  }

  const handleMoveUp = async (id: string) => {
    const index = memos.findIndex((m) => m.id === id)
    if (index <= 0) return
    const newMemos = [...memos]
    ;[newMemos[index - 1], newMemos[index]] = [newMemos[index], newMemos[index - 1]]
    // sort_orderを振り直し
    const updated = newMemos.map((m, i) => ({ ...m, sort_order: i }))
    setMemos(updated)
    // DB更新
    for (const m of updated) {
      await supabase.from('memos').update({ sort_order: m.sort_order }).eq('id', m.id)
    }
  }

  const handleMoveDown = async (id: string) => {
    const index = memos.findIndex((m) => m.id === id)
    if (index < 0 || index >= memos.length - 1) return
    const newMemos = [...memos]
    ;[newMemos[index], newMemos[index + 1]] = [newMemos[index + 1], newMemos[index]]
    const updated = newMemos.map((m, i) => ({ ...m, sort_order: i }))
    setMemos(updated)
    for (const m of updated) {
      await supabase.from('memos').update({ sort_order: m.sort_order }).eq('id', m.id)
    }
  }

  // タグフィルタ
  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag)
  }

  // 文字サイズ
  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    localStorage.setItem('memo-app-font-size', String(size))
  }

  // タグ追加/削除
  const handleAddTag = async (memoId: string, tag: string) => {
    const memo = memos.find((m) => m.id === memoId)
    if (!memo) return
    const currentTags = memo.tags || []
    if (currentTags.includes(tag)) return
    const newTags = [...currentTags, tag]
    await supabase.from('memos').update({ tags: newTags }).eq('id', memoId)
    setMemos((prev) => prev.map((m) => m.id === memoId ? { ...m, tags: newTags } : m))
  }

  const handleRemoveTag = async (memoId: string, tag: string) => {
    const memo = memos.find((m) => m.id === memoId)
    if (!memo) return
    const newTags = (memo.tags || []).filter((t) => t !== tag)
    await supabase.from('memos').update({ tags: newTags }).eq('id', memoId)
    setMemos((prev) => prev.map((m) => m.id === memoId ? { ...m, tags: newTags } : m))
  }

  return (
    <div className="h-screen bg-[#F5F0E8]">
      {view === 'home' ? (
        <MemoHome
          memos={memos}
          selectedId={selectedId}
          searchQuery={searchQuery}
          deleteMode={deleteMode}
          pinMode={pinMode}
          sortMode={sortMode}
          selectedForDelete={selectedForDelete}
          selectedForPin={selectedForPin}
          sortBy={sortBy}
          selectedTag={selectedTag}
          allTags={allTags}
          fontSize={fontSize}
          onSelect={handleSelect}
          onNew={handleNew}
          onSearchChange={setSearchQuery}
          onToggleDeleteMode={handleToggleDeleteMode}
          onToggleDeleteItem={handleToggleDeleteItem}
          onDeleteSelected={handleDeleteSelected}
          onTogglePinMode={handleTogglePinMode}
          onTogglePinItem={handleTogglePinItem}
          onPinSelected={handlePinSelected}
          onSortChange={handleSortChange}
          onToggleSortMode={handleToggleSortMode}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onTagFilter={handleTagFilter}
          onFontSizeChange={handleFontSizeChange}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      ) : (
        <MemoEditor
          memo={selectedMemo}
          fontSize={fontSize}
          onUpdate={handleUpdate}
          onBack={handleBack}
        />
      )}

      {/* Undo toast */}
      {undoData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#57873E] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 whitespace-nowrap">
          <span className="text-sm">{undoData.length}件削除</span>
          <button
            onClick={handleUndo}
            className="text-sm font-bold px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            元に戻す
          </button>
        </div>
      )}
    </div>
  )
}
