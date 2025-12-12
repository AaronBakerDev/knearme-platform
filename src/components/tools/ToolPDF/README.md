# ToolPDF Components

PDF export components for tool results. Provides email capture and PDF download workflow.

## Components

### PDFExportButton

Main button component that triggers the PDF export flow.

**Props:**
- `toolSlug` (string, required) - Tool identifier for API
- `toolName` (string, required) - Display name shown in dialog
- `inputs` (Record<string, unknown>, required) - Tool input data
- `results` (Record<string, unknown>, required) - Tool results data
- `variant` ('default' | 'outline' | 'secondary', default: 'default') - Button style
- `size` ('default' | 'sm' | 'lg', default: 'default') - Button size
- `className` (string, optional) - Additional CSS classes
- `requireEmail` (boolean, default: true) - Whether to capture email before download

**Example:**
```tsx
import { PDFExportButton } from '@/components/tools/ToolPDF'

function ToolResultsPage() {
  const inputs = { url: 'https://example.com', keyword: 'plumbing' }
  const results = { score: 85, recommendations: [...] }

  return (
    <PDFExportButton
      toolSlug="seo-analyzer"
      toolName="SEO Analysis Tool"
      inputs={inputs}
      results={results}
      variant="outline"
      size="lg"
    />
  )
}
```

**Skip email capture:**
```tsx
<PDFExportButton
  toolSlug="estimator"
  toolName="Cost Estimator"
  inputs={inputs}
  results={results}
  requireEmail={false}  // Direct download, no email gate
/>
```

### EmailCaptureDialog

Dialog for capturing email before PDF download. Used internally by PDFExportButton, but can be used standalone.

**Props:**
- `open` (boolean, required) - Dialog visibility
- `onOpenChange` ((open: boolean) => void, required) - Dialog state callback
- `onSubmit` ((email: string) => void, required) - Email submission callback
- `onSkip` (() => void, optional) - Skip email capture callback
- `toolName` (string, required) - Tool name displayed in dialog
- `isLoading` (boolean, default: false) - Loading state

**Standalone Example:**
```tsx
import { EmailCaptureDialog } from '@/components/tools/ToolPDF'

function CustomPDFFlow() {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleEmailSubmit = async (email: string) => {
    setIsGenerating(true)
    await generatePDF({ email })
    setIsGenerating(false)
    setIsOpen(false)
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Get PDF</button>

      <EmailCaptureDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleEmailSubmit}
        onSkip={() => generatePDF({ email: null })}  // Optional skip
        toolName="Custom Tool"
        isLoading={isGenerating}
      />
    </>
  )
}
```

## API Endpoint

Components call `POST /api/tools/export-pdf` with the following payload:

```typescript
{
  toolSlug: string      // Tool identifier
  toolName: string      // Display name
  inputs: object        // Tool input data
  results: object       // Tool results data
  email?: string        // Optional email (if captured)
}
```

**Expected Response:**
- Success: PDF blob with `Content-Type: application/pdf`
- Error: JSON with `{ message: string }` and appropriate status code

## Features

- Email validation with Zod
- Loading states during PDF generation
- Automatic filename generation: `{tool-slug}-YYYY-MM-DD.pdf`
- Optional email capture (can skip or disable entirely)
- Accessible form controls with ARIA attributes
- Error handling with user-friendly alerts
- Automatic cleanup of blob URLs

## Styling

Components use shadcn/ui primitives:
- `Button` from `@/components/ui/button`
- `Dialog` from `@/components/ui/dialog`
- `Input` from `@/components/ui/input`
- `Label` from `@/components/ui/label`

Customizable via `className` prop and Tailwind classes.

## Dependencies

- `react-hook-form` - Form state management
- `@hookform/resolvers/zod` - Zod validation resolver
- `zod` - Email validation schema
- `lucide-react` - Icons (FileDown, Loader2, Mail)

All dependencies are already installed in the project.
