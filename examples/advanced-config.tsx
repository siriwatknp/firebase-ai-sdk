/**
 * Advanced Configuration Example
 *
 * This example demonstrates advanced configuration options including:
 * - Custom model selection
 * - Temperature and generation parameters
 * - System instructions
 * - Safety settings
 * - Message metadata
 */

import { useState } from 'react';
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

type AssistantType = 'creative' | 'precise' | 'coding';

const ASSISTANT_CONFIGS = {
  creative: {
    model: 'gemini-2.0-pro',
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
    systemInstruction:
      'You are a creative writing assistant. Help users with creative content, storytelling, and imaginative ideas.',
  },
  precise: {
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      topK: 10,
      maxOutputTokens: 1024,
    },
    systemInstruction:
      'You are a precise and factual assistant. Provide accurate, concise, and well-researched information.',
  },
  coding: {
    model: 'gemini-2.0-pro',
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      topK: 20,
      maxOutputTokens: 4096,
    },
    systemInstruction:
      'You are an expert coding assistant. Help users with programming questions, code reviews, and debugging. Always explain your solutions.',
  },
};

export default function AdvancedConfigChat() {
  const [input, setInput] = useState('');
  const [assistantType, setAssistantType] =
    useState<AssistantType>('creative');
  const [showConfig, setShowConfig] = useState(false);

  const config = ASSISTANT_CONFIGS[assistantType];

  const { messages, sendMessage, isLoading, error, reload, setMessages } =
    useChat(app, {
      id: `chat-${assistantType}`,
      modelConfig: config,
      onFinish: (message) => {
        console.log('Response finished:', message);
      },
      onError: (error) => {
        console.error('Chat error:', error);
      },
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage({
      text: input,
      metadata: {
        assistantType,
        timestamp: Date.now(),
      },
    });
    setInput('');
  };

  const handleAssistantChange = (type: AssistantType) => {
    if (
      messages.length > 0 &&
      !confirm('Changing assistant will clear the current conversation. Continue?')
    ) {
      return;
    }
    setAssistantType(type);
    setMessages([]);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1>Advanced AI Chat Configuration</h1>
        <p style={{ color: '#666' }}>
          Select an assistant type to see different AI behaviors and configurations.
        </p>
      </div>

      {/* Assistant Type Selector */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {(Object.keys(ASSISTANT_CONFIGS) as AssistantType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleAssistantChange(type)}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor:
                assistantType === type ? '#2196f3' : '#e0e0e0',
              color: assistantType === type ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: assistantType === type ? 'bold' : 'normal',
              textTransform: 'capitalize',
            }}
          >
            {type}
          </button>
        ))}
        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f5f5f5',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '6px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          {showConfig ? 'Hide' : 'Show'} Config
        </button>
      </div>

      {/* Configuration Display */}
      {showConfig && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Current Configuration</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      )}

      {/* Messages Container */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          minHeight: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
          marginBottom: '16px',
          backgroundColor: '#fafafa',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            <p>
              <strong>
                {assistantType.charAt(0).toUpperCase() +
                  assistantType.slice(1)}{' '}
                Assistant
              </strong>
            </p>
            <p style={{ fontSize: '14px' }}>
              {config.systemInstruction}
            </p>
            <p style={{ fontSize: '14px', marginTop: '16px' }}>
              Start a conversation below!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor:
                message.role === 'user' ? '#e3f2fd' : '#ffffff',
              border: message.role === 'user' ? 'none' : '1px solid #e0e0e0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <strong style={{ textTransform: 'capitalize' }}>
                {message.role === 'assistant'
                  ? `${assistantType} Assistant`
                  : 'You'}
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
                  <p
                    key={idx}
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                    }}
                  >
                    {part.text}
                  </p>
                );
              }
              return null;
            })}
            {message.metadata && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#999',
                }}
              >
                Mode: {message.metadata.assistantType as string}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              color: '#666',
              fontStyle: 'italic',
              padding: '8px',
            }}
          >
            {assistantType.charAt(0).toUpperCase() + assistantType.slice(1)}{' '}
            assistant is thinking...
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

      {/* Actions */}
      {messages.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={reload}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Regenerate Last Response
          </button>
          <button
            onClick={() => setMessages([])}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Clear Chat
          </button>
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
            placeholder={`Ask the ${assistantType} assistant...`}
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

      {/* Info */}
      <div
        style={{
          marginTop: '16px',
          fontSize: '13px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        Using <strong>{config.model}</strong> with temperature{' '}
        <strong>{config.generationConfig.temperature}</strong>
      </div>
    </div>
  );
}
