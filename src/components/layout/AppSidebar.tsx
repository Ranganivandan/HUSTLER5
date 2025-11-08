import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  DollarSign,
  Settings,
  Calendar,
  User,
  Play,
  Palette,
  Sliders,
  MapPin,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationByRole = {
  employee: [
    { title: 'Dashboard', url: '/employee/dashboard', icon: LayoutDashboard },
    { title: 'Profile', url: '/employee/profile', icon: User },
    { title: 'Attendance', url: '/employee/attendance', icon: Clock },
    { title: 'Leaves', url: '/employee/leaves', icon: Calendar },
    { title: 'Payslips', url: '/employee/payslips', icon: FileText },
  ],
  hr: [
    { title: 'Dashboard', url: '/hr/dashboard', icon: LayoutDashboard },
    { title: 'Employees', url: '/hr/employees', icon: Users },
    { title: 'Attendance', url: '/hr/attendance', icon: Clock },
    { title: 'Leaves', url: '/hr/leaves', icon: Calendar },
  ],
  payroll: [
    { title: 'Dashboard', url: '/payroll/dashboard', icon: LayoutDashboard },
    { title: 'Pay Runs', url: '/payroll/payruns', icon: Play },
    { title: 'Configuration', url: '/payroll/configuration', icon: Sliders },
    { title: 'Payslip Designer', url: '/payroll/designer', icon: Palette },
    { title: 'Reports', url: '/payroll/reports', icon: FileText },
  ],
  admin: [
    { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: 'Office Location', url: '/admin/office-location', icon: MapPin },
    { title: 'Settings', url: '/admin/settings', icon: Settings },
    { title: 'Audit Logs', url: '/admin/audit', icon: FileText },
    { title: 'Reports', url: '/admin/reports', icon: FileText },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const { open } = useSidebar();

  if (!user) return null;

  const items = navigationByRole[user.role] || [];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">WZ</span>
            </div>
            {open && (
              <span className="text-lg font-bold text-sidebar-foreground">
                WorkZen
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
