import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  UserPlus, 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

interface AccessRequestManagerProps {
  language: 'en' | 'es';
  onBack: () => void;
  onCreateUser?: (requestData: AccessRequest) => void;
}

const AccessRequestManager = ({ language, onBack, onCreateUser }: AccessRequestManagerProps) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const content = {
    en: {
      title: "Access Requests",
      subtitle: "Manage platform access requests",
      name: "Name",
      email: "Email",
      phone: "Phone",
      status: "Status",
      requestDate: "Request Date",
      actions: "Actions",
      pending: "Pending",
      approved: "Approved", 
      denied: "Denied",
      approve: "Approve",
      deny: "Deny",
      viewDetails: "View Details",
      createUser: "Create User Account",
      requestDetails: "Request Details",
      message: "Message",
      close: "Close",
      confirmApprove: "Approve Request",
      confirmDeny: "Deny Request",
      approveDesc: "Are you sure you want to approve this access request?",
      denyDesc: "Are you sure you want to deny this access request?",
      statusUpdated: "Request status updated successfully",
      allStatuses: "All Statuses",
      noRequests: "No access requests found",
      requestedAccess: "Requested Access"
    },
    es: {
      title: "Solicitudes de Acceso",
      subtitle: "Gestionar solicitudes de acceso a la plataforma",
      name: "Nombre",
      email: "Correo",
      phone: "Teléfono",
      status: "Estado",
      requestDate: "Fecha de Solicitud",
      actions: "Acciones",
      pending: "Pendiente",
      approved: "Aprobado",
      denied: "Denegado",
      approve: "Aprobar",
      deny: "Denegar",
      viewDetails: "Ver Detalles",
      createUser: "Crear Cuenta de Usuario",
      requestDetails: "Detalles de la Solicitud",
      message: "Mensaje",
      close: "Cerrar",
      confirmApprove: "Aprobar Solicitud",
      confirmDeny: "Denegar Solicitud",
      approveDesc: "¿Estás seguro de que quieres aprobar esta solicitud de acceso?",
      denyDesc: "¿Estás seguro de que quieres denegar esta solicitud de acceso?",
      statusUpdated: "Estado de la solicitud actualizado exitosamente",
      allStatuses: "Todos los Estados",
      noRequests: "No se encontraron solicitudes de acceso",
      requestedAccess: "Acceso Solicitado"
    }
  };

  const t = content[language];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as AccessRequest[]);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch access requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Log the activity
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase.from('user_activity_logs').insert({
          user_id: currentUser?.id,
          admin_user_id: currentUser?.id,
          action: `access_request_${newStatus}`,
          details: {
            request_id: requestId,
            applicant_email: request.email,
            applicant_name: request.name
          }
        });
      }

      toast({
        title: t.statusUpdated,
        description: `Request ${newStatus} successfully.`,
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const handleApproveAndCreateUser = (request: AccessRequest) => {
    // First approve the request
    updateRequestStatus(request.id, 'approved');
    
    // Then trigger user creation flow
    if (onCreateUser) {
      onCreateUser(request);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            {t.pending}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t.approved}
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {t.denied}
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(request => {
    return statusFilter === 'all' || request.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <h2 className="text-2xl font-bold">{t.title}</h2>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="approved">{t.approved}</SelectItem>
                <SelectItem value="denied">{t.denied}</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Total: {filteredRequests.length} requests
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.email}</TableHead>
                <TableHead>{t.phone}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.requestDate}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {request.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {request.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {request.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.viewDetails}
                      </Button>
                      
                      {request.status === 'pending' && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {t.approve}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.confirmApprove}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.approveDesc}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => updateRequestStatus(request.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {t.approve}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <XCircle className="h-4 w-4 mr-1" />
                                {t.deny}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.confirmDeny}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.denyDesc}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => updateRequestStatus(request.id, 'denied')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {t.deny}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveAndCreateUser(request)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t.createUser}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t.noRequests}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.requestDetails}</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Request from ${selectedRequest.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t.name}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.name}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.email}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t.phone}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.phone || '-'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.status}</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t.message}</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedRequest.message}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t.requestDate}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              {t.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessRequestManager;