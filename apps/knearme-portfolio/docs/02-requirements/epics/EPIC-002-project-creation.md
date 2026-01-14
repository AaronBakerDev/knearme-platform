# EPIC-002: Photo Upload & Project Management

> **Version:** 1.0
> **Last Updated:** December 8, 2025
> **Status:** Ready for Development
> **Priority:** Must Have (MVP)

---

## Overview

Enable contractors to upload project photos, manage images, and create project drafts. This epic handles the image pipeline from capture/selection through storage and optimization, establishing the visual foundation for AI analysis (EPIC-003) and portfolio display (EPIC-004).

### Business Value

- **Core Content**: Photos are the primary value - contractors showcase their work visually
- **AI Foundation**: Quality images enable accurate AI analysis and content generation
- **SEO Assets**: Optimized images improve page performance and image search visibility
- **Mobile-First**: Camera integration critical for on-site project documentation

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Photos per project | 3-7 avg | Database analytics |
| Upload success rate | >98% | Error logging |
| Time to upload 5 photos | <30s | Performance monitoring |
| Image optimization rate | 100% | Processing pipeline |

---

## User Stories

### US-002-01: Camera Photo Capture

**As a** contractor on a job site
**I want to** take photos directly with my phone camera
**So that** I can document my work immediately

#### Acceptance Criteria

- Given I am on the "Add Project" screen
- When I tap "Take Photo"
- Then my device camera opens
- And I can capture a photo
- And it is added to my project upload queue

- Given I am using a desktop browser
- When I click "Take Photo"
- Then I see a prompt to allow camera access
- Or I see "Use your phone for best results" with QR code

- Given camera permission is denied
- When I tap "Take Photo"
- Then I see instructions to enable camera in settings

#### Technical Notes

- **API**: `navigator.mediaDevices.getUserMedia({ video: true })`
- **Fallback**: File input with `capture="environment"` for rear camera
- **Format**: JPEG preferred (smaller file size)
- **EXIF**: Preserve orientation, extract GPS if available

```html
<!-- Mobile camera capture -->
<input
  type="file"
  accept="image/*"
  capture="environment"
  onChange={handleCapture}
/>
```

---

### US-002-02: Gallery Photo Selection

**As a** contractor with existing project photos
**I want to** upload photos from my gallery
**So that** I can showcase work from previous jobs

#### Acceptance Criteria

- Given I am on the "Add Project" screen
- When I tap "Upload from Gallery"
- Then my device photo picker opens
- And I can select multiple photos (up to 10)
- And selected photos are added to upload queue

- Given I select more than 10 photos
- When I try to confirm selection
- Then I see "Maximum 10 photos per project"
- And excess photos are not added

- Given I select photos from different dates/locations
- When they are uploaded
- Then they are grouped into a single project

#### Technical Notes

- **API**: `<input type="file" multiple accept="image/*">`
- **Selection**: Allow multiple selection up to limit
- **Preview**: Show thumbnails before upload
- **Deduplication**: Check file hash to prevent duplicates

```typescript
const MAX_PHOTOS = 10;

const handleFileSelect = (files: FileList) => {
  const selected = Array.from(files).slice(0, MAX_PHOTOS);
  // Validate and preview
};
```

---

### US-002-03: Multi-Photo Upload

**As a** contractor with multiple project photos
**I want to** upload several photos at once
**So that** I can tell the full story of my project

#### Acceptance Criteria

- Given I have selected 1-10 photos
- When I tap "Upload"
- Then all photos upload in parallel (max 3 concurrent)
- And I see progress for each photo
- And I see overall progress percentage

- Given one photo fails to upload
- When the error occurs
- Then that photo shows an error state
- And other uploads continue
- And I can retry the failed upload

- Given all photos are uploaded successfully
- When complete
- Then I proceed to the AI interview flow
- And photos are associated with a draft project

#### Technical Notes

- **Endpoint**: `POST /api/upload/images`
- **Storage**: Supabase Storage `project-images` bucket
- **Chunking**: Large files chunked at 1MB
- **Concurrency**: 3 parallel uploads max
- **Progress**: Track via XMLHttpRequest or fetch with ReadableStream

