/**
 * PDF Export API - Generate printable estimate documents.
 *
 * POST /api/tools/export-pdf - Generate PDF estimate and optionally capture lead
 *
 * This endpoint:
 * 1. Validates the tool results and inputs
 * 2. Optionally stores email as a lead in tool_leads table (if email provided)
 * 3. Returns printable HTML that client can use with window.print()
 *
 * @see /supabase/migrations/009_add_tool_leads.sql for tool_leads schema
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';

/**
 * Validation schema for PDF export request.
 */
const exportPdfSchema = z.object({
  /** Unique tool identifier (e.g., 'chimney-repair-cost') */
  toolSlug: z.string().min(1).max(100),

  /** Human-readable tool name for display */
  toolName: z.string().min(1).max(200),

  /** Optional email for lead capture */
  email: z.string().email().optional(),

  /** Tool input values at time of export */
  inputs: z.record(z.string(), z.unknown()),

  /** Calculated results to display in PDF */
  results: z.object({
    summary: z.string(),
    low: z.number().optional(),
    high: z.number().optional(),
    typical: z.number().optional(),
    assumptions: z.array(z.string()).optional(),
  }).passthrough(), // Allow additional fields
});

type ExportPdfRequest = z.infer<typeof exportPdfSchema>;

/**
 * POST /api/tools/export-pdf
 *
 * Generates a printable estimate document and optionally captures lead.
 *
 * Returns HTML string that can be opened in new window and printed.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('PARSE_ERROR', 'Invalid JSON in request body');
    }

    const parsed = exportPdfSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid export data', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    // If email provided, store as lead (using admin client to bypass RLS)
    if (data.email) {
      await captureToolLead(data);
    }

    // Generate printable HTML
    const printHtml = generatePrintableHtml(data);

    return apiSuccess({
      success: true,
      printHtml,
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/tools/export-pdf',
      method: 'POST',
    });
  }
}

/**
 * Store lead information in tool_leads table.
 * Uses admin client to bypass RLS (no public access to this table).
 */
async function captureToolLead(data: ExportPdfRequest): Promise<void> {
  if (!data.email) return;

  const supabase = createAdminClient();

  // Extract UTM parameters from referrer if available
  const sourceUrl = typeof window !== 'undefined' ? window.location.href : undefined;

  // Supabase generated types may not include tool_leads in this repo yet.
  // Cast to any to avoid blocking builds; RLS still protects the table.
  const { error } = await (supabase as any)
    .from('tool_leads')
    .insert({
      email: data.email,
      tool_slug: data.toolSlug,
      inputs: data.inputs as Record<string, unknown>,
      results: data.results as Record<string, unknown>,
      source_url: sourceUrl,
      // UTM tracking would be passed from client if available
    });

  if (error) {
    // Log error but don't fail the request
    console.error('[captureToolLead] Failed to store lead:', error);
  }
}

/**
 * Generate printable HTML estimate document.
 * This HTML is styled for printing and can be opened in a new window.
 */
function generatePrintableHtml(data: ExportPdfRequest): string {
  const { toolName, results, inputs } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Build cost range section
  let costRangeHtml = '';
  if (results.low !== undefined || results.high !== undefined || results.typical !== undefined) {
    costRangeHtml = `
      <div style="margin: 2rem 0; padding: 1.5rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 1.25rem;">Estimated Cost Range</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
          ${results.low !== undefined ? `
            <div>
              <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 0.25rem;">Low Estimate</div>
              <div style="font-size: 1.5rem; font-weight: 600; color: #0f172a;">${formatCurrency(results.low)}</div>
            </div>
          ` : ''}
          ${results.typical !== undefined ? `
            <div>
              <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 0.25rem;">Typical Cost</div>
              <div style="font-size: 1.5rem; font-weight: 600; color: #2563eb;">${formatCurrency(results.typical)}</div>
            </div>
          ` : ''}
          ${results.high !== undefined ? `
            <div>
              <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 0.25rem;">High Estimate</div>
              <div style="font-size: 1.5rem; font-weight: 600; color: #0f172a;">${formatCurrency(results.high)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Build assumptions section
  let assumptionsHtml = '';
  if (results.assumptions && results.assumptions.length > 0) {
    assumptionsHtml = `
      <div style="margin: 2rem 0;">
        <h2 style="color: #1e293b; font-size: 1.25rem; margin-bottom: 1rem;">Assumptions & Notes</h2>
        <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8; color: #475569;">
          ${results.assumptions.map(assumption => `<li>${escapeHtml(assumption)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Build inputs section
  let inputsHtml = '';
  if (Object.keys(inputs).length > 0) {
    inputsHtml = `
      <div style="margin: 2rem 0;">
        <h2 style="color: #1e293b; font-size: 1.25rem; margin-bottom: 1rem;">Project Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${Object.entries(inputs)
              .map(([key, value]) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 0.75rem 0; color: #64748b; font-weight: 500; text-transform: capitalize;">
                    ${escapeHtml(formatInputKey(key))}
                  </td>
                  <td style="padding: 0.75rem 0; color: #0f172a; text-align: right;">
                    ${escapeHtml(formatInputValue(value))}
                  </td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(toolName)} - Estimate</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #0f172a;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
        }

        @media print {
          body {
            padding: 1rem;
          }

          .no-print {
            display: none !important;
          }

          @page {
            margin: 1cm;
          }
        }

        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .header h1 {
          font-size: 2rem;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .header .meta {
          color: #64748b;
          font-size: 0.875rem;
        }

        .summary {
          background: #f1f5f9;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 2rem 0;
        }

        .summary h2 {
          color: #1e293b;
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .summary p {
          color: #475569;
          line-height: 1.8;
        }

        .footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .print-button {
          position: fixed;
          top: 2rem;
          right: 2rem;
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
          transition: background 0.2s;
        }

        .print-button:hover {
          background: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>

      <div class="header">
        <h1>${escapeHtml(toolName)}</h1>
        <div class="meta">
          Generated on ${currentDate} • KnearMe Contractor Tools
        </div>
      </div>

      <div class="summary">
        <h2>Summary</h2>
        <p>${escapeHtml(results.summary)}</p>
      </div>

      ${costRangeHtml}
      ${assumptionsHtml}
      ${inputsHtml}

      <div class="footer">
        <p><strong>Disclaimer:</strong> This estimate is provided for informational purposes only and should not be considered a binding quote. Actual costs may vary based on site conditions, material availability, labor rates, and project complexity. For an accurate quote, please contact a licensed contractor for an on-site assessment.</p>
        <p style="margin-top: 1rem;">Generated by KnearMe Contractor Tools - Find trusted local contractors at knearme.com</p>
      </div>

      <script>
        // Auto-focus print button for accessibility
        document.addEventListener('DOMContentLoaded', () => {
          const button = document.querySelector('.print-button');
          if (button) button.focus();
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Escape HTML to prevent XSS in generated documents.
 */
function escapeHtml(text: string | number | boolean | null | undefined): string {
  if (text === null || text === undefined) return '';

  const str = String(text);
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}

/**
 * Format input keys for display (convert snake_case to Title Case).
 */
function formatInputKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format input values for display.
 */
function formatInputValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
