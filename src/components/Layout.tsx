import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, LayoutDashboard, Plus, Menu, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = (
    <>
      <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
        <Link to="/dashboard">
          <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
        <Link to="/transactions/new">
          <Plus className="h-4 w-4 mr-1" /> New
        </Link>
      </Button>
      {hasRole('admin') && (
        <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
          <Link to="/admin">
            <Shield className="h-4 w-4 mr-1" /> Admin
          </Link>
        </Button>
      )}
    </>
  );

  const profileAvatar = (
    <Avatar className="h-8 w-8 cursor-pointer">
      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
        {getInitials(profile?.display_name, profile?.email)}
      </AvatarFallback>
    </Avatar>
  );

  const profileMenu = (
    <div className="flex flex-col">
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
        <p className="text-xs text-muted-foreground">{profile?.email}</p>
      </div>
      <Separator />
      <Button
        variant="ghost"
        size="sm"
        className="justify-start mt-1"
        onClick={() => { setOpen(false); navigate('/profile'); }}
      >
        <Settings className="h-4 w-4 mr-2" /> Profile Settings
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-destructive hover:text-destructive"
        onClick={() => { setOpen(false); handleSignOut(); }}
      >
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to={user ? '/dashboard' : '/'} className="text-lg font-bold text-primary tracking-tight">
            EscrowShield
          </Link>

          {user && (
            <>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-2">
                {navItems}
                <ThemeToggle />
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    {profileAvatar}
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    {profileMenu}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mobile nav */}
              <div className="flex md:hidden items-center gap-1">
                <ThemeToggle />
                <NotificationBell />
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-2 mt-4">
                      {navItems}
                      <Separator className="my-2" />
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {getInitials(profile?.display_name, profile?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{profile?.display_name || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="justify-start" onClick={() => { setOpen(false); navigate('/profile'); }}>
                        <Settings className="h-4 w-4 mr-1" /> Profile Settings
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-destructive hover:text-destructive" onClick={() => { setOpen(false); handleSignOut(); }}>
                        <LogOut className="h-4 w-4 mr-1" /> Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}