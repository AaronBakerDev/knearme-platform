# PDF Export API

Generate printable estimate documents from tool calculations.

## Endpoint

```
POST /api/tools/export-pdf
```

## Request Body

```typescript
{
  toolSlug: string          // Unique tool identifier (e.g., 'chimney-repair-cost')
  toolName: string          // Display name (e.g., 'Chimney Repair Cost Estimator')
  email?: string            // Optional - captures lead if provided
  inputs: Record<string, unknown>  // Tool input values
  results: {
    summary: string         // Main summary text
    low?: number           // Low estimate (USD)
    high?: number          // High estimate (USD)
    typical?: number       // Typical/average estimate (USD)
    assumptions?: string[] // List of assumptions
    [key: string]: unknown // Additional result fields
  }
}
```

## Response

```typescript
{
  success: true,
  printHtml: string  // HTML document ready for printing
}
```

## Usage Example

### Client-side JavaScript

```typescript
async function exportToPdf(data: ExportData) {
  try {
    const response = await fetch('/api/tools/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolSlug: 'chimney-repair-cost',
        toolName: 'Chimney Repair Cost Estimator',
        email: 'user@example.com',  // Optional - for lead capture
        inputs: {
          height: 25,
          material: 'brick',
          condition: 'moderate',
          location: 'Denver, CO',
        },
        results: {
          summary: 'Based on a 25-foot brick chimney in moderate condition...',
          low: 3500,
          typical: 5200,
          high: 7800,
          assumptions: [
            'Assumes standard masonry rates for Denver metro area',
            'Includes materials, labor, and basic scaffolding',
            'Does not include structural repairs or permits',
          ],
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const { printHtml } = await response.json();

    // Open HTML in new window and trigger print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } catch (error) {
    console.error('Export error:', error);
  }
}
```

### React Component Example

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ExportButton({ results, inputs, toolSlug, toolName }: Props) {
  const [email, setEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/tools/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolSlug,
          toolName,
          email: email || undefined,  // Only include if provided
          inputs,
          results,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error.message);
      }

      const { printHtml } = await response.json();

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="email"
        placeholder="Email (optional - for follow-up)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Generating...' : 'Export as PDF'}
      </Button>
    </div>
  );
}
```

## Features

### Lead Capture

If an email address is provided in the request:
- Stores email in `tool_leads` table
- Includes tool inputs and results for follow-up
- Tracks UTM parameters (if available)
- Does NOT block PDF generation if storage fails

### Security

- Uses Supabase admin client to bypass RLS for lead storage
- Escapes all user input in generated HTML (XSS protection)
- Validates request schema with Zod
- No public access to `tool_leads` table (service role only)

### Generated PDF

The HTML document includes:
- Print-optimized styling
- Cost range display (if available)
- Project details table
- Assumptions list
- Professional disclaimer
- Print button with keyboard focus
- Responsive layout for all paper sizes

### Browser Compatibility

The generated HTML works in all modern browsers:
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅ (via browser print)

Users can:
1. Print directly to printer
2. Save as PDF via browser print dialog
3. Share the printed window URL

## Error Handling

### Common Errors

**400 - Validation Error**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid export data",
    "details": {
      "errors": {
        "email": ["Invalid email"]
      }
    }
  }
}
```

**400 - Parse Error**
```json
{
  "error": {
    "code": "PARSE_ERROR",
    "message": "Invalid JSON in request body"
  }
}
```

**500 - Internal Error**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again.",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Database Schema

The `tool_leads` table stores captured leads:

```sql
CREATE TABLE tool_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  inputs JSONB,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- UTM tracking
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);
```

See `/supabase/migrations/009_add_tool_leads.sql` for full schema.

## Testing

### Manual Test with cURL

```bash
curl -X POST http://localhost:3000/api/tools/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "toolSlug": "chimney-repair-cost",
    "toolName": "Chimney Repair Cost Estimator",
    "email": "test@example.com",
    "inputs": {
      "height": 25,
      "material": "brick",
      "condition": "moderate"
    },
    "results": {
      "summary": "Test estimate for a 25-foot brick chimney.",
      "low": 3500,
      "typical": 5200,
      "high": 7800,
      "assumptions": [
        "Test assumption 1",
        "Test assumption 2"
      ]
    }
  }'
```

### Check Lead Storage

Query the database to verify lead was captured:

```sql
SELECT * FROM tool_leads ORDER BY created_at DESC LIMIT 5;
```

## Future Enhancements

Potential improvements for future versions:

1. **Advanced PDF Generation**
   - Use Puppeteer or @react-pdf/renderer for server-side rendering
   - Generate actual PDF files instead of printable HTML
   - Add contractor branding/logo support

2. **Email Delivery**
   - Send PDF via email automatically
   - Email follow-up sequences for leads

3. **Analytics**
   - Track export conversion rates
   - A/B test email capture placement
   - Monitor which tools generate most leads

4. **Enhanced Lead Capture**
   - Optional phone number field
   - Project timeline questions
   - Budget confirmation

5. **Template Customization**
   - Multiple PDF templates
   - Contractor-specific branding
   - Custom disclaimers per tool
