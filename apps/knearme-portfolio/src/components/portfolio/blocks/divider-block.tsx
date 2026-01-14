import type { DividerBlock } from '@/lib/design/semantic-blocks';
import { cn } from '@/lib/utils';

type DividerRendererProps = {
  block: DividerBlock;
};

export function DividerRenderer({ block }: DividerRendererProps) {
  const styleClasses = {
    line: 'border-t border-border',
    dots: 'flex items-center justify-center gap-2',
    space: 'h-8',
  };

  if (block.style === 'dots') {
    return (
      <div className={cn('py-6', styleClasses.dots)}>
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
      </div>
    );
  }

  return <hr className={cn('my-6', styleClasses[block.style || 'line'])} />;
}
