# useChat Hook - Return Value Examples

## Complete Return Object

When you call `useChat`, you get back an object with the following properties and methods:

```typescript
const {
  // STATE VALUES
  messages,        // Array of UIMessage objects
  status,          // 'ready' | 'submitted' | 'streaming' | 'error'
  error,           // Error object or undefined
  isLoading,       // boolean - true when sending/streaming

  // ACTIONS
  sendMessage,     // Function to send a new message
  stop,            // Function to abort streaming
  reload,          // Function to regenerate last response
  regenerate,      // Function to regenerate specific message
  setMessages,     // Function to update messages locally
  addToolOutput,   // Function to add tool results (future)
} = useChat(firebaseApp, options);
```

## Detailed Breakdown

### 1. `messages` - Array of UIMessage

```typescript
messages: UIMessage[] = [
  {
    id: "msg_abc123",
    role: "user",
    parts: [
      {
        type: "text",
        text: "Hello, how are you?"
      }
    ],
    metadata: undefined,
    createdAt: Date("2025-01-15T10:30:00.000Z")
  },
  {
    id: "msg_def456",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Hello! I'm doing well, thank you for asking. How can I help you today?"
      }
    ],
    metadata: undefined,
    createdAt: Date("2025-01-15T10:30:05.000Z")
  }
]
```

**Structure of each message:**
```typescript
interface UIMessage {
  id: string;                    // Unique identifier (nanoid)
  role: 'user' | 'assistant' | 'system' | 'data';
  parts: MessagePart[];          // Array of content parts
  metadata?: Record<string, unknown>;  // Optional custom data
  createdAt?: Date;              // Timestamp
}
```

### 2. `status` - Current State

```typescript
status: ChatStatus = "ready"  // Can be:
  // "ready"      - Idle, ready for new messages
  // "submitted"  - Message sent, waiting for response
  // "streaming"  - Receiving streaming response
  // "error"      - Error occurred
```

**Status flow during a conversation:**
```
ready → submitted → streaming → ready
  ↓
error (if something fails)
```

### 3. `error` - Error Object

```typescript
error: Error | undefined = undefined  // No error

// When error occurs:
error: Error = {
  name: "Error",
  message: "Failed to send message",
  stack: "..."
}
```

### 4. `isLoading` - Boolean Flag

```typescript
isLoading: boolean = false  // Not loading
isLoading: boolean = true   // Currently sending or streaming
```

### 5. `sendMessage` - Send Function

```typescript
sendMessage: (options: SendMessageOptions) => Promise<void>

// Usage:
await sendMessage({
  text: "What is the weather like?",
  metadata: { userId: "123", timestamp: Date.now() },
  experimental_attachments: [
    { url: "data:image/png;base64,...", contentType: "image/png" }
  ]
});
```

### 6. `stop` - Stop Streaming

```typescript
stop: () => void

// Usage:
<button onClick={stop}>Stop Generation</button>
```

### 7. `reload` - Regenerate Last Response

```typescript
reload: () => Promise<void>

// Usage:
<button onClick={reload}>Regenerate Last Response</button>
```

### 8. `regenerate` - Regenerate Specific Message

```typescript
regenerate: (messageId?: string) => Promise<void>

// Usage:
<button onClick={() => regenerate("msg_def456")}>
  Regenerate This Message
</button>

// Or regenerate last if no ID:
<button onClick={() => regenerate()}>Regenerate</button>
```

### 9. `setMessages` - Update Messages Locally

```typescript
setMessages: (
  messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])
) => void

// Usage - Direct set:
setMessages([]);  // Clear all messages

// Usage - Function update:
setMessages(prev => [...prev, newMessage]);

// Usage - Load from storage:
const saved = localStorage.getItem('chat');
if (saved) setMessages(JSON.parse(saved));
```

### 10. `addToolOutput` - Add Tool Results

```typescript
addToolOutput: (options: { toolCallId: string; result: unknown }) => void

// Usage (future feature):
addToolOutput({
  toolCallId: "tool_123",
  result: { temperature: 72, conditions: "sunny" }
});
```

## Real-World Example

