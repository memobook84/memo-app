'use client'

import { Memo } from '@/lib/supabase'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  memo: Memo | null
  onUpdate: (id: string, title: string, content: string) => void
  onDelete: (id: string) => void
}

type Mode = 'edit' | 'select'

export default function MemoEditor({ memo, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<Mode>('edit')
  const [startIndex, setStartIndex] = useState<number | null>(null)
  const [endIndex, setEndIndex] = useState<number | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memoIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (memo) {
      setTitle(memo.title)
      setContent(memo.content)
      memoIdRef.current = memo.id
    } else {
      setTitle('')
      setContent('')
      memoIdRef.current = null
    }
    // メモ切替時にリセット
    setMode('edit')
    resetSelection()
  }, [memo])

  const resetSelection = () => {
    setStartIndex(null)
    setEndIndex(null)
    setCopyFeedback(false)
  }

  const handleChange = (newTitle: string, newContent: string) => {
    if (!memo) return
    setTitle(newTitle)
    setContent(newContent)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (memoIdRef.current === memo.id) {
        onUpdate(memo.id, newTitle, newContent)
      }
    }, 500)
  }

  const handleDelete = () => {
    if (!memo) return
    if (confirm('このメモを削除しますか？')) {
      onDelete(memo.id)
    }
  }

  const toggleMode = () => {
    if (mode === 'edit') {
      setMode('select')
    } else {
      setMode('edit')
      resetSelection()
    }
  }

  const handleCharClick = useCallback((index: number) => {
    if (startIndex === null) {
      // 1回目: 開始点を設定
      setStartIndex(index)
      setEndIndex(null)
      setCopyFeedback(false)
    } else if (endIndex === null) {
      // 2回目: 終了点を設定（開始点より前なら入れ替え）
      if (index < startIndex) {
        setEndIndex(startIndex)
        setStartIndex(index)
      } else {
        setEndIndex(index)
      }
    } else {
      // 3回目以降: リセットして新しい開始点
      setStartIndex(index)
      setEndIndex(null)
      setCopyFeedback(false)
    }
  }, [startIndex, endIndex])

  const handleCopy = async () => {
    if (startIndex === null || endIndex === null) return
    const selectedText = content.slice(startIndex, endIndex + 1)
    try {
      await navigator.clipboard.writeText(selectedText)
      setCopyFeedback(true)
      setTimeout(() => {
        setCopyFeedback(false)
        setMode('edit')
        resetSelection()
      }, 800)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = selectedText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopyFeedback(true)
      setTimeout(() => {
        setCopyFeedback(false)
        setMode('edit')
        resetSelection()
      }, 800)
    }
  }

  const isHighlighted = (index: number) => {
    if (startIndex === null || endIndex === null) return false
    return index >= startIndex && index <= endIndex
  }

  const isMarker = (index: number) => {
    return index === startIndex || index === endIndex
  }

  if (!memo) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p>メモを選択または新規作成してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-gray-200">
        {/* 選択モード中のコピー・リセットボタン */}
        {mode === 'select' && (
          <>
            {startIndex !== null && endIndex !== null && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {copyFeedback ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    コピーしました
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    コピー
                  </>
                )}
              </button>
            )}
            {startIndex !== null && (
              <button
                onClick={resetSelection}
                className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                リセット
              </button>
            )}
          </>
        )}

        {/* 選択モード切替ボタン */}
        <button
          onClick={toggleMode}
          className={`p-1.5 rounded-lg transition-colors ${
            mode === 'select'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={mode === 'select' ? '編集モードに戻る' : '選択モード'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
          title="削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleChange(e.target.value, content)}
        placeholder="タイトル"
        className="px-6 pt-4 pb-2 text-2xl font-bold outline-none border-none placeholder-gray-300 text-gray-900"
        readOnly={mode === 'select'}
      />

      {/* Content - 編集モード */}
      {mode === 'edit' && (
        <textarea
          value={content}
          onChange={(e) => handleChange(title, e.target.value)}
          placeholder="メモを入力..."
          className="flex-1 px-6 py-2 text-base outline-none border-none resize-none placeholder-gray-300 text-gray-700 leading-relaxed"
        />
      )}

      {/* Content - 選択モード */}
      {mode === 'select' && (
        <div className="flex-1 px-6 py-2 overflow-y-auto">
          {content.length === 0 ? (
            <p className="text-gray-300">テキストがありません</p>
          ) : (
            <div className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words select-none">
              {content.split('').map((char, i) => (
                <span
                  key={i}
                  onClick={() => handleCharClick(i)}
                  className={`cursor-pointer ${
                    isHighlighted(i) ? 'bg-blue-200' : 'hover:bg-gray-100'
                  } ${
                    isMarker(i) ? 'border-l-2 border-blue-500' : ''
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          )}
          {/* 選択ガイド */}
          {startIndex === null && (
            <p className="mt-4 text-sm text-gray-400">テキストをタップして開始位置を選択</p>
          )}
          {startIndex !== null && endIndex === null && (
            <p className="mt-4 text-sm text-gray-400">終了位置をタップして範囲を確定</p>
          )}
        </div>
      )}
    </div>
  )
}
