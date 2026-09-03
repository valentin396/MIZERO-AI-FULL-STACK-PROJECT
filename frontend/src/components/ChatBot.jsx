import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { send('', true); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(text, isFirst = false) {
    if (!isFirst) setMessages((m) => [...m, { from: 'user', text }]);
    setLoading(true);
    try {
      const res = await api.post('/chat', { session_id: sessionId, message: text });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m, { from: 'bot', text: res.data.reply }]);
      setDone(res.data.done);
      setOptions(res.data.options);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading || done) return;
    setOptions(null);
    send(input.trim());
    setInput('');
  }

  function handleOption(opt) {
    if (loading || done) return;
    setOptions(null);
    send(opt);
  }

  return (
    <div className="border border-ink/15 bg-cream flex flex-col h-[70vh] max-h-[640px]">
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${m.from === 'user' ? 'bg-hills text-cream' : 'bg-paper text-ink border border-ink/10'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-ink/40">MIZERO is typing…</p>}
        <div ref={bottomRef} />
      </div>
      {options && !done && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-ink/10 bg-paper">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => handleOption(opt)}
              className="text-xs px-3 py-1.5 border border-ink/20 bg-cream hover:border-clay hover:text-clay transition-colors">
              {opt}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="border-t border-ink/10 flex">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={done || loading}
          placeholder={done ? 'Report complete' : 'Andika ubutumwa... (type your reply)'}
          className="flex-1 px-4 py-3 text-sm bg-cream disabled:bg-ink/5 focus:outline-none" />
        <button type="submit" disabled={done || loading} className="px-5 text-sm font-medium text-clay disabled:text-ink/30">Send</button>
      </form>
    </div>
  );
}
