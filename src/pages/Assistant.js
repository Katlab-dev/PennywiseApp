import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { answerFinanceQuery } from '../utils/aiQueryHelper';
import './Assistant.css';

export default function Assistant() {
  const { incomes, expenses, totals } = useFinance();
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hi! Ask me about your balance, this month’s income, or spending by category.' }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || thinking) return;

    const userMsg = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    await new Promise((r) => setTimeout(r, 350));
    const reply = answerFinanceQuery(trimmed, { incomes, expenses, totals });
    const assistantMsg = { sender: 'assistant', text: reply };
    setMessages((prev) => [...prev, assistantMsg]);
    setThinking(false);
  }

  return (
    <section className="assistant">
      <header className="assistant__header">💬 PennyWise Assistant</header>

      <div className="assistant__chat" ref={chatRef}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`msg-row ${m.sender === 'user' ? 'msg-row--user' : 'msg-row--assistant'}`}
          >
            <div className={`msg-bubble ${m.sender === 'user' ? 'msg-bubble--user' : 'msg-bubble--assistant'}`}>
              {m.text}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="msg-row msg-row--assistant">
            <div className="msg-bubble msg-bubble--assistant typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      <form className="assistant__inputbar" onSubmit={handleSend} noValidate>
        <input
          className="assistant__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          aria-label="Ask something"
        />
        <button className="assistant__send" type="submit" disabled={!input.trim() || thinking}>
          Send
        </button>
      </form>
    </section>
  );
}
