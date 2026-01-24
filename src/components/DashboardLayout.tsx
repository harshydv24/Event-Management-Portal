import React from 'react';
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  Plus,
  LogOut,
  GraduationCap,
  Users,
  Building2,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const roleConfig = {
  student: {
    icon: GraduationCap,
    title: 'Student Portal',
    color: 'bg-student',
    navItems: [
      { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/student/events', label: 'All Events', icon: Calendar },
    ],
  },
  club: {
    icon: Users,
    title: 'Club Portal',
    color: 'bg-club',
    navItems: [
      { path: '/club', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/club/create-event', label: 'Create Event', icon: Plus },
      { path: '/club/events', label: 'My Events', icon: Calendar },
    ],
  },
  department: {
    icon: Building2,
    title: 'Department Portal',
    color: 'bg-club',
    navItems: [
      { path: '/department', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/department/pending', label: 'Pending Approval', icon: Calendar },
      { path: '/department/approved', label: 'Approved Events', icon: Calendar },
    ],
  },
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const config = roleConfig[user.role];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
<header className="bg-primary text-primary-foreground shadow-sm">
  <div className="container mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          {config.title}
        </h1>
        <p className="text-xs opacity-90 tracking-wide">
          Welcome, {user.name} 👋
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {/* Notification dot - can be made dynamic */}
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </Button>

      {/* Enhanced Theme Toggle */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>

      <Button
        variant="ghost"
        className="text-white hover:bg-white/20"
        onClick={logout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  </div>
</header>

{/* Breadcrumb Layer */}
<div className="border-b bg-muted/30 backdrop-blur">
  <div className="container mx-auto px-4 py-2">
    <div className="text-xs text-muted-foreground tracking-wide">
      {config.title} › {location.pathname.split('/')[1] || 'Dashboard'}
    </div>
  </div>
</div>

{/* Navigation Tabs */}
<nav className="border-b bg-background">
  <div className="container mx-auto px-4 flex items-center justify-between gap-3 py-2">

    {/* Tabs */}
    <div className="flex gap-4 overflow-x-auto scrollbar-none relative">
      {config.navItems.filter(item => item.label !== 'Create Event').map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}>
            <span
              className={`
                text-sm cursor-pointer pb-2 transition tracking-wide whitespace-nowrap
                ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {item.label}
            </span>
            {isActive && (
              <div className="h-[2px] rounded-full bg-primary mt-1"></div>
            )}
          </Link>
        );
      })}
    </div>

    {/* Actions */}
    {user.role === 'club' && (
      <Button size="sm" className="font-medium tracking-wide" asChild>
        <Link to="/club/create-event">
        <Plus className="w-3 h-3 mr-0" />
        Create Event
        </Link>
      </Button>
    )}
  </div>
</nav>


      

      {/* old */}
      {/* Navigation
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {config.navItems.map((item) => {
              const NavIcon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`rounded-none border-b-2 ${
                      isActive 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <NavIcon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav> */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>

      <footer className="border-t bg-muted/30">
  <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
    © {new Date().getFullYear()} University Event Management System. All rights reserved.
  </div>
</footer>
    </div>
  );
};

export default DashboardLayout;