'use client'

import { Memo } from '@/lib/supabase'
import MemoItem from './MemoItem'

type Props = {
  memos: Memo[]
  selectedId: string | null
  searchQuery: string
  onSelect: (id: string) => void
  onNew: () => void
  onSearchChange: (query: string) => void
}

export default function MemoList({
  memos,
  selectedId,
  searchQuery,
  onSelect,
  onNew,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">メモ</h1>
          <button
            onClick={onNew}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white transition-colors"
            title="新規メモ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Memo list */}
      <div className="flex-1 overflow-y-auto">
        {memos.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            {searchQuery ? '見つかりませんでした' : 'メモがありません'}
          </div>
        ) : (
          memos.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              isSelected={memo.id === selectedId}
              onClick={() => onSelect(memo.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
