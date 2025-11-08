/**
 * Firebase AI SDK - useChat hook compatible with Vercel AI SDK v5
 *
 * This package provides a React hook for building chat interfaces
 * using Firebase AI Logic (Gemini API), with an interface that matches
 * the Vercel AI SDK v5 useChat hook.
 */

export { useChat } from './use-chat';
export type {
  // Core types
  UIMessage,
  MessageRole,
  MessagePart,
  MessageMetadata,
  TextPart,
  ToolCallPart,
  ToolResultPart,

  // Status
  ChatStatus,

  // Options
  UseChatOptions,
  SendMessageOptions,
  FirebaseModelConfig,
  Attachment,

  // Return type
  UseChatHelpers,
} from './types';
