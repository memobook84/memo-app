'use client'

import { Memo } from '@/lib/supabase'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  memo: Memo | null
  fontSize: number
  onUpdate: (id: string, title: string, content: string) => void
  onBack: () => void
}

type Mode = 'edit' | 'select'

// 履歴管理をクラスで分離（Reactのstateと競合しないように）
class UndoManager {
  private stack: string[] = []
  private index = -1
  private timer: ReturnType<typeof setTimeout> | null = null
  private pending: string | null = null

  reset(initial: string) {
    this.stack = [initial]
    this.index = 0
    this.pending = null
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
  }

  // 入力のたびに呼ぶ。0.5秒後に履歴に確定する
  record(text: string) {
    this.pending = text
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.flush()
    }, 500)
  }

  // 未確定の変更を即座に履歴に確定
  flush() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    if (this.pending !== null && this.pending !== this.stack[this.index]) {
      this.stack = this.stack.slice(0, this.index + 1)
      this.stack.push(this.pending)
      if (this.stack.length > 100) this.stack.shift()
      this.index = this.stack.length - 1
      this.pending = null
    }
  }

  undo(): string | null {
    this.flush()
    if (this.index <= 0) return null
    this.index--
    return this.stack[this.index]
  }

  redo(): string | null {
    if (this.index >= this.stack.length - 1) return null
    this.index++
    return this.stack[this.index]
  }

  get canUndo() {
    return this.index > 0 || this.pending !== null
  }

  get canRedo() {
    return this.index < this.stack.length - 1
  }
}

