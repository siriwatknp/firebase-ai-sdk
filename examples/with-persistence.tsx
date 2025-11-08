/**
 * Chat with Message Persistence Example
 *
 * This example shows how to save and load chat messages from localStorage
 * to persist conversations across page reloads.
 */

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { useChat } from '../src';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const CHAT_STORAGE_KEY = 'firebase-ai-chat-messages';

export default function ChatWithPersistence() {
  const [input, setInput] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const { messages, sendMessage, setMessages, isLoading, reload } = useChat(
    app,
    {
      id: 'persisted-chat',
      modelConfig: {
        model: 'gemini-2.5-flash',
      },
    }
  );

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error('Failed to load saved messages:', error);
      }
    }
    setIsHydrated(true);
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isHydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage({ text: input });
    setInput('');
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1>Persistent Chat</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={reload}
            disabled={messages.length === 0 || isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Regenerate Last
          </button>
          <button
            onClick={handleClearHistory}
            disabled={messages.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          minHeight: '400px',
          maxHeight: '600px',
          overflowY: 'auto',
          marginBottom: '16px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            <p>No messages yet.</p>
            <p style={{ fontSize: '14px' }}>
              Your conversation will be saved automatically.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor:
                  message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <strong style={{ textTransform: 'capitalize' }}>
                  {message.role}
                </strong>
                {message.createdAt && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {message.parts.map((part, idx) => {
                if (part.type === 'text') {
                  return (
                    <p key={idx} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {part.text}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          ))
        )}

        {isLoading && (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            AI is typing...
          </div>
        )}
      </div>

      {/* Message count */}
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
        {messages.length} message{messages.length !== 1 ? 's' : ''} in history
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '6px',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isLoading ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
