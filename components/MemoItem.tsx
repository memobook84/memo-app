'use client'

import { Memo } from '@/lib/supabase'

type Props = {
  memo: Memo
  isSelected: boolean
  onClick: () => void
  deleteMode?: boolean
  pinMode?: boolean
  sortMode?: boolean
  isChecked?: boolean
  onToggleCheck?: () => void
}

export default function MemoItem({ memo, isSelected, onClick, deleteMode, pinMode, sortMode, isChecked, onToggleCheck }: Props) {
  const date = new Date(memo.updated_at)
  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()
  const dateStr = sameYear
    ? `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
    : date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const firstLine = memo.content.split('\n')[0]?.trim() || '新規メモ'
  const rest = memo.content.split('\n').slice(1).join(' ').trim()
  const preview = rest.slice(0, 50) || 'メモなし'
  const tags = memo.tags || []
  const isSelectionMode = deleteMode || pinMode

  const handleClick = () => {
    if (sortMode) return
    if (isSelectionMode && onToggleCheck) {
      onToggleCheck()
    } else {
      onClick()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-5 py-4 rounded-xl transition-colors flex items-center gap-3 bg-white hover:bg-white/80 active:bg-[#57873E]/10"
    >
      {isSelectionMode && (
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          isChecked
            ? deleteMode
              ? 'bg-[#C25B4E] border-[#C25B4E]'
              : 'bg-[#A3C57D] border-[#A3C57D]'
            : 'border-[#57873E]/30'
        }`}>
          {isChecked && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
      {memo.is_pinned && (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#A3C57D] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
      <span className="text-sm text-[#2E4A1F] truncate">{firstLine}</span>
      {tags.length > 0 && (
        <div className="flex gap-1 flex-shrink-0">
          {tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#A3C57D]/20 text-[#57873E]/60">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