export default function MemoEditor({ memo, fontSize, onUpdate, onBack }: Props) {
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<Mode>('edit')
  const [startIndex, setStartIndex] = useState<number | null>(null)
  const [endIndex, setEndIndex] = useState<number | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [, forceUpdate] = useState(0) // undo/redoボタンの再描画用
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memoIdRef = useRef<string | null>(null)
  const undoMgr = useRef(new UndoManager())

  // メモIDが変わった時だけ初期化（内容更新では履歴をリセットしない）
  const memoId = memo?.id ?? null
  useEffect(() => {
    if (memo) {
      setContent(memo.content)
      memoIdRef.current = memo.id
      undoMgr.current.reset(memo.content)
    } else {
      setContent('')
      memoIdRef.current = null
      undoMgr.current.reset('')
    }
    setMode('edit')
    resetSelection()
    forceUpdate((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId])

  const saveToDb = (text: string) => {
    if (!memo) return
    const newTitle = text.split('\n')[0]?.trim().slice(0, 100) || ''
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (memoIdRef.current === memo.id) {
        onUpdate(memo.id, newTitle, text)
      }
    }, 500)
  }

  const handleChange = (newContent: string) => {
    if (!memo) return
    setContent(newContent)
    undoMgr.current.record(newContent)
    forceUpdate((n) => n + 1)
    saveToDb(newContent)
  }

  const handleUndo = () => {
    const prev = undoMgr.current.undo()
    if (prev === null) return
    setContent(prev)
    forceUpdate((n) => n + 1)
    saveToDb(prev)
  }

  const handleRedo = () => {
    const next = undoMgr.current.redo()
    if (next === null) return
    setContent(next)
    forceUpdate((n) => n + 1)
    saveToDb(next)
  }

  const resetSelection = () => {
    setStartIndex(null)
    setEndIndex(null)
    setCopyFeedback(false)
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
      setStartIndex(index)
      setEndIndex(null)
      setCopyFeedback(false)
    } else if (endIndex === null) {
      if (index === startIndex) {
        setStartIndex(null)
        setCopyFeedback(false)
      } else if (index < startIndex) {
        setEndIndex(startIndex)
        setStartIndex(index)
      } else {
        setEndIndex(index)
      }
    } else if (index === endIndex) {
      setEndIndex(null)
      setCopyFeedback(false)
    } else {
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

  const handleSelectAll = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopyFeedback(true)
      setTimeout(() => {
        setCopyFeedback(false)
        setMode('edit')
        resetSelection()
      }, 800)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
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

  const canUndo = undoMgr.current.canUndo
  const canRedo = undoMgr.current.canRedo

  if (!memo) {
    return (
      <div className="flex flex-col h-full bg-[#F5F0E8]">
        <div className="bg-[#57873E] flex items-center px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[#F5F0E8] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">戻る</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-[#57873E]/40">
          <p>メモが見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F0E8]">
      {/* Toolbar */}
      <div className="bg-[#F5F0E8] flex items-center gap-2 px-4 py-1">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center text-[#57873E] hover:text-[#456E30] transition-colors mr-auto rounded-full hover:bg-[#57873E]/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 選択モード中のコピー・リセットボタン */}
        {mode === 'select' && (
          <>
            {startIndex !== null && endIndex !== null && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-[#57873E] text-white hover:bg-[#456E30] transition-colors"
              >
                {copyFeedback ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    コピー済
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
                className="text-sm px-3 py-1.5 rounded-full text-[#57873E]/50 hover:text-[#57873E] hover:bg-[#57873E]/10 transition-colors"
              >
                リセット
              </button>
            )}
          </>
        )}

        {/* 元に戻す・やり直し */}
        {mode === 'edit' && (
          <>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                canUndo
                  ? 'text-[#57873E] hover:bg-[#57873E]/10'
                  : 'text-[#57873E]/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                canRedo
                  ? 'text-[#57873E] hover:bg-[#57873E]/10'
                  : 'text-[#57873E]/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
              </svg>
            </button>
          </>
        )}

        {/* 選択モード切替ボタン */}
        <button
          onClick={toggleMode}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
            mode === 'select'
              ? 'bg-[#A3C57D] text-white'
              : 'text-[#57873E]/60 hover:text-[#57873E] hover:bg-[#57873E]/10'
          }`}
          title={mode === 'select' ? '編集モードに戻る' : '選択モード'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </button>

        {/* 保存して戻るボタン */}
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center text-[#57873E] hover:text-[#456E30] transition-colors rounded-full hover:bg-[#57873E]/10"
          title="保存して戻る"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* Content - 編集モード */}
      {mode === 'edit' && (
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="メモを入力..."
          style={{ fontSize }}
          className="flex-1 px-6 pt-4 py-2 outline-none border-none resize-none bg-[#F5F0E8] placeholder-[#57873E]/30 text-[#57873E] leading-relaxed"
        />
      )}

      {/* Content - 選択モード */}
      {mode === 'select' && (
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          {content.length === 0 ? (
            <p className="text-[#57873E]/30">テキストがありません</p>
          ) : (
            <div className="text-[#57873E] leading-relaxed select-none whitespace-pre-wrap break-words" style={{ fontSize }}>
              {content.split('').map((char, i) => {
                const isStart = i === startIndex
                const isEnd = i === endIndex
                const highlighted = isHighlighted(i)

                return (
                  <span
                    key={i}
                    onClick={() => handleCharClick(i)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isStart
                        ? 'bg-[#3D8B8A] text-white font-bold rounded px-[2px]'
                        : isEnd
                          ? 'bg-[#C48A4A] text-white font-bold rounded px-[2px]'
                          : highlighted
                            ? 'bg-[#A3C57D]/30 rounded-sm'
                            : 'hover:bg-[#57873E]/10'
                    }`}
                  >
                    {char}
                  </span>
                )
              })}
            </div>
          )}
          {startIndex === null && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm text-[#3D8B8A]">
                <span className="inline-block w-2.5 h-2.5 bg-[#3D8B8A]"></span>
                テキストをタップして開始位置を選択
              </span>
              <span className="w-px h-4 bg-[#57873E]/30"></span>
              <span
                onClick={handleSelectAll}
                className="text-sm text-[#57873E] cursor-pointer hover:text-[#57873E]/70 transition-colors"
              >
                {copyFeedback ? 'コピー済' : '全選択'}
              </span>
            </div>
          )}
          {startIndex !== null && endIndex === null && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 text-sm text-[#C48A4A]">
                <span className="inline-block w-2.5 h-2.5 bg-[#C48A4A]"></span>
                終了位置をタップして範囲を確定
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
