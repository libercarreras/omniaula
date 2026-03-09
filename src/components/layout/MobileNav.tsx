import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, MoreHorizontal,
  Eye, BookText, Calendar, FileBarChart, BarChart3, GraduationCap, BookOpen, Shield, Building2,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const mainTabs = [
  { title: "Panel", url: "/", icon: LayoutDashboard },
  { title: "Instituciones", url: "/instituciones", icon: Building2 },
  { title: "Grupos", url: "/grupos", icon: Users },
  { title: "Asistencia", url: "/asistencia", icon: UserCheck },
  { title: "Más", url: "#more", icon: MoreHorizontal },
];

const moreItems = [
  { title: "Materias", url: "/materias", icon: BookOpen },
  { title: "Estudiantes", url: "/estudiantes", icon: GraduationCap },
  { title: "Evaluaciones", url: "/evaluaciones", icon: ClipboardCheck },
  { title: "Seguimiento", url: "/seguimiento", icon: Eye },
  { title: "Diario de Clase", url: "/diario", icon: BookText },
  { title: "Planificación", url: "/planificacion", icon: Calendar },
  { title: "Informes", url: "/informes", icon: FileBarChart },
  { title: "Análisis", url: "/analisis", icon: BarChart3 },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const adminItem = { title: "Admin", url: "/administracion", icon: Shield };
  const allMoreItems = role === "admin" ? [...moreItems, adminItem] : moreItems;
  const isMoreActive = allMoreItems.some((item) => isActive(item.url));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {mainTabs.map((tab) => {
            if (tab.url === "#more") {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors",
                    isMoreActive && "text-primary"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.title}</span>
                </button>
              );
            }
            return (
              <RouterNavLink
                key={tab.url}
                to={tab.url}
                end={tab.url === "/"}
                className={({ isActive: active }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.title}</span>
              </RouterNavLink>
            );
          })}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Más opciones</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4 py-6">
            {allMoreItems.map((item) => (
              <RouterNavLink
                key={item.url}
                to={item.url}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                  isActive(item.url) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{item.title}</span>
              </RouterNavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
