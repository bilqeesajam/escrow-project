import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, LayoutDashboard, Plus } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, hasRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to={user ? '/dashboard' : '/'} className="text-lg font-bold text-primary tracking-tight">
            EscrowShield
          </Link>

          {user && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions/new">
                  <Plus className="h-4 w-4 mr-1" /> New
                </Link>
              </Button>
              {hasRole('admin') && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">
                    <Shield className="h-4 w-4 mr-1" /> Admin
                  </Link>
                </Button>
              )}
              <NotificationBell />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile?.display_name || profile?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
