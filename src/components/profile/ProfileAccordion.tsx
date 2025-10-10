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
} from 'lucide-react';

interface ProfileAccordionProps {
  userId: string;
  mode: 'talent' | 'admin';
}

// Zod schemas with required fields marked
const basicInfoSchema = z.object({
  legal_name: z.string().min(1, "Full legal name is required"),
  stage_name: z.string().optional(),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  email: z.string().email("Valid email is required").min(1, "Email is required"),
  address_line: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().optional(),
  postal_code: z.string().min(1, "Postal code is required"),
});

const representationSchema = z.object({
  representation_type: z.string().min(1, "Representation type is required"),
  representation_start_date: z.string().optional(),
  union_affiliation: z.boolean().optional(),
  emergency_contact_name: z.string().min(1, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(1, "Emergency contact phone is required"),
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
  preferred_airports: z.string().min(1, "Preferred airports are required"),
  preferred_airlines: z.string().min(1, "Preferred airlines are required"),
  travel_requirements: z.string().optional(),
  availability_notes: z.string().min(1, "Typical availability is required"),
  has_passport: z.boolean().optional(),
  passport_number: z.string().optional(),
  has_visa: z.boolean().optional(),
  visa_number: z.string().optional(),
  has_drivers_license: z.boolean().optional(),
  drivers_license_state: z.string().optional(),
  food_allergies: z.string().optional(),
});

const consentSchema = z.object({
  representation_consent: z.boolean().refine(val => val === true, "You must consent to representation"),
  marketing_consent: z.boolean().refine(val => val === true, "Marketing consent is required"),
  terms_accepted: z.boolean().refine(val => val === true, "You must accept terms and privacy policy"),
  signature_data: z.string().min(1, "E-signature is required"),
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
      
      // Use deterministic query to get latest row and avoid duplicates
      const { data: existingRows, error: fetchError } = await supabase
        .from('user_profile_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      let profileRow;
      if (!existingRows || existingRows.length === 0) {
        // No row exists - create one using upsert to prevent duplicates
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, avatar_url, background_image_url')
          .eq('user_id', userId)
          .single();

        const { data: upserted, error: upsertError } = await supabase
          .from('user_profile_data')
          .upsert({
            user_id: userId,
            legal_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
            email: profile?.email || '',
            contact_number: profile?.phone || '',
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (upsertError) throw upsertError;
        profileRow = upserted;
        
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile?.background_image_url) setHeroUrl(profile.background_image_url);
      } else {
        profileRow = existingRows[0];
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, background_image_url')
          .eq('user_id', userId)
          .single();
        
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile?.background_image_url) setHeroUrl(profile.background_image_url);
      }

      setProfileData(profileRow);
      populateForms(profileRow);
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      toast({
        title: 'Error loading profile',
        description: error instanceof Error ? error.message : 'Unknown error',
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
      signature_data: data.signature_data || '',
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

  // Sanitize data to ensure correct types for database
  const sanitizeSectionData = (data: any) => {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Convert empty strings and undefined to null
      if (value === '' || value === undefined) {
        sanitized[key] = null;
        continue;
      }
      
      // Parse experience_years to integer or null
      if (key === 'experience_years') {
        const parsed = parseInt(value as string, 10);
        sanitized[key] = isNaN(parsed) ? null : parsed;
        continue;
      }
      
      // Normalize boolean fields
      if (['has_passport', 'has_visa', 'has_drivers_license', 'union_affiliation', 
           'representation_consent', 'marketing_consent', 'terms_accepted'].includes(key)) {
        sanitized[key] = Boolean(value);
        continue;
      }
      
      // Normalize date fields to YYYY-MM-DD or null
      if (['date_of_birth', 'representation_start_date'].includes(key)) {
        if (typeof value === 'string' && value.length > 0) {
          sanitized[key] = value.split('T')[0]; // Extract YYYY-MM-DD
        } else {
          sanitized[key] = null;
        }
        continue;
      }
      
      // Keep all other values as-is
      sanitized[key] = value;
    }
    
    return sanitized;
  };

  const saveSection = async (sectionData: any) => {
    try {
      setSaving(true);
      console.log('🔄 Saving profile data:', { userId, mode, rawData: sectionData });
      
      // Sanitize data to ensure correct types
      const sanitizedData = sanitizeSectionData(sectionData);
      console.log('🧹 Sanitized data:', sanitizedData);
      
      const { error } = await supabase
        .from('user_profile_data')
        .upsert({
          user_id: userId,
          ...sanitizedData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      console.log('✅ Saved to user_profile_data');

      // Merge saved data into local state
      setProfileData((prev: any) => ({ ...prev, ...sanitizedData }));

      // Update profiles table with email/phone if provided
      if (sanitizedData.email || sanitizedData.contact_number) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            email: sanitizedData.email,
            phone: sanitizedData.contact_number,
          })
          .eq('user_id', userId);
        
        if (profileError) {
          console.warn('⚠️ Error updating profiles table:', profileError);
        } else {
          console.log('✅ Updated profiles table');
        }
      }

      // Sync to talent_profiles table (for admin visibility)
      if (mode === 'talent' || sanitizedData.stage_name || sanitizedData.legal_name || sanitizedData.skills || sanitizedData.training) {
        const { data: talentProfile, error: fetchError } = await supabase
          .from('talent_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          console.warn('⚠️ Error fetching talent profile:', fetchError);
        } else if (talentProfile) {
          // Build update object with name and bio
          const talentUpdate: any = { updated_at: new Date().toISOString() };
          
          if (sanitizedData.stage_name || sanitizedData.legal_name) {
            talentUpdate.name = sanitizedData.stage_name || sanitizedData.legal_name;
          }
          
          if (sanitizedData.skills || sanitizedData.training) {
            const bioParts = [];
            if (sanitizedData.skills) bioParts.push(`Skills: ${sanitizedData.skills}`);
            if (sanitizedData.training) bioParts.push(`Training: ${sanitizedData.training}`);
            talentUpdate.bio = bioParts.join('\n\n');
          }

          if (Object.keys(talentUpdate).length > 1) { // More than just updated_at
            const { error: updateError } = await supabase
              .from('talent_profiles')
              .update(talentUpdate)
              .eq('id', talentProfile.id);

            if (updateError) {
              console.warn('⚠️ Error updating talent_profiles:', updateError);
            } else {
              console.log('✅ Synced to talent_profiles:', talentUpdate);
            }
          }
        }
      }

      toast({ 
        title: 'Saved successfully',
        description: 'Your profile has been updated'
      });
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ 
        title: 'Save failed', 
        description: errorMessage,
        variant: 'destructive' 
      });
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
        <Loader2 className="h-8 w-8 animate-spin text-funko-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Section - Always Visible */}
      <Card className="bg-black border-2 border-funko-orange">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 border-2 border-funko-orange">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl font-bold bg-funko-orange text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="min-h-[44px] h-11 bg-black border-funko-orange text-white hover:bg-funko-orange/20"
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
              <Label className="text-white">Hero Banner</Label>
              {heroUrl && (
                <div
                  className="w-full h-32 bg-cover bg-center rounded-lg border-2 border-funko-orange"
                  style={{ backgroundImage: `url(${heroUrl})` }}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => heroInputRef.current?.click()}
                disabled={uploading}
                className="min-h-[44px] h-11 bg-black border-funko-orange text-white hover:bg-funko-orange/20"
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
              <Label htmlFor="quick-name" className="text-white">Legal Name</Label>
              <Input
                id="quick-name"
                {...basicForm.register('legal_name')}
                className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
              />
            </div>
            <div>
              <Label htmlFor="quick-email" className="text-white">Email</Label>
              <Input
                id="quick-email"
                type="email"
                {...basicForm.register('email')}
                className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* 1. Basic Information */}
        <AccordionItem value="basic" className="border-2 border-funko-orange rounded-lg px-4 bg-black">
          <AccordionTrigger className="hover:no-underline min-h-[44px] text-white hover:text-funko-orange">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-funko-orange" />
              <span className="font-semibold">1. Basic Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={basicForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-white">Full Legal Name <span className="text-red-500">*</span></Label>
                  <Input {...basicForm.register('legal_name')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  {basicForm.formState.errors.legal_name && (
                    <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.legal_name.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Stage/Professional Name</Label>
                  <Input {...basicForm.register('stage_name')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                </div>
                <div>
                  <Label className="text-white">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    {...basicForm.register('date_of_birth')}
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  {basicForm.formState.errors.date_of_birth && (
                    <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.date_of_birth.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Contact Number <span className="text-red-500">*</span></Label>
                  <Input {...basicForm.register('contact_number')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  {basicForm.formState.errors.contact_number && (
                    <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.contact_number.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Email Address <span className="text-red-500">*</span></Label>
                  <Input type="email" {...basicForm.register('email')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  {basicForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.email.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Full Address <span className="text-red-500">*</span></Label>
                  <Input {...basicForm.register('address_line')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" placeholder="Street number and name" />
                  {basicForm.formState.errors.address_line && (
                    <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.address_line.message)}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">City <span className="text-red-500">*</span></Label>
                    <Input {...basicForm.register('city')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                    {basicForm.formState.errors.city && (
                      <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.city.message)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white">State <span className="text-red-500">*</span></Label>
                    <Input {...basicForm.register('state')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                    {basicForm.formState.errors.state && (
                      <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.state.message)}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Country</Label>
                    <Input {...basicForm.register('country')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">Postal Code <span className="text-red-500">*</span></Label>
                    <Input {...basicForm.register('postal_code')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                    {basicForm.formState.errors.postal_code && (
                      <p className="text-red-500 text-sm mt-1">{String(basicForm.formState.errors.postal_code.message)}</p>
                    )}
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px] bg-funko-orange hover:bg-funko-orange/90 text-white">
                {saving ? 'Saving...' : 'Save Basic Info'}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Representation & Legal */}
        <AccordionItem value="representation" className="border-2 border-funko-orange rounded-lg px-4 bg-black">
          <AccordionTrigger className="hover:no-underline min-h-[44px] text-white hover:text-funko-orange">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-funko-orange" />
              <span className="font-semibold">2. Representation & Legal</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={repForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-white">Representation Type <span className="text-red-500">*</span></Label>
                  <select
                    {...repForm.register('representation_type')}
                    className="w-full min-h-[44px] px-3 py-2 border rounded-md bg-gray-900 border-funko-orange/50 text-white"
                  >
                    <option value="">Select type</option>
                    <option value="exclusive">Exclusive</option>
                    <option value="non-exclusive">Non-Exclusive</option>
                  </select>
                  {repForm.formState.errors.representation_type && (
                    <p className="text-red-500 text-sm mt-1">{String(repForm.formState.errors.representation_type.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Start Date of Representation</Label>
                  <Input
                    type="date"
                    {...repForm.register('representation_start_date')}
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...repForm.register('union_affiliation')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">Union Affiliation (SAG-AFTRA, etc.)</Label>
                </div>
                <div>
                  <Label className="text-white">Emergency Contact Name <span className="text-red-500">*</span></Label>
                  <Input {...repForm.register('emergency_contact_name')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  {repForm.formState.errors.emergency_contact_name && (
                    <p className="text-red-500 text-sm mt-1">{String(repForm.formState.errors.emergency_contact_name.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Emergency Contact Phone <span className="text-red-500">*</span></Label>
                  <Input
                    type="tel"
                    {...repForm.register('emergency_contact_phone')}
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  {repForm.formState.errors.emergency_contact_phone && (
                    <p className="text-red-500 text-sm mt-1">{String(repForm.formState.errors.emergency_contact_phone.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Previous Representation (Optional)</Label>
                  <Textarea
                    {...repForm.register('previous_representation')}
                    className="min-h-[100px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px] bg-funko-orange hover:bg-funko-orange/90 text-white">
                {saving ? 'Saving...' : 'Save Representation Info'}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Professional Details */}
        <AccordionItem value="professional" className="border-2 border-funko-orange rounded-lg px-4 bg-black">
          <AccordionTrigger className="hover:no-underline min-h-[44px] text-white hover:text-funko-orange">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-funko-orange" />
              <span className="font-semibold">3. Professional Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={profForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-white">Talent Category</Label>
                  <select
                    {...profForm.register('talent_category')}
                    className="w-full min-h-[44px] px-3 py-2 border rounded-md bg-gray-900 border-funko-orange/50 text-white"
                  >
                    <option value="">Select category</option>
                    <option value="actor">Actor</option>
                    <option value="voice-over">Voice Over</option>
                    <option value="model">Model</option>
                    <option value="musician">Musician</option>
                    <option value="influencer">Influencer</option>
                    <option value="cosplayer">Cosplayer</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white">Skills</Label>
                  <Textarea
                    {...profForm.register('skills')}
                    placeholder="e.g., dance, singing, accents, athletic ability"
                    className="min-h-[100px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Training / Certifications</Label>
                  <Textarea
                    {...profForm.register('training')}
                    className="min-h-[100px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Years of Experience</Label>
                  <Input {...profForm.register('experience_years')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                </div>
                <div className="space-y-3">
                  <Label className="text-white">Social Media Handles</Label>
                  <Input
                    {...profForm.register('social_instagram')}
                    placeholder="Instagram"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  <Input
                    {...profForm.register('social_facebook')}
                    placeholder="Facebook"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  <Input
                    {...profForm.register('social_tiktok')}
                    placeholder="TikTok"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  <Input
                    {...profForm.register('social_x')}
                    placeholder="X (Twitter)"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  <Input
                    {...profForm.register('social_linkedin')}
                    placeholder="LinkedIn"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px] bg-funko-orange hover:bg-funko-orange/90 text-white">
                {saving ? 'Saving...' : 'Save Professional Details'}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Availability, Travel & Logistics */}
        <AccordionItem value="travel" className="border-2 border-funko-orange rounded-lg px-4 bg-black">
          <AccordionTrigger className="hover:no-underline min-h-[44px] text-white hover:text-funko-orange">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-funko-orange" />
              <span className="font-semibold">4. Availability, Travel & Logistics</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={travelForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-white">Preferred Airports <span className="text-red-500">*</span></Label>
                  <Input
                    {...travelForm.register('preferred_airports')}
                    placeholder="e.g., DFW, LAX"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  {travelForm.formState.errors.preferred_airports && (
                    <p className="text-red-500 text-sm mt-1">{String(travelForm.formState.errors.preferred_airports.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Preferred Airlines <span className="text-red-500">*</span></Label>
                  <Input
                    {...travelForm.register('preferred_airlines')}
                    placeholder="e.g., American, United"
                    className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  {travelForm.formState.errors.preferred_airlines && (
                    <p className="text-red-500 text-sm mt-1">{String(travelForm.formState.errors.preferred_airlines.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Typical Availability <span className="text-red-500">*</span></Label>
                  <Textarea
                    {...travelForm.register('availability_notes')}
                    placeholder="e.g., Weekdays, weekends, travel days"
                    className="min-h-[100px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                  {travelForm.formState.errors.availability_notes && (
                    <p className="text-red-500 text-sm mt-1">{String(travelForm.formState.errors.availability_notes.message)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Specific Travel Requirements</Label>
                  <Textarea
                    {...travelForm.register('travel_requirements')}
                    className="min-h-[100px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...travelForm.register('has_passport')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">Has Passport</Label>
                </div>
                {travelForm.watch('has_passport') && (
                  <div>
                    <Label className="text-white">Passport Number</Label>
                    <Input {...travelForm.register('passport_number')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...travelForm.register('has_visa')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">Has Visa</Label>
                </div>
                {travelForm.watch('has_visa') && (
                  <div>
                    <Label className="text-white">Visa Number</Label>
                    <Input {...travelForm.register('visa_number')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...travelForm.register('has_drivers_license')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">Has U.S. Driver's License</Label>
                </div>
                {travelForm.watch('has_drivers_license') && (
                  <div>
                    <Label className="text-white">State</Label>
                    <Input {...travelForm.register('drivers_license_state')} className="min-h-[44px] bg-gray-900 border-funko-orange/50 text-white" />
                  </div>
                )}
                <div>
                  <Label className="text-white">Food Allergies</Label>
                  <Textarea
                    {...travelForm.register('food_allergies')}
                    className="min-h-[100px] bg-gray-900 border-funko-orange/50 text-white"
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px] bg-funko-orange hover:bg-funko-orange/90 text-white">
                {saving ? 'Saving...' : 'Save Travel Info'}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Consent & Digital Agreement */}
        <AccordionItem value="consent" className="border-2 border-funko-orange rounded-lg px-4 bg-black">
          <AccordionTrigger className="hover:no-underline min-h-[44px] text-white hover:text-funko-orange">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-funko-orange" />
              <span className="font-semibold">5. Consent & Digital Agreement</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <form
              onSubmit={consentForm.handleSubmit((data) => saveSection(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...consentForm.register('representation_consent')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">
                    I consent to representation <span className="text-red-500">*</span>
                  </Label>
                </div>
                {consentForm.formState.errors.representation_consent && (
                  <p className="text-red-500 text-sm">{String(consentForm.formState.errors.representation_consent.message)}</p>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...consentForm.register('marketing_consent')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">
                    I consent to photos/videos used for marketing <span className="text-red-500">*</span>
                  </Label>
                </div>
                {consentForm.formState.errors.marketing_consent && (
                  <p className="text-red-500 text-sm">{String(consentForm.formState.errors.marketing_consent.message)}</p>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...consentForm.register('terms_accepted')}
                    className="min-h-[20px] min-w-[20px] rounded"
                  />
                  <Label className="text-white">
                    I accept the terms and privacy policy <span className="text-red-500">*</span>
                  </Label>
                </div>
                {consentForm.formState.errors.terms_accepted && (
                  <p className="text-red-500 text-sm">{String(consentForm.formState.errors.terms_accepted.message)}</p>
                )}
                <div>
                  <Label className="text-white">
                    E-Signature <span className="text-red-500">*</span>
                  </Label>
                  <div className="border-2 rounded-md p-4 bg-gray-900 border-funko-orange/50 min-h-[200px]">
                    <p className="text-sm text-gray-400 mb-2">
                      Sign here with your mouse or touch (signature pad integration pending):
                    </p>
                    <Input
                      {...consentForm.register('signature_data')}
                      placeholder="Type your full name as signature"
                      className="bg-gray-800 border-funko-orange/50 text-white"
                    />
                  </div>
                  {consentForm.formState.errors.signature_data && (
                    <p className="text-red-500 text-sm mt-1">{String(consentForm.formState.errors.signature_data.message)}</p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={saving} className="min-h-[44px] bg-funko-orange hover:bg-funko-orange/90 text-white">
                {saving ? 'Saving...' : 'Save Consent & Agreement'}
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t-2 border-funko-orange z-50 md:hidden">
        <Button
          onClick={async () => {
            // Collect all form data
            const allData = {
              ...basicForm.getValues(),
              ...repForm.getValues(),
              ...profForm.getValues(),
              ...travelForm.getValues(),
              ...consentForm.getValues(),
            };
            console.log('📱 Mobile save all clicked:', allData);
            await saveSection(allData);
          }}
          disabled={saving}
          className="w-full min-h-[44px] bg-funko-orange text-white hover:bg-funko-orange/90"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
