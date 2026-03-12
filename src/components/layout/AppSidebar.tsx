import { APP_VERSION } from "@/version";
import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, GraduationCap,
  Eye, BookText, Calendar, FileBarChart, BarChart3, BookOpen, Shield, Building2, ChevronDown, Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Panel", url: "/", icon: LayoutDashboard },
  { title: "Instituciones", url: "/instituciones", icon: Building2 },
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
  const { role } = useAuth();
  const { instituciones, institucionActiva, setInstitucionActiva } = useInstitucion();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {/* Institution selector */}
        {!collapsed && instituciones.length > 1 && (
          <div className="px-3 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-xs h-9 gap-1">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{institucionActiva?.nombre || "Seleccionar"}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {instituciones.map(inst => (
                  <DropdownMenuItem key={inst.id} onClick={() => setInstitucionActiva(inst)} className={inst.id === institucionActiva?.id ? "bg-primary/10" : ""}>
                    {inst.nombre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

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

        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/administracion"
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Administración</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/configuracion"
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Configuración</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
