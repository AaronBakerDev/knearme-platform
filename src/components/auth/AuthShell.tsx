"use client";

import type { ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: ReactNode;
  className?: string;
}

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-background',
        className
      )}
    >
      {children}
    </div>
  );
}

interface AuthCardContainerProps {
  children: ReactNode;
  className?: string;
}

export function AuthCardContainer({ children, className }: AuthCardContainerProps) {
  return <div className={cn('w-full max-w-md', className)}>{children}</div>;
}

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <Card className={cn('border-none shadow-xl bg-card/50 backdrop-blur-sm', className)}>
      {children}
    </Card>
  );
}

interface AuthCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function AuthCardHeader({ children, className }: AuthCardHeaderProps) {
  return (
    <CardHeader className={cn('space-y-1 text-center pb-8 pt-10', className)}>
      {children}
    </CardHeader>
  );
}
