import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Comparison Section
 *
 * Shows why KnearMe beats alternatives contractors typically consider.
 * Addresses the "why should I pay for this?" objection.
 */

const comparisons = [
  {
    name: "KnearMe",
    highlight: true,
    features: {
      setupTime: "2 minutes",
      monthlyPrice: "$0-29",
      typing: false,
      seo: true,
      mobile: true,
      updates: "Instant",
    },
  },
  {
    name: "DIY Website",
    highlight: false,
    features: {
      setupTime: "Hours",
      monthlyPrice: "$10-50",
      typing: true,
      seo: false,
      mobile: "Maybe",
      updates: "Manual",
    },
  },
  {
    name: "Hire a Designer",
    highlight: false,
    features: {
      setupTime: "Weeks",
      monthlyPrice: "$500+",
      typing: true,
      seo: "Extra $$$",
      mobile: true,
      updates: "Pay per update",
    },
  },
  {
    name: "Do Nothing",
    highlight: false,
    features: {
      setupTime: "N/A",
      monthlyPrice: "$0",
      typing: false,
      seo: false,
      mobile: false,
      updates: "N/A",
    },
  },
];

const featureLabels = {
  setupTime: "Time to First Project",
  monthlyPrice: "Monthly Cost",
  typing: "Requires Typing",
  seo: "Shows Up on Google",
  mobile: "Mobile-Friendly",
  updates: "Project Updates",
};

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-red-500 mx-auto" />;
  }
  if (value === "Maybe" || value === "Extra $$$") {
    return <span className="text-amber-600 dark:text-amber-400 text-sm">{value}</span>;
  }
  return <span className="text-sm">{value}</span>;
}

export function Comparison() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Contractors Choose KnearMe
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Compare your options. The choice is clear.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block mx-auto max-w-5xl overflow-hidden rounded-xl border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Feature
                </th>
                {comparisons.map((option) => (
                  <th
                    key={option.name}
                    className={`px-6 py-4 text-center text-sm font-semibold ${
                      option.highlight
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {option.name}
                    {option.highlight && (
                      <span className="ml-2 text-xs font-normal opacity-80">
                        ✓ Best
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(featureLabels).map(([key, label], index) => (
                <tr
                  key={key}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {label}
                  </td>
                  {comparisons.map((option) => (
                    <td
                      key={`${option.name}-${key}`}
                      className={`px-6 py-4 text-center ${
                        option.highlight ? "bg-primary/5" : ""
                      }`}
                    >
                      <FeatureValue
                        value={option.features[key as keyof typeof option.features]}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {comparisons.map((option) => (
            <Card
              key={option.name}
              className={option.highlight ? "border-primary ring-2 ring-primary" : ""}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {option.name}
                  {option.highlight && (
                    <span className="text-xs font-normal text-primary">
                      ✓ Best Choice
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(featureLabels).map(([key, label]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">
                      <FeatureValue
                        value={option.features[key as keyof typeof option.features]}
                      />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom message */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Stop losing jobs to competitors with better websites. Start showing your work today.
        </p>
      </div>
    </section>
  );
}
