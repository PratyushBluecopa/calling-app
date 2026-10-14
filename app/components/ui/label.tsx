"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "~/utils/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "copa:flex copa:items-center copa:gap-2 copa:text-sm copa:leading-none copa:font-medium copa:select-none copa:group-data-[disabled=true]:pointer-events-none copa:group-data-[disabled=true]:opacity-50 copa:peer-disabled:cursor-not-allowed copa:peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
