import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
    {
        name: "Mike R.",
        role: "Rocky Mountain Masonry",
        content: "A customer told me they hired me because they saw my chimney work online. That one project paid for a year of KnearMe.",
        rating: 5,
        initials: "MR"
    },
    {
        name: "Carlos M.",
        role: "Heritage Brickwork",
        content: "I used to lose jobs to guys with flashy websites. Now my work speaks for itself. Three new customers last month found me through my projects.",
        rating: 5,
        initials: "CM"
    },
    {
        name: "Tom K.",
        role: "Keystone Masonry",
        content: "My nephew set up my website years ago with three photos. Now I've got 40 projects and customers actually call me saying they found me on Google.",
        rating: 5,
        initials: "TK"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Contractors Winning More Jobs
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="border-none shadow-sm bg-background">
                            <CardContent className="pt-6">
                                <div className="flex gap-1 mb-4 text-amber-500">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-current" />
                                    ))}
                                </div>
                                <p className="mb-6 text-muted-foreground italic">{testimonial.content}</p>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary">{testimonial.initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
