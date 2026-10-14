import {
  IconChevronDown,
  IconLogout,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react";

import { BluecopaLogo } from "~/components/bluecopa-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { useAppContext } from "~/contexts/app-context";

function UserInitials({ name }: { name?: string }) {
  const initials = (name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="copa:flex copa:size-8 copa:shrink-0 copa:items-center copa:justify-center copa:rounded-full copa:bg-primary/10 copa:text-xs copa:font-semibold copa:text-primary">
      {initials || "?"}
    </span>
  );
}

export function SiteHeader() {
  const { user } = useAppContext();

  return (
    <header className="copa:flex copa:h-14 copa:shrink-0 copa:items-center copa:gap-2 copa:px-6 copa:bg-sidebar copa:border-b copa:border-sidebar-border">
      <SidebarTrigger className="copa:-ml-1" />
      <Separator
        orientation="vertical"
        className="copa:mx-2 copa:data-[orientation=vertical]:h-4"
      />
      <BluecopaLogo className="copa:size-7" />
      <span className="copa:text-sm copa:font-semibold">Bluecopa</span>

      <div className="copa:ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="copa:flex copa:items-center copa:gap-2.5 copa:rounded-full copa:border copa:border-border copa:py-1 copa:pl-1 copa:pr-3 copa:text-sm copa:shadow-sm copa:transition-colors copa:hover:bg-accent copa:focus-visible:outline-none copa:focus-visible:ring-2 copa:focus-visible:ring-ring">
              <UserInitials name={user?.name} />
              <span className="copa:hidden copa:sm:inline copa:font-medium copa:text-foreground">
                {user?.name}
              </span>
              <IconChevronDown className="copa:size-3.5 copa:text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="copa:w-60 copa:rounded-lg copa:p-1.5 copa:shadow-lg">
            <DropdownMenuLabel className="copa:px-2 copa:py-2 copa:font-normal">
              <div className="copa:flex copa:items-center copa:gap-2.5">
                <UserInitials name={user?.name} />
                <div className="copa:min-w-0 copa:flex copa:flex-col">
                  <span className="copa:truncate copa:text-sm copa:font-medium">
                    {user?.name}
                  </span>
                  <span className="copa:truncate copa:text-xs copa:text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="copa:my-1.5" />
            <DropdownMenuItem className="copa:gap-2 copa:px-2 copa:py-1.5 copa:text-sm">
              <IconUserCircle className="copa:size-4 copa:text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="copa:gap-2 copa:px-2 copa:py-1.5 copa:text-sm">
              <IconSettings className="copa:size-4 copa:text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="copa:my-1.5" />
            <DropdownMenuItem className="copa:gap-2 copa:px-2 copa:py-1.5 copa:text-sm copa:text-destructive">
              <IconLogout className="copa:size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
