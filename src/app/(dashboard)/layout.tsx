import { requireAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={user.role} userName={user.nome} />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/50 px-6 py-3 shrink-0 backdrop-blur-sm bg-background/80">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 max-w-[1400px] mx-auto w-full">{children}</div>
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
