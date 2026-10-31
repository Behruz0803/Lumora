import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Eraser, Info, Send, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react'
import { api, ApiError } from '../services/api'
import { useApi } from '../hooks/useApi'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge, DemoBadge } from '../components/ui/Badge'
import { useToast } from '../context/ToastContext'
import { cn } from '../utils/cn'
import { formatQuantity, formatUZS } from '../utils/format'
import type { ScoredOffer } from '../types'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  offers?: ScoredOffer[]
  suggestions?: string[]
  intent?: string
}

const STARTER_PROMPTS = [
  'Compare potatoes for 100 kg',
  'What is the cheapest option for 50 kg of rice?',
  'Which supplier should I choose for 20 kg of tomatoes?',
  'Show the price trend for cooking oil',
  'How much would I save with the cheapest potato supplier?',
]

export function AssistantPage() {
  const toast = useToast()
  const products = useApi(() => api.products({ page_size: 100, sort: 'name' }), [])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text:
        'Hello! I am the PriceRadar purchasing assistant. I compare supplier offers using total cost — unit price × quantity plus delivery — and never recommend an offer that cannot fulfil your order.\n\nTell me a product and a quantity, for example “100 kg of potatoes”.',
      suggestions: STARTER_PROMPTS.slice(0, 3),
      intent: 'greeting',
    },
  ])
  const [input, setInput] = useState('')
  const [productId, setProductId] = useState<string>('')
  const [quantity, setQuantity] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(2)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', text: trimmed }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setThinking(true)
    try {
      const reply = await api.ask(
        trimmed,
        productId ? Number(productId) : undefined,
        quantity && Number(quantity) > 0 ? Number(quantity) : undefined,
      )
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'assistant',
          text: reply.answer,
          offers: reply.referenced_offers,
          suggestions: reply.suggestions,
          intent: reply.intent,
        },
      ])
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'The assistant could not answer that.'
      toast.error(message)
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'assistant',
          text: `I could not answer that just now. ${message}`,
          intent: 'error',
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  const lastSuggestions =
    [...messages].reverse().find((message) => message.suggestions?.length)?.suggestions ?? STARTER_PROMPTS

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Assistant"
        title="AI Assistant"
        description="Ask about offers, total costs, delivery terms and price trends. Answers come from a transparent rule-based engine over the demo dataset."
        actions={
          <>
            <DemoBadge />
            <button
              type="button"
              onClick={() => {
                setMessages((current) => current.slice(0, 1))
                toast.info('Conversation cleared.')
              }}
              className="btn-secondary"
            >
              <Eraser className="h-4 w-4" />
              Clear chat
            </button>
          </>
        }
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink-soft">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <p>
          <span className="font-semibold text-ink">No external AI model is connected.</span> Every answer is
          generated locally from deterministic pricing rules and the fictional demo dataset, and states its
          reasoning so you can verify it.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="card flex h-[calc(100vh-300px)] min-h-[480px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">PriceRadar assistant</p>
                <p className="text-[11px] text-ink-muted">Rule-based engine · demo dataset</p>
              </div>
            </div>
            <Badge tone="green">Online</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={cn(
                    'flex items-start gap-2.5',
                    message.role === 'user' ? 'flex-row-reverse' : '',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      message.role === 'assistant'
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-ink text-white',
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : (
                      <UserIcon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div
                    className={cn(
                      'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      message.role === 'assistant'
                        ? 'rounded-tl-sm border border-line bg-canvas/70 text-ink-soft'
                        : 'rounded-tr-sm bg-brand-500 text-white',
                    )}
                  >
                    {message.text}
                  </div>
                </div>

                {message.offers && message.offers.length > 0 && (
                  <div className="ml-9 space-y-1.5">
                    {message.offers.slice(0, 3).map((offer) => (
                      <div
                        key={offer.offer_id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[11px]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{offer.supplier_name}</p>
                          <p className="truncate text-ink-muted">
                            {formatUZS(offer.unit_price)} · delivery{' '}
                            {offer.delivery_cost === 0 ? 'free' : formatUZS(offer.delivery_cost)} ·{' '}
                            {formatQuantity(offer.quantity)} units
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-ink">{formatUZS(offer.total_cost)}</p>
                          {offer.is_cheapest ? (
                            <Badge tone="green">Lowest total</Badge>
                          ) : offer.eligible ? (
                            <Badge tone="neutral">Rank {offer.rank}</Badge>
                          ) : (
                            <Badge tone="red">Not eligible</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {thinking && (
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-canvas/70 px-3.5 py-3">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-500"
                      style={{ animationDelay: `${dot * 150}ms` }}
                    />
                  ))}
                  <span className="ml-2 text-[11px] text-ink-muted">Calculating…</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line bg-white px-3 py-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {lastSuggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="chip shrink-0"
                >
                  <Sparkles className="h-3 w-3 text-brand-600" />
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="assistant-input" className="sr-only">
                Message the assistant
              </label>
              <textarea
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void send(input)
                  }
                }}
                rows={1}
                placeholder="Ask about a product, quantity or supplier…"
                className="field max-h-32 min-h-[44px] flex-1 resize-none py-2.5"
              />
              <button type="submit" disabled={!input.trim() || thinking} className="btn-primary px-3 py-3" aria-label="Send message">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-ink">Optional context</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Focus the assistant on a product and quantity for sharper answers.
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="assistant-product" className="mb-1 block text-[11px] font-semibold text-ink-soft">
                  Product
                </label>
                <select
                  id="assistant-product"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className="field py-2 text-xs"
                >
                  <option value="">Any product (detected from text)</option>
                  {(products.data?.items ?? []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assistant-quantity" className="mb-1 block text-[11px] font-semibold text-ink-soft">
                  Quantity
                </label>
                <input
                  id="assistant-quantity"
                  type="number"
                  min={0}
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="e.g. 100"
                  className="field py-2 text-xs"
                />
              </div>
              {(productId || quantity) && (
                <button
                  type="button"
                  onClick={() => {
                    setProductId('')
                    setQuantity('')
                  }}
                  className="text-[11px] font-semibold text-brand-700 hover:underline"
                >
                  Clear context
                </button>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Info className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              What I can do
            </h2>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-ink-soft">
              <li>Compare supplier offers at a given quantity</li>
              <li>Explain why one offer wins on total cost</li>
              <li>Break down product cost, delivery and cost per unit</li>
              <li>Summarise price history and trends</li>
              <li>List supplier contacts, stock and minimum orders</li>
            </ul>
            <p className="mt-3 rounded-lg bg-canvas px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted">
              Limitations: no live market feed, no language model, and no negotiation or ordering automation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
