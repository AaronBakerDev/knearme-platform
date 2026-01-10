export type PortfolioCtaAction = 'contact' | 'view-more' | 'share';

export interface PortfolioImage {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}
