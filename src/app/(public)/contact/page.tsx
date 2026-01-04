/**
 * Contact Page
 *
 * Simple contact form for contractors who want to talk before signing up.
 * Currently uses mailto link - can upgrade to Resend/form endpoint later.
 *
 * @see /src/app/(public)/about/page.tsx - About page with CTA
 * @see /CLAUDE.md - Brand voice guidelines
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Textarea, Label, Badge } from "@/components/ui";
import {
  Mail,
  MessageSquare,
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Send,
} from "lucide-react";

/**
 * Contact form component with email fallback.
 * Uses mailto as simple solution pre-launch.
 */
function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct mailto link with form data
    const subject = encodeURIComponent(`KnearMe Contact: ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    const mailtoLink = `mailto:hello@knearme.co?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;

    // Show confirmation
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Opening Your Email Client</h3>
        <p className="text-muted-foreground mb-4">
          Your email app should open with your message ready to send.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            placeholder="John Smith"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">How Can We Help?</Label>
        <Textarea
          id="message"
          placeholder="Tell us what's on your mind. Questions about features, pricing, or just want to say hi—we're here."
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto gap-2">
        <Send className="w-4 h-4" />
        Send Message
      </Button>
    </form>
  );
}

/**
 * Common questions that might be answered without contact.
 */
const QUICK_ANSWERS = [
  {
    question: "Is there a free plan?",
    answer: "Yes! You can publish up to 5 projects free and keep them live forever. No credit card required.",
    link: "/#pricing",
  },
  {
    question: "Is it complicated to use?",
    answer: "Nope. Upload photos, describe the job, done. Most contractors do it right from the job site.",
    link: "/#how-it-works",
  },
  {
    question: "Do I need a website already?",
    answer: "Nope. KnearMe gives you professional project pages that you can share directly with customers.",
    link: "/about",
  },
  {
    question: "What trades do you support?",
    answer: "We're focused on masonry contractors right now—chimney repair, tuckpointing, foundation work, stone masonry, and more.",
    link: "/services",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              Get in Touch
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Questions? We&apos;re Here to Help.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Not sure if KnearMe is right for you? Want to understand how
              something works? Just want to talk? Reach out.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* Contact Form - Takes more space */}
              <div className="lg:col-span-3">
                <div className="bg-background rounded-2xl border p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Send Us a Message</h2>
                      <p className="text-sm text-muted-foreground">
                        We typically respond within 24 hours
                      </p>
                    </div>
                  </div>
                  <ContactForm />
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Direct Email */}
                <div className="bg-muted/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Email Directly</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Prefer to use your own email client?
                  </p>
                  <a
                    href="mailto:hello@knearme.co"
                    className="text-primary hover:underline font-medium"
                  >
                    hello@knearme.co
                  </a>
                </div>

                {/* Response Time */}
                <div className="bg-muted/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Response Time</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    We aim to respond to all messages within 24 hours during
                    business days. Often much faster.
                  </p>
                </div>

                {/* FAQ Link */}
                <div className="bg-muted/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Quick Answers</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Many questions are answered in our FAQ section.
                  </p>
                  <Link
                    href="/#faq"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    View FAQ
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Quick Answers Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold mb-2">Common Questions</h2>
                <p className="text-muted-foreground">
                  Quick answers to what most contractors ask
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {QUICK_ANSWERS.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.link}
                    className="bg-background rounded-xl p-5 border hover:border-primary/50 hover:shadow-sm transition-all group"
                  >
                    <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                      {item.question}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Try It Yourself?
            </h2>
            <p className="text-muted-foreground mb-6">
              Skip the questions—just dive in. Create your first project free
              and see how it works.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
