'use client'

import { Memo, SortBy } from '@/lib/supabase'
import MemoItem from './MemoItem'
import { useState } from 'react'

type Props = {
  memos: Memo[]
  selectedId: string | null
  searchQuery: string
  deleteMode: boolean
  pinMode: boolean
  selectedForDelete: Set<string>
  selectedForPin: Set<string>
  sortBy: SortBy
  selectedTag: string | null
  allTags: string[]
  fontSize: number
  onSelect: (id: string) => void
  onNew: () => void
  onSearchChange: (query: string) => void
  onToggleDeleteMode: () => void
  onToggleDeleteItem: (id: string) => void
  onDeleteSelected: () => void
  onTogglePinMode: () => void
  onTogglePinItem: (id: string) => void
  onPinSelected: () => void
  onSortChange: (sortBy: SortBy) => void
  onTagFilter: (tag: string | null) => void
  onFontSizeChange: (size: number) => void
  onAddTag: (memoId: string, tag: string) => void
  onRemoveTag: (memoId: string, tag: string) => void
}

type MenuView = 'main' | 'sort' | 'tag' | 'tagEdit' | 'fontSize'

export default function MemoHome({
  memos,
  selectedId,
  searchQuery,
  deleteMode,
  pinMode,
  selectedForDelete,
  selectedForPin,
  sortBy,
  selectedTag,
  allTags,
  fontSize,
  onSelect,
  onNew,
  onSearchChange,
  onToggleDeleteMode,
  onToggleDeleteItem,
  onDeleteSelected,
  onTogglePinMode,
  onTogglePinItem,
  onPinSelected,
  onSortChange,
  onTagFilter,
  onFontSizeChange,
  onAddTag,
  onRemoveTag,
}: Props) {
  const [showSearch, setShowSearch] = useState(false)
  const [tagEditMemoId, setTagEditMemoId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')

  const handleSearchToggle = () => {
    if (showSearch) {
      onSearchChange('')
    }
    setShowSearch(!showSearch)
  }

  const handleMenuOpen = () => {
    setMenuView('main')
    setShowMenu(true)
  }

  const handleMenuClose = () => {
    setShowMenu(false)
    setMenuView('main')
  }

  const handleMenuPin = () => {
    handleMenuClose()
    onTogglePinMode()
  }

  const handleMenuSort = () => {
    setMenuView('sort')
  }

  const handleMenuTag = () => {
    setMenuView('tag')
  }

  const handleMenuTagEdit = (memoId: string) => {
    setTagEditMemoId(memoId)
    setTagInput('')
    setMenuView('tagEdit')
  }

  const handleTagAdd = () => {
    if (!tagEditMemoId || !tagInput.trim()) return
    onAddTag(tagEditMemoId, tagInput.trim())
    setTagInput('')
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTagAdd()
    }
  }

  const handleMenuFontSize = () => {
    setMenuView('fontSize')
  }

  const handleMenuDelete = () => {
    handleMenuClose()
    onToggleDeleteMode()
  }

  const handleSortSelect = (s: SortBy) => {
    onSortChange(s)
    handleMenuClose()
  }

  const handleTagSelect = (tag: string | null) => {
    onTagFilter(tag)
    handleMenuClose()
  }

  const handleFontSizeSelect = (size: number) => {
    onFontSizeChange(size)
    handleMenuClose()
  }

  const sortLabels: Record<SortBy, string> = {
    updated_at: '更新日順',
    created_at: '作成日順',
    title: 'タイトル順',
  }

  const fontSizeOptions = [
    { value: 14, label: '小' },
    { value: 16, label: '中' },
    { value: 18, label: '大' },
    { value: 20, label: '特大' },
  ]

  const isSelectionMode = deleteMode || pinMode

  return (
    <div className="flex flex-col h-full bg-[#F5F0E8]">
      {/* Header */}
      <div className="bg-[#F5F0E8] px-4 py-1">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 rounded-full" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {/* タグフィルタ表示 */}
            {selectedTag && !isSelectionMode && (
              <button
                onClick={() => onTagFilter(null)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-[#A3C57D] text-white"
              >
                <span>#{selectedTag}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={handleMenuOpen}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#EBE4D8] text-[#57873E] shadow hover:bg-[#E0D8CA] transition-colors"
              title="メニュー"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
              </svg>
            </button>
            <button
              onClick={handleSearchToggle}
              className={`w-10 h-10 flex items-center justify-center rounded-full shadow transition-colors ${
                showSearch
                  ? 'bg-white text-[#57873E]'
                  : 'bg-[#EBE4D8] text-[#57873E] hover:bg-[#E0D8CA]'
              }`}
              title="検索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 検索ポップアップ */}
      {showSearch && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={handleSearchToggle} />
          <div className="fixed top-20 left-4 right-4 z-50">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57873E]/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="検索"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F5F0E8] rounded-full border-none outline-none focus:ring-2 focus:ring-[#A3C57D] placeholder-[#57873E]/40 text-[#57873E] shadow-lg"
              />
            </div>
          </div>
        </>
      )}

      {/* レンチメニューポップアップ */}
      {showMenu && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={handleMenuClose} />
          <div className="fixed top-20 right-4 z-50 w-56 bg-white rounded-2xl shadow-xl overflow-hidden">
            {menuView === 'main' && (
              <div className="py-1">
                <button onClick={handleMenuPin} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#57873E] hover:bg-[#F5F0E8] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  ピン留め
                </button>
                <button onClick={handleMenuSort} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#57873E] hover:bg-[#F5F0E8] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h12M3 17h6" />
                  </svg>
                  並び替え
                  <span className="ml-auto text-xs text-[#57873E]/50">{sortLabels[sortBy]}</span>
                </button>
                <button onClick={handleMenuTag} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#57873E] hover:bg-[#F5F0E8] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  タグ
                  {selectedTag && <span className="ml-auto text-xs text-[#A3C57D]">#{selectedTag}</span>}
                </button>
                <button onClick={handleMenuFontSize} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#57873E] hover:bg-[#F5F0E8] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h6.5M3 7h7m-7 0v2m14-4h-3.5M17 3v4m0 0h3m-3 0h-3m-4 10l-1.5 4.5M9 17h6m-3-10v10" />
                  </svg>
                  文字サイズ
                  <span className="ml-auto text-xs text-[#57873E]/50">{fontSizeOptions.find(o => o.value === fontSize)?.label}</span>
                </button>
                <div className="border-t border-[#F5F0E8] mx-2" />
                <button onClick={handleMenuDelete} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#C25B4E] hover:bg-[#FEF2F2] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  削除
                </button>
              </div>
            )}

            {menuView === 'sort' && (
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-bold text-[#57873E]/50 flex items-center gap-2">
                  <button onClick={() => setMenuView('main')} className="hover:text-[#57873E]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  並び替え
                </div>
                {(['updated_at', 'created_at', 'title'] as SortBy[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSortSelect(s)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      sortBy === s ? 'text-[#57873E] bg-[#F5F0E8] font-bold' : 'text-[#57873E]/70 hover:bg-[#F5F0E8]'
                    }`}
                  >
                    {sortBy === s && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className={sortBy !== s ? 'ml-7' : ''}>{sortLabels[s]}</span>
                  </button>
                ))}
              </div>
            )}

            {menuView === 'tag' && (
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-bold text-[#57873E]/50 flex items-center gap-2">
                  <button onClick={() => setMenuView('main')} className="hover:text-[#57873E]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  タグ
                </div>
                {/* フィルタセクション */}
                <div className="px-4 py-1.5 text-[10px] font-bold text-[#57873E]/40 uppercase">フィルタ</div>
                <button
                  onClick={() => handleTagSelect(null)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    !selectedTag ? 'text-[#57873E] bg-[#F5F0E8] font-bold' : 'text-[#57873E]/70 hover:bg-[#F5F0E8]'
                  }`}
                >
                  {!selectedTag && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={selectedTag ? 'ml-7' : ''}>すべて</span>
                </button>
                {allTags.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagSelect(tag)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          selectedTag === tag ? 'text-[#57873E] bg-[#F5F0E8] font-bold' : 'text-[#57873E]/70 hover:bg-[#F5F0E8]'
                        }`}
                      >
                        {selectedTag === tag && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span className={selectedTag !== tag ? 'ml-7' : ''}>#{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* タグ編集セクション */}
                <div className="border-t border-[#F5F0E8] mx-2 my-1" />
                <div className="px-4 py-1.5 text-[10px] font-bold text-[#57873E]/40 uppercase">タグ編集</div>
                <div className="max-h-40 overflow-y-auto">
                  {memos.map((m) => {
                    const memoTitle = m.content.split('\n')[0]?.trim().slice(0, 20) || '新規メモ'
                    const memoTags = m.tags || []
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleMenuTagEdit(m.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#57873E]/70 hover:bg-[#F5F0E8] transition-colors"
                      >
                        <span className="truncate flex-1 text-left">{memoTitle}</span>
                        {memoTags.length > 0 && (
                          <span className="text-[10px] text-[#A3C57D] flex-shrink-0">{memoTags.length}件</span>
                        )}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0 text-[#57873E]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {menuView === 'tagEdit' && tagEditMemoId && (() => {
              const editMemo = memos.find((m) => m.id === tagEditMemoId)
              if (!editMemo) return null
              const memoTitle = editMemo.content.split('\n')[0]?.trim().slice(0, 20) || '新規メモ'
              const memoTags = editMemo.tags || []
              return (
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-bold text-[#57873E]/50 flex items-center gap-2">
                    <button onClick={() => setMenuView('tag')} className="hover:text-[#57873E]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="truncate">{memoTitle}</span>
                  </div>
                  {/* 既存タグ */}
                  {memoTags.length > 0 && (
                    <div className="px-4 py-2 flex flex-wrap gap-1.5">
                      {memoTags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#A3C57D]/20 text-[#57873E]/70">
                          #{tag}
                          <button
                            onClick={() => onRemoveTag(editMemo.id, tag)}
                            className="hover:text-[#C25B4E] transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* タグ追加入力 */}
                  <div className="px-4 py-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="新しいタグ"
                      autoFocus
                      className="flex-1 text-sm px-3 py-1.5 rounded-full border border-[#A3C57D] bg-[#F5F0E8] text-[#57873E] outline-none focus:ring-1 focus:ring-[#A3C57D] placeholder-[#57873E]/30"
                    />
                    <button
                      onClick={handleTagAdd}
                      disabled={!tagInput.trim()}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        tagInput.trim() ? 'bg-[#57873E] text-white' : 'bg-[#57873E]/10 text-[#57873E]/30'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })()}

            {menuView === 'fontSize' && (
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-bold text-[#57873E]/50 flex items-center gap-2">
                  <button onClick={() => setMenuView('main')} className="hover:text-[#57873E]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  文字サイズ
                </div>
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFontSizeSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      fontSize === opt.value ? 'text-[#57873E] bg-[#F5F0E8] font-bold' : 'text-[#57873E]/70 hover:bg-[#F5F0E8]'
                    }`}
                  >
                    {fontSize === opt.value && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span className={fontSize !== opt.value ? 'ml-7' : ''} style={{ fontSize: opt.value }}>{opt.label}（{opt.value}px）</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ピン留めモードヘッダー */}
      {pinMode && (
        <div className="px-4 py-2 bg-[#A3C57D]/20 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#57873E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-xs text-[#57873E]">ピン留め/解除するメモを選択</span>
        </div>
      )}

      {/* Memo list */}
      <div className="flex-1 overflow-y-auto pb-24">
        {memos.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#57873E]/50">
            {searchQuery ? '見つかりませんでした' : 'メモがありません'}
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {memos.map((memo) => (
              <MemoItem
                key={memo.id}
                memo={memo}
                isSelected={memo.id === selectedId}
                onClick={() => onSelect(memo.id)}
                deleteMode={deleteMode}
                pinMode={pinMode}
                isChecked={deleteMode ? selectedForDelete.has(memo.id) : selectedForPin.has(memo.id)}
                onToggleCheck={() => {
                  if (deleteMode) onToggleDeleteItem(memo.id)
                  else if (pinMode) onTogglePinItem(memo.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating buttons */}
      <div className="fixed bottom-24 right-4 flex items-center gap-3">
        {/* 削除モード */}
        {deleteMode && selectedForDelete.size > 0 && (
          <button
            onClick={onDeleteSelected}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#C25B4E] text-white shadow-lg hover:bg-[#A84A3E] transition-colors"
            title="削除"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        {/* ピン留めモード */}
        {pinMode && selectedForPin.size > 0 && (
          <button
            onClick={onPinSelected}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#A3C57D] text-white shadow-lg hover:bg-[#8AB366] transition-colors"
            title="ピン留め切替"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
        {isSelectionMode ? (
          <button
            onClick={deleteMode ? onToggleDeleteMode : onTogglePinMode}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#57873E] text-[#F5F0E8] shadow-lg hover:bg-[#456E30] transition-colors"
            title="キャンセル"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNew}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-[#57873E] text-white shadow-lg hover:bg-[#456E30] transition-colors"
            title="新規メモ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
