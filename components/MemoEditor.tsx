'use client'

import { Memo } from '@/lib/supabase'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  memo: Memo | null
  fontSize: number
  onUpdate: (id: string, title: string, content: string) => void
  onBack: () => void
}

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

  record(text: string) {
    this.pending = text
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => { this.flush() }, 500)
  }

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

  get canUndo() { return this.index > 0 || this.pending !== null }
  get canRedo() { return this.index < this.stack.length - 1 }
}

export default function MemoEditor({ memo, fontSize, onUpdate, onBack }: Props) {
  const [content, setContent] = useState('')
  const [selStart, setSelStart] = useState<number | null>(null)
  const [selEnd, setSelEnd] = useState<number | null>(null)
  const [, forceUpdate] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memoIdRef = useRef<string | null>(null)
  const undoMgr = useRef(new UndoManager())
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const mirrorRef = useRef<HTMLDivElement | null>(null)

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
    setSelStart(null)
    setSelEnd(null)
    forceUpdate((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoId])

  // selectionchange でネイティブ選択範囲を追跡
  useEffect(() => {
    const handler = () => {
      const ta = textareaRef.current
      if (!ta || document.activeElement !== ta) return
      const s = ta.selectionStart
      const e = ta.selectionEnd
      if (mirrorRef.current) mirrorRef.current.scrollTop = ta.scrollTop
      if (s !== e) {
        setSelStart(s)
        setSelEnd(e)
      } else {
        setSelStart(null)
        setSelEnd(null)
      }
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [])

  // textarea スクロールをミラーに同期
  const handleScroll = useCallback(() => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

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

  const [saveEffect, setSaveEffect] = useState(false)
  const handleSaveEffect = () => {
    if (saveEffect) return
    setSaveEffect(true)
    setTimeout(() => setSaveEffect(false), 800)
  }

  const canUndo = undoMgr.current.canUndo
  const canRedo = undoMgr.current.canRedo

  // ミラー: ブロックハイライト表示（常に同じDOM構造を維持）
  const renderMirror = () => {
    if (content.length === 0) return <span className="text-[#57873E]/30">メモを入力...</span>

    // 常に5つのspanで描画（DOM構造を変えない→文字ずれ防止）
    const s = selStart ?? 0
    const e = selEnd ?? 0
    const hasSelection = selStart !== null && selEnd !== null
    const endIdx = hasSelection ? Math.min(e + 1, content.length) : 0

    const before = content.slice(0, hasSelection ? s : content.length)
    const firstChar = hasSelection ? content.slice(s, s + 1) : ''
    const middleChars = hasSelection ? content.slice(s + 1, e) : ''
    const endChar = hasSelection ? content.slice(e, endIdx) : ''
    const after = hasSelection ? content.slice(endIdx) : ''

    return (
      <>
        <span>{before}</span>
        <span style={{ backgroundColor: hasSelection ? 'rgba(61,139,138,0.7)' : 'transparent', color: hasSelection ? 'white' : 'inherit', borderRadius: '3px 0 0 3px' }}>{firstChar}</span>
        <span style={{ backgroundColor: hasSelection ? 'rgba(163,197,125,0.4)' : 'transparent' }}>{middleChars}</span>
        <span style={{ backgroundColor: hasSelection ? 'rgba(196,138,74,0.7)' : 'transparent', color: hasSelection ? 'white' : 'inherit', borderRadius: '0 3px 3px 0' }}>{endChar}</span>
        <span>{after}</span>
      </>
    )
  }

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

        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
            canUndo ? 'text-[#57873E] hover:bg-[#57873E]/10' : 'text-[#57873E]/30'
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
            canRedo ? 'text-[#57873E] hover:bg-[#57873E]/10' : 'text-[#57873E]/30'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
          </svg>
        </button>

        <button
          onClick={handleSaveEffect}
          className="relative w-10 h-10 flex items-center justify-center text-[#57873E] hover:text-[#456E30] transition-colors rounded-full hover:bg-[#57873E]/10"
          title="保存済み"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {saveEffect && (
            <span
              className="absolute inset-0 rounded-full border-2 border-[#57873E] animate-ping"
              style={{ animationDuration: '0.6s', animationIterationCount: '1' }}
            />
          )}
        </button>
      </div>

      {/* Content - textarea + ミラー */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <div className="relative w-full h-full">
          {/* ミラー (裏側): ブロックハイライト表示 */}
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className="absolute inset-0 px-5 pt-4 pb-2 overflow-hidden whitespace-pre-wrap break-words text-[#57873E] leading-relaxed font-medium bg-white rounded-2xl pointer-events-none"
            style={{ fontSize }}
          >
            {renderMirror()}
          </div>

          {/* textarea (前面): ネイティブ操作、テキスト透明でミラーが見える */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onScroll={handleScroll}
            onSelect={() => {
              const ta = textareaRef.current
              if (!ta) return
              const s = ta.selectionStart
              const e = ta.selectionEnd
              if (s !== e) { setSelStart(s); setSelEnd(e) }
              else { setSelStart(null); setSelEnd(null) }
            }}
            placeholder="メモを入力..."
            style={{
              fontSize,
              color: 'transparent',
              caretColor: '#57873E',
              WebkitTextFillColor: 'transparent',
            }}
            className="relative z-10 w-full h-full px-5 pt-4 pb-2 outline-none border-none resize-none bg-transparent placeholder-[#57873E]/30 leading-relaxed font-medium rounded-2xl selection:bg-transparent selection:text-transparent"
          />
        </div>
      </div>
    </div>
  )
}
