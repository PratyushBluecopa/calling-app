import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/utils/utils";

const buttonVariants = cva(
  "copa:inline-flex copa:items-center copa:justify-center copa:gap-2 copa:whitespace-nowrap copa:rounded-md copa:text-sm copa:font-medium copa:transition-all copa:disabled:pointer-events-none copa:disabled:opacity-50 copa:[&_svg]:pointer-events-none [&_svg:not([class*='size-'copa:])]:size-4 copa:shrink-0 copa:[&_svg]:shrink-0 copa:outline-none copa:focus-visible:border-ring copa:focus-visible:ring-ring/50 copa:focus-visible:ring-[3px] copa:aria-invalid:ring-destructive/20 copa:dark:aria-invalid:ring-destructive/40 copa:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "copa:bg-primary copa:text-primary-foreground copa:shadow-xs copa:hover:bg-primary/90",
        destructive:
          "copa:bg-destructive copa:text-white copa:shadow-xs copa:hover:bg-destructive/90 copa:focus-visible:ring-destructive/20 copa:dark:focus-visible:ring-destructive/40 copa:dark:bg-destructive/60",
        outline:
          "copa:border copa:bg-background copa:shadow-xs copa:hover:bg-accent copa:hover:text-accent-foreground copa:dark:bg-input/30 copa:dark:border-input copa:dark:hover:bg-input/50",
        secondary:
          "copa:bg-secondary copa:text-secondary-foreground copa:shadow-xs copa:hover:bg-secondary/80",
        ghost:
          "copa:hover:bg-accent copa:hover:text-accent-foreground copa:dark:hover:bg-accent/50",
        link: "copa:text-primary copa:underline-offset-4 copa:hover:underline",
      },
      size: {
        default: "copa:h-9 copa:px-4 copa:py-2 copa:has-[>svg]:px-3",
        sm: "copa:h-8 copa:rounded-md copa:gap-1.5 copa:px-3 copa:has-[>svg]:px-2.5",
        lg: "copa:h-10 copa:rounded-md copa:px-6 copa:has-[>svg]:px-4",
        icon: "copa:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
