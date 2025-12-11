'use client'

/**
 * Publish Success Modal - Celebration after publishing a project.
 *
 * Features:
 * - Celebration animation (confetti effect)
 * - Public URL display with copy button
 * - Share options (copy link, view page)
 * - Quick actions (edit, back to dashboard)
 *
 * @see src/app/(contractor)/projects/[id]/edit/page.tsx - Integration point
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Home,
  Pencil,
  PartyPopper,
} from 'lucide-react'

const CONFETTI_PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  color:
    ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][
      Math.floor(Math.random() * 5)
    ] || '#22c55e',
  delay: Math.random() * 0.5,
  duration: 1 + Math.random() * 1.5,
}))

interface PublishSuccessModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** The public URL of the published project */
  publicUrl: string
  /** Project title for display */
  projectTitle: string
}

/**
 * Simple confetti animation component.
 * Creates falling particle effect on mount.
 */
function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {CONFETTI_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export function PublishSuccessModal({
  isOpen,
  onClose,
  publicUrl,
  projectTitle,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false)
  // Copy URL to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        } else {
          setCopied(false)
        }
      }}
    >
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti animation */}
        {isOpen && <Confetti />}

        <DialogHeader className="text-center">
          {/* Success icon */}
          <div className="mx-auto mb-4 relative">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <PartyPopper className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
          </div>

          <DialogTitle className="text-xl">
            Your Project is Live!
          </DialogTitle>
          <DialogDescription className="text-base">
            &ldquo;{projectTitle}&rdquo; has been published and is now visible to the world.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Public URL with copy */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Public URL</label>
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid gap-2">
            <Button asChild>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Published Project
              </a>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" onClick={onClose}>
                <Pencil className="h-4 w-4 mr-2" />
                Keep Editing
              </Button>
            </div>
          </div>
        </div>

        {/* Share hint */}
        <div className="text-center text-xs text-muted-foreground">
          Share this link with potential customers to showcase your work!
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PublishSuccessModal
