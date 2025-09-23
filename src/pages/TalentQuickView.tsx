import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ModuleHeader from '@/components/ModuleHeader';
import { TalentImageUpload } from '@/components/TalentImageUpload';
import { DocumentImageUpload } from '@/components/DocumentImageUpload';
import { SecureImageViewer } from '@/components/SecureImageViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Phone, Mail, Facebook, Instagram, User, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

interface TalentQuickViewRecord {
  id: string;
  name: string;
  dob: string | null;
  email: string | null;
  phone: string | null;
  passport_number: string | null;
  visa_number: string | null;
  passport_image_url: string | null;
  visa_image_url: string | null;
  passport_image_iv: string | null;
  visa_image_iv: string | null;
  birth_year: number | null;
  image_view_failed_attempts: number;
  image_view_locked_until: string | null;
  image_view_locked_by_admin: boolean;
  local_airport: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  popular_roles: string | null;
  special_notes: string | null;
  headshot_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TalentQuickView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [talents, setTalents] = useState<TalentQuickViewRecord[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TalentQuickViewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<TalentQuickViewRecord>>({});
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title: string;
    documentType: 'passport' | 'visa' | null;
  }>({ isOpen: false, imageUrl: null, title: '', documentType: null });

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';

  useEffect(() => {
    if (!isAdmin && !isStaff) {
      navigate('/');
      return;
    }
    loadTalents();
  }, [isAdmin, isStaff, navigate]);

  useEffect(() => {
    if (id && talents.length > 0) {
      const talent = talents.find(t => t.id === id);
      if (talent) {
        setSelectedTalent(talent);
      }
    }
  }, [id, talents]);

  const loadTalents = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_quick_view')
        .select('*')
        .order('name');

