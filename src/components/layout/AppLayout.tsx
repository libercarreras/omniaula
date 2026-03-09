import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookOpen } from "lucide-react";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 sticky top-0 z-40">
            {!isMobile && <SidebarTrigger />}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="font-display font-bold text-lg text-foreground">Libreta Docente</h1>
            </div>
          </header>
          <main className={`flex-1 p-4 md:p-6 ${isMobile ? "pb-24" : ""}`}>
            <Outlet />
          </main>
          {isMobile && <MobileNav />}
        </div>
      </div>
    </SidebarProvider>
  );
}
