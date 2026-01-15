export {
  default,
  generateMetadata,
  generateStaticParams,
} from '../../../contractors/[city]/[slug]/page';

// ISR: Revalidate every hour (must be defined directly, not re-exported)
export const revalidate = 3600;
