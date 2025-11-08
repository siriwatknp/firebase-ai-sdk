/**
 * useChat hook for Firebase AI Logic
 * Compatible with Vercel AI SDK v5 interface
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { FirebaseApp } from 'firebase/app';
import type {
  GenerativeModel,
  ChatSession,
  Content,
  Part,
} from 'firebase/ai';
import {
  UseChatOptions,
  UseChatHelpers,
  UIMessage,
  MessageMetadata,
  SendMessageOptions,
  ChatStatus,
  MessagePart,
  TextPart,
} from './types';

/**
 * Convert UIMessage array to Firebase AI Logic history format
 */
function convertMessagesToHistory(messages: UIMessage[]): Content[] {
  return messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => {
      const parts: Part[] = msg.parts
        .filter((part): part is TextPart => part.type === 'text')
        .map((part) => ({ text: part.text }));

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
}

/**
 * Convert Firebase AI Logic response to UIMessage
 */
function convertResponseToMessage(
  text: string,
  role: 'user' | 'assistant',
  metadata?: MessageMetadata
): UIMessage {
  return {
    id: nanoid(),
    role,
    parts: [
      {
        type: 'text',
        text,
      },
    ],
    metadata,
    createdAt: new Date(),
  };
}

/**
 * Custom hook for chat functionality using Firebase AI Logic
 * Provides Vercel AI SDK v5 compatible interface
 */
export function useChat<METADATA extends MessageMetadata = MessageMetadata>(
  firebaseApp: FirebaseApp,
  options: UseChatOptions<METADATA> = {}
): UseChatHelpers<METADATA> {
  const {
    id: chatId,
    initialMessages = [],
    modelConfig = {},
    onFinish,
    onError,
    onToolCall,
    experimental_throttle,
    maxSteps = 0,
  } = options;

  // State management
  const [messages, setMessages] = useState<UIMessage<METADATA>[]>(
    initialMessages as UIMessage<METADATA>[]
  );
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for managing chat session and abort controller
  const chatSessionRef = useRef<ChatSession | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const modelRef = useRef<GenerativeModel | null>(null);

  // Throttle state
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessagesRef = useRef<UIMessage<METADATA>[]>([]);

  /**
   * Initialize Firebase AI Logic model
   */
  const initializeModel = useCallback(async () => {
    try {
      // Dynamically import Firebase AI Logic
      const { getAI, getGenerativeModel } = await import('firebase/ai');

      const ai = getAI(firebaseApp);
      const model = getGenerativeModel(ai, {
        model: modelConfig.model || 'gemini-2.5-flash',
        generationConfig: modelConfig.generationConfig,
        safetySettings: modelConfig.safetySettings,
        systemInstruction: modelConfig.systemInstruction,
      });

      modelRef.current = model;
      return model;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err : new Error('Failed to initialize model');
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw errorMessage;
    }
  }, [firebaseApp, modelConfig, onError]);

  /**
   * Update messages with optional throttling
   */
  const updateMessages = useCallback(
    (newMessages: UIMessage<METADATA>[]) => {
      if (experimental_throttle) {
        pendingMessagesRef.current = newMessages;

        if (!throttleTimeoutRef.current) {
          throttleTimeoutRef.current = setTimeout(() => {
            setMessages(pendingMessagesRef.current);
            throttleTimeoutRef.current = null;
          }, experimental_throttle);
        }
      } else {
        setMessages(newMessages);
      }
    },
    [experimental_throttle]
  );

  /**
   * Send a message to the chat
   */
  const sendMessage = useCallback(
    async (options: SendMessageOptions) => {
      const { text, metadata, experimental_attachments } = options;

      if (!text.trim()) {
        return;
      }

      try {
        setStatus('submitted');
        setIsLoading(true);
        setError(undefined);

        // Create user message
        const userMessage = convertResponseToMessage(
          text,
          'user',
          metadata as METADATA
        );

        // Add user message to state
        const updatedMessages = [...messages, userMessage];
        updateMessages(updatedMessages);

        // Initialize model if not already done
        const model = modelRef.current || (await initializeModel());

        // Convert messages to history format
        const history = convertMessagesToHistory(updatedMessages);

        // Start or continue chat session
        const chat = model.startChat({
          history: history.slice(0, -1), // Exclude the last user message from history
          generationConfig: modelConfig.generationConfig,
          safetySettings: modelConfig.safetySettings,
        });

        chatSessionRef.current = chat;
        abortControllerRef.current = new AbortController();

        // Set streaming status
        setStatus('streaming');

        // Send message and stream response
        const result = await chat.sendMessageStream(text);

        let accumulatedText = '';
        const assistantMessageId = nanoid();

        // Stream chunks
        for await (const chunk of result.stream) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const chunkText = chunk.text();
          accumulatedText += chunkText;

          // Create partial assistant message
          const assistantMessage: UIMessage<METADATA> = {
            id: assistantMessageId,
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: accumulatedText,
              },
            ],
            createdAt: new Date(),
          };

          // Update messages with streaming response
          updateMessages([...updatedMessages, assistantMessage]);
        }

        // Final message
        const finalMessage: UIMessage<METADATA> = {
          id: assistantMessageId,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: accumulatedText,
            },
          ],
          createdAt: new Date(),
        };

        const finalMessages = [...updatedMessages, finalMessage];
        updateMessages(finalMessages);

        // Update status
        setStatus('ready');
        setIsLoading(false);

        // Call onFinish callback
        if (onFinish) {
          onFinish(finalMessage);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err : new Error('Failed to send message');

        setError(errorMessage);
        setStatus('error');
        setIsLoading(false);

        if (onError) {
          onError(errorMessage);
        }
      }
    },
    [
      messages,
      modelConfig,
      updateMessages,
      initializeModel,
      onFinish,
      onError,
    ]
  );

  /**
   * Stop the current streaming response
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('ready');
    setIsLoading(false);
  }, []);

  /**
   * Reload/regenerate the last assistant message
   */
  const reload = useCallback(async () => {
    // Find the last user message
    const lastUserMessageIndex = messages.findLastIndex(
      (msg) => msg.role === 'user'
    );

    if (lastUserMessageIndex === -1) {
      return;
    }

    const lastUserMessage = messages[lastUserMessageIndex];
    const textPart = lastUserMessage.parts.find(
      (part): part is TextPart => part.type === 'text'
    );

    if (!textPart) {
      return;
    }

    // Remove messages after the last user message
    const messagesUpToUser = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(messagesUpToUser);

    // Resend the last user message
    await sendMessage({
      text: textPart.text,
      metadata: lastUserMessage.metadata,
    });
  }, [messages, sendMessage]);

  /**
   * Regenerate a specific message by ID
   */
  const regenerate = useCallback(
    async (messageId?: string) => {
      if (!messageId) {
        // If no message ID, regenerate the last assistant message
        return reload();
      }

      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) {
        return;
      }

      // Find the user message before this message
      const userMessageIndex = messages
        .slice(0, messageIndex)
        .findLastIndex((msg) => msg.role === 'user');

      if (userMessageIndex === -1) {
        return;
      }

      const userMessage = messages[userMessageIndex];
      const textPart = userMessage.parts.find(
        (part): part is TextPart => part.type === 'text'
      );

      if (!textPart) {
        return;
      }

      // Remove messages after the user message
      const messagesUpToUser = messages.slice(0, userMessageIndex + 1);
      setMessages(messagesUpToUser);

      // Resend the user message
      await sendMessage({
        text: textPart.text,
        metadata: userMessage.metadata,
      });
    },
    [messages, reload, sendMessage]
  );

  /**
   * Update messages locally without triggering API call
   */
  const setMessagesLocal = useCallback(
    (
      newMessages:
        | UIMessage<METADATA>[]
        | ((prev: UIMessage<METADATA>[]) => UIMessage<METADATA>[])
    ) => {
      if (typeof newMessages === 'function') {
        setMessages((prev) => newMessages(prev));
      } else {
        setMessages(newMessages);
      }
    },
    []
  );

  /**
   * Add a tool result to the chat
   */
  const addToolOutput = useCallback(
    (options: { toolCallId: string; result: unknown }) => {
      // Tool support can be added in future versions
      console.warn('Tool calls are not yet implemented for Firebase AI Logic');
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    status,
    error,
    sendMessage,
    stop,
    reload,
    regenerate,
    setMessages: setMessagesLocal,
    addToolOutput,
    isLoading,
  };
}
