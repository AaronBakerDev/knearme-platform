# Sprint 5: Form Validation UX & Progress Indicators

## Context

You are working on the **KnearMe Portfolio** project, a Next.js 14+ application for masonry contractors to showcase their work. The project uses:
- **Next.js 16** with App Router
- **Supabase** for auth and database
- **shadcn/ui** components (Radix UI + Tailwind CSS)
- **react-hook-form** + **zod** for form validation
- **Sonner** for toast notifications

## Current Sprint

Sprint 5 focuses on Polish & PWA features. We've completed PWA implementation, error handling, and network error handling. The next logical tasks are:

1. **Form Validation Errors** (Section 2.5)
2. **Progress Indicators** (Section 3.2)

## Your Tasks

### Task 1: Form Validation UX Improvements

Improve form validation UX across all forms in the application. The goal is consistent, accessible error handling.

#### Files to modify:

1. **`src/app/(auth)/login/page.tsx`** - Currently uses basic useState for errors
2. **`src/app/(auth)/signup/page.tsx`** - Similar to login
3. **`src/app/(auth)/reset-password/page.tsx`** - Password reset form
4. **`src/app/(contractor)/profile/edit/page.tsx`** - Already uses react-hook-form
5. **`src/app/(contractor)/profile/setup/page.tsx`** - Profile setup wizard
6. **`src/app/(contractor)/projects/new/page.tsx`** - New project form
7. **`src/app/(contractor)/projects/[id]/edit/page.tsx`** - Edit project form

#### Requirements:

**A. Consistent Inline Error Styling**
Create or update `src/components/ui/form-error.tsx`:
```tsx
// Reusable form error component with icon and animation
// Use destructive color from theme
// Include shake animation on error
// Screen reader friendly with role="alert"
```

**B. Focus First Error Field**
After form submission fails validation:
- Automatically focus the first field with an error
- Scroll field into view if needed
- For react-hook-form, use `setFocus()` from useForm

**C. Clear Errors on Input Change**
- Errors should clear when user starts typing in that field
- For react-hook-form this is default behavior with `mode: 'onChange'`
- For useState-based forms, clear error in onChange handler

**D. Show Success States**
- Add success toast after successful form submission
- Add visual feedback on fields that pass validation (optional green check)
- Show success state before redirect/navigation

#### Implementation Pattern for useState forms (login/signup):

```tsx
// Convert to react-hook-form OR add these improvements:

// 1. Clear error on change
const handleEmailChange = (e) => {
  setEmail(e.target.value);
  if (error) setError(null); // Clear error when user types
};

// 2. Focus first error
useEffect(() => {
  if (error && emailRef.current) {
    emailRef.current.focus();
  }
}, [error]);

// 3. Success feedback
if (success) {
  toast.success('Logged in successfully!');
}
```

#### Implementation Pattern for react-hook-form:

```tsx
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Validate on blur, clear on change
});

// Focus first error after submit
const onSubmit = async (data) => {
  try {
    await submitData(data);
    toast.success('Saved successfully!');
  } catch (err) {
    // setFocus is called automatically by react-hook-form on validation errors
    toast.error('Failed to save');
  }
};
```

---

### Task 2: Progress Indicators

Add visual progress feedback for async operations.

#### A. Image Upload Progress

**File:** `src/app/(contractor)/projects/[id]/edit/page.tsx` or wherever image upload happens

Create `src/components/ui/upload-progress.tsx`:
```tsx
interface UploadProgressProps {
  progress: number; // 0-100
  fileName: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

// Show:
// - File name being uploaded
// - Progress bar (use shadcn Progress component)
// - Status text (Uploading... / Processing... / Complete!)
// - Cancel button during upload
```

Integrate with existing upload logic using `XMLHttpRequest` or `fetch` with progress tracking.

#### B. AI Generation Progress

**File:** `src/app/(contractor)/projects/new/page.tsx` or AI generation components

Create `src/components/ui/ai-progress.tsx`:
```tsx
interface AIProgressProps {
  stage: 'analyzing' | 'generating' | 'reviewing' | 'complete';
  currentStep?: string;
}

// Show:
// - Multi-step progress indicator
// - Current stage with animated icon
// - Estimated time remaining (optional)
// - Stages: Analyzing images → Generating content → Reviewing quality
```

#### C. Page Transition Indicator

**File:** `src/app/(contractor)/layout.tsx`

Add a top-of-page progress bar for navigation:
```tsx
// Use Next.js router events or create a simple NProgress-style bar
// Options:
// 1. Use `next-nprogress-bar` package
// 2. Create custom using router events + CSS animation

// Implementation with next-nprogress-bar:
import { AppProgressBar } from 'next-nprogress-bar';

// In layout:
<AppProgressBar
  height="3px"
  color="hsl(var(--primary))"
  options={{ showSpinner: false }}
/>
```

#### D. Form Submission Spinner

Ensure all form submit buttons show loading state:
```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save Changes'
  )}
</Button>
```

Audit all forms and ensure this pattern is used consistently.

---

## Files to Create

1. `src/components/ui/form-error.tsx` - Reusable error display component
2. `src/components/ui/upload-progress.tsx` - File upload progress
3. `src/components/ui/ai-progress.tsx` - AI generation progress

## Files to Modify

1. `src/app/(auth)/login/page.tsx`
2. `src/app/(auth)/signup/page.tsx`
3. `src/app/(auth)/reset-password/page.tsx`
4. `src/app/(contractor)/profile/edit/page.tsx`
5. `src/app/(contractor)/profile/setup/page.tsx`
6. `src/app/(contractor)/projects/new/page.tsx`
7. `src/app/(contractor)/projects/[id]/edit/page.tsx`
8. `src/app/(contractor)/layout.tsx` - Add page transition indicator

## Definition of Done

- [ ] All forms clear errors when user types
- [ ] First error field is focused after failed submission
- [ ] Success toasts appear after successful submissions
- [ ] Image upload shows progress percentage
- [ ] AI generation shows current stage
- [ ] Page transitions show progress bar
- [ ] All submit buttons show loading spinner
- [ ] No TypeScript errors
- [ ] Build passes (`npm run build`)

## Testing

After implementation:
1. Test each form with invalid data - verify error UX
2. Test successful submissions - verify success feedback
3. Test image upload - verify progress shows
4. Navigate between pages - verify transition indicator
5. Test on mobile viewport

## Sprint File Update

After completing, update `todo/sprint-5-polish.md`:
- Mark Form Validation Errors tasks [x]
- Mark Progress Indicators tasks [x]
- Update completion percentage

---

## Important Notes

- Use existing shadcn/ui components where possible
- Follow existing code patterns in the codebase
- Keep accessibility in mind (ARIA labels, focus management)
- Test with keyboard navigation
- Don't add unnecessary dependencies - prefer built-in solutions
