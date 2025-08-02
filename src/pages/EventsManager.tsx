import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, MapPin, Users, Edit, Trash2, Plus, Upload, X, Settings, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import heroEventsManager from '@/assets/hero-events-manager.jpg';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  hero_image_url?: string;
  external_url?: string;
  category?: string;
  tags?: string[];
  active: boolean;
  visibility_start?: string;
  visibility_end?: string;
  created_at: string;
  updated_at: string;
}

interface EventsPageSettings {
  id: string;
  hero_image_url?: string;
  hero_alt_text?: string;
  updated_by?: string;
}

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
}

export default function EventsManager() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [events, setEvents] = useState<Event[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [selectedTalent, setSelectedTalent] = useState<string[]>([]);
  const [assignedTalent, setAssignedTalent] = useState<any[]>([]);
  const [isHeroDialogOpen, setIsHeroDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    external_url: "",
    event_date: "",
    visibility_start: "",
    visibility_end: "",
    category: "",
    tags: "",
    active: true,
    hero_image_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchTalentProfiles();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTalentProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('talent_profiles')
        .select('id, name, slug')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTalentProfiles(data || []);
    } catch (error) {
      console.error('Error fetching talent profiles:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `event-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      });
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        location: formData.location || null,
        external_url: formData.external_url || null,
        category: formData.category || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        active: formData.active,
        visibility_start: formData.visibility_start || null,
        visibility_end: formData.visibility_end || null,
        hero_image_url: formData.hero_image_url || null,
        created_by: user.id,
        updated_by: user.id,
      };

      let result;
      if (isEditing && currentEventId) {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', currentEventId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Handle talent assignments
      if (result) {
        if (isEditing) {
          // Remove existing assignments
          await supabase
            .from('event_talent_assignments')
            .delete()
            .eq('event_id', result.id);
        }

        // Add new assignments
        if (selectedTalent.length > 0) {
          const assignments = selectedTalent.map(talentId => ({
            event_id: result.id,
            talent_id: talentId,
            status: 'assigned'
          }));

          await supabase
            .from('event_talent_assignments')
            .insert(assignments);
        }
      }

      toast({
        title: "Success",
        description: `Event ${isEditing ? 'updated' : 'created'} successfully`,
      });

      fetchEvents();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} event`,
        variant: "destructive",
      });
    }
  };

  const handleHeroImageUpload = async (file: File) => {
    if (!user || profile?.role !== 'admin') {
      toast({
        title: "Error",
        description: "Only administrators can change the hero image",
        variant: "destructive",
      });
      return;
    }

    // For now, just show a toast that the feature will be available after database update
    toast({
      title: "Feature Coming Soon",
      description: "Hero image customization will be available after database updates are complete",
    });
    setIsHeroDialogOpen(false);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (event: Event) => {
    setIsEditing(true);
    setCurrentEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      external_url: event.external_url || "",
      event_date: event.event_date.substring(0, 16),
      visibility_start: event.visibility_start?.substring(0, 16) || "",
      visibility_end: event.visibility_end?.substring(0, 16) || "",
      category: event.category || "",
      tags: event.tags?.join(", ") || "",
      active: event.active,
      hero_image_url: event.hero_image_url || "",
    });

    // Fetch existing talent assignments
    try {
      const { data } = await supabase
        .from('event_talent_assignments')
        .select('talent_id')
        .eq('event_id', event.id);
      
      setSelectedTalent(data?.map(a => a.talent_id) || []);
    } catch (error) {
      console.error('Error fetching talent assignments:', error);
    }

    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentEventId(null);
    setFormData({
      title: "",
      description: "",
      location: "",
      external_url: "",
      event_date: "",
      visibility_start: "",
      visibility_end: "",
      category: "",
      tags: "",
      active: true,
      hero_image_url: "",
    });
    setSelectedTalent([]);
    setAssignedTalent([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-60 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="container mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-96">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        backgroundImage: 'var(--site-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation language={language} setLanguage={setLanguage} />
      {/* Hero Section */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={heroEventsManager}
          alt="Events Management"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">Events Manager</h1>
            <p className="text-xl opacity-90">Create and manage events for your organization</p>
            {profile?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setIsHeroDialogOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Change Hero Image
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Back to Admin Dashboard Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>

        {/* Create Event Button - Centered */}
        <div className="flex justify-center mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="px-8 py-3 text-lg"
                onClick={() => resetForm()}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Event" : "Create New Event"}
                </DialogTitle>
                <DialogDescription>
                  Fill out the form below to {isEditing ? "update" : "create"} an event.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Convention, Webinar, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="external_url">External URL</Label>
                    <Input
                      id="external_url"
                      type="url"
                      value={formData.external_url}
                      onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date & Time *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibility_start">Visibility Start</Label>
                    <Input
                      id="visibility_start"
                      type="datetime-local"
                      value={formData.visibility_start}
                      onChange={(e) => setFormData({ ...formData, visibility_start: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="visibility_end">Visibility End</Label>
                    <Input
                      id="visibility_end"
                      type="datetime-local"
                      value={formData.visibility_end}
                      onChange={(e) => setFormData({ ...formData, visibility_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="funko, convention, signing"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assigned Talent</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                    {talentProfiles.map((talent) => (
                      <label key={talent.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTalent.includes(talent.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTalent([...selectedTalent, talent.id]);
                            } else {
                              setSelectedTalent(selectedTalent.filter(id => id !== talent.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{talent.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_image">Hero Image</Label>
                  <Input
                    id="hero_image"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file);
                        if (url) {
                          setFormData(prev => ({ ...prev, hero_image_url: url }));
                        }
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  {formData.hero_image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.hero_image_url}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {isEditing ? "Update" : "Create"} Event
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="h-96">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start by creating your first event to get your calendar organized.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow h-96 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <CalendarDays className="mr-1 h-4 w-4" />
                        {format(new Date(event.event_date), 'PPP p')}
                      </CardDescription>
                      {event.location && (
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="mr-1 h-4 w-4" />
                          {event.location}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={event.active ? "default" : "secondary"}>
                        {event.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {event.hero_image_url && (
                  <div className="px-6 pb-4 flex-shrink-0">
                    <img
                      src={event.hero_image_url}
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
                
                <CardContent className="flex-grow">
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {event.description}
                    </p>
                  )}
                  
                  {event.category && (
                    <Badge variant="outline" className="mr-2 mb-2">
                      {event.category}
                    </Badge>
                  )}
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{event.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-between flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(event)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Hero Image Settings Dialog */}
        <Dialog open={isHeroDialogOpen} onOpenChange={setIsHeroDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Hero Image</DialogTitle>
              <DialogDescription>
                Upload a new hero image for the Events Manager page (1920x240px recommended)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleHeroImageUpload(file);
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Footer language={language} />
    </div>
  );
}