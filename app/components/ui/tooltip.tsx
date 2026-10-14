import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "~/utils/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal
      container={
        typeof document !== "undefined"
          ? document.querySelector<HTMLElement>(".mfe-root") ?? undefined
          : undefined
      }
    >
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "copa:bg-primary copa:text-primary-foreground copa:animate-in copa:fade-in-0 copa:zoom-in-95 copa:data-[state=closed]:animate-out copa:data-[state=closed]:fade-out-0 copa:data-[state=closed]:zoom-out-95 copa:data-[side=bottom]:slide-in-from-top-2 copa:data-[side=left]:slide-in-from-right-2 copa:data-[side=right]:slide-in-from-left-2 copa:data-[side=top]:slide-in-from-bottom-2 copa:z-50 copa:w-fit copa:origin-(--radix-tooltip-content-transform-origin) copa:rounded-md copa:px-3 copa:py-1.5 copa:text-xs copa:text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="copa:bg-primary copa:fill-primary copa:z-50 copa:size-2.5 copa:translate-y-[calc(-50%_-_2px)] copa:rotate-45 copa:rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