```typescript
import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { useChat } from 'firebase-ai-sdk';

function ChatComponent() {
  const [input, setInput] = useState('');

  const {
    messages,      // All messages in conversation
    status,        // Current status
    error,         // Any error
    isLoading,     // Is processing
    sendMessage,   // Send new message
    stop,          // Stop streaming
    reload,        // Regenerate last
  } = useChat(firebaseApp, {
    modelConfig: {
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.7 }
    },
    onFinish: (message) => {
      console.log('✅ Response complete:', message);
    },
    onError: (err) => {
      console.error('❌ Error:', err);
    }
  });

  // Example state at different times:

  // INITIALLY (no messages yet):
  // messages = []
  // status = "ready"
  // error = undefined
  // isLoading = false

  // AFTER USER SENDS "Hello":
  // messages = [{ id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] }]
  // status = "submitted"
  // isLoading = true

  // WHILE AI IS RESPONDING (streaming "Hello! How..."):
  // messages = [
  //   { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
  //   { id: "2", role: "assistant", parts: [{ type: "text", text: "Hello! How..." }] }
  // ]
  // status = "streaming"
  // isLoading = true

  // AFTER AI FINISHES:
  // messages = [
  //   { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
  //   { id: "2", role: "assistant", parts: [{ type: "text", text: "Hello! How can I help?" }] }
  // ]
  // status = "ready"
  // isLoading = false

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendMessage({ text: input });
    setInput('');
  };

  return (
    <div>
      {/* Display Messages */}
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong>
          {msg.parts.map(part =>
            part.type === 'text' && <p>{part.text}</p>
          )}
        </div>
      ))}

      {/* Show status */}
      <div>Status: {status}</div>

      {/* Show error */}
      {error && <div>Error: {error.message}</div>}

      {/* Show loading */}
      {isLoading && <div>Loading...</div>}

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Send</button>
        {isLoading && <button type="button" onClick={stop}>Stop</button>}
      </form>

      {/* Regenerate */}
      {messages.length > 0 && (
        <button onClick={reload}>Regenerate Last</button>
      )}
    </div>
  );
}
```

## Message Parts Examples

Messages can have different types of parts:

### Text Part
```typescript
{
  type: "text",
  text: "Hello, world!"
}
```

### Tool Call Part (future)
```typescript
{
  type: "tool-call",
  toolCallId: "call_abc123",
  toolName: "getWeather",
  args: { city: "San Francisco" }
}
```

### Tool Result Part (future)
```typescript
{
  type: "tool-result",
  toolCallId: "call_abc123",
  toolName: "getWeather",
  result: { temp: 72, condition: "sunny" }
}
```

## Status Visualization

```
User sends message:
┌─────────────────────────────────────────┐
│ status: "ready" → "submitted"           │
│ isLoading: false → true                 │
│ messages: [..., newUserMessage]         │
└─────────────────────────────────────────┘

AI starts streaming:
┌─────────────────────────────────────────┐
│ status: "streaming"                     │
│ isLoading: true                         │
│ messages: [..., partialAIMessage]       │
│           (updates in real-time)        │
└─────────────────────────────────────────┘

AI finishes:
┌─────────────────────────────────────────┐
│ status: "ready"                         │
│ isLoading: false                        │
│ messages: [..., completeAIMessage]      │
│ onFinish callback fired ✓               │
└─────────────────────────────────────────┘

If error occurs:
┌─────────────────────────────────────────┐
│ status: "error"                         │
│ isLoading: false                        │
│ error: Error { message: "..." }        │
│ onError callback fired ✓                │
└─────────────────────────────────────────┘
```

## TypeScript Type Reference

```typescript
// What you get back:
interface UseChatHelpers<METADATA = MessageMetadata> {
  messages: UIMessage<METADATA>[];
  status: ChatStatus;
  error: Error | undefined;
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  stop: () => void;
  reload: () => Promise<void>;
  regenerate: (messageId?: string) => Promise<void>;
  setMessages: (
    messages: UIMessage<METADATA>[] |
    ((prev: UIMessage<METADATA>[]) => UIMessage<METADATA>[])
  ) => void;
  addToolOutput: (options: { toolCallId: string; result: unknown }) => void;
  isLoading: boolean;
}

// Message type:
interface UIMessage<METADATA = MessageMetadata> {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  parts: MessagePart[];
  metadata?: METADATA;
  createdAt?: Date;
}

// Status type:
type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

// Send options:
interface SendMessageOptions {
  text: string;
  metadata?: MessageMetadata;
  experimental_attachments?: Attachment[];
}
```

## Console Output Example

```javascript
// After calling useChat
console.log(messages);
// Output:
// []

// After sending first message
console.log(messages);
// Output:
// [
//   {
//     id: 'xYz789AbC',
//     role: 'user',
//     parts: [{ type: 'text', text: 'Hello' }],
//     createdAt: 2025-01-15T10:30:00.000Z
//   }
// ]

// During streaming
console.log(messages);
// Output:
// [
//   { id: 'xYz789AbC', role: 'user', ... },
//   {
//     id: 'aBc123XyZ',
//     role: 'assistant',
//     parts: [{ type: 'text', text: 'Hello! How can I...' }], // Partial
//     createdAt: 2025-01-15T10:30:01.000Z
//   }
// ]

// After streaming completes
console.log(messages);
// Output:
// [
//   { id: 'xYz789AbC', role: 'user', ... },
//   {
//     id: 'aBc123XyZ',
//     role: 'assistant',
//     parts: [{ type: 'text', text: 'Hello! How can I help you today?' }], // Complete
//     createdAt: 2025-01-15T10:30:01.000Z
//   }
// ]

console.log(status);
// Output: 'ready'

console.log(isLoading);
// Output: false

console.log(error);
// Output: undefined
```
