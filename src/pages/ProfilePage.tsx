import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Save, Lock, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, Activity, Calendar } from 'lucide-react';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  return (email?.[0] ?? 'U').toUpperCase();
}

interface Stats {
  total: number;
  completed: number;
  disputed: number;
  active: number;
  totalValue: number;
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, disputed: 0, active: 0, totalValue: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name || '');
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;
    setLoadingStats(true);

    // Temporarily set default stats due to type issues
    setStats({ total: 0, completed: 0, disputed: 0, active: 0, totalValue: 0 });
    setLoadingStats(false);

    // TODO: Fix Supabase query types
    /*
    try {
      // For users (clients): gigs they posted
      // For hustlers: gigs they accepted
      const isHustler = profile.role === 'hustler';
      let data;

      if (isHustler) {
        const { data: d } = await supabase
          .from('gigs')
          .select('*')
          .eq('accepted_by', profile.id);
        data = d;
      } else {
        const { data: d } = await supabase
          .from('gigs')
          .select('*')
          .eq('posted_by', profile.id);
        data = d;
      }

      const gigs = data ?? [];
      const completed = gigs.filter((g: any) => g.status === 'completed');
      const disputed = gigs.filter((g: any) => g.status === 'disputed');
      const active = gigs.filter((g: any) => ['open', 'accepted', 'in_progress'].includes(g.status));

      setStats({
        total: gigs.length,
        completed: completed.length,
        disputed: disputed.length,
        active: active.length,
        totalValue: gigs.reduce((sum: number, g: any) => sum + (g.budget || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, completed: 0, disputed: 0, active: 0, totalValue: 0 });
    } finally {
      setLoadingStats(false);
    }
    */
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: displayName.trim() })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match.');
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('Password must be at least 6 characters.');
          setSaving(false);
          return;
        }
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) throw pwError;
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password updated successfully.');
      }

      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const formatValue = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero profile header */}
        <Card className="overflow-hidden">
          <div className="h-32 rounded-t-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--primary) / 0.4) 40%, hsl(var(--accent) / 0.5) 70%, hsl(var(--accent) / 0.15) 100%)' }} />
          <div className="px-6 pb-6 -mt-14">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <Avatar className="h-24 w-24 text-3xl border-4 border-card shadow-lg">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {getInitials(profile?.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-2">
                <h1 className="text-2xl font-bold">{profile?.full_name || 'User'}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  Member since {memberSince}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Gigs', value: stats.total, icon: Activity, color: 'text-primary' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-accent' },
            { label: 'Disputed', value: stats.disputed, icon: AlertTriangle, color: 'text-destructive' },
            { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-primary' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  {loadingStats ? (
                    <div className="h-7 w-8 rounded bg-muted animate-pulse" />
                  ) : (
                    <span className="text-2xl font-bold">{value}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion rate + total value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.completed} of {stats.total} gigs completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Gig Value</span>
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              {loadingStats ? (
                <div className="h-8 w-32 rounded bg-muted animate-pulse" />
              ) : (
                <p className="text-2xl font-bold">{formatValue(stats.totalValue)}</p>
              )}
              <p className="text-xs text-muted-foreground">Across all gigs</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
            <CardDescription>Update your profile and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Change Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}