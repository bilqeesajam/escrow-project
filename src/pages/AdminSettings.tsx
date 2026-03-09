import { useState, useEffect } from 'react';
import { User, Shield, Bell, Key, Save, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Profile, AppRole } from '@/types/escrow';

interface AdminSettings {
  email_notifications: boolean;
  dispute_notifications: boolean;
  two_factor_enabled: boolean;
  api_key?: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    email_notifications: true,
    dispute_notifications: true,
    two_factor_enabled: false,
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // Fetch user profile and settings
  useEffect(() => {
    fetchProfileAndSettings();
  }, []);

  const fetchProfileAndSettings = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to access settings',
          variant: 'destructive',
        });
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;
      
      if (rolesData) {
        setUserRoles(rolesData.map(r => r.role as AppRole));
      }

      // Fetch settings from user_settings table
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching settings:', settingsError);
      }

      if (settingsData) {
        setSettings({
          email_notifications: settingsData.email_notifications ?? true,
          dispute_notifications: settingsData.dispute_notifications ?? true,
          two_factor_enabled: settingsData.two_factor_enabled ?? false,
        });
      }

      // Fetch API key
      await fetchApiKey(user.id);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading settings',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKey = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching API key:', error);
      }

      if (data) {
        // Mask the API key for security
        const maskedKey = data.api_key.substring(0, 8) + '••••••••' + data.api_key.substring(data.api_key.length - 4);
        setApiKey(maskedKey);
      } else {
        // Generate a demo key for display
        setApiKey('••••••••••••••••••••••••••');
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const user = await getCurrentUser();
    if (!user?.id || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error updating profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    const user = await getCurrentUser();
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...newSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings({ ...settings, ...newSettings });
      toast({
        title: 'Settings updated',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error updating settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error changing password',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const regenerateApiKey = async () => {
    const user = await getCurrentUser();
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Generate a new API key
      const newApiKey = 'sk_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store in database
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          api_key: newApiKey,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Mask for display
      const maskedKey = newApiKey.substring(0, 8) + '••••••••' + newApiKey.substring(newApiKey.length - 4);
      setApiKey(maskedKey);
      
      toast({
        title: 'API key regenerated',
        description: 'Your new API key has been generated. Make sure to save it now.',
      });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast({
        title: 'Error regenerating API key',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'Copied to clipboard',
      description: 'API key has been copied.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#041120] to-[#212227] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#F1D302] animate-spin mx-auto mb-4" />
          <p className="text-[#508991]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041120] to-[#212227] p-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between bg-[#1A1F2E] p-6 rounded-2xl shadow-lg border border-[#50899120]">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Settings</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-[#F1D302] to-transparent rounded-full" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1A1F2E] border border-[#50899120] p-1">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-[#F1D302] data-[state=active]:text-[#003249] text-[#508991]"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-[#F1D302] data-[state=active]:text-[#003249] text-[#508991]"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-[#F1D302] data-[state=active]:text-[#003249] text-[#508991]"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="api" 
              className="data-[state=active]:bg-[#F1D302] data-[state=active]:text-[#003249] text-[#508991]"
            >
              <Key className="w-4 h-4 mr-2" />
              API Access
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-[#1A1F2E] border-[#50899120]">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F1D302] to-[#FFE55C] flex items-center justify-center text-[#003249] text-3xl font-bold">
                      {profile?.display_name?.charAt(0) || profile?.email?.charAt(0) || 'A'}
                    </div>
                    <Button 
                      size="icon"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#508991] hover:bg-[#F1D302] transition-all"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{profile?.display_name || 'Admin User'}</h3>
                    <p className="text-[#F1D302] text-sm">
                      {userRoles.length > 0 ? userRoles.join(', ') : 'admin'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">{profile?.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile?.display_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                      className="bg-[#212227] border-[#50899130] text-white focus:border-[#F1D302]"
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-[#212227] border-[#50899130] text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-[#508991]">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white">Roles</Label>
                    <Input
                      id="role"
                      value={userRoles.length > 0 ? userRoles.join(', ') : 'No roles assigned'}
                      disabled
                      className="bg-[#212227] border-[#50899130] text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => updateProfile({ display_name: profile?.display_name })}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#F1D302] to-[#FFE55C] text-[#003249] font-semibold hover:shadow-lg hover:shadow-[#F1D302]/20"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  {!saving && <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-[#1A1F2E] border-[#50899120]">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>

                {/* Change Password */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">Change Password</h3>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#212227] border-[#50899130] text-white focus:border-[#F1D302]"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[#212227] border-[#50899130] text-white focus:border-[#F1D302]"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button 
                    onClick={changePassword}
                    disabled={saving || !newPassword || !confirmPassword}
                    className="bg-gradient-to-r from-[#F1D302] to-[#FFE55C] text-[#003249] font-semibold"
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                    Update Password
                  </Button>
                </div>

                {/* Two-Factor Authentication */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
                      <p className="text-gray-400 text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={settings.two_factor_enabled}
                      onCheckedChange={(checked) => updateSettings({ two_factor_enabled: checked })}
                      className="data-[state=checked]:bg-[#F1D302]"
                    />
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-[#212227] flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Current Session</p>
                        <p className="text-gray-400 text-sm">Last active: Just now</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-[#1A1F2E] border-[#50899120]">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">Email Notifications</h3>
                      <p className="text-gray-400 text-sm">
                        Receive email alerts for important events
                      </p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                      className="data-[state=checked]:bg-[#F1D302]"
                    />
                  </div>

                  {/* Dispute Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">Dispute Notifications</h3>
                      <p className="text-gray-400 text-sm">Get notified when disputes are escalated</p>
                    </div>
                    <Switch
                      checked={settings.dispute_notifications}
                      onCheckedChange={(checked) => updateSettings({ dispute_notifications: checked })}
                      className="data-[state=checked]:bg-[#F1D302]"
                    />
                  </div>
                </div>

                <Button 
                  disabled={saving}
                  className="bg-gradient-to-r from-[#F1D302] to-[#FFE55C] text-[#003249] font-semibold"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Access Tab */}
          <TabsContent value="api">
            <Card className="bg-[#1A1F2E] border-[#50899120]">
              <CardContent className="p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">API Access</h2>

                <div className="p-6 rounded-lg bg-[#508991]/10 border border-[#508991]/30">
                  <h3 className="text-white font-semibold mb-2">API Key</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Use this key to access the admin API programmatically
                  </p>
                  <div className="flex gap-3">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="bg-[#212227] border-[#50899130] text-white font-mono flex-1"
                    />
                    <Button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      variant="outline"
                      className="bg-[#212227] border-[#50899130] text-white hover:bg-[#27474E]"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                    <Button 
                      onClick={copyApiKey}
                      className="bg-gradient-to-r from-[#F1D302] to-[#FFE55C] text-[#003249]"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={regenerateApiKey}
                  disabled={saving}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/20"
                >
                  {saving && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                  Regenerate API Key
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}