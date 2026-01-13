import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFAQs, type FAQ as FAQType } from "@/lib/payload/client";

/**
 * FAQ Section
 *
 * Addresses common objections and questions contractors have.
 * Positioned before final CTA to handle last-minute hesitations.
 *
 * Data flow:
 * 1. Fetches FAQs from Payload CMS via getFAQs()
 * 2. Falls back to hardcoded content on failure
 *
 * @see PAY-011 in PRD for acceptance criteria
 * @see src/lib/payload/client.ts for getFAQs() implementation
 */

/**
 * Hardcoded fallback FAQs
 * Used when CMS is unavailable or returns no data
 */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
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

/**
 * Extract plain text answer from FAQ
 * Handles both string answers (from fallback) and Lexical rich text (from CMS)
 */
function getAnswerText(faq: FAQType | { question: string; answer: string }): string {
  const answer = faq.answer;

  // If it's a string, return as-is (fallback data)
  if (typeof answer === "string") {
    return answer;
  }

  // If it's Lexical rich text, extract text content
  // Lexical stores content in root.children[].children[].text
  if (answer && typeof answer === "object") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const root = (answer as any).root;
      if (root?.children) {
        return root.children
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((paragraph: any) => {
            if (paragraph.children) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return paragraph.children.map((node: any) => node.text || "").join("");
            }
            return "";
          })
          .join("\n\n");
      }
    } catch {
      // Fall back to empty string if parsing fails
      return "";
    }
  }

  return "";
}

/**
 * FAQ Server Component
 *
 * Fetches FAQs from Payload CMS and renders an accordion.
 * Falls back to hardcoded content if CMS fetch fails.
 */
export async function FAQ() {
  // Fetch FAQs from Payload CMS
  let faqs: (FAQType | { question: string; answer: string })[] = FALLBACK_FAQS;

  try {
    const cmsFaqs = await getFAQs({ showOnLandingOnly: true });

    // Only use CMS data if we got results
    if (cmsFaqs && cmsFaqs.length > 0) {
      faqs = cmsFaqs;
    }
  } catch (error) {
    // Log error but continue with fallback data
    console.error("[FAQ] Failed to fetch from CMS, using fallback:", error);
  }

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
          <FAQAccordion faqs={faqs} />
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ Accordion Component
 *
 * Renders the interactive accordion UI.
 * Uses client-side Accordion from shadcn/ui.
 * Can be called from Server Components since Accordion itself is a client component.
 */
function FAQAccordion({
  faqs
}: {
  faqs: (FAQType | { question: string; answer: string })[]
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={"id" in faq ? faq.id : index} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-base font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground whitespace-pre-line">
            {getAnswerText(faq)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
