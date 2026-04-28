import React from 'react';
import ThemeToggle from "@/components/ThemeToggle";
import NotificationPanel from '@/components/NotificationPanel';
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
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const roleConfig = {
  student: {
    icon: GraduationCap,
    title: 'Student Portal',
    navItems: [
      { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/student/events', label: 'All Events', icon: Calendar },
    ],
  },
  club: {
    icon: Users,
    title: 'Club Portal',
    navItems: [
      { path: '/club', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/club/events', label: 'My Events', icon: Calendar },
    ],
  },
  department: {
    icon: Building2,
    title: 'Department Portal',
    navItems: [
      { path: '/department', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/department/clubs', label: 'Registered Clubs', icon: Users },
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
      <header className="surface-2 sticky top-0 z-50 border-b border-border relative">
        <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
        <div className="w-full px-4 py-3 flex items-center justify-between relative">
          {/* Left — Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full surface-translucent-3 border border-border flex items-center justify-center text-foreground">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {config.title}
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide">
                Welcome, {user.name}
              </p>
            </div>
          </div>

          {/* Center — Navigation Tabs */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
            {config.navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <span
                    className={`
                      relative text-sm px-3 py-1.5 rounded-md transition-all duration-200 tracking-wide whitespace-nowrap font-emphasis
                      ${isActive
                        ? 'text-foreground surface-translucent-3'
                        : 'text-muted-foreground hover:text-foreground hover:surface-translucent-2'}
                    `}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationPanel />

            <ThemeToggle />

            {/* Logout — icon-only, matching theme toggle style */}
            <button
              onClick={logout}
              className="rounded-full w-9 h-9 p-0 flex items-center justify-center
                surface-translucent-2 border border-standard
                text-foreground/80 hover:text-foreground
                hover:surface-translucent-3
                transition-all duration-200 cursor-pointer"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Create Event — Club only */}
            {user.role === 'club' && (
              <>
                {/* Vertical separator */}
                <div className="w-px h-6 bg-border mx-1" />

                <Button size="sm" className="font-emphasis tracking-wide" asChild>
                  <Link to="/club/create-event">
                    Create Event
                    <Plus className="w-3.5 h-3.5 mr-1" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs — shown below header on small screens */}
        <div className="md:hidden border-t border-border">
          <div className="w-full px-4 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {config.navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <span
                    className={`
                      text-sm px-3 py-1.5 rounded-md transition-all duration-200 tracking-wide whitespace-nowrap font-emphasis
                      ${isActive
                        ? 'text-foreground surface-translucent-3'
                        : 'text-muted-foreground hover:text-foreground hover:surface-translucent-2'}
                    `}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>

      <footer className="border-t border-border surface-2">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} University Event Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;