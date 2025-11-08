/**
 * Basic Chat Example
 *
 * This example demonstrates a simple chat interface using the useChat hook
 * with Firebase AI Logic.
 */

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { useChat } from '../src';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export default function BasicChat() {
  const [input, setInput] = useState('');

  const { messages, status, sendMessage, isLoading, error } = useChat(app, {
    modelConfig: {
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    },
    onFinish: (message) => {
      console.log('Response complete:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage({ text: input });
    setInput('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Firebase AI Chat</h1>

      {/* Messages Container */}
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
        {messages.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center' }}>
            Start a conversation by typing a message below.
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor:
                message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            }}
          >
            <strong style={{ textTransform: 'capitalize' }}>
              {message.role}:
            </strong>
            {message.parts.map((part, idx) => {
              if (part.type === 'text') {
                return (
                  <p key={idx} style={{ margin: '4px 0 0 0' }}>
                    {part.text}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && status === 'streaming' && (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            AI is typing...
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

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
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Status Display */}
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
        Status: <strong>{status}</strong>
      </div>
    </div>
  );
}
