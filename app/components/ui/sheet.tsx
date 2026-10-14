"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "~/utils/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  const container =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(".mfe-root") ?? undefined
      : undefined;

  return (
    <SheetPrimitive.Portal
      data-slot="sheet-portal"
      container={container}
      {...props}
    />
  );
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "copa:data-[state=open]:animate-in copa:data-[state=closed]:animate-out copa:data-[state=closed]:fade-out-0 copa:data-[state=open]:fade-in-0 copa:fixed copa:inset-0 copa:z-50 copa:bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "copa:bg-background copa:data-[state=open]:animate-in copa:data-[state=closed]:animate-out copa:fixed copa:z-50 copa:flex copa:flex-col copa:gap-4 copa:shadow-lg copa:transition copa:ease-in-out copa:data-[state=closed]:duration-300 copa:data-[state=open]:duration-500",
          side === "right" &&
            "copa:data-[state=closed]:slide-out-to-right copa:data-[state=open]:slide-in-from-right copa:inset-y-0 copa:right-0 copa:h-full copa:w-3/4 copa:border-l copa:sm:max-w-sm",
          side === "left" &&
            "copa:data-[state=closed]:slide-out-to-left copa:data-[state=open]:slide-in-from-left copa:inset-y-0 copa:left-0 copa:h-full copa:w-3/4 copa:border-r copa:sm:max-w-sm",
          side === "top" &&
            "copa:data-[state=closed]:slide-out-to-top copa:data-[state=open]:slide-in-from-top copa:inset-x-0 copa:top-0 copa:h-auto copa:border-b",
          side === "bottom" &&
            "copa:data-[state=closed]:slide-out-to-bottom copa:data-[state=open]:slide-in-from-bottom copa:inset-x-0 copa:bottom-0 copa:h-auto copa:border-t",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="copa:ring-offset-background copa:focus:ring-ring copa:data-[state=open]:bg-secondary copa:absolute copa:top-4 copa:right-4 copa:rounded-xs copa:opacity-70 copa:transition-opacity copa:hover:opacity-100 copa:focus:ring-2 copa:focus:ring-offset-2 copa:focus:outline-hidden copa:disabled:pointer-events-none">
          <XIcon className="copa:size-4" />
          <span className="copa:sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("copa:flex copa:flex-col copa:gap-1.5 copa:p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("copa:mt-auto copa:flex copa:flex-col copa:gap-2 copa:p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("copa:text-foreground copa:font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("copa:text-muted-foreground copa:text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
