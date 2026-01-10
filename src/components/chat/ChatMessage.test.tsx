/**
 * Unit tests for ChatMessage component.
 *
 * Tests message rendering for user/assistant roles,
 * markdown rendering, copy functionality, and feedback buttons.
 *
 * @see src/components/chat/ChatMessage.tsx
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

// Mock the Tooltip component to avoid Radix UI complexity in tests
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tooltip-content">{children}</span>
  ),
}));

describe('ChatMessage', () => {
  // ---------------------------------------------------------------------------
  // User Messages
  // ---------------------------------------------------------------------------

  describe('user messages', () => {
    it('renders user message with correct content', () => {
      render(<ChatMessage role="user" content="Hello, I need help with my project" />);

      expect(screen.getByText('Hello, I need help with my project')).toBeInTheDocument();
    });

    it('renders user message right-aligned', () => {
      const { container } = render(<ChatMessage role="user" content="Test message" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('justify-end');
    });

    it('renders user message with teal pill styling', () => {
      render(<ChatMessage role="user" content="User message" />);

      const messageElement = screen.getByText('User message').closest('div');
      expect(messageElement).toHaveClass('bg-primary');
      expect(messageElement).toHaveClass('rounded-3xl');
    });

    it('does not show action buttons for user messages', () => {
      render(<ChatMessage role="user" content="No buttons here" />);

      // Thumbs up/down buttons should not be present
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Assistant Messages
  // ---------------------------------------------------------------------------

  describe('assistant messages', () => {
    it('renders assistant message with correct content', () => {
      render(
        <ChatMessage
          role="assistant"
          content="I can help you create a portfolio for your masonry work."
        />
      );

      expect(
        screen.getByText(/I can help you create a portfolio/)
      ).toBeInTheDocument();
    });

    it('renders assistant message left-aligned', () => {
      const { container } = render(
        <ChatMessage role="assistant" content="Assistant message" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('justify-start');
    });

    it('renders markdown content correctly', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Here's a **bold** statement and a [link](https://example.com)"
        />
      );

      // Check bold text is rendered
      const boldText = screen.getByText('bold');
      expect(boldText.tagName.toLowerCase()).toBe('strong');

      // Check link is rendered
      const link = screen.getByRole('link', { name: /link/i });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders code blocks with proper styling', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Use `npm install` to install packages."
        />
      );

      const codeElement = screen.getByText('npm install');
      expect(codeElement.tagName.toLowerCase()).toBe('code');
      expect(codeElement).toHaveClass('font-mono');
    });

    it('renders lists correctly', () => {
      // Use actual newlines for markdown parsing
      const content = `Steps:
- Step one
- Step two
- Step three`;

      render(<ChatMessage role="assistant" content={content} />);

      // Check list items exist
      expect(screen.getByText('Step one')).toBeInTheDocument();
      expect(screen.getByText('Step two')).toBeInTheDocument();
      expect(screen.getByText('Step three')).toBeInTheDocument();
    });

    it('shows action buttons on hover', () => {
      render(
        <ChatMessage role="assistant" content="Message with actions" />
      );

      // Buttons should exist (visibility controlled by CSS)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // Copy, ThumbsUp, ThumbsDown
    });
  });

  // ---------------------------------------------------------------------------
  // Copy Functionality
  // ---------------------------------------------------------------------------

  describe('copy functionality', () => {
    it('copies message content to clipboard when copy button clicked', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator.clipboard, { writeText: writeTextMock });

      render(<ChatMessage role="assistant" content="Copy this text" />);

      const copyButton = screen.getAllByRole('button')[0]; // First button is copy
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('Copy this text');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Feedback Functionality
  // ---------------------------------------------------------------------------

  describe('feedback functionality', () => {
    it('calls onFeedback with positive when thumbs up clicked', () => {
      const onFeedback = vi.fn();

      render(
        <ChatMessage
          role="assistant"
          content="Rate this message"
          messageId="msg-123"
          onFeedback={onFeedback}
        />
      );

      const buttons = screen.getAllByRole('button');
      const thumbsUpButton = buttons[1]; // Second button is thumbs up
      fireEvent.click(thumbsUpButton);

      expect(onFeedback).toHaveBeenCalledWith('msg-123', 'positive');
    });

    it('calls onFeedback with negative when thumbs down clicked', () => {
      const onFeedback = vi.fn();

      render(
        <ChatMessage
          role="assistant"
          content="Rate this message"
          messageId="msg-123"
          onFeedback={onFeedback}
        />
      );

      const buttons = screen.getAllByRole('button');
      const thumbsDownButton = buttons[2]; // Third button is thumbs down
      fireEvent.click(thumbsDownButton);

      expect(onFeedback).toHaveBeenCalledWith('msg-123', 'negative');
    });

    it('does not call onFeedback when messageId is not provided', () => {
      const onFeedback = vi.fn();

      render(
        <ChatMessage
          role="assistant"
          content="No message ID"
          onFeedback={onFeedback}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]); // Thumbs up

      expect(onFeedback).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Streaming State
  // ---------------------------------------------------------------------------

  describe('streaming state', () => {
    it('applies streaming animation to user message', () => {
      render(
        <ChatMessage role="user" content="Streaming message" isStreaming={true} />
      );

      const messageElement = screen.getByText('Streaming message').closest('div');
      expect(messageElement).toHaveClass('animate-pulse');
    });

    it('applies opacity to streaming assistant message', () => {
      const { container } = render(
        <ChatMessage role="assistant" content="Streaming response" isStreaming={true} />
      );

      // Find the text container with opacity class
      const textContainer = container.querySelector('.opacity-70');
      expect(textContainer).toBeInTheDocument();
    });

    it('hides action buttons when streaming', () => {
      render(
        <ChatMessage role="assistant" content="Still typing..." isStreaming={true} />
      );

      // Action buttons should not be present when streaming
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('renders empty content without crashing', () => {
      render(<ChatMessage role="assistant" content="" />);

      // Should render without throwing
      expect(screen.queryByRole('button')).not.toBeInTheDocument(); // No buttons for empty content
    });

    it('handles very long content', () => {
      const longContent = 'A'.repeat(1000);
      render(<ChatMessage role="assistant" content={longContent} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ChatMessage role="user" content="Custom class" className="custom-test-class" />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });

    it('renders special markdown characters correctly', () => {
      render(
        <ChatMessage
          role="assistant"
          content="Price: $100 or 50% off with code *SAVE50*"
        />
      );

      expect(screen.getByText(/Price:/)).toBeInTheDocument();
    });
  });
});
