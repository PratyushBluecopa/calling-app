"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "~/utils/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("copa:flex copa:flex-col", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "copa:flex copa:items-center copa:gap-6 copa:border-b copa:border-border",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "copa:relative copa:inline-flex copa:items-center copa:justify-center copa:pb-3 copa:text-sm copa:font-medium copa:text-muted-foreground copa:transition-colors copa:hover:text-foreground copa:focus-visible:outline-none copa:data-[state=active]:text-primary copa:data-[state=active]:font-semibold copa:data-[state=active]:after:absolute copa:data-[state=active]:after:bottom-0 copa:data-[state=active]:after:left-0 copa:data-[state=active]:after:right-0 copa:data-[state=active]:after:h-0.5 copa:data-[state=active]:after:bg-primary copa:data-[state=active]:after:rounded-full copa:data-[disabled]:pointer-events-none copa:data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("copa:flex-1 copa:outline-none copa:pt-6", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
