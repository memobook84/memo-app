'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, Memo, Collection } from '@/lib/supabase'
import MemoHome from '@/components/MemoHome'
import dynamic from 'next/dynamic'
const MemoEditor = dynamic(() => import('@/components/MemoEditor'))

type View = 'home' | 'editor'

function sortMemos(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

export default function Home() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<View>('home')
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())
  const [undoData, setUndoData] = useState<Memo[] | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(16)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)

  // localStorage からフォントサイズ読み込み
  useEffect(() => {
    const saved = localStorage.getItem('memo-app-font-size')
    if (saved) setFontSize(Number(saved))
  }, [])

  const fetchCollections = useCallback(async () => {
    const { data } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) setCollections(data)
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

    if (selectedCollection) {
      query = query.contains('collection_ids', [selectedCollection])
    }

    const { data } = await query
    if (data) {
      setMemos(sortMemos(data))
    }
  }, [searchQuery, selectedTag, selectedCollection])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

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
      return sortMemos(updated)
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
    const rows = undoData.map(({ id, title, content, created_at, updated_at, is_pinned, tags, sort_order, collection_ids }) => ({
      id, title, content, created_at, updated_at, is_pinned: is_pinned || false, tags: tags || [], sort_order: sort_order ?? 0, collection_ids: collection_ids || [],
    }))
    const { data } = await supabase.from('memos').insert(rows).select()
    if (data) {
      setMemos((prev) => sortMemos([...prev, ...data]))
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

  // タグフィルタ
  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag)
  }

  // 文字サイズ
  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    localStorage.setItem('memo-app-font-size', String(size))
  }

  // コレクション
  const handleCreateCollection = async (name: string) => {
    const maxOrder = collections.reduce((max, c) => Math.max(max, c.sort_order), 0)
    const { data } = await supabase
      .from('collections')
      .insert({ name, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (data) setCollections((prev) => [...prev, data])
  }

  const handleRenameCollection = async (id: string, name: string) => {
    await supabase.from('collections').update({ name }).eq('id', id)
    setCollections((prev) => prev.map((c) => c.id === id ? { ...c, name } : c))
  }

  const handleDeleteCollection = async (id: string) => {
    await supabase.from('collections').delete().eq('id', id)
    setCollections((prev) => prev.filter((c) => c.id !== id))
    if (selectedCollection === id) setSelectedCollection(null)
    // メモからcollection_idsをクリーンアップ
    const affected = memos.filter((m) => (m.collection_ids || []).includes(id))
    for (const memo of affected) {
      const newIds = (memo.collection_ids || []).filter((cid) => cid !== id)
      await supabase.from('memos').update({ collection_ids: newIds }).eq('id', memo.id)
    }
    setMemos((prev) => prev.map((m) => {
      if ((m.collection_ids || []).includes(id)) {
        return { ...m, collection_ids: (m.collection_ids || []).filter((cid) => cid !== id) }
      }
      return m
    }))
  }

  const handleAddToCollection = async (memoId: string, collectionId: string) => {
    const memo = memos.find((m) => m.id === memoId)
    if (!memo) return
    const current = memo.collection_ids || []
    if (current.includes(collectionId)) return
    const newIds = [...current, collectionId]
    await supabase.from('memos').update({ collection_ids: newIds }).eq('id', memoId)
    setMemos((prev) => prev.map((m) => m.id === memoId ? { ...m, collection_ids: newIds } : m))
  }

  const handleRemoveFromCollection = async (memoId: string, collectionId: string) => {
    const memo = memos.find((m) => m.id === memoId)
    if (!memo) return
    const newIds = (memo.collection_ids || []).filter((cid) => cid !== collectionId)
    await supabase.from('memos').update({ collection_ids: newIds }).eq('id', memoId)
    setMemos((prev) => prev.map((m) => m.id === memoId ? { ...m, collection_ids: newIds } : m))
  }

  const handleCollectionFilter = (collectionId: string | null) => {
    setSelectedCollection(collectionId)
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
          selectedForDelete={selectedForDelete}
          selectedTag={selectedTag}
          allTags={allTags}
          fontSize={fontSize}
          collections={collections}
          selectedCollection={selectedCollection}
          onSelect={handleSelect}
          onNew={handleNew}
          onSearchChange={setSearchQuery}
          onToggleDeleteMode={handleToggleDeleteMode}
          onToggleDeleteItem={handleToggleDeleteItem}
          onDeleteSelected={handleDeleteSelected}
          onTagFilter={handleTagFilter}
          onFontSizeChange={handleFontSizeChange}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onCreateCollection={handleCreateCollection}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onAddToCollection={handleAddToCollection}
          onRemoveFromCollection={handleRemoveFromCollection}
          onCollectionFilter={handleCollectionFilter}
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
