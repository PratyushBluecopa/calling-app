"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";

import { useIsMobile } from "~/hooks/use-mobile";
import { cn } from "~/utils/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "copa:group/sidebar-wrapper copa:has-data-[variant=inset]:bg-sidebar copa:flex copa:min-h-svh copa:w-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "copa:bg-sidebar copa:text-sidebar-foreground copa:flex copa:h-full copa:w-(--sidebar-width) copa:flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="copa:bg-sidebar copa:text-sidebar-foreground copa:w-(--sidebar-width) copa:p-0 copa:[&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="copa:sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="copa:flex copa:h-full copa:w-full copa:flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="copa:group copa:peer copa:text-sidebar-foreground copa:hidden copa:md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "copa:relative copa:w-(--sidebar-width) copa:bg-transparent copa:transition-[width] copa:duration-200 copa:ease-linear",
          "copa:group-data-[collapsible=offcanvas]:w-0",
          "copa:group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "copa:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "copa:group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "copa:fixed copa:inset-y-0 copa:z-10 copa:hidden copa:h-svh copa:w-(--sidebar-width) copa:transition-[left,right,width] copa:duration-200 copa:ease-linear copa:md:flex",
          side === "left"
            ? "copa:left-0 copa:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "copa:right-0 copa:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "copa:p-2 copa:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "copa:group-data-[collapsible=icon]:w-(--sidebar-width-icon) copa:group-data-[side=left]:border-r copa:group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="copa:bg-sidebar copa:group-data-[variant=floating]:border-sidebar-border copa:flex copa:h-full copa:w-full copa:flex-col copa:group-data-[variant=floating]:rounded-lg copa:group-data-[variant=floating]:border copa:group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("copa:size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="copa:sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "copa:hover:after:bg-sidebar-border copa:absolute copa:inset-y-0 copa:z-20 copa:hidden copa:w-4 copa:-translate-x-1/2 copa:transition-all copa:ease-linear copa:group-data-[side=left]:-right-4 copa:group-data-[side=right]:left-0 copa:after:absolute copa:after:inset-y-0 copa:after:left-1/2 copa:after:w-[2px] copa:sm:flex",
        "copa:in-data-[side=left]:cursor-w-resize copa:in-data-[side=right]:cursor-e-resize",
        "copa:[[data-side=left][data-state=collapsed]_&]:cursor-e-resize copa:[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "copa:hover:group-data-[collapsible=offcanvas]:bg-sidebar copa:group-data-[collapsible=offcanvas]:translate-x-0 copa:group-data-[collapsible=offcanvas]:after:left-full",
        "copa:[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "copa:[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "copa:bg-background copa:relative copa:flex copa:w-full copa:flex-1 copa:flex-col",
        "copa:md:peer-data-[variant=inset]:m-2 copa:md:peer-data-[variant=inset]:ml-0 copa:md:peer-data-[variant=inset]:rounded-xl copa:md:peer-data-[variant=inset]:shadow-sm copa:md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("copa:bg-background copa:h-8 copa:w-full copa:shadow-none", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("copa:flex copa:flex-col copa:gap-2 copa:p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("copa:flex copa:flex-col copa:gap-2 copa:p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("copa:bg-sidebar-border copa:mx-2 copa:w-auto", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "copa:flex copa:min-h-0 copa:flex-1 copa:flex-col copa:gap-2 copa:overflow-auto copa:group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("copa:relative copa:flex copa:w-full copa:min-w-0 copa:flex-col copa:p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "copa:text-sidebar-foreground/70 copa:ring-sidebar-ring copa:flex copa:h-8 copa:shrink-0 copa:items-center copa:rounded-md copa:px-2 copa:text-xs copa:font-medium copa:outline-hidden copa:transition-[margin,opacity] copa:duration-200 copa:ease-linear copa:focus-visible:ring-2 copa:[&>svg]:size-4 copa:[&>svg]:shrink-0",
        "copa:group-data-[collapsible=icon]:-mt-8 copa:group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "copa:text-sidebar-foreground copa:ring-sidebar-ring copa:hover:bg-sidebar-accent copa:hover:text-sidebar-accent-foreground copa:absolute copa:top-3.5 copa:right-3 copa:flex copa:aspect-square copa:w-5 copa:items-center copa:justify-center copa:rounded-md copa:p-0 copa:outline-hidden copa:transition-transform copa:focus-visible:ring-2 copa:[&>svg]:size-4 copa:[&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "copa:after:absolute copa:after:-inset-2 copa:md:after:hidden",
        "copa:group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("copa:w-full copa:text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("copa:flex copa:w-full copa:min-w-0 copa:flex-col copa:gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("copa:group/menu-item copa:relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "copa:peer/menu-button copa:flex copa:w-full copa:items-center copa:gap-2 copa:overflow-hidden copa:rounded-md copa:p-2 copa:text-left copa:text-sm copa:outline-hidden copa:ring-sidebar-ring copa:transition-[width,height,padding] copa:hover:bg-sidebar-accent copa:hover:text-sidebar-accent-foreground copa:focus-visible:ring-2 copa:active:bg-sidebar-accent copa:active:text-sidebar-accent-foreground copa:disabled:pointer-events-none copa:disabled:opacity-50 copa:group-has-data-[sidebar=menu-action]/menu-item:pr-8 copa:aria-disabled:pointer-events-none copa:aria-disabled:opacity-50 copa:data-[active=true]:bg-sidebar-accent copa:data-[active=true]:font-medium copa:data-[active=true]:text-sidebar-accent-foreground copa:data-[state=open]:hover:bg-sidebar-accent copa:data-[state=open]:hover:text-sidebar-accent-foreground copa:group-data-[collapsible=icon]:size-8! copa:group-data-[collapsible=icon]:p-2! copa:[&>span:last-child]:truncate copa:[&>svg]:size-4 copa:[&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "copa:hover:bg-sidebar-accent copa:hover:text-sidebar-accent-foreground",
        outline:
          "copa:bg-background copa:shadow-[0_0_0_1px_hsl(var(--sidebar-border))] copa:hover:bg-sidebar-accent copa:hover:text-sidebar-accent-foreground copa:hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "copa:h-8 copa:text-sm",
        sm: "copa:h-7 copa:text-xs",
        lg: "copa:h-12 copa:text-sm copa:group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "copa:text-sidebar-foreground copa:ring-sidebar-ring copa:hover:bg-sidebar-accent copa:hover:text-sidebar-accent-foreground copa:peer-hover/menu-button:text-sidebar-accent-foreground copa:absolute copa:top-1.5 copa:right-1 copa:flex copa:aspect-square copa:w-5 copa:items-center copa:justify-center copa:rounded-md copa:p-0 copa:outline-hidden copa:transition-transform copa:focus-visible:ring-2 copa:[&>svg]:size-4 copa:[&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "copa:after:absolute copa:after:-inset-2 copa:md:after:hidden",
        "copa:peer-data-[size=sm]/menu-button:top-1",
        "copa:peer-data-[size=default]/menu-button:top-1.5",
        "copa:peer-data-[size=lg]/menu-button:top-2.5",
        "copa:group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "copa:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground copa:group-focus-within/menu-item:opacity-100 copa:group-hover/menu-item:opacity-100 copa:data-[state=open]:opacity-100 copa:md:opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "copa:text-sidebar-foreground copa:pointer-events-none copa:absolute copa:right-1 copa:flex copa:h-5 copa:min-w-5 copa:items-center copa:justify-center copa:rounded-md copa:px-1 copa:text-xs copa:font-medium copa:tabular-nums copa:select-none",
        "copa:peer-hover/menu-button:text-sidebar-accent-foreground copa:peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "copa:peer-data-[size=sm]/menu-button:top-1",
        "copa:peer-data-[size=default]/menu-button:top-1.5",
        "copa:peer-data-[size=lg]/menu-button:top-2.5",
        "copa:group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("copa:flex copa:h-8 copa:items-center copa:gap-2 copa:rounded-md copa:px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="copa:size-4 copa:rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="copa:h-4 copa:max-w-(--skeleton-width) copa:flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "copa:border-sidebar-border copa:mx-3.5 copa:flex copa:min-w-0 copa:translate-x-px copa:flex-col copa:gap-1 copa:border-l copa:px-2.5 copa:py-0.5",
        "copa:group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("copa:group/menu-sub-item copa:relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "copa:text-sidebar-foreground copa:ring-sidebar-ring copa:hover:bg-sidebar-accent copa:hover:text-sidebar-accent-foreground copa:active:bg-sidebar-accent copa:active:text-sidebar-accent-foreground copa:[&>svg]:text-sidebar-accent-foreground copa:flex copa:h-7 copa:min-w-0 copa:-translate-x-px copa:items-center copa:gap-2 copa:overflow-hidden copa:rounded-md copa:px-2 copa:outline-hidden copa:focus-visible:ring-2 copa:disabled:pointer-events-none copa:disabled:opacity-50 copa:aria-disabled:pointer-events-none copa:aria-disabled:opacity-50 copa:[&>span:last-child]:truncate copa:[&>svg]:size-4 copa:[&>svg]:shrink-0",
        "copa:data-[active=true]:bg-sidebar-accent copa:data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "copa:text-xs",
        size === "md" && "copa:text-sm",
        "copa:group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
