'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  blocksToPlainText,
  type DescriptionBlock,
} from '@/lib/content/description-blocks';

interface BlockEditorProps {
  value: DescriptionBlock[];
  onChange: (value: DescriptionBlock[]) => void;
  minWords?: number;
  maxChars?: number;
  disabled?: boolean;
  className?: string;
}

type BlockType = DescriptionBlock['type'];

const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraph',
  heading: 'Heading',
  list: 'List',
  callout: 'Callout',
  stats: 'Stats',
  quote: 'Quote',
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((word) => word.length > 0).length;
}

function createBlock(type: BlockType): DescriptionBlock {
  switch (type) {
    case 'heading':
      return { type: 'heading', level: '2', text: '' };
    case 'list':
      return { type: 'list', style: 'bullet', items: [''] };
    case 'callout':
      return { type: 'callout', variant: 'info', title: '', text: '' };
    case 'stats':
      return { type: 'stats', items: [{ label: '', value: '' }] };
    case 'quote':
      return { type: 'quote', text: '', cite: '' };
    case 'paragraph':
    default:
      return { type: 'paragraph', text: '' };
  }
}

export function BlockEditor({
  value,
  onChange,
  minWords = 200,
  maxChars,
  disabled,
  className,
}: BlockEditorProps) {
  const [blockType, setBlockType] = useState<BlockType>('paragraph');

  const textValue = useMemo(() => blocksToPlainText(value || []), [value]);
  const wordCount = useMemo(() => countWords(textValue), [textValue]);
  const charCount = textValue.length;
  const isUnderMinWords = minWords && wordCount < minWords;
  const isOverMaxChars = maxChars && charCount > maxChars;

  const updateBlock = (index: number, next: DescriptionBlock) => {
    const updated = [...value];
    updated[index] = next;
    onChange(updated);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const updated = [...value];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= updated.length) return;
    const temp = updated[target];
    updated[target] = updated[index]!;
    updated[index] = temp!;
    onChange(updated);
  };

  const removeBlock = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addBlock = () => {
    onChange([...(value || []), createBlock(blockType)]);
  };

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3 bg-muted/50">
        <Select value={blockType} onValueChange={(v) => setBlockType(v as BlockType)}>
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <SelectValue placeholder="Block type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BLOCK_LABELS).map(([type, label]) => (
              <SelectItem key={type} value={type} className="text-sm">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" onClick={addBlock} className="h-9 gap-1">
          <Plus className="h-4 w-4" />
          Add Block
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add a block to start writing your description.
          </p>
        )}

        {value.map((block, index) => (
          <div key={`${block.type}-${index}`} className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                {BLOCK_LABELS[block.type]}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveBlock(index, 'up')}
                  aria-label="Move block up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveBlock(index, 'down')}
                  aria-label="Move block down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeBlock(index)}
                  aria-label="Remove block"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {block.type === 'paragraph' && (
              <Textarea
                value={block.text}
                onChange={(event) =>
                  updateBlock(index, { ...block, text: event.target.value })
                }
                placeholder="Write the paragraph..."
                className="min-h-[120px] text-sm"
              />
            )}

            {block.type === 'heading' && (
              <div className="space-y-2">
                <Select
                  value={String(block.level)}
                  onValueChange={(value) =>
                    updateBlock(index, {
                      ...block,
                      level: value as '2' | '3',
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-[140px] text-sm">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Heading 2</SelectItem>
                    <SelectItem value="3">Heading 3</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={block.text}
                  onChange={(event) =>
                    updateBlock(index, { ...block, text: event.target.value })
                  }
                  placeholder="Heading text"
                  className="text-sm"
                />
              </div>
            )}

            {block.type === 'list' && (
              <div className="space-y-3">
                <Select
                  value={block.style}
                  onValueChange={(value) =>
                    updateBlock(index, {
                      ...block,
                      style: value as 'bullet' | 'number',
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-[140px] text-sm">
                    <SelectValue placeholder="List style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bullet">Bulleted</SelectItem>
                    <SelectItem value="number">Numbered</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  {block.items.map((item, itemIndex) => (
                    <div key={`${index}-item-${itemIndex}`} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(event) => {
                          const items = [...block.items];
                          items[itemIndex] = event.target.value;
                          updateBlock(index, { ...block, items });
                        }}
                        placeholder={`Item ${itemIndex + 1}`}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => {
                          const items = block.items.filter((_, i) => i !== itemIndex);
                          updateBlock(index, { ...block, items });
                        }}
                        aria-label="Remove list item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateBlock(index, { ...block, items: [...block.items, ''] })
                    }
                  >
                    Add item
                  </Button>
                </div>
              </div>
            )}

            {block.type === 'callout' && (
              <div className="space-y-2">
                <Select
                  value={block.variant}
                  onValueChange={(value) =>
                    updateBlock(index, {
                      ...block,
                      variant: value as 'info' | 'tip' | 'warning',
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-[160px] text-sm">
                    <SelectValue placeholder="Variant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="tip">Tip</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={block.title || ''}
                  onChange={(event) =>
                    updateBlock(index, { ...block, title: event.target.value })
                  }
                  placeholder="Optional title"
                  className="text-sm"
                />
                <Textarea
                  value={block.text}
                  onChange={(event) =>
                    updateBlock(index, { ...block, text: event.target.value })
                  }
                  placeholder="Callout content"
                  className="min-h-[120px] text-sm"
                />
              </div>
            )}

            {block.type === 'stats' && (
              <div className="space-y-3">
                {block.items.map((item, itemIndex) => (
                  <div key={`${index}-stat-${itemIndex}`} className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={item.label}
                      onChange={(event) => {
                        const items = [...block.items];
                        const current = items[itemIndex];
                        if (current) {
                          items[itemIndex] = { ...current, label: event.target.value };
                          updateBlock(index, { ...block, items });
                        }
                      }}
                      placeholder="Label"
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={item.value}
                        onChange={(event) => {
                          const items = [...block.items];
                          const current = items[itemIndex];
                          if (current) {
                            items[itemIndex] = { ...current, value: event.target.value };
                            updateBlock(index, { ...block, items });
                          }
                        }}
                        placeholder="Value"
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => {
                          const items = block.items.filter((_, i) => i !== itemIndex);
                          updateBlock(index, { ...block, items });
                        }}
                        aria-label="Remove stat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateBlock(index, {
                      ...block,
                      items: [...block.items, { label: '', value: '' }],
                    })
                  }
                >
                  Add stat
                </Button>
              </div>
            )}

            {block.type === 'quote' && (
              <div className="space-y-2">
                <Textarea
                  value={block.text}
                  onChange={(event) =>
                    updateBlock(index, { ...block, text: event.target.value })
                  }
                  placeholder="Quote text"
                  className="min-h-[100px] text-sm"
                />
                <Input
                  value={block.cite || ''}
                  onChange={(event) =>
                    updateBlock(index, { ...block, cite: event.target.value })
                  }
                  placeholder="Citation (optional)"
                  className="text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 text-sm">
        <div className="flex items-center gap-4">
          <span className={cn(isUnderMinWords && 'text-amber-600')}>
            {wordCount} words
            {minWords && (
              <span className="text-muted-foreground"> / {minWords} min</span>
            )}
          </span>
          <span className={cn('text-muted-foreground', isOverMaxChars && 'text-destructive')}>
            {charCount.toLocaleString()} chars
            {maxChars && ` / ${maxChars.toLocaleString()}`}
          </span>
        </div>
        {minWords && (
          <div className="flex items-center gap-2">
            {isUnderMinWords ? (
              <span className="text-amber-600 text-xs">
                {minWords - wordCount} more words needed
              </span>
            ) : (
              <span className="text-green-600 text-xs">Minimum reached</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockEditor;
