import { Camera, Mic, Sparkles, Send, ChevronRight } from "lucide-react";

/**
 * How It Works - Visual Journey
 *
 * Shows the 4-step process as a flowing visual experience.
 * Avoids B2B jargon like "case study" - uses "project page" instead.
 */

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-background overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        From Job Site to Online
                        <span className="block text-primary mt-1">In Under 3 Minutes</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        No writing. No design skills. Just your phone and your voice.
                    </p>
                </div>

                {/* Steps - Staggered Layout */}
                <div className="max-w-5xl mx-auto">
                    {/* Step 1 */}
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16">
                        <div className="flex-1 order-2 md:order-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg">1</span>
                                <h3 className="text-2xl font-bold text-foreground">Snap Some Photos</h3>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Right from the job site. Before, during, after—whatever shows off your work.
                                Takes 30 seconds while you&apos;re already there.
                            </p>
                        </div>
                        <div className="flex-1 order-1 md:order-2">
                            <div className="relative">
                                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                    <div className="text-center">
                                        <Camera className="w-16 h-16 text-blue-500 mx-auto mb-3" strokeWidth={1.5} />
                                        <div className="flex gap-2 justify-center">
                                            <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700" />
                                            <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700" />
                                            <div className="w-12 h-12 rounded-lg bg-blue-500/30 border border-blue-500/50 flex items-center justify-center text-blue-400 text-xs">+3</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Connecting arrow */}
                                <div className="hidden md:flex absolute -bottom-12 left-1/2 -translate-x-1/2 items-center justify-center">
                                    <ChevronRight className="w-6 h-6 text-muted-foreground/50 rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16">
                        <div className="flex-1">
                            <div className="relative">
                                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="relative inline-block">
                                            <Mic className="w-16 h-16 text-purple-500 mx-auto" strokeWidth={1.5} />
                                            {/* Pulse rings */}
                                            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
                                        </div>
                                        <p className="mt-4 text-sm text-purple-400 max-w-[200px]">
                                            &quot;We rebuilt this chimney from the ground up...&quot;
                                        </p>
                                    </div>
                                </div>
                                {/* Connecting arrow */}
                                <div className="hidden md:flex absolute -bottom-12 left-1/2 -translate-x-1/2 items-center justify-center">
                                    <ChevronRight className="w-6 h-6 text-muted-foreground/50 rotate-90" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 text-white font-bold text-lg">2</span>
                                <h3 className="text-2xl font-bold text-foreground">Talk About It</h3>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Tap record and describe what you did—like you&apos;re telling a customer.
                                60 seconds is plenty. We handle the rest.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16">
                        <div className="flex-1 order-2 md:order-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 text-white font-bold text-lg">3</span>
                                <h3 className="text-2xl font-bold text-foreground">We Write It Up</h3>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Your photos and voice become a professional project page—with a title,
                                description, and all the details that help customers find you online.
                            </p>
                        </div>
                        <div className="flex-1 order-1 md:order-2">
                            <div className="relative">
                                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center p-6">
                                    <div className="w-full max-w-[240px] bg-zinc-900 rounded-lg p-4 shadow-xl">
                                        <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
                                        <div className="h-3 w-3/4 bg-zinc-700 rounded mb-2" />
                                        <div className="space-y-1.5">
                                            <div className="h-2 w-full bg-zinc-800 rounded" />
                                            <div className="h-2 w-full bg-zinc-800 rounded" />
                                            <div className="h-2 w-2/3 bg-zinc-800 rounded" />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <div className="h-6 w-6 bg-zinc-800 rounded" />
                                            <div className="h-6 w-6 bg-zinc-800 rounded" />
                                            <div className="h-6 w-6 bg-zinc-800 rounded" />
                                        </div>
                                    </div>
                                </div>
                                {/* Connecting arrow */}
                                <div className="hidden md:flex absolute -bottom-12 left-1/2 -translate-x-1/2 items-center justify-center">
                                    <ChevronRight className="w-6 h-6 text-muted-foreground/50 rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="flex-1">
                            <div className="relative">
                                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 flex items-center justify-center">
                                    <div className="text-center">
                                        <Send className="w-12 h-12 text-green-500 mx-auto mb-3" strokeWidth={1.5} />
                                        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 text-sm px-3 py-1.5 rounded-full">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            Published & Live
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white font-bold text-lg">4</span>
                                <h3 className="text-2xl font-bold text-foreground">Share & Get Found</h3>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                One tap to publish. Send the link to customers, post it on social,
                                or let it work for you in local search results.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
