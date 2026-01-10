import type { ParagraphBlock, HeadingBlock, ListBlock } from '@/lib/design/semantic-blocks';
import { cn } from '@/lib/utils';
import type { BlockBaseProps } from './types';

type ParagraphRendererProps = BlockBaseProps & {
  block: ParagraphBlock;
};

type HeadingRendererProps = BlockBaseProps & {
  block: HeadingBlock;
};

type ListRendererProps = BlockBaseProps & {
  block: ListBlock;
};

export function ParagraphRenderer({ block, classes }: ParagraphRendererProps) {
  return (
    <p className={cn(classes.body, classes.background.text, 'max-w-prose')}>
      {block.text}
    </p>
  );
}

export function HeadingRenderer({ block, classes }: HeadingRendererProps) {
  const baseClasses = cn(classes.heading, classes.background.text);

  if (block.level === '2') {
    return <h2 className={cn(baseClasses, 'text-2xl md:text-3xl mb-4')}>{block.text}</h2>;
  }

  return <h3 className={cn(baseClasses, 'text-xl md:text-2xl mb-3')}>{block.text}</h3>;
}

export function ListRenderer({ block, classes }: ListRendererProps) {
  const listClasses = cn(classes.body, classes.background.text, 'space-y-2 pl-6');

  if (block.style === 'number') {
    return (
      <ol className={cn(listClasses, 'list-decimal')}>
        {block.items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <ul className={cn(listClasses, 'list-disc')}>
      {block.items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}
