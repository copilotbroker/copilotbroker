import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border border-crm-success/35 bg-crm-success text-crm-success-foreground shadow-[0_8px_20px_hsl(var(--crm-success)/0.22)] hover:bg-crm-success/90 hover:shadow-[0_12px_28px_hsl(var(--crm-success)/0.28)]",
        warning: "border border-crm-warning/35 bg-crm-warning text-crm-warning-foreground shadow-[0_8px_20px_hsl(var(--crm-warning)/0.22)] hover:bg-crm-warning/90 hover:shadow-[0_12px_28px_hsl(var(--crm-warning)/0.28)]",
        info: "border border-crm-info/35 bg-crm-info text-crm-info-foreground shadow-[0_8px_20px_hsl(var(--crm-info)/0.2)] hover:bg-crm-info/90 hover:shadow-[0_12px_28px_hsl(var(--crm-info)/0.26)]",
        accent: "border border-crm-accent/35 bg-crm-accent text-crm-accent-foreground shadow-[0_8px_20px_hsl(var(--crm-accent)/0.22)] hover:bg-crm-accent/90 hover:shadow-[0_12px_28px_hsl(var(--crm-accent)/0.28)]",
        neutral: "border border-crm-neutral/35 bg-crm-neutral text-crm-neutral-foreground shadow-[0_8px_20px_hsl(var(--crm-neutral)/0.18)] hover:bg-crm-neutral/90 hover:shadow-[0_12px_28px_hsl(var(--crm-neutral)/0.24)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
