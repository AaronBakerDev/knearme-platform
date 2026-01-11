import { describe, it, expect } from 'vitest';
import {
  calculateProjectFormCompleteness,
  conversationToProfileForm,
  conversationToProjectForm,
  hasMinimumProjectData,
  mapDiscoveredProfileFields,
  mapExtractedProfileFields,
  mapExtractedProjectFields,
  mapProfileFormToExtracted,
  mapProjectFormToExtracted,
  mapProjectFormToState,
  mapProjectStateToForm,
  parseLocationFromAddress,
  profileFormToConversation,
  projectFormToConversation,
  type ProjectWizardFormData,
} from '../state-transfer';
import type { SharedProjectState } from '@/lib/agents/types';

describe('state-transfer mapping helpers', () => {
  it('maps discovered profile fields and parses city/state', () => {
    const result = mapDiscoveredProfileFields({
      business_name: 'Acme Masonry',
      address: '123 Main St, Denver, CO 80202',
      phone: '',
      website: 'https://example.com',
      google_place_id: 'place-123',
      google_cid: 'cid-456',
    });

    expect(result).toMatchObject({
      businessName: 'Acme Masonry',
      website: 'https://example.com',
      googlePlaceId: 'place-123',
      googleCid: 'cid-456',
      city: 'Denver',
      state: 'CO',
    });
    expect(result.phone).toBeUndefined();
  });

  it('maps extracted profile fields with string coercion', () => {
    const result = mapExtractedProfileFields({
      business_name: 12345,
      city: 'Boulder',
      state: 'CO',
      description: 'Brick repair and restoration.',
      services: ['tuckpointing'],
      service_areas: ['Boulder', 'Longmont'],
    });

    expect(result).toEqual({
      businessName: '12345',
      city: 'Boulder',
      state: 'CO',
      description: 'Brick repair and restoration.',
      services: ['tuckpointing'],
      serviceAreas: ['Boulder', 'Longmont'],
    });
  });

  it('prefers extracted profile data over discovered data', () => {
    const result = conversationToProfileForm(
      { business_name: 'Override Co', city: 'Boulder' },
      {
        business_name: 'Original Co',
        address: '123 Main St, Denver, CO 80202',
      }
    );

    expect(result.businessName).toBe('Override Co');
    expect(result.city).toBe('Boulder');
    expect(result.state).toBe('CO');
  });

  it('maps extracted project fields to the project form', () => {
    const result = mapExtractedProjectFields({
      project_type: 'chimney-repair',
      customer_problem: 'Leak',
      solution_approach: 'Repaired',
      materials_mentioned: ['brick'],
      techniques_mentioned: ['tuckpoint'],
      duration: '2 days',
      location: 'Denver, CO',
      city: 'Denver',
      state: 'CO',
      challenges: 'Weather delays',
      proud_of: 'Craftsmanship',
    });

    expect(result).toEqual({
      projectType: 'chimney-repair',
      customerProblem: 'Leak',
      solutionApproach: 'Repaired',
      materials: ['brick'],
      techniques: ['tuckpoint'],
      duration: '2 days',
      location: 'Denver, CO',
      city: 'Denver',
      state: 'CO',
      challenges: 'Weather delays',
      proudOf: 'Craftsmanship',
    });
  });

  it('maps project state to form fields including images', () => {
    const state: Partial<SharedProjectState> = {
      title: 'Before and After',
      description: 'Rebuilt the chimney crown.',
      seoTitle: 'Denver Chimney Repair',
      seoDescription: 'Chimney repair in Denver, CO.',
      tags: ['chimney', 'repair'],
      images: [
        {
          id: 'img-1',
          url: 'https://example.com/img-1.jpg',
          filename: 'img-1.jpg',
          imageType: 'after',
          altText: 'Repaired chimney crown',
          displayOrder: 2,
        },
      ],
    };

    const result = mapProjectStateToForm(state);

    expect(result).toMatchObject({
      title: 'Before and After',
      description: 'Rebuilt the chimney crown.',
      seoTitle: 'Denver Chimney Repair',
      seoDescription: 'Chimney repair in Denver, CO.',
      tags: ['chimney', 'repair'],
    });
    expect(result.images).toEqual([
      {
        id: 'img-1',
        url: 'https://example.com/img-1.jpg',
        filename: 'img-1.jpg',
        imageType: 'after',
        altText: 'Repaired chimney crown',
        displayOrder: 2,
      },
    ]);
  });

  it('combines extracted data and state when building project form', () => {
    const result = conversationToProjectForm(
      {
        project_type: 'chimney-repair',
        customer_problem: 'Leak',
        solution_approach: 'Repaired',
      },
      {
        title: 'Before and After',
        description: 'Rebuilt the chimney crown.',
      }
    );

    expect(result).toMatchObject({
      projectType: 'chimney-repair',
      customerProblem: 'Leak',
      solutionApproach: 'Repaired',
      title: 'Before and After',
      description: 'Rebuilt the chimney crown.',
    });
  });

  it('maps project form data back to extracted and state payloads', () => {
    const formData: ProjectWizardFormData = {
      projectType: 'chimney-repair',
      customerProblem: 'Leak',
      solutionApproach: 'Repaired',
      materials: ['brick'],
      techniques: ['tuckpoint'],
      duration: '2 days',
      location: 'Denver, CO',
      city: 'Denver',
      state: 'CO',
      challenges: 'Weather delays',
      proudOf: 'Craftsmanship',
      title: 'Before and After',
      description: 'Rebuilt the chimney crown.',
      seoTitle: 'Denver Chimney Repair',
      seoDescription: 'Chimney repair in Denver, CO.',
      tags: ['chimney', 'repair'],
      images: [
        {
          id: 'img-1',
          url: 'https://example.com/img-1.jpg',
          filename: 'img-1.jpg',
          imageType: 'after',
          altText: 'Repaired chimney crown',
          displayOrder: 2,
        },
      ],
    };

    const extracted = mapProjectFormToExtracted(formData);
    const state = mapProjectFormToState(formData);

    expect(extracted).toMatchObject({
      project_type: 'chimney-repair',
      customer_problem: 'Leak',
      solution_approach: 'Repaired',
      materials_mentioned: ['brick'],
      techniques_mentioned: ['tuckpoint'],
      duration: '2 days',
      location: 'Denver, CO',
      city: 'Denver',
      state: 'CO',
      challenges: 'Weather delays',
      proud_of: 'Craftsmanship',
    });
    expect(state).toMatchObject({
      title: 'Before and After',
      description: 'Rebuilt the chimney crown.',
      seoTitle: 'Denver Chimney Repair',
      seoDescription: 'Chimney repair in Denver, CO.',
      tags: ['chimney', 'repair'],
    });
    expect(state.images).toEqual([
      {
        id: 'img-1',
        url: 'https://example.com/img-1.jpg',
        filename: 'img-1.jpg',
        imageType: 'after',
        altText: 'Repaired chimney crown',
        displayOrder: 2,
      },
    ]);
  });

  it('round-trips project form to conversation shape', () => {
    const formData = {
      projectType: 'chimney-repair',
      customerProblem: 'Leak',
      solutionApproach: 'Repaired',
      title: 'Before and After',
    };

    const result = projectFormToConversation(formData);

    expect(result.extracted).toMatchObject({
      project_type: 'chimney-repair',
      customer_problem: 'Leak',
      solution_approach: 'Repaired',
    });
    expect(result.state).toMatchObject({
      title: 'Before and After',
    });
  });

  it('maps profile form data back to conversation payload', () => {
    const extracted = profileFormToConversation({
      businessName: 'Acme Masonry',
      city: 'Denver',
      state: 'CO',
      description: 'Brick repair.',
      services: ['tuckpointing'],
      serviceAreas: ['Denver'],
      phone: '555-1234',
      website: 'https://example.com',
      email: 'info@example.com',
      googlePlaceId: 'place-123',
      googleCid: 'cid-456',
    });

    expect(extracted).toMatchObject({
      business_name: 'Acme Masonry',
      city: 'Denver',
      state: 'CO',
      description: 'Brick repair.',
      services: ['tuckpointing'],
      service_areas: ['Denver'],
      phone: '555-1234',
      website: 'https://example.com',
    });
    expect(extracted).not.toHaveProperty('email');
    expect(extracted).not.toHaveProperty('googlePlaceId');
    expect(extracted).not.toHaveProperty('googleCid');
  });
});

