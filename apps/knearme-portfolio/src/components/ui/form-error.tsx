'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormErrorProps = {
  message?: string | null;
  className?: string;
  id?: string;
};

/**
 * Reusable inline form error message with icon + shake animation.
 * - Uses destructive theme color
 * - Screen-reader friendly via role="alert"
 */
export function FormError({ message, className, id }: FormErrorProps) {
  if (!message) return null;

  const animationKey = typeof message === 'string' ? message : 'form-error';

  return (
    <div
      key={animationKey}
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive shadow-[0_1px_2px_rgba(0,0,0,0.08)] animate-[form-shake_0.3s_ease-in-out] motion-reduce:animate-none',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>

      <style jsx>{`
        :global {
          @keyframes form-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
        }
      `}</style>
    </div>
  );
}

export default FormError;
