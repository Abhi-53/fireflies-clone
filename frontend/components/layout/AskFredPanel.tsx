"use client";

import React, { useState } from "react";
import {
  ArrowUp,
  Bot,
  CheckSquare,
  Layers,
  MessageSquare,
  Mic,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "fred";
  text: string;
}

export function AskFredPanel({
  open = true,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  if (!open) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: query.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I analyzed your meetings. Here are the latest action items and discussion highlights:";
      if (query.toLowerCase().includes("action item")) {
        reply = "Here are your key action items:\n• Prepare sprint velocity metrics for the executive sync.\n• Elena Rostova to review API latency bottlenecks by Friday.\n• Finalize the Q3 product roadmap document.";
      } else if (query.toLowerCase().includes("decision")) {
        reply = "Here are the key decisions recorded across your meetings:\n• Approved the microservices migration timeline for next quarter.\n• Team will adopt FastAPI for core async streaming services.\n• Client demo scheduled for next Wednesday.";
      } else {
        reply = `Based on your recent meetings: We discussed ${query} and noted that next milestones are on track with high speaker engagement.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "fred",
          text: reply,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <aside className="ask-fred-panel" aria-label="Ask Fred AI Assistant">
      {/* Header */}
      <div className="ask-fred__header">
        <div className="ask-fred__title">
          <div className="ask-fred__icon">
            <Bot size={16} />
          </div>
          <span>Ask Fred</span>
        </div>
        <div className="ask-fred__actions">
          <button
            type="button"
            className="ask-fred__icon-btn"
            title="Chat History"
            aria-label="Chat History"
          >
            <MessageSquare size={16} />
          </button>
          <button
            type="button"
            className="ask-fred__icon-btn"
            title="New Chat"
            aria-label="New Chat"
            onClick={() => setMessages([])}
          >
            <Plus size={16} />
          </button>
          {onClose && (
            <button
              type="button"
              className="ask-fred__icon-btn"
              title="Close panel"
              aria-label="Close panel"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="ask-fred__body">
        {/* Integration Card */}
        {bannerVisible && (
          <div className="ask-fred__banner">
            <div className="ask-fred__banner-top">
              <div className="ask-fred__app-icons">
                {/* Slack icon SVG */}
                <div className="app-badge app-badge--slack" title="Slack">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 15a2.5 2.5 0 0 1-2.5-2.5A2.5 2.5 0 0 1 6 10h2.5v2.5A2.5 2.5 0 0 1 6 15z"
                      fill="#E01E5A"
                    />
                    <path
                      d="M8.5 6a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 3.5 6 2.5 2.5 0 0 1 6 3.5h2.5V6z"
                      fill="#36C5F0"
                    />
                    <path
                      d="M18 8.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5h-2.5V11a2.5 2.5 0 0 1 2.5-2.5z"
                      fill="#2EB67D"
                    />
                    <path
                      d="M15.5 18a2.5 2.5 0 0 1 2.5-2.5 2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5h-2.5V18z"
                      fill="#ECB22E"
                    />
                  </svg>
                </div>
                {/* Gmail icon SVG */}
                <div className="app-badge app-badge--gmail" title="Gmail">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 18.5V7.5L12 14.25L21 7.5V18.5C21 19.33 20.33 20 19.5 20H4.5C3.67 20 3 19.33 3 18.5Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M21 5.5C21 4.67 20.33 4 19.5 4H16.5L12 7.375L7.5 4H4.5C3.67 4 3 4.67 3 5.5V7.5L12 14.25L21 7.5V5.5Z"
                      fill="#C5221F"
                    />
                  </svg>
                </div>
              </div>

              <div className="ask-fred__banner-text">
                Connect Slack and Gmail — get answers with full context.
              </div>

              <button
                type="button"
                className="ask-fred__banner-close"
                aria-label="Dismiss integration suggestion"
                onClick={() => setBannerVisible(false)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="ask-fred__banner-actions">
              <button
                type="button"
                className="ask-fred__banner-connect"
                onClick={() => alert("Connecting integrations...")}
              >
                Connect
              </button>
            </div>
          </div>
        )}

        {/* Greeting & Prompts */}
        {messages.length === 0 ? (
          <div className="ask-fred__greeting-section">
            <div className="ask-fred__sparkle-icon">
              <Sparkles size={24} />
            </div>

            <h2 className="ask-fred__greeting-heading">Hi Abhi!</h2>
            <p className="ask-fred__greeting-sub">Get ready for your meeting</p>

            <div className="ask-fred__chips">
              <button
                type="button"
                className="ask-fred__chip"
                onClick={() => handleSend("What are my action items?")}
              >
                <CheckSquare size={14} className="chip-icon--green" />
                <span>My action items</span>
              </button>

              <button
                type="button"
                className="ask-fred__chip"
                onClick={() => handleSend("What were the key decisions made?")}
              >
                <Target size={14} className="chip-icon--red" />
                <span>Key decisions</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="ask-fred__messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ask-fred__msg ask-fred__msg--${m.sender}`}
              >
                {m.sender === "fred" ? (
                  <div className="msg-bot-avatar">
                    <Bot size={13} />
                  </div>
                ) : null}
                <div className="msg-bubble">{m.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="ask-fred__typing">
                <span>Fred is thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input container at bottom */}
      <div className="ask-fred__composer">
        <div className="ask-fred__context-pill">
          <span># My Meetings</span>
        </div>

        <div className="ask-fred__input-box">
          <textarea
            className="ask-fred__textarea"
            rows={1}
            placeholder="Ask anything. Type / to run AI skills."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <div className="ask-fred__input-footer">
            <div className="ask-fred__input-tools-left">
              <button
                type="button"
                className="ask-fred__tool-btn"
                title="Add attachment or context"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                className="ask-fred__tool-btn"
                title="AI skills & prompt templates"
              >
                <Layers size={16} />
              </button>
            </div>

            <div className="ask-fred__input-tools-right">
              <button
                type="button"
                className="ask-fred__tool-btn"
                title="Voice dictation"
              >
                <Mic size={16} />
              </button>
              <button
                type="button"
                className="ask-fred__send-btn"
                aria-label="Send message"
                onClick={() => handleSend()}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
