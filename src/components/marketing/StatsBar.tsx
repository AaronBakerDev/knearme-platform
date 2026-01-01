import { Mic, Camera, Globe, Clock } from "lucide-react";

/**
 * Stats Bar Section
 *
 * Shows what the product does - not fake metrics.
 * Positioned after Hero to reinforce value prop.
 */

const stats = [
  {
    icon: Camera,
    value: "Photos",
    label: "Upload from your phone",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Mic,
    value: "Voice",
    label: "Describe your work",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Clock,
    value: "2 min",
    label: "To publish a project",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Globe,
    value: "Live",
    label: "Shareable instantly",
    color: "text-green-600 dark:text-green-400",
  },
];

export function StatsBar() {
  return (
    <section className="py-12 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
