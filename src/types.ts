/**
 * Type definitions compatible with Vercel AI SDK v5 useChat interface
 * Adapted for Firebase AI Logic backend
 */

/**
 * Represents the role of a message in a conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'data';

/**
 * Represents different types of content parts in a message
 */
export type TextPart = {
  type: 'text';
  text: string;
};

export type ToolCallPart = {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown;
};

export type ToolResultPart = {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
};

export type MessagePart = TextPart | ToolCallPart | ToolResultPart;

/**
 * Message metadata type - can be customized per application
 */
export type MessageMetadata = Record<string, unknown>;

/**
 * UIMessage type compatible with Vercel AI SDK v5
 * This is the core message structure used throughout the hook
 */
export interface UIMessage<
  METADATA extends MessageMetadata = MessageMetadata
> {
  /**
   * Unique identifier for the message
   */
  id: string;

  /**
   * The role of the message sender
   */
  role: MessageRole;

  /**
   * The content parts of the message
   * Use this for rendering the message in the UI
   */
  parts: MessagePart[];

  /**
   * Optional metadata attached to the message
   */
  metadata?: METADATA;

  /**
   * Timestamp when the message was created
   */
  createdAt?: Date;
}

/**
 * Status of the chat hook
 */
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  /**
   * The text content to send
   */
  text: string;

  /**
   * Optional metadata to attach to the message
   */
  metadata?: MessageMetadata;

  /**
   * Optional experimental attachments (images, files, etc.)
   */
  experimental_attachments?: Attachment[];
}

/**
 * Attachment type for multimodal messages
 */
export interface Attachment {
  /**
   * Name of the attachment
   */
  name?: string;

  /**
   * MIME type of the attachment
   */
  contentType?: string;

  /**
   * URL or data URI of the attachment
   */
  url: string;
}

/**
 * Firebase AI Logic model configuration
 */
export interface FirebaseModelConfig {
  /**
   * The model to use (e.g., 'gemini-2.5-flash', 'gemini-2.0-pro')
   */
  model?: string;

  /**
   * Generation configuration
   */
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };

  /**
   * Safety settings - will be passed directly to Firebase AI
   */
  safetySettings?: any;

  /**
   * System instruction for the model
   */
  systemInstruction?: string;
}

/**
 * Options for the useChat hook
 */
export interface UseChatOptions<
  METADATA extends MessageMetadata = MessageMetadata
> {
  /**
   * Unique identifier for this chat session
   * Used for persistence and state management
   */
  id?: string;

  /**
   * Initial messages to populate the chat
   */
  initialMessages?: UIMessage<METADATA>[];

  /**
   * Firebase AI Logic model configuration
   */
  modelConfig?: FirebaseModelConfig;

  /**
   * Called when the assistant response has finished streaming
   */
  onFinish?: (message: UIMessage<METADATA>) => void;

  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Called when a tool call is received
   * You must handle the tool execution and return the result
   */
  onToolCall?: (toolCall: ToolCallPart) => void | Promise<unknown>;

  /**
   * Custom throttle wait in milliseconds for chat messages updates
   * Default is undefined (no throttling)
   */
  experimental_throttle?: number;

  /**
   * Maximum number of automatic tool call rounds
   * Default is 0 (no automatic tool calls)
   */
  maxSteps?: number;
}

/**
 * Return type of the useChat hook
 */
export interface UseChatHelpers<
  METADATA extends MessageMetadata = MessageMetadata
> {
  /**
   * The current array of chat messages
   */
  messages: UIMessage<METADATA>[];

  /**
   * The current status of the chat
   */
  status: ChatStatus;

  /**
   * Error object if an error occurred
   */
  error: Error | undefined;

  /**
   * Send a new message to the chat
   */
  sendMessage: (options: SendMessageOptions) => Promise<void>;

  /**
   * Stop the current streaming response
   */
  stop: () => void;

  /**
   * Reload/regenerate the last assistant message
   */
  reload: () => Promise<void>;

  /**
   * Regenerate a specific message by ID
   */
  regenerate: (messageId?: string) => Promise<void>;

  /**
   * Update messages locally without triggering API call
   */
  setMessages: (
    messages:
      | UIMessage<METADATA>[]
      | ((prev: UIMessage<METADATA>[]) => UIMessage<METADATA>[])
  ) => void;

  /**
   * Add a tool result to the chat
   */
  addToolOutput: (options: {
    toolCallId: string;
    result: unknown;
  }) => void;

  /**
   * Whether the chat is currently loading/streaming
   */
  isLoading: boolean;
}
