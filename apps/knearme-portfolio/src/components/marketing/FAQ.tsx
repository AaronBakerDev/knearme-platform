"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * FAQ Section
 *
 * Addresses common objections and questions contractors have.
 * Positioned before final CTA to handle last-minute hesitations.
 */

const faqs = [
  {
    question: "Can I really do this from my phone?",
    answer:
      "Yes, KnearMe is built mobile-first. Upload photos from your camera roll, record your voice description, and publish—all from your phone or tablet. No computer needed.",
  },
  {
    question: "What if I'm not good at speaking or describing my work?",
    answer:
      "Just talk like you're explaining the job to a customer. 'We rebuilt this chimney using matching vintage brick. Took about 3 days.' That's all we need. We turn your natural explanation into professional copy.",
  },
  {
    question: "How long until my projects show up on Google?",
    answer:
      "Your project pages are live instantly and shareable immediately. Google typically indexes new pages within 1-4 weeks. We optimize every page for local search terms like 'masonry contractor [your city]'.",
  },
  {
    question: "Can I edit my projects after publishing?",
    answer:
      "Absolutely. You can update titles, descriptions, photos, and details anytime. Changes go live immediately.",
  },
  {
    question: "What happens to my projects if I cancel?",
    answer:
      "Your published projects stay live on the free plan. If you downgrade from Pro, you keep everything you have, but you can only publish up to 5 total projects unless you upgrade.",
  },
  {
    question: "Is my data backed up?",
    answer:
      "Yes. All your photos, project details, and account data are automatically backed up daily. Your work is safe with us.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes. If you're not satisfied with Pro within the first 30 days, we'll refund your subscription—no questions asked.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Common Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
