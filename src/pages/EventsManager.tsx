import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  external_url: string | null;
  hero_image_url: string | null;
  event_date: string;
  visibility_start: string | null;
  visibility_end: string | null;
  tags: string[] | null;
  category: string | null;
  active: boolean;
  created_at: string;
}

interface TalentProfile {
  id: string;
  name: string;
  slug: string;
}

export default function EventsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<TalentProfile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
  });

  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchTalentProfiles();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
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
        .from("talent_profiles")
        .select("id, name, slug")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setTalentProfiles(data || []);
    } catch (error) {
      console.error("Error fetching talent profiles:", error);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("event-images")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
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
    
    try {
      const eventData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
        visibility_start: formData.visibility_start || null,
        visibility_end: formData.visibility_end || null,
        updated_by: user?.id,
      };

      if (selectedEvent) {
        // For updates, only set updated_by
      } else {
        // For new events, set created_by
        (eventData as any).created_by = user?.id;
      }

      const { data, error } = selectedEvent
        ? await supabase
            .from("events")
            .update(eventData)
            .eq("id", selectedEvent.id)
            .select()
            .single()
        : await supabase
            .from("events")
            .insert(eventData)
            .select()
            .single();

      if (error) throw error;

      // Handle talent assignments
      if (data && selectedTalents.length > 0) {
        // Remove existing assignments
        await supabase
          .from("event_talent_assignments")
          .delete()
          .eq("event_id", data.id);

        // Add new assignments
        const assignments = selectedTalents.map(talentId => ({
          event_id: data.id,
          talent_id: talentId,
        }));

        const { error: assignmentError } = await supabase
          .from("event_talent_assignments")
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      toast({
        title: "Success",
        description: `Event ${selectedEvent ? "updated" : "created"} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      external_url: event.external_url || "",
      event_date: event.event_date.substring(0, 16), // Format for datetime-local input
      visibility_start: event.visibility_start?.substring(0, 16) || "",
      visibility_end: event.visibility_end?.substring(0, 16) || "",
      category: event.category || "",
      tags: event.tags?.join(", ") || "",
      active: event.active,
    });

    // Fetch existing talent assignments
    try {
      const { data } = await supabase
        .from("event_talent_assignments")
        .select("talent_id")
        .eq("event_id", event.id);
      
      setSelectedTalents(data?.map(a => a.talent_id) || []);
    } catch (error) {
      console.error("Error fetching talent assignments:", error);
    }

    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedEvent(null);
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
    });
    setSelectedTalents([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events Manager</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
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
                        checked={selectedTalents.includes(talent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTalents([...selectedTalents, talent.id]);
                          } else {
                            setSelectedTalents(selectedTalents.filter(id => id !== talent.id));
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
                <Label htmlFor="hero_image">Hero Image (1080x1080px recommended)</Label>
                <Input
                  id="hero_image"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleImageUpload(file);
                      if (url) {
                        setSelectedEvent(prev => prev ? { ...prev, hero_image_url: url } : null);
                      }
                    }
                  }}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
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
                  {selectedEvent ? "Update" : "Create"} Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {event.title}
                    {!event.active && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.event_date), "PPP p")}
                    </div>
                    {event.location && <span>{event.location}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(event)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {event.description && (
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {event.description}
                </p>
              )}
              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No events created yet.</p>
          <p className="text-sm text-muted-foreground">Create your first event to get started.</p>
        </div>
      )}
    </div>
  );
}