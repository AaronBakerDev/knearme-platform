import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import type { CalloutBlock } from '@/lib/design/semantic-blocks';
import { cn } from '@/lib/utils';
import type { BlockBaseProps } from './types';

type CalloutRendererProps = BlockBaseProps & {
  block: CalloutBlock;
};

export function CalloutRenderer({ block, classes }: CalloutRendererProps) {
  const variantStyles = {
    info: {
      container: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50',
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />,
    },
    tip: {
      container: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50',
      icon: <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />,
    },
    warning: {
      container: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />,
    },
  };

  const style = variantStyles[block.variant];

  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', style.container)}>
      {style.icon}
      <div className="flex-1">
        {block.title && (
          <h4 className={cn(classes.heading, 'text-base mb-1')}>{block.title}</h4>
        )}
        <p className={cn(classes.body, 'text-sm')}>{block.text}</p>
      </div>
    </div>
  );
}
