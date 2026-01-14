# AI SDK Elements - Component API Reference

Complete props reference for all chatbot components.

---

## Conversation Components

### `<Conversation />`

Main chat container with auto-scroll.

| Prop | Type | Description |
|------|------|-------------|
| `contextRef` | `React.Ref<StickToBottomContext>` | Ref for scroll context |
| `instance` | `StickToBottomInstance` | Scroll instance |
| `children` | `ReactNode \| RenderFunction` | Content |
| `className` | `string` | Tailwind classes |

### `<ConversationContent />`

Message wrapper within Conversation.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode \| RenderFunction` | Messages |
| `className` | `string` | Tailwind classes |

### `<ConversationEmptyState />`

Displayed when no messages.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"No messages yet"` | Heading |
| `description` | `string` | - | Subtext |
| `icon` | `ReactNode` | - | Icon component |
| `children` | `ReactNode` | - | Additional content |

### `<ConversationScrollButton />`

Scroll-to-bottom button (appears when scrolled up).

Extends Button component props.

---

## Message Components

### `<Message />`

Individual message container.

| Prop | Type | Description |
|------|------|-------------|
| `from` | `'user' \| 'assistant' \| 'system'` | Message sender |
| `children` | `ReactNode` | Message content |
| `className` | `string` | Tailwind classes |

### `<MessageContent />`

Text content of a message.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content |
| `className` | `string` | Tailwind classes |

---

## Prompt Input

### `<PromptInput />`

User text input.

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Input value |
| `onChange` | `(e: ChangeEvent) => void` | Change handler |
| `onSubmit` | `() => void` | Submit handler |
| `placeholder` | `string` | Placeholder text |
| `disabled` | `boolean` | Disable input |
| `className` | `string` | Tailwind classes |

---

## Reasoning Components

### `<Reasoning />`

Collapsible reasoning container.

| Prop | Type | Description |
|------|------|-------------|
| `isStreaming` | `boolean` | Auto-open when streaming, close when done |
| `children` | `ReactNode` | Trigger + Content |
| `className` | `string` | Tailwind classes |

Extends Radix UI `Collapsible` props.

### `<ReasoningTrigger />`

Clickable header for reasoning.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Label text |
| `getThinkingMessage` | `() => string` | Custom status message |
| `className` | `string` | Tailwind classes |

Extends `CollapsibleTrigger` props.

### `<ReasoningContent />`

Reasoning text content.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Reasoning text |
| `className` | `string` | Tailwind classes |

Extends `CollapsibleContent` props.

---

## Chain of Thought Components

### `<ChainOfThought />`

Visual reasoning steps container.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Steps |
| `className` | `string` | Tailwind classes |

### `<ChainOfThoughtStep />`

Individual reasoning step.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Icon + Content |
| `className` | `string` | Tailwind classes |

### `<ChainOfThoughtIcon />`

Step icon.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Icon element |

### `<ChainOfThoughtContent />`

Step content.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Text + links |

### `<ChainOfThoughtLinks />`

Links container.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Link components |

### `<ChainOfThoughtLink />`

Individual link.

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | URL |
| `children` | `ReactNode` | Link text |

---

## Confirmation Components

### `<Confirmation />`

Tool approval wrapper.

| Prop | Type | Description |
|------|------|-------------|
| `approval` | `ToolUIPart['approval']` | Approval state object |
| `state` | `ToolUIPart['state']` | Current state |
| `className` | `string` | Tailwind classes |

Extends Alert component props.

### `<ConfirmationRequest />`

Request message (shown when pending).

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Request text |

### `<ConfirmationAccepted />`

Accepted message (shown after approval).

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Success text |

### `<ConfirmationRejected />`

Rejected message (shown after denial).

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Rejection text |

### `<ConfirmationActions />`

Button container.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Action buttons |
| `className` | `string` | Tailwind classes |

### `<ConfirmationAction />`

Action button.

Extends Button component props.

---

## Suggestion Components

### `<Suggestions />`

Horizontal scroll container for suggestions.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Suggestion buttons |

Extends `ScrollArea` component props.

### `<Suggestion />`

