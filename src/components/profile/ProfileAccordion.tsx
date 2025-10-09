import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Briefcase, 
  Star, 
  Plane, 
  FileCheck, 
  Camera,
  Upload,
  Loader2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAccordionProps {
  userId: string;
  mode: 'talent' | 'admin';
}

// Zod schemas for each section
const basicInfoSchema = z.object({
  legal_name: z.string().min(1, 'Legal name is required'),
  stage_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  contact_number: z.string().optional(),
  email: z.string().email('Valid email required'),
  address_line: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
});

const representationSchema = z.object({
  representation_type: z.string().optional(),
  representation_start_date: z.string().optional(),
  union_affiliation: z.boolean().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  previous_representation: z.string().optional(),
});

const professionalSchema = z.object({
  talent_category: z.string().optional(),
  skills: z.string().optional(),
  training: z.string().optional(),
  experience_years: z.string().optional(),
  social_instagram: z.string().optional(),
  social_facebook: z.string().optional(),
  social_tiktok: z.string().optional(),
  social_x: z.string().optional(),
  social_linkedin: z.string().optional(),
});

const travelSchema = z.object({
  preferred_airports: z.string().optional(),
  preferred_airlines: z.string().optional(),
  travel_requirements: z.string().optional(),
  availability_notes: z.string().optional(),
  has_passport: z.boolean().optional(),
  passport_number: z.string().optional(),
  has_visa: z.boolean().optional(),
  visa_number: z.string().optional(),
  has_drivers_license: z.boolean().optional(),
  drivers_license_state: z.string().optional(),
  food_allergies: z.string().optional(),
});

const consentSchema = z.object({
  representation_consent: z.boolean().optional(),
  marketing_consent: z.boolean().optional(),
  terms_accepted: z.boolean().optional(),
});

