import type { ResolvedClasses } from '@/lib/design/tokens';
import type { PortfolioCtaAction, PortfolioImage } from '../types';

export type ImageLookup = (id: string) => PortfolioImage | undefined;

export interface BlockBaseProps {
  classes: ResolvedClasses;
}

export interface ImageBlockProps extends BlockBaseProps {
  getImageById: ImageLookup;
}

export interface CtaBlockProps extends BlockBaseProps {
  onCtaClick?: (action: PortfolioCtaAction) => void;
}
