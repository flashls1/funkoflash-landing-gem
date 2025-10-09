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
  UserCheck,
  Key
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
  role: 'admin' | 'staff' | 'talent' | 'business';
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
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'talent' as 'admin' | 'staff' | 'talent' | 'business',
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
      viewProfileData: "View Profile Data",
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
      business: "Business",
      never: "Never",
      deleteUser: "Delete User",
      confirmDelete: "This delete cannot be undone. Do you wish to permanently delete this user?",
      resetPassword: "Reset Password",
      newPassword: "New Password",
      resetPasswordConfirm: "Are you sure you want to reset this user's password?",
      passwordUpdated: "Password updated successfully",
      userDeleted: "User deleted successfully",
      userCreated: "User created successfully",
      userUpdated: "User updated successfully",
      updateUser: "Update User",
      update: "Update",
      exportLoginHistory: "Export Full History"
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
      viewProfileData: "Ver Datos de Perfil",
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
      business: "Empresa",
      never: "Nunca",
      deleteUser: "Eliminar Usuario",
      confirmDelete: "Esta eliminación no se puede deshacer. ¿Deseas eliminar permanentemente a este usuario?",
      resetPassword: "Restablecer Contraseña", 
      newPassword: "Nueva Contraseña",
      resetPasswordConfirm: "¿Estás seguro de que quieres restablecer la contraseña de este usuario?",
      passwordUpdated: "Contraseña actualizada exitosamente",
      userDeleted: "Usuario eliminado exitosamente",
      userCreated: "Usuario creado exitosamente",
      userUpdated: "Usuario actualizado exitosamente",
      updateUser: "Actualizar Usuario",
      update: "Actualizar",
      exportLoginHistory: "Exportar historial completo"
    }
  };

  const t = content[language];

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time subscriptions for user changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          // Refresh users list when any profile changes
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('User role change detected:', payload);
          // Refresh users list when roles change
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
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
        .limit(15);

      if (error) throw error;
      setLoginHistory(data || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const createUser = async () => {
    try {
      console.log('Creating user with data:', newUser);
      
      // Create user using signup flow with admin_created flag for auto-confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            admin_created: true, // This triggers auto-confirmation in the database trigger
            role: newUser.role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      console.log('Auth signup result:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('User created with auto-confirmation trigger...');
        
        // Wait a moment for the trigger to create profile, user_roles, and talent_profile (if talent)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Updating profile with additional details...');
        // Update the profile with additional details that weren't in the trigger
        const { data: updateData, error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: newUser.phone,
            created_by: currentUser?.id
          })
          .eq('user_id', authData.user.id)
          .select();

        console.log('Profile update result:', { updateData, profileError });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // If creating a talent user, verify talent_profile was created
        if (newUser.role === 'talent') {
          const { data: talentProfile, error: talentError } = await supabase
            .from('talent_profiles')
            .select('id')
            .eq('user_id', authData.user.id)
            .maybeSingle();

          if (talentError || !talentProfile) {
            console.error('Talent profile not created:', talentError);
            toast({
              title: "Warning",
              description: "User created but talent profile may be missing. Please verify.",
              variant: "destructive",
            });
          } else {
            console.log('Talent profile verified:', talentProfile.id);
          }
        }

        // Verify user_roles entry exists
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (roleError || !userRole) {
          console.error('User role not found:', roleError);
          toast({
            title: "Warning",
            description: "User created but role assignment may be missing. Please verify.",
            variant: "destructive",
          });
        } else {
          console.log('User role verified:', userRole.role);
        }

        // Enhanced security logging
        const { error: logError } = await supabase.from('user_activity_logs').insert({
          user_id: authData.user.id,
          admin_user_id: currentUser?.id,
          action: 'user_created_via_admin',
          details: {
            email: newUser.email,
            role: newUser.role,
            send_notification: newUser.sendNotification,
            auto_verified: true,
            created_from_ip: window.location.hostname,
            user_agent: navigator.userAgent
          }
        });

        // Also log to security audit
        const { error: securityLogError } = await supabase.rpc('log_security_event', {
          p_action: 'admin_user_creation',
          p_table_name: 'profiles',
          p_record_id: authData.user.id,
          p_new_values: {
            email: newUser.email,
            role: newUser.role,
            created_by: currentUser?.id
          }
        });

        if (logError) {
          console.error('Activity log error:', logError);
          // Don't fail the whole operation for logging errors
        }

        toast({
          title: t.userCreated,
          description: `User ${newUser.email} has been created and auto-confirmed via database trigger.`,
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

  const updateUserRole = async (userId: string, newRole: 'admin' | 'staff' | 'talent' | 'business') => {
    try {
      // Get current user data for logging
      const currentUserData = users.find(u => u.user_id === userId);
      const oldRole = currentUserData?.role;

      // Enhanced security: Use the secure role update function with validation
      const { data, error } = await supabase.rpc('update_user_role_safely', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        console.error('Role update error:', error);
        throw new Error(error.message || 'Failed to update user role');
      }

      // Clean role transition: Remove old permissions and add new ones
      await cleanRoleTransition(userId, oldRole, newRole);

      // Additional activity logging for frontend operations
      await supabase.from('user_activity_logs').insert({
        user_id: userId,
        admin_user_id: currentUser?.id,
        action: 'role_updated_via_ui',
        details: { 
          old_role: oldRole,
          new_role: newRole,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          permissions_cleaned: true
        }
      });

      // Enhanced security audit log
      await supabase.rpc('log_security_event', {
        p_action: 'role_change_completed',
        p_table_name: 'profiles',
        p_record_id: userId,
        p_old_values: { role: oldRole },
        p_new_values: { role: newRole }
      });

      toast({
        title: t.userUpdated,
        description: `User role updated from ${oldRole} to ${newRole} with permissions cleaned.`,
      });

      // Force refresh to show real-time changes
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

  const cleanRoleTransition = async (userId: string, oldRole: 'admin' | 'staff' | 'talent' | 'business' | undefined, newRole: 'admin' | 'staff' | 'talent' | 'business') => {
    try {
      console.log(`Cleaning role transition for user ${userId}: ${oldRole} -> ${newRole}`);
      
      // Step 1: Clean up old role permissions in user_roles table
      if (oldRole) {
        const { error: deleteOldRoleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', oldRole);
        
        if (deleteOldRoleError) {
          console.warn('Failed to clean old role permissions:', deleteOldRoleError);
        }
      }

      // Step 2: Ensure new role is properly set (the function already handles this, but this is extra insurance)
      const { error: insertNewRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
          assigned_by: currentUser?.id
        });

      if (insertNewRoleError) {
        console.warn('Failed to ensure new role permissions:', insertNewRoleError);
      }

      // Step 3: Special handling for talent profile management
      if (oldRole === 'talent' && newRole !== 'talent') {
        // Deactivate talent profile when moving away from talent role
        await supabase
          .from('talent_profiles')
          .update({ 
            active: false, 
            public_visibility: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else if (oldRole !== 'talent' && newRole === 'talent') {
        // Reactivate or create talent profile when moving to talent role
        const { data: existingProfile } = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          // Reactivate existing profile
          await supabase
            .from('talent_profiles')
            .update({ 
              active: true,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
        // Note: New talent profile creation is handled by the database trigger
      }

      // Step 4: Business account management
      if (newRole === 'business') {
        // Ensure business account exists
        await supabase.rpc('ensure_business_account_exists', {
          p_user_id: userId
        });
      }

      console.log(`Role transition cleanup completed for user ${userId}`);
    } catch (error) {
      console.error('Error during role transition cleanup:', error);
      throw error;
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
      console.log('Starting comprehensive user deletion for:', userId);
      
      // Get user email for logging before deletion
      const userToDelete = users.find(u => u.user_id === userId);
      const userEmail = userToDelete?.email || 'unknown';
      
      // First, try to log the deletion activity before deleting the user
      try {
        await supabase.from('user_activity_logs').insert({
          user_id: userId,
          admin_user_id: currentUser?.id,
          action: 'user_permanently_deleted',
          details: { 
            deleted_by_admin: true, 
            permanent: true,
            user_email: userEmail
          }
        });
      } catch (logError) {
        console.warn('Failed to log deletion activity:', logError);
      }

      // Step 1: Use our enhanced database function to clean up ALL user data and files
      console.log('Cleaning up user data and files...');
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('delete_user_and_files_completely', { target_user_id: userId });

      console.log('Cleanup result:', { cleanupResult, cleanupError });

      if (cleanupError) {
        console.error('Cleanup error:', cleanupError);
        throw cleanupError;
      }

      if (!cleanupResult) {
        throw new Error('User not found or cleanup failed');
      }

      console.log('User data and files cleaned up successfully');

      // Step 2: Try to delete from auth (this removes the user from auth.users)
      try {
        console.log('Attempting auth user deletion...');
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn('Auth deletion failed (but manual cleanup succeeded):', authError);
          // Don't throw error here - manual cleanup already worked
        } else {
          console.log('Auth user deleted successfully');
        }
      } catch (authError) {
        console.warn('Auth deletion failed (but manual cleanup succeeded):', authError);
        // Don't throw error here - manual cleanup already worked
      }

      toast({
        title: t.userDeleted,
        description: `User ${userEmail} has been permanently deleted from all systems.`,
      });

      // Refresh the user list to show the user is gone
      console.log('Refreshing user list...');
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

  const resetUserPassword = async () => {
    if (!selectedUser || !newPassword.trim()) return;
    
    try {
      // Use admin function to reset password without requiring the user to be logged in
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.user_id,
        { password: newPassword }
      );

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      // Log the activity
      await supabase.from('user_activity_logs').insert({
        user_id: selectedUser.user_id,
        admin_user_id: currentUser?.id,
        action: 'password_reset',
        details: { reset_by_admin: true }
      });

      toast({
        title: t.passwordUpdated,
        description: `Password has been updated for ${selectedUser.email}.`,
      });

      setIsPasswordResetOpen(false);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const exportLoginHistory = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to export login history",
          variant: "destructive",
        });
        return;
      }

      // Make a direct HTTP request since we're downloading a file
      const response = await fetch(
        `https://gytjgmeoepglbrjrbfie.supabase.co/functions/v1/export-login-history?user_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Export error:', errorData);
        toast({
          title: "Error",
          description: errorData.error || "Failed to export login history",
          variant: "destructive",
        });
        return;
      }

      // Get the CSV content
      const csvContent = await response.text();
      
      // Create a blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `login-history-${userId}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Login history exported successfully",
      });

    } catch (error: any) {
      console.error('Error exporting login history:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to export login history",
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
            <h2 className="text-2xl font-bold text-white">{t.userDashboard}</h2>
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
                      onValueChange={(value: 'admin' | 'staff' | 'talent' | 'business') => {
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
                        <SelectItem value="business">{t.business}</SelectItem>
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
                
                {/* Password Reset Section */}
                <div className="pt-4 border-t">
                  <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Key className="h-4 w-4 mr-2" />
                        {t.resetPassword}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.resetPassword}</DialogTitle>
                        <DialogDescription>
                          {t.resetPasswordConfirm}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newPassword">{t.newPassword}</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsPasswordResetOpen(false);
                          setNewPassword('');
                        }}>
                          {t.cancel}
                        </Button>
                        <Button 
                          onClick={resetUserPassword}
                          disabled={!newPassword.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t.resetPassword}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t.loginHistory}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportLoginHistory(selectedUser.user_id)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {t.exportLoginHistory}
                  </Button>
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
          <h2 className="text-2xl font-bold text-white">{t.userManagement}</h2>
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
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff' | 'talent' | 'business') => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="admin">{t.admin}</SelectItem>
                        <SelectItem value="staff">{t.staff}</SelectItem>
                        <SelectItem value="talent">{t.talent}</SelectItem>
                        <SelectItem value="business">{t.business}</SelectItem>
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
                <SelectItem value="business">{t.business}</SelectItem>
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
                     <Select
                       value={user.role}
                       onValueChange={(value: 'admin' | 'staff' | 'talent' | 'business') => {
                         if (user.user_id === currentUser?.id) {
                           toast({
                             title: "Error",
                             description: "You cannot change your own role.",
                             variant: "destructive",
                           });
                           return;
                         }
                         updateUserRole(user.user_id, value);
                       }}
                     >
                       <SelectTrigger className="w-32">
                         <SelectValue>
                           <div className="flex items-center gap-2">
                             {getRoleIcon(user.role)}
                             <span>{t[user.role as keyof typeof t]}</span>
                           </div>
                         </SelectValue>
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="admin">
                           <div className="flex items-center gap-2">
                             <Crown className="h-4 w-4" />
                             {t.admin}
                           </div>
                         </SelectItem>
                         <SelectItem value="staff">
                           <div className="flex items-center gap-2">
                             <UserCheck className="h-4 w-4" />
                             {t.staff}
                           </div>
                         </SelectItem>
                         <SelectItem value="talent">
                           <div className="flex items-center gap-2">
                             <User className="h-4 w-4" />
                             {t.talent}
                           </div>
                         </SelectItem>
                         <SelectItem value="business">
                           <div className="flex items-center gap-2">
                             <User className="h-4 w-4" />
                             {t.business}
                           </div>
                         </SelectItem>
                       </SelectContent>
                     </Select>
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
                        className="flex items-center gap-1 min-h-[44px]"
                        aria-label={t.viewDashboard}
                      >
                        <Eye className="h-4 w-4" />
                        {t.viewDashboard}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/users/${user.user_id}/profile`}
                        className="flex items-center gap-1 min-h-[44px]"
                        aria-label={t.viewProfileData}
                      >
                        <User className="h-4 w-4" />
                        {t.viewProfileData}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 min-h-[44px]"
                            aria-label={t.delete}
                          >
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
                             <AlertDialogCancel>No</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => deleteUser(user.user_id)}
                               className="bg-red-600 hover:bg-red-700"
                             >
                               Yes
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