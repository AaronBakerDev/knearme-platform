import { Type, Search, Layout } from "lucide-react";

const features = [
    {
        icon: Type,
        title: "Zero Typing Required",
        description: "Hate writing case studies? Just talk. Our AI transcribes your voice and turns it into professional copy that sells your services.",
    },
    {
        icon: Search,
        title: "SEO Built-in",
        description: "Every project page is automatically optimized for local search terms like 'Brick Repair in [City]', helping you rank higher on Google.",
    },
    {
        icon: Layout,
        title: "Premium Design",
        description: "Your portfolio looks like it cost $10,000. Clean, modern, and mobile-friendly layouts that impress high-end homeowners.",
    },
];

export function FeatureGrid() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Why Contractors Love KnearMe
                    </h2>
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
