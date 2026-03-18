import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../integrations/supabase/client';
import { AppLayout } from '../components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Save, Lock, ShieldCheck, TrendingUp, AlertTriangle,
  CheckCircle2, Activity, Calendar, Wallet, Eye, EyeOff,
  User, BadgeCheck, Clock, Camera, Loader2, RefreshCw,
} from 'lucide-react';
import type { Tables } from '../integrations/supabase/types';

type Gig = Tables<'gigs'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (email?.[0] ?? 'U').toUpperCase();
}

const zar = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(n);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const KYC_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  approved: { label: 'Verified',     className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: <BadgeCheck className="h-3 w-3" /> },
  pending:  { label: 'KYC Pending',  className: 'bg-amber-500/10  text-amber-500  border-amber-500/20',    icon: <Clock       className="h-3 w-3" /> },
  rejected: { label: 'KYC Rejected', className: 'bg-red-500/10    text-red-500    border-red-500/20',      icon: <AlertTriangle className="h-3 w-3" /> },
};

// localStorage key to track whether this user has already used their one role change
const roleChangedKey = (userId: string) => `gighold_role_changed_${userId}`;

interface Stats {
  total: number; completed: number; disputed: number; active: number; totalValue: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName,     setDisplayName]     = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw,       setShowNewPw]       = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview,   setAvatarPreview]   = useState<string | null>(null);
  const [stats,           setStats]           = useState<Stats>({ total: 0, completed: 0, disputed: 0, active: 0, totalValue: 0 });
  const [loadingStats,    setLoadingStats]    = useState(true);

  // Role-change dialog state
  const [showRoleDialog,  setShowRoleDialog]  = useState(false);
  const [changingRole,    setChangingRole]    = useState(false);
  const [roleAlreadyUsed, setRoleAlreadyUsed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name ?? '');
      fetchStats();
      // Check if this user already spent their one role change
      if (user) {
        setRoleAlreadyUsed(!!localStorage.getItem(roleChangedKey(user.id)));
      }
    }
  }, [profile]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    if (!profile) return;
    setLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('status, budget')
        .eq(profile.role === 'hustler' ? 'hustler_id' : 'client_id', profile.id);
      if (error) throw error;
      const gigs: Pick<Gig, 'status' | 'budget'>[] = data ?? [];
      setStats({
        total:      gigs.length,
        completed:  gigs.filter(g => g.status === 'completed').length,
        disputed:   gigs.filter(g => g.status === 'disputed').length,
        active:     gigs.filter(g => ['open', 'accepted', 'in_progress', 'pending_confirmation'].includes(g.status)).length,
        totalValue: gigs.reduce((s, g) => s + (Number(g.budget) || 0), 0),
      });
    } catch { toast.error('Could not load stats.'); }
    finally  { setLoadingStats(false); }
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be under 5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const ext      = file.name.split('.').pop();
      const filePath = `${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Profile picture updated.');
    } catch (err: any) {
      toast.error(err.message ?? 'Avatar upload failed.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Profile + password save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || !profile) return;
    if (newPassword && newPassword !== confirmPassword) { toast.error('Passwords do not match.');           return; }
    if (newPassword && newPassword.length < 6)          { toast.error('Password must be at least 6 characters.'); return; }

    setSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles').update({ full_name: displayName.trim() }).eq('id', profile.id);
      if (profileError) throw profileError;

      if (newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) throw pwError;
        setNewPassword(''); setConfirmPassword('');
      }
      await refreshProfile();
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  // ── Role change ────────────────────────────────────────────────────────────
  const handleConfirmRoleChange = async () => {
    if (!user || !profile) return;

    const newRole: 'client' | 'hustler' = profile.role === 'client' ? 'hustler' : 'client';

    setChangingRole(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Replace entry in user_roles table (delete old, upsert new)
      await supabase.from('user_roles').delete().eq('user_id', user.id);
      await supabase.from('user_roles').upsert({ user_id: user.id, role: newRole });

      // Lock permanently in localStorage
      localStorage.setItem(roleChangedKey(user.id), '1');
      setRoleAlreadyUsed(true);

      await refreshProfile();
      toast.success(`Role changed to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)} successfully.`);
    } catch (err: any) {
      toast.error(err.message ?? 'Could not change role.');
    } finally {
      setChangingRole(false);
      setShowRoleDialog(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const memberSince    = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const kycCfg    = KYC_CONFIG[profile?.kyc_status ?? 'pending'];
  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '—';
  const oppositeRole = profile?.role === 'client' ? 'Hustler' : 'Client';

  const avatarSrc = avatarPreview ?? profile?.avatar_url ?? undefined;

  const statCards = [
    { label: 'Total Gigs', value: stats.total,    icon: Activity,      color: 'text-primary'     },
    { label: 'Completed',  value: stats.completed, icon: CheckCircle2,  color: 'text-emerald-500' },
    { label: 'Disputed',   value: stats.disputed,  icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Active',     value: stats.active,    icon: TrendingUp,    color: 'text-sky-500'     },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">

        {/* ── Role Change Confirmation Dialog ────────────────────────────────── */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="sm:max-w-md border-destructive/20 bg-card shadow-xl">
            <DialogHeader className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center text-lg">Are you sure?</DialogTitle>
              <DialogDescription className="text-center text-sm leading-relaxed">
                You can only change your role <span className="font-semibold text-foreground">once</span> and the effect is{' '}
                <span className="font-semibold text-foreground">permanent</span>. Your role will switch from{' '}
                <span className="font-semibold text-foreground">{roleLabel}</span> to{' '}
                <span className="font-semibold text-foreground">{oppositeRole}</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRoleDialog(false)}
                disabled={changingRole}
              >
                No, keep my role
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmRoleChange}
                disabled={changingRole}
              >
                {changingRole
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Changing…</>
                  : 'Yes, change role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Hero card ──────────────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="h-28" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.4) 45%, hsl(var(--accent) / 0.4) 75%, hsl(var(--accent) / 0.1) 100%)' }} />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">

              {/* Avatar with upload overlay */}
              <div className="relative group shrink-0">
                <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                  <AvatarImage src={avatarSrc} alt={profile?.full_name ?? 'Avatar'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {getInitials(profile?.full_name, user?.email)}
                  </AvatarFallback>
                </Avatar>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="
                    absolute inset-0 flex items-center justify-center rounded-full
                    bg-black/0 group-hover:bg-black/50
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    cursor-pointer disabled:cursor-not-allowed
                  "
                  title="Change profile picture"
                >
                  {uploadingAvatar
                    ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                    : <Camera  className="h-6 w-6 text-white" />}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-bold truncate">{profile?.full_name || 'User'}</h1>
                  {kycCfg && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${kycCfg.className}`}>
                      {kycCfg.icon}{kycCfg.label}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    <User className="h-3 w-3" />{roleLabel}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" /> Member since {memberSince}
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1 sm:justify-end">
                  <Wallet className="h-3 w-3" /> Wallet Balance
                </p>
                <p className="text-2xl font-bold text-foreground">{zar(Number(profile?.balance ?? 0))}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3 ml-0.5">
              Hover over your avatar to change it · Max 5 MB · JPG, PNG, WebP
            </p>
          </div>
        </Card>

        {/* ── Stat cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  {loadingStats
                    ? <div className="h-7 w-10 rounded bg-muted animate-pulse" />
                    : <span className="text-2xl font-bold">{value}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Completion rate + total value ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} gigs completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Gig Value</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              {loadingStats
                ? <div className="h-8 w-32 rounded bg-muted animate-pulse" />
                : <p className="text-2xl font-bold">{zar(stats.totalValue)}</p>}
              <p className="text-xs text-muted-foreground">Across all gigs</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Account settings ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
            <CardDescription>Update your profile information and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Avatar upload row */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={avatarSrc} alt="Avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {getInitials(profile?.full_name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploadingAvatar
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Camera  className="h-4 w-4 text-white" />}
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile Picture</p>
                <p className="text-xs text-muted-foreground mb-2">JPG, PNG or WebP · Max 5 MB</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading…</>
                    : <><Camera  className="h-3.5 w-3.5 mr-1.5" /> Change Photo</>}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Display name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" />
            </div>

            {/* Read-only info + role change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled className="opacity-60" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2">
                  <Input value={roleLabel} disabled className="opacity-60 capitalize flex-1" />
                  {!roleAlreadyUsed ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-10 px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-xs gap-1.5"
                      onClick={() => setShowRoleDialog(true)}
                      title={`Switch to ${oppositeRole}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Switch
                    </Button>
                  ) : (
                    <div
                      className="shrink-0 h-10 px-3 flex items-center rounded-md border border-border bg-muted/40 text-xs text-muted-foreground gap-1.5 cursor-not-allowed"
                      title="Role change already used"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </div>
                  )}
                </div>
                {!roleAlreadyUsed && (
                  <p className="text-[11px] text-muted-foreground">
                    You can switch roles <span className="font-medium">once</span>. This is permanent.
                  </p>
                )}
                {roleAlreadyUsed && (
                  <p className="text-[11px] text-muted-foreground">
                    Role changes are permanent and cannot be undone.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Password change */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Change Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="pr-10" />
                    <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="pr-10" />
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Passwords don't match
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || (!!newPassword && newPassword !== confirmPassword)} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}