/**
 * MDX Component Overrides for educational content hub.
 *
 * These components customize how MDX elements render in the /learn section.
 * Uses Tailwind prose classes for typography and custom components for
 * enhanced interactivity.
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/mdx
 * @see /docs/SEO-DISCOVERY-STRATEGY.md for content strategy
 */

import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

/**
 * Custom MDX components.
 *
 * Override default HTML elements with styled React components.
 * These apply to all MDX content rendered in the app.
 */
export function getMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with proper semantic structure
    // Note: Omitting ref from spread to avoid React 19 type incompatibility
    h1: ({ children, ref: _ref, ...props }) => (
      <h1
        className="text-3xl md:text-4xl font-bold tracking-tight mt-8 mb-4 text-foreground"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ref: _ref, ...props }) => (
      <h2
        className="text-2xl md:text-3xl font-semibold tracking-tight mt-8 mb-3 text-foreground scroll-mt-20"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ref: _ref, ...props }) => (
      <h3
        className="text-xl md:text-2xl font-semibold mt-6 mb-2 text-foreground scroll-mt-20"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ref: _ref, ...props }) => (
      <h4
        className="text-lg font-semibold mt-4 mb-2 text-foreground"
        {...props}
      >
        {children}
      </h4>
    ),

    // Paragraphs with comfortable reading width
    p: ({ children, ref: _ref, ...props }) => (
      <p className="text-base md:text-lg leading-relaxed mb-4 text-muted-foreground" {...props}>
        {children}
      </p>
    ),

    // Links - internal vs external handling
    a: ({ href, children, ref: _ref, ...props }) => {
      const isInternal = href?.startsWith("/") || href?.startsWith("#");

      if (isInternal) {
        return (
          <Link
            href={href || "#"}
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            {...props}
          >
            {children}
          </Link>
        );
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    },

    // Lists with proper spacing
    ul: ({ children, ref: _ref, ...props }) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ref: _ref, ...props }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ref: _ref, ...props }) => (
      <li className="text-base md:text-lg leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Blockquotes for callouts
    blockquote: ({ children, ref: _ref, ...props }) => (
      <blockquote
        className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground bg-muted/30 py-2 rounded-r"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Code blocks
    code: ({ children, ref: _ref, ...props }) => (
      <code
        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ref: _ref, ...props }) => (
      <pre
        className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),

    // Images with Next.js optimization
    img: ({ src, alt, ref: _ref, className, ...props }) => {
      // Skip if no src
      if (!src) return null;

      const imageClassName = ['rounded-lg w-full', className].filter(Boolean).join(' ');

      // External images use regular img tag
      if (src.startsWith("http")) {
        return (
          <span className="block my-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || ""}
              className={imageClassName}
              loading="lazy"
              {...props}
            />
            {alt && (
              <span className="block text-sm text-muted-foreground text-center mt-2">
                {alt}
              </span>
            )}
          </span>
        );
      }

      // Internal images use Next.js Image
      return (
        <span className="block my-6">
          <Image
            src={src}
            alt={alt || ""}
            width={800}
            height={450}
            className={['rounded-lg w-full h-auto', className].filter(Boolean).join(' ')}
            {...props}
          />
          {alt && (
            <span className="block text-sm text-muted-foreground text-center mt-2">
              {alt}
            </span>
          )}
        </span>
      );
    },

    // Tables for data presentation
    table: ({ children, ref: _ref, ...props }) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ref: _ref, ...props }) => (
      <thead className="bg-muted" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ref: _ref, ...props }) => (
      <th
        className="border border-border px-4 py-2 text-left font-semibold text-foreground"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ref: _ref, ...props }) => (
      <td
        className="border border-border px-4 py-2 text-muted-foreground"
        {...props}
      >
        {children}
      </td>
    ),

    // Horizontal rule
    hr: ({ ref: _ref, ...props }) => <hr className="my-8 border-border" {...props} />,

    // Strong and emphasis
    strong: ({ children, ref: _ref, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ref: _ref, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Allow custom components to be passed in
    ...components,
  };
}
