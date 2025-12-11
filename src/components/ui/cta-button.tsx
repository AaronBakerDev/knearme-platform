import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface CTAButtonProps extends React.ComponentProps<typeof Button> {
    children: React.ReactNode
    showArrow?: boolean
}

export function CTAButton({
    children,
    className,
    size = "lg",
    showArrow = true,
    ...props
}: CTAButtonProps) {
    return (
        <Button
            size={size}
            className={cn(
                "rounded-full text-base font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-primary/20 active:scale-[0.98]",
                className
            )}
            {...props}
        >
            {children}
            {showArrow && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </Button>
    )
}
