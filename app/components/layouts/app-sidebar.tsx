import * as React from "react";
import {
  IconPhone,
  IconSettings,
} from "@tabler/icons-react";

import { BluecopaLogo } from "~/components/bluecopa-logo";
import { NavMain, type NavSection } from "~/components/layouts/nav-main";
import { NavFooter } from "~/components/layouts/nav-user";
import { ROUTES } from "~/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";

const navSections: NavSection[] = [
  {
    items: [{ title: "Dialer", url: ROUTES.DIALER, icon: IconPhone }],
  },
  {
    items: [{ title: "Settings", url: ROUTES.SETTINGS, icon: IconSettings }],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="copa:data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="https://bluecopa.com">
                <BluecopaLogo className="copa:size-8" />
                <span className="copa:text-base copa:font-semibold">Bluecopa</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className="copa:mx-0" />
      <SidebarContent>
        <NavMain sections={navSections} />
      </SidebarContent>
      <SidebarSeparator className="copa:mx-0" />
      <SidebarFooter>
        <NavFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
