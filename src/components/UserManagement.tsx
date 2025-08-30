import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, UserPlus, Eye } from "lucide-react";
import LoginHistoryBox from "./LoginHistoryBox";

interface User {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'staff' | 'talent' | 'business';
  active: boolean;
  last_login: string | null;
  avatar_url: string | null;
}

interface UserManagementProps {
  language: 'en' | 'es';
}

const UserManagement = ({ language }: UserManagementProps) => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'talent' as 'admin' | 'staff' | 'talent' | 'business',
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_profiles_for_management');
      
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

  const createUser = async () => {
    try {
      // Create user via Supabase Auth Admin API would go here
      // For now, we'll just show a placeholder
      toast({
        title: "Info",
        description: "User creation functionality needs to be implemented with proper admin credentials",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      if (updates.role) {
        const { error } = await supabase.rpc('update_user_role_safely', {
          target_user_id: userId,
          new_role: updates.role
        });
        if (error) throw error;
      }

      // Update other profile fields
      const profileUpdates = { ...updates };
      delete profileUpdates.role;
      
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', userId);
        if (error) throw error;
      }

      await fetchUsers();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('delete_user_and_files_completely_enhanced', {
        target_user_id: userId
      });
      
      if (error) throw error;
      
      await fetchUsers();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'talent',
      active: true
    });
    setEditingUser(null);
    setShowCreateUser(false);
  };

  const openEditForm = (user: User) => {
    setFormData({
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role,
      active: user.active
    });
    setEditingUser(user);
    setShowCreateUser(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      await updateUser(editingUser.user_id, {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        active: formData.active
      });
    } else {
      await createUser();
    }
    
    resetForm();
  };

  const content = {
    en: {
      title: "User Management",
      addUser: "Add User",
      email: "Email",
      firstName: "First Name", 
      lastName: "Last Name",
      role: "Role",
      active: "Active",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      viewHistory: "View Login History",
      save: "Save",
      cancel: "Cancel",
      createUser: "Create User",
      editUser: "Edit User"
    },
    es: {
      title: "Gestión de Usuarios",
      addUser: "Agregar Usuario",
      email: "Correo",
      firstName: "Nombre",
      lastName: "Apellido", 
      role: "Rol",
      active: "Activo",
      actions: "Acciones",
      edit: "Editar",
      delete: "Eliminar",
      viewHistory: "Ver Historial de Inicio",
      save: "Guardar",
      cancel: "Cancelar",
      createUser: "Crear Usuario",
      editUser: "Editar Usuario"
    }
  };

  const t = content[language];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <Button onClick={() => setShowCreateUser(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          {t.addUser}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">{t.email}</th>
                  <th className="text-left p-2">{t.firstName}</th>
                  <th className="text-left p-2">{t.lastName}</th>
                  <th className="text-left p-2">{t.role}</th>
                  <th className="text-left p-2">{t.active}</th>
                  <th className="text-left p-2">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.first_name || '-'}</td>
                    <td className="p-2">{user.last_name || '-'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'talent' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-2">
                      <Switch 
                        checked={user.active}
                        onCheckedChange={(checked) => updateUser(user.user_id, { active: checked })}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowLoginHistory(user.user_id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditForm(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteUser(user.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? t.editUser : t.createUser}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="firstName">{t.firstName}</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="lastName">{t.lastName}</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="role">{t.role}</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="talent">Talent</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">{t.active}</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">{t.save}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                {t.cancel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={!!showLoginHistory} onOpenChange={() => setShowLoginHistory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'es' ? 'Historial de Inicio de Sesión' : 'Login History'}
            </DialogTitle>
          </DialogHeader>
          
          {showLoginHistory && (
            <LoginHistoryBox 
              language={language} 
              targetUserId={showLoginHistory}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