```typescript
async function uploadWithProgress(file: File, onProgress: (pct: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => resolve(JSON.parse(xhr.response));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.open('POST', '/api/upload/images');
    xhr.send(formData);
  });
}
```

---

### US-002-04: Image Compression

**As a** contractor uploading photos
**I want to** have large photos automatically compressed
**So that** uploads are fast and storage is efficient

#### Acceptance Criteria

- Given I upload a photo larger than 2MB
- When it is processed
- Then it is compressed to under 2MB while maintaining quality
- And original aspect ratio is preserved

- Given I upload a photo smaller than 2MB
- When it is processed
- Then it is not further compressed
- And quality is preserved

- Given compression would significantly degrade quality
- When detected
- Then a larger file size is accepted (up to 4MB)
- And quality is prioritized

**Compression Targets:**
| Original Size | Target Size | Quality |
|--------------|-------------|---------|
| <2MB | No compression | 100% |
| 2-5MB | <2MB | 85% JPEG |
| 5-10MB | <2MB | 80% JPEG |
| >10MB | <3MB | 75% JPEG |

#### Technical Notes

- **Library**: `browser-image-compression` or Canvas API
- **Client-side**: Compress before upload to save bandwidth
- **Server-side**: Final optimization after upload
- **Max Dimension**: 4096px (longer edge)

```typescript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 2,
  maxWidthOrHeight: 4096,
  useWebWorker: true,
};

const compressedFile = await imageCompression(file, options);
```

---

### US-002-05: WebP Conversion

**As a** platform operator
**I want to** convert all images to WebP format
**So that** pages load faster and SEO scores improve

#### Acceptance Criteria

- Given a photo is uploaded in JPEG or PNG
- When it is processed on the server
- Then a WebP version is created
- And the original is preserved as fallback

- Given a browser doesn't support WebP
- When the image is requested
- Then the JPEG fallback is served

- Given the WebP conversion fails
- When the error occurs
- Then the original format is used
- And an alert is logged for review

#### Technical Notes

- **Conversion**: Sharp library on server
- **Storage**: Both formats stored
- **Serving**: Next.js Image component handles format negotiation
- **Quality**: WebP at 80% ≈ JPEG at 90%

```typescript
import sharp from 'sharp';

async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .webp({ quality: 80 })
    .toBuffer();
}
```

---

### US-002-06: Responsive Image Sizes

**As a** platform operator
**I want to** generate multiple image sizes
**So that** appropriate sizes are served for different devices

#### Acceptance Criteria

- Given a photo is uploaded
- When processing completes
- Then three size variants are created:
  - Thumbnail: 400x300 (<30KB)
  - Medium: 1200x900 (<150KB)
  - Full: 2400x1800 (<400KB)

- Given a photo is smaller than the target size
- When resized
- Then it is not upscaled (use original dimensions)

- Given a photo has non-standard aspect ratio
- When resized
- Then aspect ratio is preserved (fit within bounds)

#### Technical Notes

- **Processing**: Server-side with Sharp
- **Storage Paths**: `{project_id}/{size}/{filename}.webp`
- **Database**: Store all paths in `project_images` table
- **Serving**: Use `srcset` for responsive loading

```typescript
const SIZES = [
  { name: 'thumb', width: 400, height: 300 },
  { name: 'medium', width: 1200, height: 900 },
  { name: 'full', width: 2400, height: 1800 },
];

async function generateSizes(buffer: Buffer, projectId: string, filename: string) {
  const results = [];

  for (const size of SIZES) {
    const resized = await sharp(buffer)
      .resize(size.width, size.height, { fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();

    const path = `${projectId}/${size.name}/${filename}.webp`;
    await uploadToStorage(path, resized);
    results.push({ size: size.name, path });
  }

  return results;
}
```

---

### US-002-07: EXIF Location Extraction (Should Have)

**As a** contractor uploading photos
**I want to** have the project location auto-detected from photo metadata
**So that** I don't have to manually enter it

#### Acceptance Criteria

