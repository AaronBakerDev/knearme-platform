'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Password requirements checklist with real-time validation.
 * Shows checkmarks as each requirement is met.
 *
 * @example
 * <PasswordRequirements password={password} />
 *
 * @see src/app/(auth)/signup/page.tsx - Usage in signup form
 * @see src/app/(auth)/reset-password/confirm/page.tsx - Usage in password reset
 */
interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
];

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  return (
    <ul className={cn('space-y-1 text-sm', className)} role="list" aria-label="Password requirements">
      {requirements.map((req, index) => {
        const met = req.test(password);
        return (
          <li
            key={index}
            className={cn(
              'flex items-center gap-2 transition-colors duration-200',
              met ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{req.label}</span>
            <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Validates a password against all requirements.
 * Use this for form validation before submission.
 *
 * @param password - The password to validate
 * @returns true if all requirements are met
 */
export function validatePassword(password: string): boolean {
  return requirements.every((req) => req.test(password));
}
