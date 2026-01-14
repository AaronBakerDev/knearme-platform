'use client';

import { cn } from '@/lib/utils';
import type { DescriptionBlock } from '@/lib/content/description-blocks';

interface DescriptionBlocksProps {
  blocks: DescriptionBlock[];
  className?: string;
}

function Callout({
  title,
  text,
  variant,
}: {
  title?: string;
  text: string;
  variant: 'info' | 'tip' | 'warning';
}) {
  const styles = {
    info: 'border-primary/20 bg-primary/5',
    tip: 'border-accent/30 bg-accent/10',
    warning: 'border-destructive/30 bg-destructive/10',
  } as const;

  return (
    <div className={cn('rounded-lg border p-4', styles[variant])}>
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function StatsRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="space-y-1">
          <div className="text-sm text-muted-foreground">{item.label}</div>
          <div className="text-lg font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DescriptionBlocksClient({ blocks, className }: DescriptionBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <article className={cn('prose prose-lg prose-earth max-w-none mb-8', className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index}>{block.text}</p>;
          case 'heading': {
            if (block.level === '2') {
              return <h2 key={index}>{block.text}</h2>;
            }
            return <h3 key={index}>{block.text}</h3>;
          }
          case 'list':
            if (block.style === 'number') {
              return (
                <ol key={index}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case 'callout':
            return (
              <Callout
                key={index}
                title={block.title}
                text={block.text}
                variant={block.variant}
              />
            );
          case 'stats':
            return <StatsRow key={index} items={block.items} />;
          case 'quote':
            return (
              <blockquote key={index}>
                <p>{block.text}</p>
                {block.cite && <cite>{block.cite}</cite>}
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}

export default DescriptionBlocksClient;