      if (error) throw error;
      setTalents(data || []);
    } catch (error) {
      console.error('Error loading talents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load talent records',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('talent_quick_view')
          .update(formData)
          .eq('id', formData.id);
        if (error) throw error;
        
        // Update selectedTalent if we're editing the currently viewed talent
        if (selectedTalent?.id === formData.id) {
          setSelectedTalent({ ...selectedTalent, ...formData });
        }
        
        toast({ title: 'Success', description: 'Talent updated successfully' });
      } else {
        const { error } = await supabase
          .from('talent_quick_view')
          .insert({
            ...formData,
            name: formData.name // Ensure name is always present
          });
        if (error) throw error;
        toast({ title: 'Success', description: 'Talent added successfully' });
      }
      setShowForm(false);
      setFormData({});
      loadTalents();
    } catch (error) {
      console.error('Error saving talent:', error);
      toast({
        title: 'Error',
        description: 'Failed to save talent record',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (talentId: string) => {
    if (!confirm('Are you sure you want to delete this talent record?')) return;
    
    try {
      const { error } = await supabase
        .from('talent_quick_view')
        .delete()
        .eq('id', talentId);
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Talent deleted successfully' });
      loadTalents();
      if (selectedTalent?.id === talentId) {
        setSelectedTalent(null);
      }
    } catch (error) {
      console.error('Error deleting talent:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete talent record',
        variant: 'destructive'
      });
    }
  };

  const toggleActive = async (talent: TalentQuickViewRecord) => {
    try {
      const { error } = await supabase
        .from('talent_quick_view')
        .update({ active: !talent.active })
        .eq('id', talent.id);
      
      if (error) throw error;
      loadTalents();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const filteredTalents = talents.filter(talent =>
    talent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  if (!selectedTalent && !showForm) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <ModuleHeader
            title="Talent Quick View"
            onBack={() => navigate(isAdmin ? '/dashboard/admin' : '/dashboard/staff')}
            role={profile?.role}
            profileLocale={profile?.first_name}
          />

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle className="text-white">Talent Directory</CardTitle>
                <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Talent
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                <Input
                  placeholder="Search talents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>

              <div className="grid gap-4">
                {filteredTalents.map((talent) => (
                  <div
                    key={talent.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedTalent(talent)}
                  >
                    <img
                      src={talent.headshot_url || '/placeholder.svg'}
                      alt={talent.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{talent.name}</h3>
                      <p className="text-sm text-white/60">
                        {talent.email || 'No email provided'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        talent.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {talent.active ? 'Active' : 'Inactive'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(talent);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive(talent);
                        }}
                      >
                        {talent.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Form view
  if (showForm) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <ModuleHeader
            title={formData.id ? "Edit Talent" : "Add New Talent"}
            onBack={() => {
              setShowForm(false);
              setFormData({});
            }}
            role={profile?.role}
            profileLocale={profile?.first_name}
          />

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={80}
                    required
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob || ''}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_year">Birth Year (for document security)</Label>
                    <Input
                      id="birth_year"
                      type="number"
                      min="1900"
                      max="2100"
                      value={formData.birth_year || ''}
                      onChange={(e) => setFormData({ ...formData, birth_year: parseInt(e.target.value) || null })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="e.g., 1962"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number || ''}
                      onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visa_number">Visa Number</Label>
                    <Input
                      id="visa_number"
                      value={formData.visa_number || ''}
                      onChange={(e) => setFormData({ ...formData, visa_number: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local_airport">Local Airport</Label>
                  <Input
                    id="local_airport"
                    value={formData.local_airport || ''}
                    onChange={(e) => setFormData({ ...formData, local_airport: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.facebook || ''}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram || ''}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={formData.tiktok || ''}
                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <TalentImageUpload
                  currentImageUrl={formData.headshot_url}
                  onImageUploaded={(imageUrl) => setFormData({ ...formData, headshot_url: imageUrl })}
                  onImageRemoved={() => setFormData({ ...formData, headshot_url: null })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DocumentImageUpload
                    currentImageUrl={formData.passport_image_url}
                    onImageUploaded={(imageUrl, iv) => setFormData({ 
                      ...formData, 
                      passport_image_url: imageUrl,
                      passport_image_iv: iv 
                    })}
                    onImageRemoved={() => setFormData({ 
                      ...formData, 
                      passport_image_url: null,
                      passport_image_iv: null 
                    })}
                    label="Passport"
                    documentType="passport"
                    talentId={formData.id}
                  />
                  
                  <DocumentImageUpload
                    currentImageUrl={formData.visa_image_url}
                    onImageUploaded={(imageUrl, iv) => setFormData({ 
                      ...formData, 
                      visa_image_url: imageUrl,
                      visa_image_iv: iv 
                    })}
                    onImageRemoved={() => setFormData({ 
                      ...formData, 
                      visa_image_url: null,
                      visa_image_iv: null 
                    })}
                    label="Visa"
                    documentType="visa"
                    talentId={formData.id}
                  />
                </div>

                <Separator className="bg-white/20" />
                <div className="space-y-2">
                  <Label htmlFor="popular_roles">Popular Roles</Label>
                  <Textarea
                    id="popular_roles"
                    value={formData.popular_roles || ''}
                    onChange={(e) => setFormData({ ...formData, popular_roles: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_notes">Special Notes</Label>
                  <Textarea
                    id="special_notes"
                    value={formData.special_notes || ''}
                    onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    {formData.id ? 'Update' : 'Create'} Talent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({});
                    }}
                  >
                    Cancel
                  </Button>
                  {formData.id && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(formData.id!)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Detail view
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 sm:p-6">
            {/* Mobile-optimized header with photo and back button */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col">
                <img
                  src={selectedTalent.headshot_url || '/placeholder.svg'}
                  alt={selectedTalent.name}
                  className="w-[100px] h-[100px] rounded-lg object-cover flex-shrink-0 border-2 border-blue-400"
                />
                <h1 className="text-lg sm:text-xl font-bold text-white mt-3">{selectedTalent.name}</h1>
              </div>
              
              {/* Back button positioned in top right with black text */}
              <Button
                onClick={() => setSelectedTalent(null)}
                variant="outline"
                size="sm"
                className="border-white/20 bg-white text-black hover:bg-gray-100 flex-shrink-0"
              >
                ← Back
              </Button>
            </div>

            <Separator className="bg-white/20 mb-6" />

            <div className="space-y-4">
              {selectedTalent.dob && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-white/80 min-w-0">Date of Birth:</span>
                  <span className="text-white font-medium">{formatDate(selectedTalent.dob)}</span>
                </div>
              )}

              {selectedTalent.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-white/80 min-w-0">Email:</span>
                  <a href={`mailto:${selectedTalent.email}`} className="text-blue-400 hover:text-blue-300 break-all">
                    {selectedTalent.email}
                  </a>
                </div>
              )}

              {selectedTalent.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-white/80 min-w-0">Phone:</span>
                  <a href={`tel:${selectedTalent.phone}`} className="text-blue-400 hover:text-blue-300">
                    {selectedTalent.phone}
                  </a>
                </div>
              )}

              {selectedTalent.passport_number && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-sm text-white/80 min-w-0">Passport:</span>
                    <span className="text-white font-medium">{selectedTalent.passport_number}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedTalent.passport_image_url) {
                        setImageViewer({
                          isOpen: true,
                          imageUrl: selectedTalent.passport_image_url,
                          title: 'Passport Image',
                          documentType: 'passport'
                        });
                      } else {
                        toast({
                          title: 'No Image Available',
                          description: 'No passport image has been uploaded for this talent.',
                          variant: 'destructive'
                        });
                      }
                    }}
                    className="border-blue-400 bg-white text-black hover:bg-gray-100 text-xs px-2 py-1 h-6"
                  >
                    View Image
                  </Button>
                </div>
              )}

              {selectedTalent.visa_number && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="text-sm text-white/80 min-w-0">Visa:</span>
                    <span className="text-white font-medium">{selectedTalent.visa_number}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedTalent.visa_image_url) {
                        setImageViewer({
                          isOpen: true,
                          imageUrl: selectedTalent.visa_image_url,
                          title: 'Visa Image',
                          documentType: 'visa'
                        });
                      } else {
                        toast({
                          title: 'No Image Available',
                          description: 'No visa image has been uploaded for this talent.',
                          variant: 'destructive'
                        });
                      }
                    }}
                    className="border-blue-400 bg-white text-black hover:bg-gray-100 text-xs px-2 py-1 h-6"
                  >
                    View Image
                  </Button>
                </div>
              )}

              {selectedTalent.local_airport && (
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 flex-shrink-0">✈️</span>
                  <span className="text-sm text-white/80 min-w-0">Local Airport:</span>
                  <span className="text-white font-medium">{selectedTalent.local_airport}</span>
                </div>
              )}

              {/* Social Media Links */}
              {(selectedTalent.facebook || selectedTalent.instagram || selectedTalent.tiktok) && (
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-sm text-white/80">Social:</span>
                  {selectedTalent.facebook && (
                    <a href={selectedTalent.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {selectedTalent.instagram && (
                    <a href={selectedTalent.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {selectedTalent.tiktok && (
                    <a href={selectedTalent.tiktok} target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                      <span className="text-lg">🎵</span>
                    </a>
                  )}
                </div>
              )}

              {selectedTalent.popular_roles && (
                <div className="pt-2">
                  <span className="text-sm text-white/80 block mb-2">Popular Roles:</span>
                  <p className="text-white bg-white/5 p-3 rounded-lg">{selectedTalent.popular_roles}</p>
                </div>
              )}

              {selectedTalent.special_notes && (
                <div className="pt-2">
                  <span className="text-sm text-white/80 block mb-2">Special Notes:</span>
                  <p className="text-white bg-white/5 p-3 rounded-lg">{selectedTalent.special_notes}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate(`/dashboard/calendar?talent=${selectedTalent.id}`)}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Check Calendar
                </Button>
                <Button
                  onClick={() => {
                    setFormData(selectedTalent);
                    setShowForm(true);
                  }}
                  variant="outline"
                  className="border-white/20 bg-white text-black hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secure Image Viewer Modal */}
        <SecureImageViewer
          isOpen={imageViewer.isOpen}
          onClose={() => setImageViewer({ isOpen: false, imageUrl: null, title: '', documentType: null })}
          imageUrl={imageViewer.imageUrl}
          title={imageViewer.title}
          talentId={selectedTalent.id}
          birthYear={selectedTalent.birth_year}
          failedAttempts={selectedTalent.image_view_failed_attempts}
          isLocked={selectedTalent.image_view_locked_until ? new Date(selectedTalent.image_view_locked_until) > new Date() : false}
          lockedUntil={selectedTalent.image_view_locked_until}
          lockedByAdmin={selectedTalent.image_view_locked_by_admin}
          documentType={imageViewer.documentType}
          iv={imageViewer.documentType === 'passport' ? selectedTalent.passport_image_iv : selectedTalent.visa_image_iv}
        />
      </div>
    </div>
  );
}