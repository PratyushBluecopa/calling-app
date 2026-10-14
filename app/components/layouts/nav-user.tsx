import { IconHelpCircle, IconMessageCircle } from "@tabler/icons-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export function NavFooter() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a
            href="https://docs.bluecopa.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconHelpCircle className="copa:size-4" />
            <span>Help & Docs</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a
            href="https://bluecopa.com/support"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconMessageCircle className="copa:size-4" />
            <span>Support</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
