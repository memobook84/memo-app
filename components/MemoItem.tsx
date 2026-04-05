'use client'

import { Memo } from '@/lib/supabase'

type Props = {
  memo: Memo
  isSelected: boolean
  onClick: () => void
  deleteMode?: boolean
  isChecked?: boolean
  onToggleCheck?: () => void
  onDotsClick?: () => void
}

export default function MemoItem({ memo, isSelected, onClick, deleteMode, isChecked, onToggleCheck, onDotsClick }: Props) {
  const firstLine = memo.content.split('\n')[0]?.trim() || '新規メモ'
  const tags = memo.tags || []
  const d = new Date(memo.updated_at)
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`

  const handleClick = () => {
    if (deleteMode && onToggleCheck) {
      onToggleCheck()
    } else {
      onClick()
    }
  }

  return (
    <div className="relative">
      {/* タグ：左上に半分かかる形で表示（最初の1つだけ） */}
      {tags.length > 0 && (
        <span className="absolute -top-2 left-3 text-[10px] px-2 py-0.5 rounded-full bg-[#A3C57D]/20 text-[#57873E]/60 z-10">
          #{tags[0]}
        </span>
      )}
      <div className="flex items-center gap-0 bg-white rounded-xl">
        <button
          onClick={handleClick}
          className="flex-1 text-left px-5 py-4 rounded-xl transition-colors flex items-center gap-3 hover:bg-white/80 active:bg-[#57873E]/10 min-w-0"
        >
          {deleteMode && (
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              isChecked
                ? 'bg-[#C25B4E] border-[#C25B4E]'
                : 'border-[#57873E]/30'
            }`}>
              {isChecked && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
          <span className="text-xs text-[#57873E] font-medium flex-shrink-0 bg-[#F5F0E8] px-2 py-0.5 rounded-full">{dateLabel}</span>
          <span className="text-sm text-[#57873E] font-medium truncate flex-1">{firstLine}</span>
        </button>
        {!deleteMode && onDotsClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onDotsClick() }}
            className="px-2 py-4 flex-shrink-0 flex items-center justify-center text-[#57873E]/35 hover:text-[#57873E] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
