"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "~/utils/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    data-slot="dropdown-menu-trigger"
    {...props}
  />
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const container =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(".mfe-root") ?? undefined
      : undefined;

  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "copa:bg-popover copa:text-popover-foreground copa:data-[state=open]:animate-in copa:data-[state=closed]:animate-out copa:data-[state=closed]:fade-out-0 copa:data-[state=open]:fade-in-0 copa:data-[state=closed]:zoom-out-95 copa:data-[state=open]:zoom-in-95 copa:data-[side=bottom]:slide-in-from-top-2 copa:data-[side=left]:slide-in-from-right-2 copa:data-[side=right]:slide-in-from-left-2 copa:data-[side=top]:slide-in-from-bottom-2 copa:z-50 copa:max-h-(--radix-dropdown-menu-content-available-height) copa:min-w-[8rem] copa:origin-(--radix-dropdown-menu-content-transform-origin) copa:overflow-x-hidden copa:overflow-y-auto copa:rounded-md copa:border copa:p-1 copa:shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "copa:focus:bg-accent copa:focus:text-accent-foreground copa:data-[variant=destructive]:text-destructive copa:data-[variant=destructive]:focus:bg-destructive/10 copa:dark:data-[variant=destructive]:focus:bg-destructive/20 copa:data-[variant=destructive]:focus:text-destructive copa:data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'copa:])]:text-muted-foreground copa:relative copa:flex copa:cursor-default copa:items-center copa:gap-2 copa:rounded-sm copa:px-2 copa:py-1.5 copa:text-sm copa:outline-hidden copa:select-none copa:data-[disabled]:pointer-events-none copa:data-[disabled]:opacity-50 copa:data-[inset]:pl-8 copa:[&_svg]:pointer-events-none copa:[&_svg]:shrink-0 [&_svg:not([class*='size-'copa:])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "copa:focus:bg-accent copa:focus:text-accent-foreground copa:relative copa:flex copa:cursor-default copa:items-center copa:gap-2 copa:rounded-sm copa:py-1.5 copa:pr-2 copa:pl-8 copa:text-sm copa:outline-hidden copa:select-none copa:data-[disabled]:pointer-events-none copa:data-[disabled]:opacity-50 copa:[&_svg]:pointer-events-none copa:[&_svg]:shrink-0 [&_svg:not([class*='size-'copa:])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="copa:pointer-events-none copa:absolute copa:left-2 copa:flex copa:size-3.5 copa:items-center copa:justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="copa:size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "copa:focus:bg-accent copa:focus:text-accent-foreground copa:relative copa:flex copa:cursor-default copa:items-center copa:gap-2 copa:rounded-sm copa:py-1.5 copa:pr-2 copa:pl-8 copa:text-sm copa:outline-hidden copa:select-none copa:data-[disabled]:pointer-events-none copa:data-[disabled]:opacity-50 copa:[&_svg]:pointer-events-none copa:[&_svg]:shrink-0 [&_svg:not([class*='size-'copa:])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="copa:pointer-events-none copa:absolute copa:left-2 copa:flex copa:size-3.5 copa:items-center copa:justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="copa:size-2 copa:fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "copa:px-2 copa:py-1.5 copa:text-sm copa:font-medium copa:data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("copa:bg-border copa:-mx-1 copa:my-1 copa:h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "copa:text-muted-foreground copa:ml-auto copa:text-xs copa:tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "copa:focus:bg-accent copa:focus:text-accent-foreground copa:data-[state=open]:bg-accent copa:data-[state=open]:text-accent-foreground copa:flex copa:cursor-default copa:items-center copa:rounded-sm copa:px-2 copa:py-1.5 copa:text-sm copa:outline-hidden copa:select-none copa:data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="copa:ml-auto copa:size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "copa:bg-popover copa:text-popover-foreground copa:data-[state=open]:animate-in copa:data-[state=closed]:animate-out copa:data-[state=closed]:fade-out-0 copa:data-[state=open]:fade-in-0 copa:data-[state=closed]:zoom-out-95 copa:data-[state=open]:zoom-in-95 copa:data-[side=bottom]:slide-in-from-top-2 copa:data-[side=left]:slide-in-from-right-2 copa:data-[side=right]:slide-in-from-left-2 copa:data-[side=top]:slide-in-from-bottom-2 copa:z-50 copa:min-w-[8rem] copa:origin-(--radix-dropdown-menu-content-transform-origin) copa:overflow-hidden copa:rounded-md copa:border copa:p-1 copa:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
