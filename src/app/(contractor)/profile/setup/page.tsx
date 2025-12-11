'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MASONRY_SERVICES, REGIONS } from '@/lib/constants/services';
import { generateCitySlug } from '@/lib/utils/slugify';
import { Building2, Wrench, MapPin, CheckCircle2, X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormError } from '@/components/ui/form-error';

type Step = 1 | 2 | 3;

interface ProfileData {
  businessName: string;
  city: string;
  state: string;
  description: string;
  services: string[];
  serviceAreas: string[];
}

/**
 * Profile setup wizard for new contractors.
 * Three-step flow: Business Info → Services → Service Areas
 *
 * @see EPIC-001-auth.md US-001-05, US-001-06, US-001-07
 */
export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newArea, setNewArea] = useState('');
  const businessRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLButtonElement>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    businessName: '',
    city: '',
    state: '',
    description: '',
    services: [],
    serviceAreas: [],
  });

  // Load existing data if user refreshes mid-setup
  useEffect(() => {
    const loadExistingProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      type ContractorRow = {
        business_name: string | null;
        city: string | null;
        state: string | null;
        description: string | null;
        services: string[] | null;
        service_areas: string[] | null;
      };
      const contractor = contractorData as ContractorRow | null;

      if (contractor) {
        setProfileData({
          businessName: contractor.business_name ?? '',
          city: contractor.city ?? '',
          state: contractor.state ?? '',
          description: contractor.description ?? '',
          services: contractor.services ?? [],
          serviceAreas: contractor.service_areas ?? [],
        });
      }
    };

    loadExistingProfile();
  }, [router]);

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setProfileData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
    if (error) setError(null);
  };

  const addServiceArea = () => {
    const area = newArea.trim();
    if (area && !profileData.serviceAreas.includes(area) && profileData.serviceAreas.length < 20) {
      setProfileData((prev) => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, area],
      }));
      setNewArea('');
    }
  };

  const removeServiceArea = (area: string) => {
    setProfileData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((a) => a !== area),
    }));
  };

  const validateStep = (currentStep: Step): boolean => {
    setError(null);

    if (currentStep === 1) {
      if (!profileData.businessName.trim()) {
        setError('Business name is required');
        businessRef.current?.focus();
        return false;
      }
      if (!profileData.city.trim()) {
        setError('City is required');
        cityRef.current?.focus();
        return false;
      }
      if (!profileData.state) {
        setError('State is required');
        stateRef.current?.focus();
        return false;
      }
    }

    if (currentStep === 2) {
      if (profileData.services.length === 0) {
        setError('Please select at least one service');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const citySlug = generateCitySlug(profileData.city, profileData.state);

      // Type assertion needed until Supabase project is connected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('contractors')
        .update({
          business_name: profileData.businessName,
          city: profileData.city,
          state: profileData.state,
          city_slug: citySlug,
          description: profileData.description || null,
          services: profileData.services,
          service_areas: profileData.serviceAreas,
        })
        .eq('auth_user_id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      toast.success('Profile setup complete!');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepInfo = [
    { label: 'Business', icon: Building2 },
    { label: 'Services', icon: Wrench },
    { label: 'Areas', icon: MapPin },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-background">
      <Card className="w-full max-w-lg border-0 shadow-lg">
        <CardHeader className="pb-4">
          {/* Progress indicator with labels */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {stepInfo.map((info, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === step;
                const isCompleted = stepNum < step;
                const Icon = info.icon;
                return (
                  <div key={stepNum} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${isCompleted
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
          </div>

          <CardTitle className="text-2xl">
            {step === 1 && 'Business Information'}
            {step === 2 && 'Services You Offer'}
            {step === 3 && 'Service Areas'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us about your masonry business'}
            {step === 2 && 'Select all the services you provide'}
            {step === 3 && 'List the cities and areas you serve'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <FormError message={error} />

          {/* Step 1: Business Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="ABC Masonry"
                  value={profileData.businessName}
                  onChange={(e) => {
                    updateField('businessName', e.target.value);
                    if (error) setError(null);
                  }}
                  ref={businessRef}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Denver"
                    value={profileData.city}
                    onChange={(e) => {
                      updateField('city', e.target.value);
                      if (error) setError(null);
                    }}
                    ref={cityRef}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Select
                    value={profileData.state}
                    onValueChange={(value) => {
                      updateField('state', value);
                      if (error) setError(null);
                    }}
                  >
                    <SelectTrigger id="state" ref={stateRef}>
                      <SelectValue placeholder="Select state/province" />
                    </SelectTrigger>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">About Your Business (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell potential customers about your experience, specialties, and what sets you apart..."
                  value={profileData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MASONRY_SERVICES.map((service) => {
                const isSelected = profileData.services.includes(service.id);
                return (
                  <div
                    key={service.id}
                    className={`relative flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-muted hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    onClick={() => toggleService(service.id)}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <span className="text-2xl">{service.icon}</span>
                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                      {service.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: Service Areas */}
          {step === 3 && (
            <>
              <div className="space-y-3">
                <Label htmlFor="newArea">Add Service Area</Label>
                <div className="flex gap-2">
                  <Input
                    id="newArea"
                    placeholder="e.g., Downtown Denver, Aurora, Lakewood"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addServiceArea();
                      }
                    }}
                    className="h-11"
                  />
                  <Button
                    type="button"
                    onClick={addServiceArea}
                    disabled={!newArea.trim()}
                    size="lg"
                    className="px-6"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter or click Add. You can add up to 20 areas.
                </p>
              </div>

              {profileData.serviceAreas.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Service Areas</Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {profileData.serviceAreas.length}/20
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl min-h-[80px]">
                    {profileData.serviceAreas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="cursor-pointer pl-3 pr-2 py-1.5 text-sm hover:bg-destructive/10 hover:text-destructive transition-colors group"
                        onClick={() => removeServiceArea(area)}
                      >
                        <MapPin className="w-3 h-3 mr-1.5 text-muted-foreground group-hover:text-destructive" />
                        {area}
                        <X className="w-3.5 h-3.5 ml-1.5 opacity-50 group-hover:opacity-100" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profileData.serviceAreas.length === 0 && (
                <div className="text-center py-8 bg-muted/30 rounded-xl">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No service areas added yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps customers find you in local searches.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-6 border-t">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} disabled={loading} size="lg">
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={handleNext} size="lg" className="px-8">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="px-8">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
