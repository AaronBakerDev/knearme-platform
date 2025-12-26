'use client';

/**
 * Quick reply suggestion buttons.
 *
 * Displays horizontally scrollable buttons for common responses.
 * Disappear after one is selected.
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

interface ChatQuickRepliesProps {
  /** Available quick reply options */
  replies: QuickReply[];
  /** Called when a reply is selected */
  onSelect: (reply: QuickReply) => void;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Optional additional className */
  className?: string;
}

/**
 * Horizontal scrollable quick reply buttons.
 */
export function ChatQuickReplies({
  replies,
  onSelect,
  disabled = false,
  className,
}: ChatQuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide',
        className
      )}
    >
      {replies.map((reply) => (
        <Button
          key={reply.id}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="flex-shrink-0 rounded-full"
        >
          {reply.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * Common quick reply presets.
 */
export const QUICK_REPLY_PRESETS = {
  projectTypes: [
    { id: 'chimney', label: 'Chimney', value: 'chimney' },
    { id: 'tuckpointing', label: 'Tuckpointing', value: 'tuckpointing' },
    { id: 'stone', label: 'Stone work', value: 'stone work' },
    { id: 'brick', label: 'Brick repair', value: 'brick repair' },
  ],
  confirmation: [
    { id: 'yes', label: 'Yes', value: 'yes' },
    { id: 'no', label: 'No', value: 'no' },
    { id: 'maybe', label: 'Not sure', value: "I'm not sure" },
  ],
  contentReview: [
    { id: 'looks-good', label: 'Looks good!', value: 'Looks good!' },
    { id: 'tweak', label: 'Tweak it', value: 'Can you tweak it a bit?' },
    { id: 'regenerate', label: 'Try again', value: 'Can you generate a new version?' },
  ],
};
