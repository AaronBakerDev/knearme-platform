import Link from "next/link";
import { CTAButton } from "@/components/ui/cta-button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-background pt-16 pb-32 md:pt-32 lg:pt-40 lg:pb-32 xl:pt-48 xl:pb-40">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/20 opacity-30 blur-[100px]" />
            <div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 opacity-30 blur-[100px]" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

                    {/* Text Content */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                            ✨ The AI Portfolio Builder for Masons
                        </Badge>

                        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                            Build Your Portfolio in <span className="text-primary">30 Seconds</span>
                        </h1>

                        <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                            Upload photos, answer a few questions by voice, and let our AI write the case study and optimize it for SEO. No typing required.
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link href="/signup">
                                <CTAButton size="lg" className="px-8 text-lg h-14 w-full sm:w-auto">
                                    Get Started Free
                                </CTAButton>
                            </Link>
                            <Link href="#how-it-works">
                                <CTAButton variant="outline" size="lg" showArrow={false} className="px-8 text-lg h-14 w-full sm:w-auto">
                                    See How It Works
                                </CTAButton>
                            </Link>
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Free forever plan</span>
                            </div>
                        </div>
                    </div>

                    {/* Visual Content (Mockup) */}
                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                        <div className="relative rounded-2xl bg-zinc-900/5 p-2 ring-1 ring-inset ring-zinc-900/10 dark:bg-white/5 dark:ring-white/10 lg:-m-4 lg:rounded-3xl lg:p-4">
                            <div className="relative overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                                {/* Mock UI Header */}
                                <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                                    <div className="h-3 w-3 rounded-full bg-red-400" />
                                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                                    <div className="h-3 w-3 rounded-full bg-green-400" />
                                    <div className="ml-2 h-4 w-32 rounded-full bg-muted-foreground/10" />
                                </div>

                                {/* Mock UI Content - Before/After */}
                                <div className="grid grid-cols-2 h-[400px]">
                                    <div className="relative flex flex-col items-center justify-center border-r bg-muted/10 p-6 text-center">
                                        <div className="mb-4 h-24 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                                        <p className="font-semibold text-muted-foreground">Raw Photos</p>
                                        <p className="text-xs text-muted-foreground mt-2">IMG_001.jpg</p>
                                    </div>
                                    <div className="relative flex flex-col p-6">
                                        <Badge className="w-fit mb-4 bg-green-500 hover:bg-green-600">Generated Portfolio</Badge>
                                        <div className="space-y-3">
                                            <div className="h-6 w-3/4 rounded bg-primary/10" />
                                            <div className="h-4 w-full rounded bg-muted-foreground/10" />
                                            <div className="h-4 w-full rounded bg-muted-foreground/10" />
                                            <div className="h-4 w-2/3 rounded bg-muted-foreground/10" />
                                            <div className="mt-4 aspect-video w-full rounded-lg bg-primary/5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Floating "AI Processing" Badge */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                                    <div className="flex items-center gap-2 rounded-full bg-black/90 px-4 py-2 text-white shadow-xl backdrop-blur-sm dark:bg-white/90 dark:text-black">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                        </span>
                                        <span className="text-sm font-medium">AI Generating...</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
