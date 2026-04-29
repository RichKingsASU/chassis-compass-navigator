import { useEffect, useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Send, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AIChatPanelProps {
  open: boolean
  onClose: () => void
  context?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const MODEL_ID = 'claude-sonnet-4-20250514'
const MAX_HISTORY = 20

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={idx} className="leading-relaxed">
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={i}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    )
  })
}

export default function AIChatPanel({ open, onClose, context }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchKey() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'anthropic_api_key')
          .maybeSingle()
        setApiKey(data?.value || import.meta.env.VITE_ANTHROPIC_API_KEY || null)
      } catch {
        setApiKey(import.meta.env.VITE_ANTHROPIC_API_KEY || null)
      }
    }
    fetchKey()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const systemPrompt = `You are an expert logistics analyst assistant for Forrest Transportation LLC (SCAC: FRQT), a drayage carrier operating in LA/Long Beach ports. You have access to fleet data context. Answer questions about chassis utilization, unbilled loads, revenue gaps, and fleet performance. Be concise and actionable. When you don't have specific data, suggest what to look for in the CCN platform. Current context: ${context || 'No specific context provided.'}`

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    if (!apiKey) {
      toast.error('No Anthropic API key configured. Set anthropic_api_key in app_settings or VITE_ANTHROPIC_API_KEY env.')
      return
    }

    const newHistory: ChatMessage[] = [...messages, { role: 'user' as const, content: trimmed }].slice(-MAX_HISTORY)
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL_ID,
          max_tokens: 1024,
          system: systemPrompt,
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`)
      }
      const data = await res.json()
      const text = data?.content?.[0]?.text || '(no response)'
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: text }].slice(-MAX_HISTORY))
    } catch (err) {
      console.error(err)
      toast.error('Failed to get AI response')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: 'Sorry, I ran into an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Fleet AI Assistant
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              <Trash2 size={14} />
              Clear
            </Button>
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12 space-y-2">
              <Sparkles size={24} className="mx-auto text-primary/60" />
              <p>Ask me about chassis utilization, unbilled loads, or revenue gaps.</p>
              {context && (
                <p className="text-xs italic max-w-sm mx-auto pt-2">{context}</p>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="space-y-2">{renderMarkdown(m.content)}</div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3 space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your fleet..."
            rows={2}
            className="resize-none text-sm"
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={sendMessage} disabled={loading || !input.trim()} className="gap-1">
              <Send size={14} />
              Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