export function ProfileAccordion({ userId, mode }: ProfileAccordionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [heroUrl, setHeroUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const basicForm = useForm({
    resolver: zodResolver(basicInfoSchema),
    mode: 'onBlur',
  });

  const repForm = useForm({
    resolver: zodResolver(representationSchema),
    mode: 'onBlur',
  });

  const profForm = useForm({
    resolver: zodResolver(professionalSchema),
    mode: 'onBlur',
  });

  const travelForm = useForm({
    resolver: zodResolver(travelSchema),
    mode: 'onBlur',
  });

  const consentForm = useForm({
    resolver: zodResolver(consentSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user_profile_data
      const { data, error } = await supabase
        .from('user_profile_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create baseline record
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, avatar_url, background_image_url')
          .eq('user_id', userId)
          .single();

        const newData = {
          user_id: userId,
          legal_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
          email: profile?.email || '',
          contact_number: profile?.phone || '',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('user_profile_data')
          .insert(newData)
          .select()
          .single();

        if (insertError) throw insertError;
        setProfileData(inserted);
        populateForms(inserted);
        
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile?.background_image_url) setHeroUrl(profile.background_image_url);
      } else {
        setProfileData(data);
        populateForms(data);
        
        // Also fetch avatar/hero from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, background_image_url')
          .eq('user_id', userId)
          .single();
        
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile?.background_image_url) setHeroUrl(profile.background_image_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error loading profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const populateForms = (data: any) => {
    basicForm.reset({
      legal_name: data.legal_name || '',
      stage_name: data.stage_name || '',
      date_of_birth: data.date_of_birth || '',
      contact_number: data.contact_number || '',
      email: data.email || '',
      address_line: data.address_line || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || 'USA',
      postal_code: data.postal_code || '',
    });

    repForm.reset({
      representation_type: data.representation_type || '',
      representation_start_date: data.representation_start_date || '',
      union_affiliation: data.union_affiliation || false,
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      previous_representation: data.previous_representation || '',
    });

    profForm.reset({
      talent_category: data.talent_category || '',
      skills: data.skills || '',
      training: data.training || '',
      experience_years: data.experience_years?.toString() || '',
      social_instagram: data.social_instagram || '',
      social_facebook: data.social_facebook || '',
      social_tiktok: data.social_tiktok || '',
      social_x: data.social_x || '',
      social_linkedin: data.social_linkedin || '',
    });

    travelForm.reset({
      preferred_airports: data.preferred_airports || '',
      preferred_airlines: data.preferred_airlines || '',
      travel_requirements: data.travel_requirements || '',
      availability_notes: data.availability_notes || '',
      has_passport: data.has_passport || false,
      passport_number: data.passport_number || '',
      has_visa: data.has_visa || false,
      visa_number: data.visa_number || '',
      has_drivers_license: data.has_drivers_license || false,
      drivers_license_state: data.drivers_license_state || '',
      food_allergies: data.food_allergies || '',
    });

    consentForm.reset({
      representation_consent: data.representation_consent || false,
      marketing_consent: data.marketing_consent || false,
      terms_accepted: data.terms_accepted || false,
    });
  };

  const uploadImage = async (file: File, type: 'avatar' | 'hero') => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profiles table for compatibility
      const updateField = type === 'avatar' ? 'avatar_url' : 'background_image_url';
      await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('user_id', userId);

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
      } else {
        setHeroUrl(publicUrl);
      }

      toast({ title: 'Image uploaded successfully' });
      return publicUrl;
    } catch (error) {
      console.error('Error uploading:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'hero'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large (max 10MB)', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    await uploadImage(file, type);
  };

  const saveSection = async (sectionData: any) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_profile_data')
        .upsert({
          user_id: userId,
          ...sectionData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Sync certain fields to profiles for compatibility
      if (sectionData.email || sectionData.contact_number) {
        await supabase
          .from('profiles')
          .update({
            email: sectionData.email,
            phone: sectionData.contact_number,
          })
          .eq('user_id', userId);
      }

      toast({ title: 'Saved successfully' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const name = profileData?.legal_name || '';
    const parts = name.split(' ');
    return parts.map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Section - Always Visible */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border-2">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="min-h-[44px] h-11"
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Change Photo'}
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                className="hidden"
              />
            </div>

            {/* Hero Image */}
            <div className="flex-1 space-y-3">
              <Label>Hero Banner</Label>
              {heroUrl && (
                <div
                  className="w-full h-32 bg-cover bg-center rounded-lg border"
                  style={{ backgroundImage: `url(${heroUrl})` }}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => heroInputRef.current?.click()}
                disabled={uploading}
                className="min-h-[44px] h-11"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Change Banner'}
              </Button>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'hero')}
                className="hidden"
              />
            </div>
          </div>

          {/* Quick Edit Fields */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quick-name">Legal Name</Label>
              <Input
                id="quick-name"
                {...basicForm.register('legal_name')}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <Label htmlFor="quick-email">Email</Label>
              <Input
                id="quick-email"
                type="email"
                {...basicForm.register('email')}
                className="min-h-[44px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* 1. Basic Information */}
        <AccordionItem value="basic" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline min-h-[44px]">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <span className="font-semibold">Basic Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={basicForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Stage Name</Label>
                  <Input {...basicForm.register('stage_name')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    {...basicForm.register('date_of_birth')}
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <Label>Contact Number</Label>
                  <Input {...basicForm.register('contact_number')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input {...basicForm.register('address_line')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input {...basicForm.register('city')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input {...basicForm.register('state')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input {...basicForm.register('country')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input {...basicForm.register('postal_code')} className="min-h-[44px]" />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Section
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Representation & Legal */}
        <AccordionItem value="representation" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline min-h-[44px]">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-semibold">Representation & Legal</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={repForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Representation Type</Label>
                  <Input {...repForm.register('representation_type')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    {...repForm.register('representation_start_date')}
                    className="min-h-[44px]"
                  />
                </div>
                <div className="flex items-center space-x-2 md:col-span-2">
                  <Checkbox
                    id="union"
                    {...repForm.register('union_affiliation')}
                  />
                  <Label htmlFor="union" className="cursor-pointer">Union Affiliation</Label>
                </div>
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input {...repForm.register('emergency_contact_name')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input {...repForm.register('emergency_contact_phone')} className="min-h-[44px]" />
                </div>
                <div className="md:col-span-2">
                  <Label>Previous Representation</Label>
                  <Textarea {...repForm.register('previous_representation')} />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Section
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Professional Details */}
        <AccordionItem value="professional" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline min-h-[44px]">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold">Professional Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={profForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Talent Category</Label>
                  <Input {...profForm.register('talent_category')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Years of Experience</Label>
                  <Input {...profForm.register('experience_years')} type="number" className="min-h-[44px]" />
                </div>
                <div className="md:col-span-2">
                  <Label>Skills</Label>
                  <Textarea {...profForm.register('skills')} />
                </div>
                <div className="md:col-span-2">
                  <Label>Training</Label>
                  <Textarea {...profForm.register('training')} />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input {...profForm.register('social_instagram')} placeholder="@username" className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input {...profForm.register('social_facebook')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>TikTok</Label>
                  <Input {...profForm.register('social_tiktok')} placeholder="@username" className="min-h-[44px]" />
                </div>
                <div>
                  <Label>X (Twitter)</Label>
                  <Input {...profForm.register('social_x')} placeholder="@username" className="min-h-[44px]" />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input {...profForm.register('social_linkedin')} className="min-h-[44px]" />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Section
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Travel & Logistics */}
        <AccordionItem value="travel" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline min-h-[44px]">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-primary" />
              <span className="font-semibold">Availability, Travel & Logistics</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={travelForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Airports</Label>
                  <Input {...travelForm.register('preferred_airports')} className="min-h-[44px]" />
                </div>
                <div>
                  <Label>Preferred Airlines</Label>
                  <Input {...travelForm.register('preferred_airlines')} className="min-h-[44px]" />
                </div>
                <div className="md:col-span-2">
                  <Label>Travel Requirements</Label>
                  <Textarea {...travelForm.register('travel_requirements')} />
                </div>
                <div className="md:col-span-2">
                  <Label>Availability Notes</Label>
                  <Textarea {...travelForm.register('availability_notes')} />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passport"
                    {...travelForm.register('has_passport')}
                  />
                  <Label htmlFor="passport" className="cursor-pointer">Has Passport</Label>
                </div>
                <div>
                  <Label>Passport Number</Label>
                  <Input {...travelForm.register('passport_number')} className="min-h-[44px]" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visa"
                    {...travelForm.register('has_visa')}
                  />
                  <Label htmlFor="visa" className="cursor-pointer">Has Visa</Label>
                </div>
                <div>
                  <Label>Visa Number</Label>
                  <Input {...travelForm.register('visa_number')} className="min-h-[44px]" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="license"
                    {...travelForm.register('has_drivers_license')}
                  />
                  <Label htmlFor="license" className="cursor-pointer">Has Driver's License</Label>
                </div>
                <div>
                  <Label>Driver's License State</Label>
                  <Input {...travelForm.register('drivers_license_state')} className="min-h-[44px]" />
                </div>
                <div className="md:col-span-2">
                  <Label>Food Allergies</Label>
                  <Textarea {...travelForm.register('food_allergies')} />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Section
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Consent & Digital Agreement */}
        <AccordionItem value="consent" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline min-h-[44px]">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">Consent & Digital Agreement</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={consentForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="rep-consent"
                    {...consentForm.register('representation_consent')}
                  />
                  <Label htmlFor="rep-consent" className="cursor-pointer leading-relaxed">
                    I consent to representation and understand the terms
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing-consent"
                    {...consentForm.register('marketing_consent')}
                  />
                  <Label htmlFor="marketing-consent" className="cursor-pointer leading-relaxed">
                    I consent to marketing communications
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-consent"
                    {...consentForm.register('terms_accepted')}
                  />
                  <Label htmlFor="terms-consent" className="cursor-pointer leading-relaxed">
                    I accept the terms and conditions
                  </Label>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Section
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-50 md:hidden">
        <Button
          onClick={() => {
            const currentSection = document.querySelector('[data-state="open"]');
            if (currentSection) {
              const form = currentSection.querySelector('form');
              form?.requestSubmit();
            }
          }}
          disabled={saving}
          className="w-full min-h-[44px] h-12 text-base font-semibold"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
          Save Current Section
        </Button>
      </div>
    </div>
  );
}
