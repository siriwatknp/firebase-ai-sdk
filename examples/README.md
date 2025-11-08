# Examples

This directory contains example implementations of the `useChat` hook with Firebase AI Logic.

## Setup

Before running the examples, make sure to:

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your Firebase configuration:
```env
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## Examples

### 1. Basic Chat (`basic-chat.tsx`)

A simple chat interface demonstrating the core functionality:
- Sending messages
- Displaying conversation
- Streaming responses
- Error handling
- Loading states

**Features:**
- Minimal setup
- Clean UI
- Status indicators
- Error display

### 2. With Persistence (`with-persistence.tsx`)

Shows how to save and load messages from localStorage:
- Automatic message saving
- Load on mount
- Clear history function
- Message timestamps
- Regenerate functionality

**Features:**
- LocalStorage integration
- Hydration handling
- Message count display
- Clear history button
- Reload/regenerate

### 3. Advanced Configuration (`advanced-config.tsx`)

Demonstrates advanced configuration options:
- Custom model selection
- Temperature control
- Max tokens
- System instructions
- Safety settings
- Custom metadata

**Use Cases:**
- Fine-tuned responses
- Specialized assistants
- Content filtering
- Custom behavior

## Running Examples

These examples are TypeScript/TSX files meant to be integrated into a React application. To use them:

1. Copy the example code into your React app
2. Install required dependencies:
   ```bash
   npm install firebase firebase-ai-sdk react
   ```
3. Update the Firebase configuration with your credentials
4. Import and use the component:
   ```tsx
   import BasicChat from './examples/basic-chat';

   function App() {
     return <BasicChat />;
   }
   ```

## Example with Next.js

```tsx
// app/chat/page.tsx
'use client';

import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { useChat } from 'firebase-ai-sdk';

const app = initializeApp({
  // Your Firebase config
});

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useChat(app);

  return (
    // Your chat UI
  );
}
```

## Example with Vite + React

```tsx
// src/App.tsx
import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { useChat } from 'firebase-ai-sdk';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... other config
});

function App() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useChat(app);

  return (
    // Your chat UI
  );
}
```

## Styling

These examples use inline styles for simplicity. In production, consider using:
- Tailwind CSS
- CSS Modules
- Styled Components
- Emotion
- Your preferred styling solution

## Next Steps

1. **Customize the UI**: Modify the styling to match your brand
2. **Add features**: Implement typing indicators, read receipts, etc.
3. **Integrate auth**: Use Firebase Authentication for user management
4. **Add analytics**: Track usage with Firebase Analytics
5. **Deploy**: Host on Firebase Hosting or your preferred platform

## Common Patterns

### Loading Indicator
```tsx
{isLoading && status === 'streaming' && (
  <div className="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
)}
```

### Message Timestamps
```tsx
{message.createdAt && (
  <time>{new Date(message.createdAt).toLocaleTimeString()}</time>
)}
```

### Auto-scroll to Bottom
```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

return (
  <div className="messages">
    {messages.map(msg => <Message key={msg.id} {...msg} />)}
    <div ref={messagesEndRef} />
  </div>
);
```

### Markdown Rendering
```tsx
import ReactMarkdown from 'react-markdown';

{message.parts.map((part, idx) => {
  if (part.type === 'text') {
    return <ReactMarkdown key={idx}>{part.text}</ReactMarkdown>;
  }
})}
```

## Troubleshooting

### Messages not appearing
- Check that Firebase is initialized correctly
- Verify your API key has AI Logic enabled
- Check browser console for errors

### Streaming not working
- Ensure you're using a supported browser
- Check network connectivity
- Verify model name is correct

### TypeScript errors
- Make sure TypeScript version is 5.0+
- Check that types are properly imported
- Verify Firebase SDK version compatibility

## Resources

- [Firebase AI Logic Docs](https://firebase.google.com/docs/ai-logic)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
