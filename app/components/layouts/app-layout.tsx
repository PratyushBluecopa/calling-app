import { Outlet } from "react-router-dom";
import { AppSidebar } from "~/components/layouts/app-sidebar";
import { SiteHeader } from "~/components/layouts/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

export function AppLayout() {
  return (
    <SidebarProvider
      style={
        { "--sidebar-width": "16rem" } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="copa:flex copa:flex-1 copa:flex-col copa:gap-6 copa:px-6 copa:py-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
