# useChat Return Value - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         useChat() Returns                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────── STATE VALUES ────────────────────────────┐
│                                                                      │
│  ① messages: UIMessage[]                                            │
│     ┌────────────────────────────────────────────────────────────┐  │
│     │ [                                                          │  │
│     │   {                                                        │  │
│     │     id: "msg_abc123",              // Unique ID           │  │
│     │     role: "user",                  // or "assistant"      │  │
│     │     parts: [                                              │  │
│     │       { type: "text", text: "Hello, how are you?" }       │  │
│     │     ],                                                     │  │
│     │     metadata: undefined,           // Optional data       │  │
│     │     createdAt: Date(...)           // Timestamp           │  │
│     │   },                                                       │  │
│     │   {                                                        │  │
│     │     id: "msg_def456",                                      │  │
│     │     role: "assistant",                                     │  │
│     │     parts: [                                               │  │
│     │       { type: "text", text: "I'm doing well!" }           │  │
│     │     ],                                                     │  │
│     │     createdAt: Date(...)                                   │  │
│     │   }                                                        │  │
│     │ ]                                                          │  │
│     └────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ② status: ChatStatus                                               │
│     "ready" | "submitted" | "streaming" | "error"                   │
│                                                                      │
│  ③ error: Error | undefined                                         │
│     undefined  OR  { name: "Error", message: "..." }                │
│                                                                      │
│  ④ isLoading: boolean                                               │
│     true (when sending/streaming)  |  false (idle)                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────── ACTIONS ─────────────────────────────────┐
│                                                                      │
│  ⑤ sendMessage(options)                                             │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ await sendMessage({                                      │    │
│     │   text: "Your message here",                             │    │
│     │   metadata?: { ... },           // Optional              │    │
│     │   experimental_attachments?: [] // Optional              │    │
│     │ })                                                        │    │
│     └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ⑥ stop()                                                            │
│     Aborts the current streaming response                           │
│     Usage: <button onClick={stop}>Stop</button>                     │
│                                                                      │
│  ⑦ reload()                                                          │
│     Regenerates the last assistant message                          │
│     Usage: <button onClick={reload}>Regenerate</button>             │
│                                                                      │
│  ⑧ regenerate(messageId?)                                           │
│     Regenerates a specific message or last if no ID                 │
│     Usage: <button onClick={() => regenerate("msg_123")}>...</>     │
│                                                                      │
│  ⑨ setMessages(messages)                                            │
│     Updates messages locally without API call                       │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ setMessages([])                  // Clear all            │    │
│     │ setMessages(prev => [...prev])   // Functional update    │    │
│     │ setMessages(loadedMessages)      // Set from storage     │    │
│     └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ⑩ addToolOutput({ toolCallId, result })                            │
│     Adds tool/function call results (future feature)                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Example Usage Flow

```typescript
// 1. Initialize the hook
const {
  messages,      // ① Array of messages
  status,        // ② Current status
  error,         // ③ Error if any
  isLoading,     // ④ Loading state
  sendMessage,   // ⑤ Send function
  stop,          // ⑥ Stop function
  reload,        // ⑦ Reload function
  regenerate,    // ⑧ Regenerate function
  setMessages,   // ⑨ Set messages function
  addToolOutput, // ⑩ Add tool output (future)
} = useChat(firebaseApp, options);

// 2. Initial state
messages      → []
status        → "ready"
error         → undefined
isLoading     → false

// 3. User sends a message
await sendMessage({ text: "Hello" });

// During send:
status        → "submitted" → "streaming"
isLoading     → true
messages      → [{ role: "user", ... }]

// During streaming:
messages      → [
                  { role: "user", ... },
                  { role: "assistant", parts: [{ text: "Hel..." }] } // Partial
                ]

// After complete:
status        → "ready"
isLoading     → false
messages      → [
                  { role: "user", ... },
                  { role: "assistant", parts: [{ text: "Hello! ..." }] } // Complete
                ]

// 4. Stop streaming (if needed)
stop();
status        → "ready"
isLoading     → false

// 5. Regenerate response
await reload();
// Removes last assistant message and requests new one

// 6. Update messages locally
setMessages([]); // Clear chat
setMessages(prev => [...prev, customMessage]); // Add message
```

## Message Object Structure

```
UIMessage
├── id: string              ← "msg_abc123" (nanoid)
├── role: MessageRole       ← "user" | "assistant" | "system" | "data"
├── parts: MessagePart[]    ← Array of content parts
│   └── [0]
│       ├── type: "text"
│       └── text: "Hello!"
├── metadata?: object       ← { userId: "123", ... } (optional)
└── createdAt?: Date        ← 2025-01-15T10:30:00.000Z (optional)
```

## Status Flow Diagram

```
                    sendMessage()
         ┌──────────────────────────────────┐
         │                                  │
         ▼                                  │
    ┌────────┐                              │
    │ ready  │ ◄────────────────┐           │
    └────────┘                  │           │
         │                      │           │
         │ sendMessage()        │           │
         │                      │           │
         ▼                      │           │
  ┌────────────┐                │           │
  │ submitted  │                │           │
  └────────────┘                │           │
         │                      │           │
         │ streaming starts     │           │
         │                      │           │
         ▼                      │           │
  ┌────────────┐                │           │
  │ streaming  │────────────────┘           │
  └────────────┘  streaming completes       │
         │                                  │
         │ error occurs                     │
         │                                  │
         ▼                                  │
    ┌───────┐                               │
    │ error │───────────────────────────────┘
    └───────┘         retry / new message
```

## Practical Example Output

```javascript
// Console after calling useChat
const chat = useChat(app);

console.log(chat);
// {
//   messages: [],
//   status: "ready",
//   error: undefined,
//   isLoading: false,
//   sendMessage: [Function],
//   stop: [Function],
//   reload: [Function],
//   regenerate: [Function],
//   setMessages: [Function],
//   addToolOutput: [Function]
// }

// After sending "What is AI?"
await chat.sendMessage({ text: "What is AI?" });

console.log(chat.messages);
// [
//   {
//     id: 'K8pQx2mN9',
//     role: 'user',
//     parts: [{ type: 'text', text: 'What is AI?' }],
//     createdAt: 2025-01-15T14:23:10.445Z
//   },
//   {
//     id: 'L9qRy3nO0',
//     role: 'assistant',
//     parts: [{
//       type: 'text',
//       text: 'AI, or Artificial Intelligence, refers to...'
//     }],
//     createdAt: 2025-01-15T14:23:12.892Z
//   }
// ]

console.log(chat.status);
// "ready"

console.log(chat.isLoading);
// false
```

## Quick Reference

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `UIMessage[]` | All conversation messages |
| `status` | `ChatStatus` | `ready`, `submitted`, `streaming`, or `error` |
| `error` | `Error \| undefined` | Error object if error occurred |
| `isLoading` | `boolean` | `true` when processing |
| `sendMessage` | `Function` | Send a new message |
| `stop` | `Function` | Stop current streaming |
| `reload` | `Function` | Regenerate last response |
| `regenerate` | `Function` | Regenerate specific message |
| `setMessages` | `Function` | Update messages locally |
| `addToolOutput` | `Function` | Add tool results (future) |
