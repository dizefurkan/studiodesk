import * as React from "react"

import { cn } from "@/lib/utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-sm",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#111827]",
      secondary: "bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]",
      ghost: "hover:bg-[#F9FAFB] text-[#111827]",
      link: "text-[#4F46E5] underline-offset-4 hover:underline",
    }

    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2 text-sm font-medium",
      sm: "h-8 px-3 text-xs font-medium",
      lg: "h-12 px-8 text-base font-medium",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