describe('state-transfer utilities', () => {
  it('parses city and state from full address', () => {
    const result = parseLocationFromAddress('123 Main St, Denver, CO 80202');
    expect(result).toEqual({ city: 'Denver', state: 'CO' });
  });

  it('parses city and state from short address', () => {
    const result = parseLocationFromAddress('Boulder, CO');
    expect(result).toEqual({ city: 'Boulder', state: 'CO' });
  });

  it('returns null when address format is unknown', () => {
    const result = parseLocationFromAddress('No city state here');
    expect(result).toBeNull();
  });

  it('weights required fields as full points and optional as half', () => {
    const completeness = calculateProjectFormCompleteness({
      projectType: 'chimney-repair',
      city: 'Denver',
      customerProblem: 'Leak',
      solutionApproach: 'Repaired',
    });

    expect(completeness).toBe(53);
  });

  it('counts optional string fields toward completeness', () => {
    const completeness = calculateProjectFormCompleteness({
      projectType: 'chimney-repair',
      city: 'Denver',
      customerProblem: 'Leak',
      solutionApproach: 'Repaired',
      description: 'Rebuilt the crown.',
    });

    expect(completeness).toBe(60);
  });

  it('requires minimum project data for readiness', () => {
    expect(hasMinimumProjectData({})).toBe(false);
    expect(hasMinimumProjectData({ projectType: 'chimney-repair' })).toBe(false);
    expect(
      hasMinimumProjectData({
        projectType: 'chimney-repair',
        customerProblem: 'Leak',
      })
    ).toBe(true);
  });

  it('maps profile form data through helper', () => {
    const extracted = mapProfileFormToExtracted({
      businessName: 'Acme Masonry',
      city: 'Denver',
      state: 'CO',
      description: 'Brick repair.',
      services: ['tuckpointing'],
      serviceAreas: ['Denver'],
      phone: '555-1234',
      website: 'https://example.com',
    });

    expect(extracted).toMatchObject({
      business_name: 'Acme Masonry',
      city: 'Denver',
      state: 'CO',
      description: 'Brick repair.',
      services: ['tuckpointing'],
      service_areas: ['Denver'],
      phone: '555-1234',
      website: 'https://example.com',
    });
  });
});
