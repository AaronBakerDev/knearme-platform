'use client';

/**
 * Profile Edit Page - Update contractor business information.
 *
 * Allows contractors to update:
 * - Business name and description
 * - Location (city, state)
 * - Services offered
 * - Service areas
 *
 * @see /docs/02-requirements/capabilities.md PROFILE capabilities
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REGIONS, MASONRY_SERVICES } from '@/lib/constants/services';
import type { Contractor } from '@/types/database';



const profileSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().length(2, 'Please select a state'),
  description: z.string().max(1000).optional(),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  service_areas: z.array(z.string()).max(30),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newServiceArea, setNewServiceArea] = useState('');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      business_name: '',
      city: '',
      state: '',
      description: '',
      services: [],
      service_areas: [],
    },
  });

  // Fetch current profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/contractors/me');
        const data = await res.json();

        if (res.ok && data.contractor) {
          const contractor = data.contractor as Contractor;
          form.reset({
            business_name: contractor.business_name || '',
            city: contractor.city || '',
            state: contractor.state || '',
            description: contractor.description || '',
            services: contractor.services || [],
            service_areas: contractor.service_areas || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [form]);

  // Handle form submission
  async function onSubmit(data: ProfileFormData) {
    setIsSaving(true);
    try {
      const res = await fetch('/api/contractors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Profile updated');
        router.push('/dashboard');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  // Handle adding service area
  function addServiceArea() {
    const trimmed = newServiceArea.trim();
    if (!trimmed) return;

    const current = form.getValues('service_areas');
    if (!current.includes(trimmed) && current.length < 30) {
      form.setValue('service_areas', [...current, trimmed]);
    }
    setNewServiceArea('');
  }

  // Handle removing service area
  function removeServiceArea(area: string) {
    const current = form.getValues('service_areas');
    form.setValue('service_areas', current.filter((a) => a !== area));
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your business information and service offerings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name */}
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Mike's Masonry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Denver" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state/province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <div key={region.group}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                {region.group}
                              </div>
                              {region.items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell potential customers about your experience and what makes your work stand out..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Describe your business and expertise.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Services */}
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services Offered</FormLabel>
                    <FormDescription>
                      Select all the services you provide
                    </FormDescription>
                    <div className="grid gap-2 sm:grid-cols-2 mt-2">
                      {MASONRY_SERVICES.map((service) => {
                        const isSelected = field.value.includes(service.id);
                        return (
                          <Button
                            key={service.id}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start"
                            onClick={() => {
                              if (isSelected) {
                                field.onChange(field.value.filter((s) => s !== service.id));
                              } else {
                                field.onChange([...field.value, service.id]);
                              }
                            }}
                          >
                            <span className="mr-2">{service.icon}</span>
                            {service.label}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Areas */}
              <FormField
                control={form.control}
                name="service_areas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Areas</FormLabel>
                    <FormDescription>
                      Add cities or neighborhoods you serve
                    </FormDescription>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add a city or area"
                        value={newServiceArea}
                        onChange={(e) => setNewServiceArea(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addServiceArea();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addServiceArea}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {field.value.map((area) => (
                          <Badge key={area} variant="secondary" className="gap-1">
                            {area}
                            <button
                              type="button"
                              onClick={() => removeServiceArea(area)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