Individual suggestion button.

| Prop | Type | Description |
|------|------|-------------|
| `suggestion` | `string` | Suggestion text |
| `onClick` | `(suggestion: string) => void` | Click handler |
| `variant` | `string` | Button variant |
| `size` | `string` | Button size |

Extends Button props (excluding onClick).

---

## Tool Components

### `<Tool />`

Tool call display.

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Tool name |
| `children` | `ReactNode` | Content + Result |
| `className` | `string` | Tailwind classes |

### `<ToolContent />`

Tool call details.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Arguments/details |

### `<ToolResult />`

Tool result display.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Result content |

---

## Checkpoint Components

### `<Checkpoint />`

Conversation restore point.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Icon + Trigger |
| `className` | `string` | Tailwind classes |

### `<CheckpointIcon />`

Checkpoint icon.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Custom icon |

Extends LucideProps.

### `<CheckpointTrigger />`

Restore button.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Button text |
| `variant` | `string` | Button variant |
| `size` | `string` | Button size |
| `onClick` | `() => void` | Click handler |

Extends Button component props.

---

## Sources Components

### `<Sources />`

Collapsible sources container.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Trigger + Content |
| `className` | `string` | Tailwind classes |

### `<SourcesTrigger />`

Sources toggle button.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `count` | `number` | Yes | Number of sources |
| `className` | `string` | No | Tailwind classes |

### `<SourcesContent />`

Sources list container.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Source items |
| `className` | `string` | Tailwind classes |

### `<Source />`

Individual source link.

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | Source URL |
| `title` | `string` | Source title |
| `className` | `string` | Tailwind classes |

Extends anchor (`<a>`) element props.

---

## Inline Citation

### `<InlineCitation />`

In-text citation marker.

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string` | Source URL |
| `index` | `number` | Citation number |
| `className` | `string` | Tailwind classes |

---

## Loading Components

### `<Queue />`

Loading/queue state display.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Loading message |
| `className` | `string` | Tailwind classes |

### `<Shimmer />`

Skeleton loading placeholder.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Tailwind classes (set dimensions) |

---

## Plan & Task Components

### `<Plan />`

Plan container.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Plan heading |
| `children` | `ReactNode` | Task items |
| `className` | `string` | Tailwind classes |

### `<Task />`

Individual task item.

| Prop | Type | Description |
|------|------|-------------|
| `status` | `'pending' \| 'in_progress' \| 'completed'` | Task state |
| `children` | `ReactNode` | Task description |
| `className` | `string` | Tailwind classes |

---

## Model Selector

### `<ModelSelector />`

Model switching dropdown.

| Prop | Type | Description |
|------|------|-------------|
| `models` | `string[]` | Available models |
| `selected` | `string` | Current model |
| `onSelect` | `(model: string) => void` | Selection handler |
| `className` | `string` | Tailwind classes |

---

## Context

### `<Context />`

Context information display.

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Context heading |
| `children` | `ReactNode` | Context details |
| `className` | `string` | Tailwind classes |

---

## TypeScript Types

```typescript
// Common types used across components
type MessageRole = 'user' | 'assistant' | 'system';

type TaskStatus = 'pending' | 'in_progress' | 'completed';

interface ToolUIPart {
  approval?: {
    approvalId: string;
    // Additional approval properties
  };
  state?: 'pending' | 'accepted' | 'rejected';
}

// Hook types from AI SDK
interface UseChat {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  error?: Error;
}
```

---

## Installation Commands

```bash
# Install individual components
npx ai-elements@latest add conversation
npx ai-elements@latest add message
npx ai-elements@latest add prompt-input
npx ai-elements@latest add reasoning
npx ai-elements@latest add chain-of-thought
npx ai-elements@latest add confirmation
npx ai-elements@latest add suggestion
npx ai-elements@latest add tool
npx ai-elements@latest add checkpoint
npx ai-elements@latest add sources
npx ai-elements@latest add inline-citation
npx ai-elements@latest add queue
npx ai-elements@latest add shimmer
npx ai-elements@latest add plan
npx ai-elements@latest add model-selector
npx ai-elements@latest add context
```