- Given I upload a photo with GPS EXIF data
- When the photo is processed
- Then the location is extracted
- And suggested as the project city

- Given multiple photos have different locations
- When analyzed
- Then the most common location is suggested
- Or I am asked to confirm

- Given photos have no GPS data
- When uploaded
- Then I am asked to enter location manually

#### Technical Notes

- **Library**: `exif-js` or `piexifjs`
- **Privacy**: GPS data stripped from stored images
- **Reverse Geocoding**: Use free API (Nominatim/BigDataCloud)

```typescript
import EXIF from 'exif-js';

function extractLocation(file: File): Promise<{lat: number, lng: number} | null> {
  return new Promise((resolve) => {
    EXIF.getData(file, function() {
      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      if (lat && lng) {
        resolve({ lat: convertDMSToDD(lat), lng: convertDMSToDD(lng) });
      } else {
        resolve(null);
      }
    });
  });
}
```

---

### US-002-08: Photo Reordering (Should Have)

**As a** contractor managing project photos
**I want to** reorder my uploaded photos
**So that** the best photos appear first

#### Acceptance Criteria

- Given I have uploaded multiple photos
- When I drag and drop a photo
- Then the order is updated immediately
- And the new order is saved

- Given I reorder photos on mobile
- When I tap and hold, then drag
- Then the drag-and-drop works smoothly

- Given I reorder photos
- When I view my published project
- Then photos appear in the custom order

#### Technical Notes

- **Library**: `@dnd-kit/core` or `react-beautiful-dnd`
- **Database**: `display_order` column in `project_images`
- **Update**: Batch update order on save

```typescript
const handleReorder = async (items: Image[]) => {
  const updates = items.map((item, index) => ({
    id: item.id,
    display_order: index
  }));

  await supabase
    .from('project_images')
    .upsert(updates);
};
```

---

### US-002-09: Photo Deletion

**As a** contractor managing project photos
**I want to** delete unwanted photos
**So that** only the best work is shown

#### Acceptance Criteria

- Given I am viewing my project photos
- When I tap the delete icon on a photo
- Then I see a confirmation dialog

- Given I confirm deletion
- When the action completes
- Then the photo is removed from the project
- And storage is freed

- Given I delete the last photo
- When confirmed
- Then I am warned "Projects need at least 1 photo"
- And deletion is prevented

#### Technical Notes

- **Storage**: Delete from Supabase Storage
- **Database**: Delete row from `project_images`
- **Cascade**: All size variants deleted
- **Soft Delete Option**: Consider archiving instead for recovery

```typescript
const deletePhoto = async (imageId: string, projectId: string) => {
  // Get image paths
  const { data: image } = await supabase
    .from('project_images')
    .select('storage_path')
    .eq('id', imageId)
    .single();

  // Delete from storage (all variants)
  for (const size of ['thumb', 'medium', 'full']) {
    await supabase.storage
      .from('project-images')
      .remove([`${projectId}/${size}/${image.storage_path}`]);
  }

  // Delete database record
  await supabase
    .from('project_images')
    .delete()
    .eq('id', imageId);
};
```

---

### US-002-10: Before/After Tagging (Should Have)

**As a** contractor with before and after photos
**I want to** tag photos as before, after, or process
**So that** viewers understand the project progression

#### Acceptance Criteria

- Given I have uploaded photos
- When I tap on a photo
- Then I can select a tag: Before / After / Process / None

- Given AI analysis suggests image types
- When I review
- Then tags are pre-filled based on AI suggestion
- And I can override them

- Given I have tagged before/after photos
- When displayed on the portfolio
- Then a before/after slider is shown

#### Technical Notes

- **Database**: `image_type` column (enum: before, after, process, null)
- **AI Assist**: Suggest based on image analysis (EPIC-003)
- **UI Component**: Before/after comparison slider

---

### US-002-11: Draft Project Creation

**As a** contractor uploading photos
**I want to** have a draft project created automatically
**So that** my work is saved even if I don't finish

#### Acceptance Criteria

- Given I start uploading photos
- When the first photo uploads successfully
- Then a draft project is created
- And the draft ID is stored in local state

