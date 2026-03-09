import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Profile, AppRole } from '@/types/escrow';

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Get total count first (for pagination)
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    setTotalCount(count || 0);

    // Fetch paginated profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

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
  }, [currentPage, itemsPerPage]);

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

  const getRoleBadgeVariant = (role: string) => {
    switch(role) {
      case 'buyer':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300';
      case 'seller':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300';
      case 'admin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredUsers = roleFilter === 'all' 
    ? users 
    : users.filter(user => user.roles.includes(roleFilter as AppRole));

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        
        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by role:</span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No users found with the selected role filter
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.display_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length > 0 ? (
                              u.roles.map(r => (
                                <Badge 
                                  key={r} 
                                  variant="secondary" 
                                  className={`cursor-pointer hover:opacity-80 ${getRoleBadgeVariant(r)}`}
                                  onClick={() => removeRole(u.user_id, r)}
                                >
                                  {r}
                                  <span className="ml-1 opacity-50 group-hover:opacity-100">×</span>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select onValueChange={(v) => addRole(u.user_id, v as AppRole)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Add role" />
                            </SelectTrigger>
                            <SelectContent>
                              {(['buyer', 'seller', 'admin'] as AppRole[])
                                .filter(r => !u.roles.includes(r))
                                .map(r => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} users
              </span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => {
                setItemsPerPage(parseInt(v));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm px-4">
                Page {currentPage} of {totalPages || 1}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}