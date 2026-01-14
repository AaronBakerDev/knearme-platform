'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { QuickActionItem, QuickActionType } from './hooks/useQuickActions';

interface QuickActionChipsProps {
  actions: QuickActionItem[];
  onInsertPrompt: (text: string) => void;
  onAction: (action: Exclude<QuickActionType, 'insert'>) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Quick action chips shown above the chat input.
 *
 * These are lightweight suggestions that help contractors move
 * the project forward with one tap.
 */
export function QuickActionChips({
  actions,
  onInsertPrompt,
  onAction,
  disabled = false,
  className,
}: QuickActionChipsProps) {
  if (!actions.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => {
        return (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full h-8 px-3 text-xs font-medium"
            disabled={disabled}
            onClick={() => {
              if (action.type === 'insert') {
                onInsertPrompt(action.value ?? '');
              } else {
                onAction(action.type);
              }
            }}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

export default QuickActionChips;