- Given I leave the page before completing
- When I return later
- Then I see "Continue draft project?" prompt
- And I can resume where I left off

- Given I have old drafts (>7 days)
- When I view my dashboard
- Then I see a reminder to complete or delete them

#### Technical Notes

- **Database**: Project with `status = 'draft'`
- **Persistence**: Draft ID in localStorage
- **Cleanup**: Cron job deletes drafts >30 days old

```typescript
const createDraftProject = async (contractorId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      contractor_id: contractorId,
      status: 'draft',
      title: '', // Filled by AI later
      description: '',
      project_type: '',
      city: '', // May be extracted from EXIF
    })
    .select()
    .single();

  return data;
};
```

---

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Upload speed | <5s for 2MB image | On 4G connection |
| Compression time | <2s client-side | Web Worker |
| Server processing | <10s for all variants | Queue if needed |
| Storage format | WebP + JPEG fallback | Dual storage |
| Max file size (input) | 20MB | Before compression |
| Max file size (stored) | 4MB (full size) | After compression |

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| EPIC-001 | Internal | Requires authenticated user |
| EPIC-003 | Internal | Photos feed into AI analysis |
| Supabase Storage | External | Must be configured |
| Sharp library | External | Server-side processing |

---

## Out of Scope

- Video upload (Phase 3)
- Image cropping/editing in-app (Could Have)
- Watermarking (Phase 2)
- Batch upload from cloud storage (Phase 3)

---

## UI/UX Specifications

### Photo Upload Interface

```
┌─────────────────────────────────────┐
│  Add Your Project Photos             │
│  Upload 1-10 photos of your work     │
│                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │   📷    │ │   🖼️    │ │   +    │ │
│  │  Take   │ │ Gallery │ │  Add   │ │
│  │  Photo  │ │  Upload │ │  More  │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ [img1] [img2] [img3]            │ │
│  │  ✓ 100%  ✓ 100%  ⟳ 45%          │ │
│  │                                 │ │
│  │ [img4]                          │ │
│  │  ✓ 100%                         │ │
│  └─────────────────────────────────┘ │
│                                       │
│  4/10 photos uploaded                 │
│                                       │
│  [Continue to Interview →]            │
└─────────────────────────────────────┘
```

### Photo Management Grid

```
┌─────────────────────────────────────┐
│  Project Photos                       │
│  Drag to reorder • Tap to edit        │
│                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐    │
│  │        │ │        │ │        │    │
│  │ img 1  │ │ img 2  │ │ img 3  │    │
│  │        │ │        │ │        │    │
│  │ Before │ │ After  │ │Process │    │
│  │   ✕    │ │   ✕    │ │   ✕    │    │
│  └────────┘ └────────┘ └────────┘    │
│                                       │
│  ┌────────┐                           │
│  │   +    │                           │
│  │  Add   │                           │
│  │  More  │                           │
│  └────────┘                           │
└─────────────────────────────────────┘
```

---

## Test Scenarios

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| IMG-T01 | Upload 1 photo from camera | Photo captured and uploaded |
| IMG-T02 | Upload 10 photos from gallery | All 10 photos uploaded |
| IMG-T03 | Try to upload 12 photos | Only 10 accepted, warning shown |
| IMG-T04 | Upload 15MB photo | Compressed to <2MB, uploaded |
| IMG-T05 | Upload with slow connection | Progress shown, completes |
| IMG-T06 | Upload fails mid-way | Error shown, retry option |
| IMG-T07 | Reorder photos via drag | Order updated in DB |
| IMG-T08 | Delete a photo | Photo removed, storage freed |
| IMG-T09 | Delete last photo | Prevention message shown |
| IMG-T10 | Resume draft project | Previous photos shown |

---

## Storage Structure

```
project-images/
├── {project_id}/
│   ├── thumb/
│   │   ├── image1.webp
│   │   └── image2.webp
│   ├── medium/
│   │   ├── image1.webp
│   │   └── image2.webp
│   └── full/
│       ├── image1.webp
│       └── image2.webp
```

---

*This epic provides the visual foundation. EPIC-003 (AI Interview) consumes these images for analysis.*
