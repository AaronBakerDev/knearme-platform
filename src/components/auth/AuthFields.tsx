"use client";

import type { ReactNode, Ref } from 'react';
import { Mail, Lock, type LucideIcon } from 'lucide-react';
import { Input, Label, PasswordInput } from '@/components/ui';

interface BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

interface AuthTextFieldProps extends BaseFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: LucideIcon;
  labelAction?: ReactNode;
}

function AuthTextField({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  icon: Icon,
  value,
  onChange,
  disabled,
  inputRef,
  labelAction,
}: AuthTextFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        )}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className="pl-9 h-10 transition-all focus-visible:ring-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          autoComplete={autoComplete}
          ref={inputRef}
        />
      </div>
    </div>
  );
}

interface AuthPasswordFieldProps extends BaseFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  labelAction?: ReactNode;
}

export function AuthEmailField(props: BaseFieldProps) {
  return (
    <AuthTextField
      id="email"
      label="Email"
      type="email"
      placeholder="name@example.com"
      autoComplete="email"
      icon={Mail}
      {...props}
    />
  );
}

export function AuthPasswordField({
  id,
  label,
  placeholder = '••••••••',
  autoComplete,
  labelAction,
  value,
  onChange,
  disabled,
  inputRef,
}: AuthPasswordFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <div className="relative group">
        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
        <PasswordInput
          id={id}
          placeholder={placeholder}
          className="pl-9 h-10 transition-all focus-visible:ring-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          autoComplete={autoComplete}
          ref={inputRef}
        />
      </div>
    </div>
  );
}
