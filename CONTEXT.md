# Firebase AI SDK - Context and Research Summary

## Overview

This document summarizes the research and context gathered for building a `useChat` hook compatible with Vercel AI SDK v5, but using Firebase AI Logic as the backend.

## Research Findings

### Vercel AI SDK v5 - useChat Interface

**Key Features:**
- **Transport-based architecture**: v5 moved to a pluggable transport system
- **No internal input management**: Unlike v4, v5 doesn't manage form input state
- **Type safety**: Full TypeScript support with generics for metadata, tools, and data
- **Message structure**: Uses `UIMessage` as the core type with `id`, `role`, `parts`, and `metadata`
- **Streaming support**: Real-time streaming of responses
- **Status states**: `ready`, `submitted`, `streaming`, `error`
- **Tool calling**: Full support for function/tool calling with automatic handling

**Return Values:**
```typescript
{
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  sendMessage: (options) => Promise<void>;
  stop: () => void;
  reload: () => Promise<void>;
  regenerate: (messageId?) => Promise<void>;
  setMessages: (messages) => void;
  addToolOutput: (options) => void;
  isLoading: boolean;
}
```

**Message Structure:**
```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  parts: MessagePart[];  // Array of text, tool-call, or tool-result parts
  metadata?: Record<string, unknown>;
}
```

### Firebase AI Logic

**Key Features:**
- **Client-side AI calls**: No need for API routes
- **Streaming support**: Via `sendMessageStream()` and async iteration
- **Chat sessions**: Built-in history management with `startChat()`
- **Model support**: Gemini 2.5 Flash, Gemini 2.0 Pro, etc.
- **Configuration**: Temperature, topP, topK, maxOutputTokens, safety settings

**API Methods:**
```typescript
// Initialize
const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });

// Start chat
const chat = model.startChat({ history: [...] });

// Stream response
const result = await chat.sendMessageStream(message);
for await (const chunk of result.stream) {
  const text = chunk.text();
}
```

**Note**: The `@google/generative-ai` package is being deprecated in favor of `@google/genai`, but Firebase AI Logic uses its own `firebase/ai` package which follows similar patterns.

## Design Decisions

### 1. Interface Compatibility
- Match Vercel AI SDK v5's interface as closely as possible
- Use same type names (`UIMessage`, `UseChatOptions`, etc.)
- Support same return values and methods

### 2. Firebase Integration
- Accept Firebase app instance as first parameter
- Use `firebase/ai` package (not `@google/generative-ai`)
- Support Firebase-specific configuration (model, generationConfig, etc.)

### 3. Streaming Implementation
- Use Firebase's `sendMessageStream()` for streaming
- Update React state incrementally during streaming
- Support abort/stop functionality

### 4. State Management
- Use React hooks (`useState`, `useCallback`, `useRef`)
- Track messages, status, error, and loading state
- Support optional throttling for performance

### 5. Message Format
- Convert between UIMessage format and Firebase's Content format
- Support text parts (tool parts reserved for future)
- Include timestamps and metadata

## Implementation Highlights

### Core Hook (`use-chat.ts`)
- **350+ lines** of TypeScript
- Full streaming support with abort control
- Message history conversion
- Error handling and callbacks
- Reload/regenerate functionality

### Type Definitions (`types.ts`)
- Complete TypeScript definitions
- Compatible with Vercel AI SDK v5 types
- Generic support for metadata
- Extensible for future features

### Examples
- Basic chat interface
- Message persistence with localStorage
- Error handling
- Custom styling

## Key Differences from Vercel AI SDK

| Feature | Vercel AI SDK v5 | Firebase AI SDK |
|---------|------------------|-----------------|
| Backend | API routes | Client-side Firebase |
| Transport | Pluggable | Built-in |
| Setup | Complex (needs API routes) | Simple (client only) |
| Tool calling | ✅ Full support | ⏳ Coming soon |
| Input management | External | External |
| Attachments | ✅ Supported | ⏳ In development |

## Future Enhancements

1. **Tool Calling**: Implement function/tool calling support
2. **Attachments**: Add image and file upload support
3. **Server-side**: Cloud Functions integration
4. **Optimistic Updates**: Better UX during sends
5. **Middleware**: Request/response interceptors
6. **Multi-modal**: Image generation support

## References

- [Vercel AI SDK v5 Documentation](https://ai-sdk.dev/)
- [Firebase AI Logic Documentation](https://firebase.google.com/docs/ai-logic)
- [Vercel AI SDK GitHub](https://github.com/vercel/ai)
- [Firebase AI Logic Blog](https://firebase.blog/posts/2025/05/building-ai-apps/)
