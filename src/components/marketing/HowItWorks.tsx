import { Camera, Mic, Sparkles, Globe } from "lucide-react";

const steps = [
    {
        icon: Camera,
        title: "1. Snap Photos",
        description: "Take a few quick photos of your finished work. Don&apos;t worry about lighting or angles—our AI handles the rest.",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
        icon: Mic,
        title: "2. Record Voice Note",
        description: "Tap the microphone and tell us what you did. 'Fixed a chimney in Toronto using red clay brick.' That&apos;s it.",
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
        icon: Sparkles,
        title: "3. AI Magic",
        description: "KnearMe generates a beautiful project page, writes the description, and tags it for SEO automatically.",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
        icon: Globe,
        title: "4. Publish & Rank",
        description: "Your project goes live instantly. Homeowners in your area start finding you on Google for that specific service.",
        color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        From Job Site to Website in Minutes
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Stop spending hours at the computer. Build your portfolio while you&apos;re still in the truck.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="group relative flex flex-col items-center rounded-2xl bg-background p-8 text-center shadow-xs ring-1 ring-zinc-900/5 transition-all hover:shadow-md hover:ring-primary/20 dark:ring-white/10"
                        >
                            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} transition-transform group-hover:scale-110`}>
                                <step.icon className="h-8 w-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-foreground">
                                {step.title}
                            </h3>
                            <p className="text-muted-foreground">
                                {step.description}
                            </p>

                            {/* Connector Line (Desktop) - hidden for last item */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute -right-4 top-16 h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
