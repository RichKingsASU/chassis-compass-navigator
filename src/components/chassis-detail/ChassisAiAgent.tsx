import { useEffect, useRef, useState } from 'react'
import { Bot, Send, RotateCcw, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  chassisNumber: string
  systemPrompt: string | null
  contextLoading: boolean
}

const SUGGESTED_PROMPTS = [
  'Where is this chassis and how long has it been there?',
  'Is this chassis making money?',
  "What's the revenue trend over the last 6 months?",
  'Are there any operational concerns I should know about?',
  'When was this chassis last on a load?',
  'Is this chassis flagged for any issues?',
]

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''
const PROXY_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/chassis-agent-proxy`
  : ''

interface AnthropicResponse {
  content?: { type: string; text?: string }[]
  error?: { message?: string }
}

async function callAgent(
  systemPrompt: string,
  history: Message[]
): Promise<string> {
  if (!PROXY_URL) {
    throw new Error('VITE_SUPABASE_URL is not configured')
  }
  const session = await supabase.auth.getSession()
  const accessToken = session.data.session?.access_token || SUPABASE_ANON
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      system: systemPrompt,
      messages: history,
    }),
  })
  const text = await res.text()
  let body: AnthropicResponse | null = null
  try {
    body = JSON.parse(text) as AnthropicResponse
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const message = body?.error?.message || text || `HTTP ${res.status}`
    throw new Error(message)
  }
  const content = body?.content || []
  const reply = content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n')
    .trim()
  return reply || '(empty response)'
}

function MessageBubble({
  msg,
  onCopy,
}: {
  msg: Message
  onCopy: () => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border'
        }`}
      >
        {msg.content}
        {!isUser && (
          <div className="mt-1.5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(msg.content)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
                onCopy()
              }}
              className="text-[10px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChassisAiAgent({
  chassisNumber,
  systemPrompt,
  contextLoading,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  // Reset when chassis changes
  useEffect(() => {
    setMessages([])
    setError(null)
  }, [chassisNumber])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending || !systemPrompt) return
    setError(null)
    const next: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const reply = await callAgent(systemPrompt, next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach agent')
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const showSuggestions = messages.length === 0 && !sending

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chassis AI Agent
          </span>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setMessages([])
                setError(null)
              }}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ask anything about{' '}
          <span className="font-mono">{chassisNumber}</span>
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          {contextLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-64" />
              <p className="text-xs text-muted-foreground mt-3">Loading chassis data...</p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} onCopy={() => {}} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2 bg-muted border text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </span>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {error}
                </div>
              )}
              {showSuggestions && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Suggested questions:</p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => void send(p)}
                        className="text-left text-xs rounded-md border bg-card hover:bg-muted px-3 py-2"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t p-3 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending || contextLoading}
            placeholder={
              contextLoading
                ? 'Loading context...'
                : 'Ask about this chassis...'
            }
            className="min-h-[44px] max-h-[120px] text-sm resize-none"
            rows={2}
          />
          <Button
            type="button"
            onClick={() => void send(input)}
            disabled={!input.trim() || sending || contextLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
