'use client'

/**
 * DynamicForm Component - Renders CMS-configured Forms
 *
 * Takes form configuration from Payload CMS and renders the appropriate
 * form fields dynamically. Handles validation and submission to the
 * form submissions API endpoint.
 *
 * @see PAY-055 in PRD for acceptance criteria
 * @see src/payload/collections/Forms.ts for field block definitions
 */

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types for form fields from CMS
interface TextField {
  blockType: 'textField'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  width?: 'full' | 'half'
}

interface EmailField {
  blockType: 'emailField'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  width?: 'full' | 'half'
}

interface TextareaField {
  blockType: 'textareaField'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  rows?: number
}

interface SelectField {
  blockType: 'selectField'
  name: string
  label: string
  required?: boolean
  options: Array<{ label: string; value: string }>
  width?: 'full' | 'half'
}

interface CheckboxField {
  blockType: 'checkboxField'
  name: string
  label: string
  required?: boolean
  defaultChecked?: boolean
}

interface HiddenField {
  blockType: 'hiddenField'
  name: string
  value?: string
}

type FormField =
  | TextField
  | EmailField
  | TextareaField
  | SelectField
  | CheckboxField
  | HiddenField

export interface FormConfig {
  id: string
  name: string
  slug: string
  fields: FormField[]
  submitButton?: string
  successMessage?: string
  redirectUrl?: string
}

interface DynamicFormProps {
  form: FormConfig
  className?: string
  /** Optional callback on successful submission */
  onSuccess?: (data: Record<string, unknown>) => void
  /** Optional callback on submission error */
  onError?: (error: Error) => void
}

/**
 * Build Zod schema dynamically from CMS field configuration
 */
function buildValidationSchema(fields: FormField[]) {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    if (field.blockType === 'hiddenField') {
      // Hidden fields don't need validation
      schemaFields[field.name] = z.string().optional()
      continue
    }

    let fieldSchema: z.ZodTypeAny

    switch (field.blockType) {
      case 'emailField':
        fieldSchema = z.string().email('Please enter a valid email address')
        break
      case 'checkboxField':
        fieldSchema = z.boolean()
        break
      default:
        fieldSchema = z.string()
    }

    // Apply required validation
    if ('required' in field && field.required) {
      if (field.blockType === 'checkboxField') {
        // For required checkboxes, must be true
        fieldSchema = z.literal(true).refine((val) => val === true, {
          message: 'This field is required',
        })
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(1, 'This field is required')
      }
    } else {
      fieldSchema = fieldSchema.optional()
    }

    schemaFields[field.name] = fieldSchema
  }

  return z.object(schemaFields)
}

/**
 * Get default values for form fields
 */
function getDefaultValues(fields: FormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}

  for (const field of fields) {
    switch (field.blockType) {
      case 'checkboxField':
        defaults[field.name] = field.defaultChecked ?? false
        break
      case 'hiddenField':
        // Replace {{pageUrl}} with actual URL
        defaults[field.name] =
          field.value?.replace('{{pageUrl}}', typeof window !== 'undefined' ? window.location.href : '') ?? ''
        break
      default:
        defaults[field.name] = ''
    }
  }

  return defaults
}

export function DynamicForm({ form, className, onSuccess, onError }: DynamicFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const schema = buildValidationSchema(form.fields)
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(form.fields) as FormData,
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          formSlug: form.slug,
          data,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Form submission failed')
      }

      setIsSuccess(true)
      onSuccess?.(data)

      // Handle redirect if configured
      if (form.redirectUrl) {
        window.location.href = form.redirectUrl
      }

      // Reset form after a delay
      setTimeout(() => {
        reset()
      }, 3000)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setErrorMessage(err.message)
      onError?.(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success state
  if (isSuccess && !form.redirectUrl) {
    return (
      <div
        className={cn(
          'rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950',
          className
        )}
        data-form-slug={form.slug}
      >
        <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-600 dark:text-green-400" />
        <p className="text-green-800 dark:text-green-200">
          {form.successMessage || 'Thank you for your submission!'}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
      data-form-slug={form.slug}
    >
      <div className="flex flex-wrap gap-4">
        {form.fields.map((field, index) => {
          // Hidden fields render as hidden inputs
          if (field.blockType === 'hiddenField') {
            return (
              <input
                key={`${field.name}-${index}`}
                type="hidden"
                {...register(field.name)}
              />
            )
          }

          const fieldWidth =
            'width' in field && field.width === 'half' ? 'w-full sm:w-[calc(50%-0.5rem)]' : 'w-full'

          return (
            <div key={`${field.name}-${index}`} className={cn(fieldWidth, 'space-y-2')}>
              {field.blockType === 'checkboxField' ? (
                // Checkbox layout
                <div className="flex items-center space-x-2">
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Checkbox
                        id={field.name}
                        checked={controllerField.value as boolean}
                        onCheckedChange={controllerField.onChange}
                      />
                    )}
                  />
                  <Label
                    htmlFor={field.name}
                    className={cn(
                      'cursor-pointer text-sm',
                      errors[field.name] && 'text-destructive'
                    )}
                  >
                    {field.label}
                    {field.required && <span className="ml-1 text-destructive">*</span>}
                  </Label>
                </div>
              ) : (
                // Other field layouts
                <>
                  <Label
                    htmlFor={field.name}
                    className={cn(errors[field.name] && 'text-destructive')}
                  >
                    {field.label}
                    {'required' in field && field.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </Label>

                  {field.blockType === 'textField' && (
                    <Input
                      id={field.name}
                      type="text"
                      placeholder={'placeholder' in field ? field.placeholder : undefined}
                      {...register(field.name)}
                      className={cn(errors[field.name] && 'border-destructive')}
                    />
                  )}

                  {field.blockType === 'emailField' && (
                    <Input
                      id={field.name}
                      type="email"
                      placeholder={'placeholder' in field ? field.placeholder : undefined}
                      {...register(field.name)}
                      className={cn(errors[field.name] && 'border-destructive')}
                    />
                  )}

                  {field.blockType === 'textareaField' && (
                    <Textarea
                      id={field.name}
                      placeholder={'placeholder' in field ? field.placeholder : undefined}
                      rows={'rows' in field ? field.rows : 4}
                      {...register(field.name)}
                      className={cn(errors[field.name] && 'border-destructive')}
                    />
                  )}

                  {field.blockType === 'selectField' && (
                    <Controller
                      name={field.name}
                      control={control}
                      render={({ field: controllerField }) => (
                        <Select
                          value={controllerField.value as string}
                          onValueChange={controllerField.onChange}
                        >
                          <SelectTrigger
                            className={cn(errors[field.name] && 'border-destructive')}
                          >
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </>
              )}

              {/* Error message */}
              {errors[field.name] && (
                <p className="text-sm text-destructive">
                  {errors[field.name]?.message as string}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Form-level error message */}
      {errorMessage && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          form.submitButton || 'Submit'
        )}
      </Button>
    </form>
  )
}

export default DynamicForm
