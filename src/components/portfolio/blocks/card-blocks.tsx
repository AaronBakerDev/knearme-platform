import { ArrowRight, Mail, Share2 } from 'lucide-react';
import type {
  FeatureCardBlock,
  CtaSectionBlock,
  StatsBlock,
  MaterialsListBlock,
} from '@/lib/design/semantic-blocks';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { BlockBaseProps, CtaBlockProps } from './types';
import { getIconEmoji } from './icon-utils';

type FeatureCardRendererProps = BlockBaseProps & {
  block: FeatureCardBlock;
};

type CtaSectionRendererProps = CtaBlockProps & {
  block: CtaSectionBlock;
};

type StatsRendererProps = BlockBaseProps & {
  block: StatsBlock;
};

type MaterialsListRendererProps = BlockBaseProps & {
  block: MaterialsListBlock;
};

export function FeatureCardRenderer({ block, classes }: FeatureCardRendererProps) {
  const variantStyles = {
    default: classes.background.card,
    highlight: cn(classes.accent.bg, 'text-white'),
    subtle: 'bg-transparent border-0 shadow-none',
  };

  return (
    <Card className={cn(variantStyles[block.variant], 'transition-shadow hover:shadow-md')}>
      <CardContent className="pt-6">
        {block.icon && (
          <div className={cn('text-2xl mb-3', block.variant === 'highlight' ? '' : classes.accent.text)}>
            <span role="img" aria-label={block.icon}>
              {getIconEmoji(block.icon)}
            </span>
          </div>
        )}
        <h4
          className={cn(
            classes.heading,
            'text-lg mb-2',
            block.variant === 'highlight' ? 'text-white' : ''
          )}
        >
          {block.title}
        </h4>
        <p
          className={cn(
            classes.body,
            'text-sm',
            block.variant === 'highlight' ? 'text-white/90' : classes.background.muted
          )}
        >
          {block.content}
        </p>
      </CardContent>
    </Card>
  );
}

export function CtaSectionRenderer({ block, classes, onCtaClick }: CtaSectionRendererProps) {
  const actionIcons = {
    contact: <Mail className="h-4 w-4" />,
    'view-more': <ArrowRight className="h-4 w-4" />,
    share: <Share2 className="h-4 w-4" />,
  };

  return (
    <section
      className={cn(
        classes.spacing.section,
        'text-center py-12 px-6 rounded-xl',
        classes.accent.bg
      )}
    >
      <h3 className={cn(classes.heading, 'text-2xl md:text-3xl text-white mb-4')}>
        {block.heading}
      </h3>
      {block.body && (
        <p className="text-white/90 mb-6 max-w-xl mx-auto">{block.body}</p>
      )}
      <Button
        size="lg"
        variant="secondary"
        onClick={() => onCtaClick?.(block.buttonAction)}
        className="gap-2"
      >
        {block.buttonText}
        {actionIcons[block.buttonAction]}
      </Button>
    </section>
  );
}

export function StatsRenderer({ block, classes }: StatsRendererProps) {
  const gridCols = block.items.length <= 2
    ? 'grid-cols-2'
    : block.items.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-2 md:grid-cols-4';

  return (
    <section className={classes.spacing.section}>
      <div
        className={cn(
          'grid gap-4',
          gridCols,
          'p-6 rounded-lg',
          classes.background.card,
          'border'
        )}
      >
        {block.items.map((item, idx) => (
          <div key={idx} className="text-center">
            <div className={cn(classes.heading, 'text-2xl md:text-3xl', classes.accent.text)}>
              {item.value}
            </div>
            <div className={cn(classes.body, 'text-sm', classes.background.muted)}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MaterialsListRenderer({ block, classes }: MaterialsListRendererProps) {
  return (
    <section className={classes.spacing.section}>
      <Card className={classes.background.card}>
        <CardContent className="pt-6">
          {block.title && (
            <h4 className={cn(classes.heading, 'text-lg mb-4 flex items-center gap-2')}>
              <span className={cn('w-2 h-2 rounded-full', classes.accent.bg)} />
              {block.title}
            </h4>
          )}
          <ul className="space-y-3">
            {block.items.map((item, idx) => (
              <li
                key={idx}
                className={cn(
                  'flex items-start gap-3',
                  classes.body,
                  classes.background.muted
                )}
              >
                <span className={cn('mt-1.5', classes.accent.text)}>&#8226;</span>
                <div>
                  <span className={cn('font-medium', classes.background.text)}>
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="text-sm"> &mdash; {item.description}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
