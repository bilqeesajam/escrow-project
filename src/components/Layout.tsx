import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, LayoutDashboard, Plus, Settings } from 'lucide-react';
import { AdminSettingsModal } from '@/components/AdminSettingsModal';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 px-2 py-1 rounded-md transition-colors group"
                onClick={() => setShowSettingsModal(true)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F1D302] to-[#FFE55C] flex items-center justify-center text-[#003249] text-xs font-bold">
                  {profile?.display_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
                <span className="text-sm text-muted-foreground hidden sm:inline group-hover:text-foreground transition-colors">
                  {profile?.display_name || profile?.email}
                </span>
                <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline" />
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Settings Modal */}
      <AdminSettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}