import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Profile, AppRole } from '@/types/escrow';

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('*');

    const usersWithRoles = (profiles ?? []).map(p => ({
      ...p,
      roles: (roles ?? []).filter(r => r.user_id === p.user_id).map(r => r.role) as AppRole[],
    }));
    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        fetchUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
    if (error) {
      toast({ title: 'Error adding role', variant: 'destructive' });
    } else {
      toast({ title: `Role "${role}" added` });
      fetchUsers();
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    toast({ title: `Role "${role}" removed` });
    fetchUsers();
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {users.map(u => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{u.display_name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <div className="flex gap-1 mt-1">
                    {u.roles.map(r => (
                      <Badge key={r} variant="secondary" className="cursor-pointer" onClick={() => removeRole(u.user_id, r)}>
                        {r} x
                      </Badge>
                    ))}
                  </div>
                </div>
                <Select onValueChange={(v) => addRole(u.user_id, v as AppRole)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Add role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['buyer', 'seller', 'admin'] as AppRole[])
                      .filter(r => !u.roles.includes(r))
                      .map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
