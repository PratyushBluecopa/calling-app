import * as React from "react";

import { cn } from "~/utils/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "copa:file:text-foreground copa:placeholder:text-muted-foreground copa:selection:bg-primary copa:selection:text-primary-foreground copa:dark:bg-input/30 copa:border-input copa:flex copa:h-9 copa:w-full copa:min-w-0 copa:rounded-md copa:border copa:bg-transparent copa:px-3 copa:py-1 copa:text-base copa:shadow-xs copa:transition-[color,box-shadow] copa:outline-none copa:file:inline-flex copa:file:h-7 copa:file:border-0 copa:file:bg-transparent copa:file:text-sm copa:file:font-medium copa:disabled:pointer-events-none copa:disabled:cursor-not-allowed copa:disabled:opacity-50 copa:md:text-sm",
        "copa:focus-visible:border-ring copa:focus-visible:ring-ring/50 copa:focus-visible:ring-[3px]",
        "copa:aria-invalid:ring-destructive/20 copa:dark:aria-invalid:ring-destructive/40 copa:aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
