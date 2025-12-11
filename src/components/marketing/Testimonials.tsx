import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
    {
        name: "Mike Ross",
        role: "Owner, Ross Masonry",
        content: "I used to spend my Sunday nights uploading photos to my terrible Wordpress site. Now I just talk to KnearMe on the drive home and it's done.",
        rating: 5,
        initials: "MR"
    },
    {
        name: "Sarah Jenkins",
        role: "SJ Brickworks",
        content: "The pages looking amazing. My customers are actually impressed when I send them the link. It looks way more expensive than it is.",
        rating: 5,
        initials: "SJ"
    },
    {
        name: "David Chen",
        role: "Master Stoneworks",
        content: "Finally, something that actually works for tradies. No complicated tech, just results. Ranking #1 in my city for 'chimney repair' now.",
        rating: 5,
        initials: "DC"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Trusted by Pros
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
