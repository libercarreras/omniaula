import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, GraduationCap,
  Eye, BookText, Calendar, FileBarChart, BarChart3, BookOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Panel", url: "/", icon: LayoutDashboard },
  { title: "Materias", url: "/materias", icon: BookOpen },
  { title: "Grupos", url: "/grupos", icon: Users },
  { title: "Estudiantes", url: "/estudiantes", icon: GraduationCap },
  { title: "Asistencia", url: "/asistencia", icon: UserCheck },
  { title: "Evaluaciones", url: "/evaluaciones", icon: ClipboardCheck },
  { title: "Seguimiento", url: "/seguimiento", icon: Eye },
  { title: "Diario de Clase", url: "/diario", icon: BookText },
  { title: "Planificación", url: "/planificacion", icon: Calendar },
  { title: "Informes", url: "/informes", icon: FileBarChart },
  { title: "Análisis", url: "/analisis", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
