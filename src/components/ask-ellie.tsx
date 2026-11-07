'use client';
import { useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { ruleBasedReply } from '@/lib/assistant';
type Message = { role: 'user' | 'ellie'; text: string; mode?: string };
const starters = [
  'How can I find affordable care?',
  'What should I ask about insurance?',
  'How do I save an appointment?',
];
export default function AskEllie({
  aiAvailable,
  compact = false,
}: {
  aiAvailable: boolean;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [notice, setNotice] = useState('');
  const log = useRef<HTMLDivElement>(null);
  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setDraft('');
    setBusy(true);
    setNotice('');
    // The default assistant runs entirely in-browser. No chat is sent to any server.
    if (!useAI) {
      setMessages((m) => [
        ...m,
        { role: 'ellie', text: ruleBasedReply(message), mode: 'Navigation guide' },
      ]);
      setBusy(false);
      setTimeout(
        () => log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }),
        30,
      );
      return;
    }
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, useAI }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      setMessages((m) => [
        ...m,
        {
          role: 'ellie',
          text: data.reply,
          mode: data.mode === 'ai' ? 'AI assisted' : 'Navigation guide',
        },
      ]);
      if (data.notice) setNotice(data.notice);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'ellie', text: ruleBasedReply(message), mode: 'Navigation guide' },
      ]);
      setNotice('Connection unavailable. Your local navigation guide answered instead.');
    } finally {
      setBusy(false);
      setTimeout(
        () => log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }),
        30,
      );
    }
  }
  return (
    <section className={`ask-panel ${compact ? 'compact' : ''}`}>
      <div className="ask-panel-head">
        <span className="ellie-orb">
          <MessageCircle size={24} />
        </span>
        <span className="eyebrow">A LITTLE GUIDANCE, A LOT OF CARE</span>
        <span className="guide-badge">{useAI ? 'AI assisted' : 'Rule-based guide'}</span>
      </div>
      <h2>
        Your next step,
        <br />
        <span>with Ellie.</span>
      </h2>
      <p className="ask-intro">
        Healthcare can feel complicated.
        <br />
        You don’t have to navigate it alone.
      </p>
      {messages.length > 0 && (
        <div
          className="chat-log"
          ref={log}
          role="log"
          aria-live="polite"
          aria-label="Conversation with Ellie"
        >
          {messages.map((m, i) => (
            <div className={`message ${m.role}`} key={i}>
              {m.role === 'ellie' && <span className="message-name">Ellie · {m.mode}</span>}
              <p>{m.text}</p>
            </div>
          ))}
          {busy && <p className="small-muted">Ellie is preparing a response…</p>}
        </div>
      )}
      {messages.length === 0 && (
        <div className="starter-questions">
          {starters.map((s) => (
            <button key={s} onClick={() => send(s)}>
              {s}
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      )}
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <label className="sr-only" htmlFor={`ellie-message-${compact}`}>
          Ask Ellie a navigation question
        </label>
        <input
          id={`ellie-message-${compact}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Ask a care navigation question…"
          autoComplete="off"
        />
        <button disabled={!draft.trim() || busy} aria-label="Send message">
          <ArrowUp size={18} />
        </button>
      </form>
      {aiAvailable && (
        <label className="ai-optin">
          <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
          Use AI: send my next message to OpenAI. Leave out personal health details.
        </label>
      )}
      {notice && (
        <p className="small-muted" role="status">
          {notice}
        </p>
      )}
      <p className="ask-disclaimer">
        <ShieldCheck size={13} />
        {useAI
          ? 'AI can make mistakes. Confirm details with a clinic.'
          : 'Navigation support, not medical advice. No chat leaves this browser.'}
      </p>
      {messages.length > 0 && (
        <button className="text-button clear-chat" onClick={() => setMessages([])}>
          Clear conversation
        </button>
      )}
    </section>
  );
}
