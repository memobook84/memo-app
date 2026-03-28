'use client'

import { Memo } from '@/lib/supabase'

type Props = {
  memo: Memo
  isSelected: boolean
  onClick: () => void
}

export default function MemoItem({ memo, isSelected, onClick }: Props) {
  const date = new Date(memo.updated_at)
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const preview = memo.content.slice(0, 50).replace(/\n/g, ' ') || 'メモなし'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-100 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-3 border-l-blue-500' : ''
      }`}
    >
      <div className="font-semibold text-sm truncate text-gray-900">
        {memo.title || '新規メモ'}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-500">{dateStr}</span>
        <span className="text-xs text-gray-400 truncate">{preview}</span>
      </div>
    </button>
  )
}
