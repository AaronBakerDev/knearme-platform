'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type {
  HeroSectionBlock,
  BeforeAfterBlock,
  ImageGalleryBlock,
  TestimonialBlock,
  ProcessStepBlock,
} from '@/lib/design/semantic-blocks';
import { SafeImage, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PortfolioImage } from '../types';
import type { ImageBlockProps } from './types';

type HeroSectionRendererProps = ImageBlockProps & {
  block: HeroSectionBlock;
};

type BeforeAfterRendererProps = ImageBlockProps & {
  block: BeforeAfterBlock;
};

type ImageGalleryRendererProps = ImageBlockProps & {
  block: ImageGalleryBlock;
};

type TestimonialRendererProps = ImageBlockProps & {
  block: TestimonialBlock;
};

type ProcessStepRendererProps = ImageBlockProps & {
  block: ProcessStepBlock;
};

export function HeroSectionRenderer({ block, classes, getImageById }: HeroSectionRendererProps) {
  const heroImages = block.imageIds
    .map((id) => getImageById(id))
    .filter((img): img is PortfolioImage => !!img);

  if (heroImages.length === 0) {
    return null;
  }

  const renderHeroLayout = () => {
    switch (block.layout) {
      case 'large-single': {
        const mainImage = heroImages[0];
        if (!mainImage) return null;
        return (
          <div className={cn(classes.hero.container, classes.image, 'relative')}>
            <SafeImage
              src={mainImage.url}
              alt={mainImage.alt || 'Hero image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
        );
      }

      case 'grid': {
        const gridImages = heroImages.slice(0, 3);
        return (
          <div className={cn('grid grid-cols-3 gap-2', classes.spacing.gap)}>
            {gridImages.map((img, idx) => (
              <div
                key={img.id}
                className={cn('relative aspect-video', classes.image)}
              >
                <SafeImage
                  src={img.url}
                  alt={img.alt || `Hero image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 400px"
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        );
      }

      case 'side-by-side': {
        const leftImage = heroImages[0];
        const rightImage = heroImages[1] || heroImages[0];
        if (!leftImage) return null;
        return (
          <div className={cn('grid grid-cols-2 gap-4', classes.spacing.gap)}>
            <div className={cn('relative aspect-[4/3]', classes.image)}>
              <SafeImage
                src={leftImage.url}
                alt={leftImage.alt || 'Hero image left'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 600px"
                priority
              />
            </div>
            <div className={cn('relative aspect-[4/3]', classes.image)}>
              <SafeImage
                src={rightImage?.url || ''}
                alt={rightImage?.alt || 'Hero image right'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 600px"
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <section className={cn(classes.spacing.section, 'relative')}>
      {renderHeroLayout()}

      {(block.title || block.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          {block.title && (
            <h1 className={cn(classes.heading, 'text-3xl md:text-4xl text-white mb-2')}>
              {block.title}
            </h1>
          )}
          {block.subtitle && (
            <p className="text-lg text-white/80">{block.subtitle}</p>
          )}
        </div>
      )}
    </section>
  );
}

export function BeforeAfterRenderer({ block, classes, getImageById }: BeforeAfterRendererProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const beforeImage = getImageById(block.beforeImageId);
  const afterImage = getImageById(block.afterImageId);

  if (!beforeImage || !afterImage) {
    return null;
  }

  return (
    <section className={classes.spacing.section}>
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <div className={cn('absolute inset-0', classes.image)}>
          <SafeImage
            src={afterImage.url}
            alt={afterImage.alt || 'After'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>

        <div
          className={cn('absolute inset-0 overflow-hidden', classes.image)}
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <SafeImage
            src={beforeImage.url}
            alt={beforeImage.alt || 'Before'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-gray-600" />
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          aria-label="Adjust before/after comparison"
        />

        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm font-medium rounded">
          Before
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm font-medium rounded">
          After
        </div>
      </div>

      {block.caption && (
        <p className={cn(classes.body, classes.background.muted, 'text-center mt-4')}>
          {block.caption}
        </p>
      )}
    </section>
  );
}

export function ImageGalleryRenderer({ block, classes, getImageById }: ImageGalleryRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const galleryImages = block.imageIds
    .map((id) => getImageById(id))
    .filter((img): img is PortfolioImage => !!img);

  if (galleryImages.length === 0) {
    return null;
  }

  const layoutClasses = {
    'grid-2': 'grid grid-cols-2 gap-4',
    'grid-3': 'grid grid-cols-2 md:grid-cols-3 gap-4',
    masonry: 'columns-2 md:columns-3 gap-4 space-y-4',
    carousel: 'relative overflow-hidden',
  };

  if (block.layout === 'carousel') {
    const currentImage = galleryImages[currentIndex];
    if (!currentImage) return null;

    return (
      <section className={classes.spacing.section}>
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <SafeImage
            src={currentImage.url}
            alt={currentImage.alt || 'Gallery image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      idx === currentIndex ? 'bg-white' : 'bg-white/50'
                    )}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {block.captions?.[currentImage.id] && (
          <p className={cn(classes.body, classes.background.muted, 'text-center mt-4')}>
            {block.captions[currentImage.id]}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className={cn(classes.spacing.section, layoutClasses[block.layout])}>
      {galleryImages.map((img) => (
        <div
          key={img.id}
          className={cn(
            'relative',
            classes.image,
            block.layout === 'masonry' ? 'break-inside-avoid mb-4' : 'aspect-square'
          )}
        >
          <SafeImage
            src={img.url}
            alt={img.alt || 'Gallery image'}
            fill={block.layout !== 'masonry'}
            width={block.layout === 'masonry' ? img.width || 400 : undefined}
            height={block.layout === 'masonry' ? img.height || 300 : undefined}
            className={cn(
              'object-cover',
              block.layout === 'masonry' ? 'w-full h-auto rounded-lg' : ''
            )}
            sizes="(max-width: 768px) 50vw, 300px"
          />
          {block.captions?.[img.id] && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs">
              {block.captions[img.id]}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export function TestimonialRenderer({ block, classes, getImageById }: TestimonialRendererProps) {
  const testimonialImage = block.imageId ? getImageById(block.imageId) : null;

  return (
    <section className={cn(classes.spacing.section, 'relative')}>
      <Card className={cn(classes.background.card, 'border-l-4', classes.accent.border)}>
        <CardContent className="pt-6 flex gap-6">
          {testimonialImage && (
            <div className="flex-shrink-0">
              <div className={cn('relative w-16 h-16 rounded-full overflow-hidden', classes.image)}>
                <SafeImage
                  src={testimonialImage.url}
                  alt={testimonialImage.alt || 'Testimonial'}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </div>
          )}
          <div className="flex-1">
            <Quote className={cn('h-8 w-8 mb-3', classes.accent.text, 'opacity-50')} />
            <blockquote className={cn(classes.body, 'italic mb-4')}>
              &ldquo;{block.quote}&rdquo;
            </blockquote>
            {block.attribution && (
              <cite className={cn(classes.body, classes.background.muted, 'not-italic font-medium')}>
                &mdash; {block.attribution}
              </cite>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function ProcessStepRenderer({ block, classes, getImageById }: ProcessStepRendererProps) {
  const stepImage = block.imageId ? getImageById(block.imageId) : null;

  return (
    <section className={cn(classes.spacing.section, 'flex gap-6')}>
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
          classes.accent.bg,
          'text-white'
        )}
      >
        {block.stepNumber}
      </div>

      <div className="flex-1">
        <h4 className={cn(classes.heading, 'text-lg mb-2')}>{block.title}</h4>
        <p className={cn(classes.body, classes.background.muted, 'mb-4')}>
          {block.content}
        </p>

        {stepImage && (
          <div className={cn('relative aspect-video rounded-lg overflow-hidden', classes.image)}>
            <SafeImage
              src={stepImage.url}
              alt={stepImage.alt || `Step ${block.stepNumber}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}
      </div>
    </section>
  );
}
