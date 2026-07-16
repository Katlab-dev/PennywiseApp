import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { askGemini } from '../services/geminiAssistant';
import { answerFinanceQuery } from '../utils/aiQueryHelper';
import { buildSafeFinancialSummary } from '../utils/assistantFinanceSummary';
import {
  containsSensitiveInformation,
  isHypotheticalFinanceScenario,
  MAX_ASSISTANT_QUESTION_LENGTH,
  redactKnownFinanceText,
  SENSITIVE_INPUT_MESSAGE,
} from '../utils/assistantPrivacy';
import './Assistant.css';

const SAFE_ERROR_CODES = new Set([
  'assistant/empty-question',
  'assistant/question-too-long',
  'assistant/sensitive-input',
  'assistant/sign-in-required',
  'assistant/empty-response',
  'assistant/local-proxy-unavailable',
]);

function getAssistantErrorMessage(error) {
  if (SAFE_ERROR_CODES.has(error?.code) || String(error?.code || '').startsWith('assistant/local-proxy-')) {
    return error.message;
  }

  const code = String(error?.code || '').toLowerCase();
  if (code.includes('quota') || code.includes('resource-exhausted') || code.includes('429')) {
    return 'Gemini has reached its current usage limit. Please try again later.';
  }

  return 'Gemini is unavailable right now. Check your connection and Firebase AI Logic setup, then try again.';
}

export default function Assistant() {
  const {
    incomes,
    expenses,
    totals,
    budget,
    goals,
    loading: financeLoading,
    dataError,
  } = useFinance();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      source: 'PennyWise',
      text: 'Hi! I calculate exact PennyWise figures privately. For personalised guidance, your question is privacy-filtered before Gemini receives it with category totals, budget percentages, and anonymous goal progress — never raw transactions, account details, or personal identifiers.',
    }
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
    if (!trimmed || thinking || financeLoading || dataError) return;

    const userMsg = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const financeData = { incomes, expenses, totals, budget, goals };
      const hypotheticalScenario = isHypotheticalFinanceScenario(trimmed);
      const localReply = hypotheticalScenario
        ? null
        : answerFinanceQuery(trimmed, financeData);
      if (!localReply && containsSensitiveInformation(trimmed)) {
        const privacyError = new Error(SENSITIVE_INPUT_MESSAGE);
        privacyError.code = 'assistant/sensitive-input';
        throw privacyError;
      }
      const reply = localReply || await askGemini(
        redactKnownFinanceText(trimmed, financeData),
        buildSafeFinancialSummary(hypotheticalScenario ? {} : financeData)
      );
      const assistantMsg = {
        sender: 'assistant',
        source: localReply ? 'Private calculation' : 'Gemini guidance',
        text: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          kind: 'error',
          text: getAssistantErrorMessage(error),
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <section className="assistant">
      <header className="assistant__header">
        <span className="assistant__mark" aria-hidden="true">✦</span>
        <div className="assistant__identity">
          <div className="assistant__title">
            PennyWise Guide
            <span className="assistant__badge">Gemini</span>
          </div>
          <p className="assistant__subtitle">Private totals, practical money guidance</p>
        </div>
      </header>

      <div
        className="assistant__chat"
        ref={chatRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`msg-row ${m.sender === 'user' ? 'msg-row--user' : 'msg-row--assistant'}`}
          >
            <div
              className={`msg-bubble ${m.sender === 'user' ? 'msg-bubble--user' : 'msg-bubble--assistant'}${m.kind === 'error' ? ' msg-bubble--error' : ''}`}
            >
              <span>{m.text}</span>
              {m.source && <span className="msg-bubble__source">{m.source}</span>}
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
        {financeLoading ? (
          <p className="assistant__privacy" role="status">
            <span aria-hidden="true">◆</span>
            Loading your PennyWise records before answers are enabled…
          </p>
        ) : dataError ? (
          <p className="assistant__privacy" role="alert">
            <span aria-hidden="true">◆</span>
            Finance data is incomplete. Refresh before using the assistant.
          </p>
        ) : null}
        <div className="assistant__composer">
          <input
            className="assistant__input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your budget, spending, or goals..."
            aria-label="Ask PennyWise Assistant"
            maxLength={MAX_ASSISTANT_QUESTION_LENGTH}
          />
          <button
            className="assistant__send"
            type="submit"
            disabled={!input.trim() || thinking || financeLoading || Boolean(dataError)}
          >
            {financeLoading ? 'Loading…' : 'Ask AI'}
          </button>
        </div>
      </form>
    </section>
  );
}
