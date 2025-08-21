import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, ArrowLeft, Users, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { BusinessEvent, businessEventsApi } from './data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import TravelHotelSection from './TravelHotelSection';
import BusinessEventFormDialog from './BusinessEventFormDrawer';
import PageLayout from '@/components/PageLayout';

const BusinessEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [event, setEvent] = useState<BusinessEvent | null>(null);
  const [assignedTalents, setAssignedTalents] = useState<any[]>([]);
  const [assignedBusinesses, setAssignedBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const canEdit = profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'business';

  useEffect(() => {
    if (id) {
      loadEventDetails();
    }
  }, [id]);

  const loadEventDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const events = await businessEventsApi.getEvents();
      const foundEvent = events.find(e => e.id === id);
      
      if (!foundEvent) {
        toast({
          title: 'Error',
          description: 'Event not found',
          variant: 'destructive'
        });
        navigate('/admin/business-events');
        return;
      }

      setEvent(foundEvent);
      
      // Extract assigned talents and businesses
      const eventWithRelations = foundEvent as any;
      setAssignedTalents(eventWithRelations.business_event_talent?.map((bet: any) => bet.talent_profiles) || []);
      setAssignedBusinesses(eventWithRelations.business_event_account?.map((bea: any) => bea.business_account) || []);
      
    } catch (error) {
      console.error('Error loading event details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return null;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return null;
    }
  };

  const handleEventSave = (updatedEvent: BusinessEvent) => {
    setEvent(updatedEvent);
    loadEventDetails(); // Reload to get updated relations
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </PageLayout>
    );
  }

  if (!event) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Event Not Found</h1>
          <Button onClick={() => navigate('/admin/business-events')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </PageLayout>
    );
  }

  const heroImageUrl = event.hero_logo_path && !imageError
    ? `https://gytjgmeoepglbrjrbfie.supabase.co/storage/v1/object/public/business-events/${event.hero_logo_path}`
    : null;

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/business-events')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {event.title || 'Untitled Event'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>
            </div>
          </div>
          
          {canEdit && (
            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          )}
        </div>

        {/* Hero Image */}
        {heroImageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden rounded-lg">
            <img
              src={heroImageUrl}
              alt={event.title || 'Event Hero Image'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              {(event.start_ts || event.end_ts) && (
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Date & Time</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(event.start_ts)}
                      {event.start_ts && formatTime(event.start_ts) && (
                        <span className="ml-1">at {formatTime(event.start_ts)}</span>
                      )}
                      {event.end_ts && event.end_ts !== event.start_ts && (
                        <div>
                          Ends: {formatDate(event.end_ts)}
                          {formatTime(event.end_ts) && (
                            <span className="ml-1">at {formatTime(event.end_ts)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {(event.venue || event.city || event.state || event.address_line) && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">
                      {event.venue && <div className="font-medium">{event.venue}</div>}
                      {event.address_line && <div>{event.address_line}</div>}
                      <div>
                        {event.city && <span>{event.city}</span>}
                        {event.state && <span>, {event.state}</span>}
                        {event.country && event.country !== 'USA' && <span>, {event.country}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Website */}
              {event.website && (
                <div>
                  <div className="font-medium">Website</div>
                  <a 
                    href={event.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {event.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Talents & Businesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Talents */}
              {assignedTalents.length > 0 && (
                <div>
                  <div className="font-medium mb-2">Assigned Talents</div>
                  <div className="flex flex-wrap gap-2">
                    {assignedTalents.map((talent) => (
                      <Badge key={talent.id} variant="secondary">
                        {talent.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Accounts */}
              {assignedBusinesses.length > 0 && (
                <div>
                  <div className="font-medium mb-2">Business Accounts</div>
                  <div className="flex flex-wrap gap-2">
                    {assignedBusinesses.map((business) => (
                      <Badge key={business.id} variant="outline">
                        {business.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {assignedTalents.length === 0 && assignedBusinesses.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No talents or businesses assigned yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Travel & Hotel Section */}
        {assignedTalents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Travel & Hotel Details</CardTitle>
            </CardHeader>
            <CardContent>
              <TravelHotelSection 
                eventId={event.id} 
                assignedTalents={assignedTalents}
                language="en"
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <BusinessEventFormDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          event={event}
          onSave={handleEventSave}
          language="en"
        />
      </div>
    </PageLayout>
  );
};

export default BusinessEventDetail;