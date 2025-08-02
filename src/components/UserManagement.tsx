import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  Clock, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  Activity,
  FileImage,
  Upload,
  ArrowLeft,
  Crown,
  User,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';


interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'admin' | 'staff' | 'talent';
  active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  background_image_url?: string;
  name_color?: string;
  status?: string;
}

interface LoginHistory {
  id: string;
  ip_address: string;
  user_agent?: string;
  login_time: string;
  location_info?: any;
}

interface UserManagementProps {
  language: 'en' | 'es';
  onBack: () => void;
}

const UserManagement = ({ language, onBack }: UserManagementProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'talent' as 'admin' | 'staff' | 'talent',
    sendNotification: true
  });

  const content = {
    en: {
      userManagement: "User Management",
      addUser: "Add User",
      searchUsers: "Search users...",
      allRoles: "All Roles",
      allStatuses: "All Statuses",
      active: "Active",
      inactive: "Inactive",
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status", 
      lastLogin: "Last Login",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      viewDashboard: "View Dashboard",
      userDetails: "User Details",
      loginHistory: "Login History",
      ipAddress: "IP Address",
      userAgent: "User Agent",
      loginTime: "Login Time",
      location: "Location",
      createUser: "Create User",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone",
      password: "Password",
      sendEmailNotification: "Send email notification",
      cancel: "Cancel",
      create: "Create",
      userDashboard: "User Dashboard",
      exitDashboard: "Exit Dashboard",
      profilePicture: "Profile Picture",
      backgroundImage: "Background Image",
      uploadFiles: "Upload Files",
      admin: "Admin",
      staff: "Staff",
      talent: "Talent",
      never: "Never",
      deleteUser: "Delete User",
      confirmDelete: "Are you sure you want to delete this user? This action cannot be undone.",
      userDeleted: "User deleted successfully",
      userCreated: "User created successfully",
      userUpdated: "User updated successfully",
      updateUser: "Update User",
      update: "Update"
    },
    es: {
      userManagement: "Gestión de Usuarios",
      addUser: "Agregar Usuario",
      searchUsers: "Buscar usuarios...",
      allRoles: "Todos los Roles",
      allStatuses: "Todos los Estados",
      active: "Activo",
      inactive: "Inactivo",
      name: "Nombre",
      email: "Correo",
      role: "Rol",
      status: "Estado",
      lastLogin: "Último Acceso",
      actions: "Acciones",
      edit: "Editar",
      delete: "Eliminar",
      viewDashboard: "Ver Panel",
      userDetails: "Detalles del Usuario",
      loginHistory: "Historial de Acceso",
      ipAddress: "Dirección IP",
      userAgent: "Agente de Usuario",
      loginTime: "Hora de Acceso",
      location: "Ubicación",
      createUser: "Crear Usuario",
      firstName: "Nombre",
      lastName: "Apellido",
      phone: "Teléfono",
      password: "Contraseña",
      sendEmailNotification: "Enviar notificación por correo",
      cancel: "Cancelar",
      create: "Crear",
      userDashboard: "Panel de Usuario",
      exitDashboard: "Salir del Panel",
      profilePicture: "Foto de Perfil",
      backgroundImage: "Imagen de Fondo",
      uploadFiles: "Subir Archivos",
      admin: "Administrador",
      staff: "Personal",
      talent: "Talento",
      never: "Nunca",
      deleteUser: "Eliminar Usuario",
      confirmDelete: "¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.",
      userDeleted: "Usuario eliminado exitosamente",
      userCreated: "Usuario creado exitosamente",
      userUpdated: "Usuario actualizado exitosamente",
      updateUser: "Actualizar Usuario",
      update: "Actualizar"
    }
  };

  const t = content[language];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLoginHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_login_history')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLoginHistory(data || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const createUser = async () => {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: newUser.firstName,
          last_name: newUser.lastName,
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with additional details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            phone: newUser.phone,
            role: newUser.role,
            created_by: currentUser?.id
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;

        // Log the activity
        await supabase.from('user_activity_logs').insert({
          user_id: authData.user.id,
          admin_user_id: currentUser?.id,
          action: 'user_created',
          details: {
            email: newUser.email,
            role: newUser.role,
            send_notification: newUser.sendNotification
          }
        });

        toast({
          title: t.userCreated,
          description: `User ${newUser.email} has been created successfully.`,
        });

        setIsAddUserOpen(false);
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'talent',
          sendNotification: true
        });
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'staff' | 'talent') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the activity
      await supabase.from('user_activity_logs').insert({
        user_id: userId,
        admin_user_id: currentUser?.id,
        action: 'role_changed',
        details: { new_role: newRole }
      });

      toast({
        title: t.userUpdated,
        description: "User role updated successfully.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the activity
      await supabase.from('user_activity_logs').insert({
        user_id: userId,
        admin_user_id: currentUser?.id,
        action: currentStatus ? 'user_deactivated' : 'user_activated',
        details: { previous_status: currentStatus }
      });

      toast({
        title: t.userUpdated,
        description: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete from auth (this will cascade to profiles due to FK constraint)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: t.userDeleted,
        description: "User deleted successfully.",
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const openUserDashboard = (user: UserProfile) => {
    setSelectedUser(user);
    fetchUserLoginHistory(user.user_id);
    setIsUserDashboardOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'staff': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 hover:bg-red-600';
      case 'staff': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-green-500 hover:bg-green-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isUserDashboardOpen && selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUserDashboardOpen(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.exitDashboard}
            </Button>
            <h2 className="text-2xl font-bold">{t.userDashboard}</h2>
            <Badge className={getRoleBadgeColor(selectedUser.role)}>
              {getRoleIcon(selectedUser.role)}
              <span className="ml-1">{t[selectedUser.role as keyof typeof t]}</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Management */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t.userDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                      {selectedUser.avatar_url ? (
                        <img 
                          src={selectedUser.avatar_url} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${selectedUser.user_id}/avatar.${fileExt}`;
                          
                          const { data, error } = await supabase.storage
                            .from('avatars')
                            .upload(fileName, file, { upsert: true });
                          
                          if (error) throw error;
                          
                          const { data: urlData } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(data.path);
                          
                          await supabase
                            .from('profiles')
                            .update({ avatar_url: urlData.publicUrl })
                            .eq('user_id', selectedUser.user_id);
                          
                          setSelectedUser({ ...selectedUser, avatar_url: urlData.publicUrl });
                          
                          toast({
                            title: "Success",
                            description: "Profile picture updated successfully",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to upload image",
                            variant: "destructive",
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t.profilePicture}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${selectedUser.user_id}/background.${fileExt}`;
                          
                          const { data, error } = await supabase.storage
                            .from('avatars')
                            .upload(fileName, file, { upsert: true });
                          
                          if (error) throw error;
                          
                          const { data: urlData } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(data.path);
                          
                          await supabase
                            .from('profiles')
                            .update({ background_image_url: urlData.publicUrl })
                            .eq('user_id', selectedUser.user_id);
                          
                          setSelectedUser({ ...selectedUser, background_image_url: urlData.publicUrl });
                          
                          toast({
                            title: "Success",
                            description: "Background image updated successfully",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to upload image",
                            variant: "destructive",
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <FileImage className="h-4 w-4 mr-2" />
                    {t.backgroundImage}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t.role}:</span>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value: 'admin' | 'staff' | 'talent') => {
                        updateUserRole(selectedUser.user_id, value);
                        setSelectedUser({ ...selectedUser, role: value });
                      }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t.admin}</SelectItem>
                        <SelectItem value="staff">{t.staff}</SelectItem>
                        <SelectItem value="talent">{t.talent}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t.status}:</span>
                    <Switch
                      checked={selectedUser.active}
                      onCheckedChange={() => {
                        toggleUserStatus(selectedUser.user_id, selectedUser.active);
                        setSelectedUser({ ...selectedUser, active: !selectedUser.active });
                      }}
                    />
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{t.lastLogin}:</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedUser.last_login 
                        ? new Date(selectedUser.last_login).toLocaleDateString()
                        : t.never
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t.loginHistory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.ipAddress}</TableHead>
                      <TableHead>{t.loginTime}</TableHead>
                      <TableHead>{t.location}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell className="font-mono text-sm">{login.ip_address}</TableCell>
                        <TableCell>
                          {new Date(login.login_time).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {login.location_info ? (
                            <span className="text-sm text-muted-foreground">
                              {login.location_info.city || 'Unknown'}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {loginHistory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No login history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Admin Dashboard
          </Button>
          <h2 className="text-2xl font-bold">{t.userManagement}</h2>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t.addUser}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.createUser}</DialogTitle>
              <DialogDescription>
                Create a new user account with instant activation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t.firstName}</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t.lastName}</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">{t.phone}</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="role">{t.role}</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff' | 'talent') => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                    <SelectItem value="staff">{t.staff}</SelectItem>
                    <SelectItem value="talent">{t.talent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sendNotification"
                  checked={newUser.sendNotification}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, sendNotification: checked })}
                />
                <Label htmlFor="sendNotification">{t.sendEmailNotification}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={createUser} disabled={!newUser.email || !newUser.password}>
                {t.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder={t.searchUsers}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allRoles}</SelectItem>
                <SelectItem value="admin">{t.admin}</SelectItem>
                <SelectItem value="staff">{t.staff}</SelectItem>
                <SelectItem value="talent">{t.talent}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="inactive">{t.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.email}</TableHead>
                <TableHead>{t.role}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.lastLogin}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <span>
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1">{t[user.role as keyof typeof t]}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.active}
                      onCheckedChange={() => toggleUserStatus(user.user_id, user.active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : t.never
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUserDashboard(user)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        {t.viewDashboard}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteUser}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.confirmDelete}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.user_id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;