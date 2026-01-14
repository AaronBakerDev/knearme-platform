import Link from "next/link";
import { CTAButton } from "@/components/ui/cta-button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Camera, Mic, ImageIcon, ArrowRight } from "lucide-react";

type HeroSectionProps = {
    authCta?: { href: string; label: string } | null;
};

export function HeroSection({ authCta }: HeroSectionProps) {
    const primaryCta = authCta ?? { href: "/signup", label: "Get Started Free" };

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
                            📸 Turn Every Job Into Proof
                        </Badge>

                        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                            Showcase Your Best Work in <span className="text-primary">Under 3 Minutes</span>
                        </h1>

                        <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                            Snap photos, describe what you did by voice, and get a professional project page ready to share. Build your portfolio from the job site—no computer required.
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link href={primaryCta.href}>
                                <CTAButton size="lg" className="px-8 text-lg h-14 w-full sm:w-auto">
                                    {primaryCta.label}
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
                                <span>Free plan includes 5 projects</span>
                            </div>
                        </div>
                    </div>

                    {/* Visual Content - Two Phone Mockups */}
                    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                        <div className="flex items-center justify-center gap-4 lg:gap-8">
                            {/* Phone 1 - Recording Voice */}
                            <div className="relative">
                                {/* Phone Frame */}
                                <div className="relative w-[160px] sm:w-[180px] lg:w-[200px] rounded-[2rem] bg-zinc-900 p-2 shadow-2xl ring-1 ring-white/10">
                                    {/* Phone Notch */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-zinc-900 rounded-b-xl z-10" />

                                    {/* Phone Screen */}
                                    <div className="relative overflow-hidden rounded-[1.5rem] bg-zinc-800 aspect-[9/19]">
                                        {/* Status Bar */}
                                        <div className="flex items-center justify-between px-4 pt-2 text-[8px] text-zinc-400">
                                            <span>9:41</span>
                                            <div className="flex gap-1">
                                                <div className="w-3 h-1.5 bg-zinc-400 rounded-sm" />
                                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                                            </div>
                                        </div>

                                        {/* App Content - Voice Recording */}
                                        <div className="flex flex-col items-center justify-center h-full px-4 pb-8 -mt-4">
                                            {/* Photo thumbnails */}
                                            <div className="flex gap-1 mb-4">
                                                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                                                    +3
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-zinc-400 mb-4 text-center">
                                                Describe your work
                                            </p>

                                            {/* Mic Button */}
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                                    <Mic className="w-7 h-7 text-white" />
                                                </div>
                                                {/* Pulse animation */}
                                                <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping" />
                                            </div>

                                            <p className="text-[9px] text-zinc-500 mt-3">Hold to record</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Label */}
                                <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                                    1. Record from job site
                                </p>
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0">
                                <ArrowRight className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                            </div>

                            {/* Phone 2 - Published Project */}
                            <div className="relative">
                                {/* Phone Frame */}
                                <div className="relative w-[160px] sm:w-[180px] lg:w-[200px] rounded-[2rem] bg-zinc-900 p-2 shadow-2xl ring-1 ring-white/10">
                                    {/* Phone Notch */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-zinc-900 rounded-b-xl z-10" />

                                    {/* Phone Screen */}
                                    <div className="relative overflow-hidden rounded-[1.5rem] bg-white dark:bg-zinc-800 aspect-[9/19]">
                                        {/* Status Bar */}
                                        <div className="flex items-center justify-between px-4 pt-2 text-[8px] text-zinc-600 dark:text-zinc-400">
                                            <span>9:42</span>
                                            <div className="flex gap-1">
                                                <div className="w-3 h-1.5 bg-zinc-400 rounded-sm" />
                                                <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                                            </div>
                                        </div>

                                        {/* App Content - Published Project */}
                                        <div className="px-3 pt-2">
                                            {/* Project Image */}
                                            <div className="aspect-video rounded-lg bg-gradient-to-br from-amber-900/30 to-orange-900/30 mb-2 flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-amber-600/50" />
                                            </div>

                                            {/* Badge */}
                                            <div className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] text-green-600 dark:text-green-400 mb-1">
                                                ✓ Published
                                            </div>

                                            {/* Title */}
                                            <div className="h-3 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700 mb-2" />

                                            {/* Description lines */}
                                            <div className="space-y-1">
                                                <div className="h-2 w-full rounded bg-zinc-100 dark:bg-zinc-700/50" />
                                                <div className="h-2 w-full rounded bg-zinc-100 dark:bg-zinc-700/50" />
                                                <div className="h-2 w-3/4 rounded bg-zinc-100 dark:bg-zinc-700/50" />
                                            </div>

                                            {/* Share Button */}
                                            <div className="mt-3 flex justify-center">
                                                <div className="rounded-full bg-primary px-4 py-1.5 text-[8px] text-white font-medium">
                                                    Share with Customer
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Label */}
                                <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                                    2. Share instantly
                                </p>
                            </div>
                        </div>

                        {/* Floating badge */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                            <Badge variant="secondary" className="shadow-lg">
                                Works on any phone
                            </Badge>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
