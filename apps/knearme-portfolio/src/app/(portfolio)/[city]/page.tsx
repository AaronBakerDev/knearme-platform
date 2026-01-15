export { default, generateMetadata, generateStaticParams } from './masonry/page';

// ISR: Revalidate every hour (must be defined directly, not re-exported)
export const revalidate = 3600;
