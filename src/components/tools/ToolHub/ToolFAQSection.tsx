/**
 * ToolFAQSection Component
 *
 * SEO-optimized FAQ section with structured data for featured snippets.
 * Uses accordion for clean UX and injects JSON-LD schema.
 */

'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'
import Script from 'next/script'

interface FAQ {
  question: string
  answer: string
}

interface ToolFAQSectionProps {
  faqs: FAQ[]
}

/**
 * Default FAQs for tools hub page.
 */
export const DEFAULT_TOOL_FAQS: FAQ[] = [
  {
    question: 'How accurate are these masonry cost estimates?',
    answer:
      'Our cost estimators provide planning-level ranges based on national averages and regional adjustments. Actual quotes from contractors may vary by 15-30% depending on project complexity, material availability, and local labor rates. Always get 3 quotes from licensed contractors for accurate pricing.',
  },
  {
    question: 'Do I need to create an account to use these tools?',
    answer:
      'No! All homeowner tools are completely free and require no signup or account creation. Just visit any tool and start planning your project immediately.',
  },
  {
    question: 'Can I save or share my estimate?',
    answer:
      'Yes. Each tool includes a share button that generates a unique URL with your inputs saved. You can bookmark it, share it with contractors, or email it to family members for feedback.',
  },
  {
    question: 'What should I do after using a cost estimator?',
    answer:
      'Use the estimate as a budget baseline, then request quotes from at least 3 licensed masonry contractors in your area. Compare their proposals against the estimate and ask about any significant differences. Our tools help you have informed conversations with contractors.',
  },
  {
    question: 'Are these tools useful for contractors?',
    answer:
      'While designed for homeowners, contractors may find them helpful for client education and setting realistic expectations. However, contractors should use their own pricing and estimation methods for actual quotes.',
  },
]

/**
 * Generate FAQPage JSON-LD structured data.
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
function generateFAQSchema(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function ToolFAQSection({ faqs }: ToolFAQSectionProps) {
  const schema = generateFAQSchema(faqs)

  return (
    <section className="space-y-6">
      {/* Structured data for SEO */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {/* Section header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="size-6 text-primary" />
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
      </div>

      {/* FAQ accordion */}
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-semibold">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
