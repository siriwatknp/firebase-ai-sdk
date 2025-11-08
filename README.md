# Firebase AI SDK - useChat Hook

A React hook for building chat interfaces with **Firebase AI Logic** (Gemini API), providing an interface compatible with **Vercel AI SDK v5**.

## Overview

This package allows you to use Firebase AI Logic for chat applications while maintaining the same developer experience as Vercel AI SDK's `useChat` hook. It supports:

- ✅ **Streaming responses** - Real-time text generation
- ✅ **Message history** - Automatic conversation management
- ✅ **Type safety** - Full TypeScript support
- ✅ **Compatible API** - Drop-in replacement for Vercel AI SDK v5 interface
- ✅ **Firebase integration** - Direct client-side AI calls (no API routes needed)
- ✅ **Customizable** - Configure model, temperature, and more

## Installation

```bash
npm install firebase-ai-sdk firebase
# or
yarn add firebase-ai-sdk firebase
# or
pnpm add firebase-ai-sdk firebase
```

## Quick Start

### 1. Initialize Firebase

```typescript
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  // ... other config
};

const app = initializeApp(firebaseConfig);
```

### 2. Use the Chat Hook

```typescript
import { useChat } from 'firebase-ai-sdk';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');

  const { messages, status, sendMessage, isLoading } = useChat(app, {
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
      console.error('Error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input });
    setInput('');
  };

  return (
    <div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role}:</strong>
            {message.parts.map((part, idx) => (
              part.type === 'text' && <span key={idx}>{part.text}</span>
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

## API Reference

### `useChat(firebaseApp, options)`

#### Parameters

- **`firebaseApp`** (required): Firebase app instance from `initializeApp()`
- **`options`** (optional): Configuration object

#### Options

```typescript
interface UseChatOptions {
  // Unique identifier for this chat session
  id?: string;

  // Initial messages to populate the chat
  initialMessages?: UIMessage[];

  // Firebase AI Logic model configuration
  modelConfig?: {
    // Model name (default: 'gemini-2.5-flash')
    model?: string;

    // Generation parameters
    generationConfig?: {
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
      stopSequences?: string[];
    };

    // Safety settings
    safetySettings?: Array<{
      category: string;
      threshold: string;
    }>;

    // System instruction
    systemInstruction?: string;
  };

  // Callback when response completes
  onFinish?: (message: UIMessage) => void;

  // Callback when error occurs
  onError?: (error: Error) => void;

  // Callback for tool calls (future feature)
  onToolCall?: (toolCall: ToolCallPart) => void | Promise<unknown>;

  // Throttle message updates (ms)
  experimental_throttle?: number;

  // Max automatic tool call rounds (default: 0)
  maxSteps?: number;
}
```

#### Return Value

```typescript
interface UseChatHelpers {
  // Current messages array
  messages: UIMessage[];

  // Current status: 'ready' | 'submitted' | 'streaming' | 'error'
  status: ChatStatus;

  // Error object if error occurred
  error: Error | undefined;

  // Whether currently loading/streaming
  isLoading: boolean;

  // Send a new message
  sendMessage: (options: SendMessageOptions) => Promise<void>;

  // Stop current streaming response
  stop: () => void;

  // Reload/regenerate last assistant message
  reload: () => Promise<void>;

  // Regenerate specific message by ID
  regenerate: (messageId?: string) => Promise<void>;

  // Update messages locally (no API call)
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;

  // Add tool output (future feature)
  addToolOutput: (options: { toolCallId: string; result: unknown }) => void;
}
```

### Message Structure

```typescript
interface UIMessage {
  // Unique message ID
  id: string;

  // Message role
  role: 'user' | 'assistant' | 'system' | 'data';

  // Message content parts
  parts: MessagePart[];

  // Optional metadata
  metadata?: Record<string, unknown>;

  // Creation timestamp
  createdAt?: Date;
}

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown }
  | { type: 'tool-result'; toolCallId: string; toolName: string; result: unknown };
```

## Advanced Usage

### With Initial Messages

```typescript
const { messages, sendMessage } = useChat(app, {
  initialMessages: [
    {
      id: '1',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Hello! How can I help you today?' }],
    },
  ],
});
```

### With Custom Configuration

```typescript
const { messages, sendMessage } = useChat(app, {
  modelConfig: {
    model: 'gemini-2.0-pro',
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
    systemInstruction: 'You are a helpful coding assistant.',
  },
});
```

### With Message Persistence

```typescript
const { messages, setMessages, sendMessage } = useChat(app, {
  id: 'chat-123',
});

// Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('chat-123');
  if (saved) {
    setMessages(JSON.parse(saved));
  }
}, []);

// Save to localStorage on message change
useEffect(() => {
  localStorage.setItem('chat-123', JSON.stringify(messages));
}, [messages]);
```

### Regenerate Messages

```typescript
const { messages, regenerate, reload } = useChat(app);

// Regenerate last assistant message
<button onClick={reload}>Regenerate Last Response</button>

// Regenerate specific message
<button onClick={() => regenerate(message.id)}>Regenerate This</button>
```

## Comparison with Vercel AI SDK

### Similarities

- **Same interface**: Drop-in replacement for most use cases
- **Message structure**: Compatible `UIMessage` format
- **Streaming**: Real-time response streaming
- **Status management**: Same status states
- **Type safety**: Full TypeScript support

### Differences

| Feature | Vercel AI SDK v5 | Firebase AI SDK |
|---------|------------------|-----------------|
| **Backend** | API routes required | Direct client-side calls |
| **Transport** | Customizable transport | Built-in Firebase AI Logic |
| **Tool calling** | Full support | Coming soon |
| **Input management** | External (v5) | External |
| **Setup complexity** | Higher (needs API routes) | Lower (client-only) |

### Migration from Vercel AI SDK

If you're coming from Vercel AI SDK, the main changes are:

1. **No API route needed** - Firebase AI Logic runs directly in the browser
2. **Pass Firebase app** - First parameter is your Firebase app instance
3. **Model config** - Use `modelConfig` instead of passing to API route

```diff
- const { messages, sendMessage } = useChat({
-   api: '/api/chat',
- });

+ const { messages, sendMessage } = useChat(firebaseApp, {
+   modelConfig: { model: 'gemini-2.5-flash' },
+ });
```

## Examples

See the `/examples` directory for complete working examples:

- **Basic Chat** - Simple chat interface
- **Custom Styling** - Styled chat with Tailwind CSS
- **Message Persistence** - Save/load messages from localStorage
- **Streaming UI** - Visual streaming indicator
- **Multi-model** - Switch between different models

## Limitations

- **Tool calling**: Not yet implemented (coming soon)
- **Attachments**: Image/file support in development
- **Server-side**: Designed for client-side use (consider Cloud Functions for server)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.

## Links

- [Firebase AI Logic Documentation](https://firebase.google.com/docs/ai-logic)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/)
- [Gemini API Documentation](https://ai.google.dev/docs)
