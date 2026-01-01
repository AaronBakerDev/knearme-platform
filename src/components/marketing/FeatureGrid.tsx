import { Mic, Search, Layout } from "lucide-react";

const features = [
    {
        icon: Mic,
        title: "Voice-First Creation",
        description: "Describe your project like you're talking to a customer. We turn your words into polished case studies—no typing, no staring at a blank page.",
    },
    {
        icon: Search,
        title: "Built for Local Search",
        description: "Every project page is structured to help you show up when homeowners search for services in your area. Real visibility, not just a pretty portfolio.",
    },
    {
        icon: Layout,
        title: "Professional Without the Price Tag",
        description: "Clean, modern layouts that make your work look as good as it deserves. Mobile-friendly and ready to impress potential customers.",
    },
];

export function FeatureGrid() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Built for Busy Contractors
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Everything you need to turn finished projects into marketing that works.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col items-start">
                            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-4 text-2xl font-bold text-foreground">
                                {feature.title}
                            </h3>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
