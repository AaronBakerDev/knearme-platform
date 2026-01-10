import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Link2,
  ListOrdered,
  Tag,
  User,
} from "lucide-react";
import {
  Badge, Card, CardContent,
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui";
import { SocialShare } from "@/components/content/SocialShare";
import type { ArticleFrontmatter, ArticleMeta } from "@/lib/content/mdx";

export type KeyLink = { href: string; label: string; external?: boolean };

type ArticleHeaderProps = {
  frontmatter: ArticleFrontmatter;
  formattedDate: string;
  readingTimeText: string;
};

export function ArticleHeader({
  frontmatter,
  formattedDate,
  readingTimeText,
}: ArticleHeaderProps) {
  return (
    <header className="mb-8">
      <Badge variant="secondary" className="mb-4">
        {frontmatter.category}
      </Badge>

      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
        {frontmatter.title}
      </h1>

      <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-6">
        {frontmatter.description}
      </p>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span>{frontmatter.author}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{readingTimeText}</span>
        </div>
      </div>

      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {frontmatter.tags.map((tag) => (
            <Link
              key={tag}
              href={`/learn?tag=${tag}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
        <span className="text-sm text-muted-foreground">Share:</span>
        <SocialShare
          title={frontmatter.title}
          description={frontmatter.description}
        />
      </div>
    </header>
  );
}

type KeyLinksSectionProps = {
  links: KeyLink[];
};

export function KeyLinksSection({ links }: KeyLinksSectionProps) {
  if (links.length === 0) return null;

  return (
    <section className="mb-8" aria-labelledby="key-links-heading">
      <div className="rounded-xl border bg-muted/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-primary" />
          <h2
            id="key-links-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Key links
          </h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-start justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-muted-foreground/30 hover:bg-muted/20"
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              <span className="text-sm text-primary font-semibold group-hover:text-primary/80">
                {link.label}
              </span>
              {link.external && (
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

type HowToSectionProps = {
  frontmatter: ArticleFrontmatter;
};

export function HowToSection({ frontmatter }: HowToSectionProps) {
  if (!frontmatter.howToSteps || frontmatter.howToSteps.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby="howto-steps-heading">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ListOrdered className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2
            id="howto-steps-heading"
            className="text-2xl font-semibold tracking-tight"
          >
            {frontmatter.howToTitle || "Step-by-Step Process"}
          </h2>
          {frontmatter.howToDescription && (
            <p className="text-sm text-muted-foreground">
              {frontmatter.howToDescription}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {frontmatter.howToSteps.map((step, idx) => (
          <Card key={`${step.title}-${idx}`} className="border border-muted">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                </div>
                {step.duration && (
                  <Badge variant="outline" className="text-xs">
                    {step.duration}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

type FeaturedImageProps = {
  image?: string;
  title: string;
};

export function FeaturedImage({ image, title }: FeaturedImageProps) {
  if (!image) return null;

  return (
    <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 800px"
      />
    </div>
  );
}

type FaqSectionProps = {
  faqs?: Array<{ question: string; answer: string }>;
};

export function FaqSection({ faqs }: FaqSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

type RelatedServicesSectionProps = {
  services?: string[];
};

export function RelatedServicesSection({ services }: RelatedServicesSectionProps) {
  if (!services || services.length === 0) return null;

  return (
    <section className="mt-8 p-6 bg-muted/50 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Related Services</h3>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => (
          <Link
            key={service}
            href={`/services/${service}`}
            className="transition-transform hover:scale-105"
          >
            <Badge variant="outline" className="cursor-pointer">
              {service.replace(/-/g, " ")}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}

type RelatedArticlesSectionProps = {
  articles: ArticleMeta[];
};

export function RelatedArticlesSection({ articles }: RelatedArticlesSectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <RelatedArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

function RelatedArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/learn/${article.slug}`} className="group">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.frontmatter.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.frontmatter.description}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{article.readingTime.minutes} min read</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
