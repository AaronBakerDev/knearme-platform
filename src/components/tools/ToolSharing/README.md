# Tool Sharing Components

URL state management and shareable link functionality for calculator tools.

## Components

### `useUrlState`

A React hook that syncs tool form state with URL query parameters, enabling shareable calculator links.

**Features:**
- Initializes state from URL parameters if present
- Type-aware parsing (number, boolean, string) based on default values
- Debounced URL updates (default: 300ms)
- Only includes non-default values in URL (shorter URLs)
- Generates full shareable URLs with all current state

**Example:**

```tsx
'use client'

import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'

interface BrickCalculatorState {
  length: number
  width: number
  height: number
  includeWaste: boolean
}

export function BrickCalculator() {
  const { state, setState, getShareableUrl, hasUrlParams } = useUrlState<BrickCalculatorState>({
    length: 10,
    width: 5,
    height: 8,
    includeWaste: true
  }, { debounceMs: 500 })

  return (
    <div>
      {/* Show banner if initialized from shared link */}
      {hasUrlParams && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            Calculator loaded with shared values
          </p>
        </div>
      )}

      {/* Form inputs */}
      <input
        type="number"
        value={state.length}
        onChange={(e) => setState({ length: Number(e.target.value) })}
      />

      {/* Share button */}
      <ShareableLinkButton
        getUrl={getShareableUrl}
        variant="outline"
        label="Share Calculator"
      />
    </div>
  )
}
```

### `ShareableLinkButton`

A button component that copies the shareable URL to clipboard.

**Features:**
- Copies URL to clipboard on click
- Shows success toast notification
- Icon changes to checkmark for 2 seconds after copy
- Accessible button with ARIA labels
- Customizable variant, size, and label

**Props:**

```typescript
interface ShareableLinkButtonProps {
  getUrl: () => string
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  label?: string  // Default: "Share Link"
}
```

**Example:**

```tsx
import { ShareableLinkButton } from '@/components/tools/ToolSharing'

<ShareableLinkButton
  getUrl={getShareableUrl}
  variant="outline"
  size="sm"
  label="Copy Calculator Link"
  className="ml-auto"
/>
```

## URL Structure

The hook creates clean, shareable URLs by:
1. Only including values that differ from defaults
2. Using standard query parameters
3. Supporting all primitive types (string, number, boolean)

**Example URL:**
```
https://knearme.com/tools/brick-calculator?length=12&height=10&includeWaste=false
```

If all values are defaults, URL has no query string:
```
https://knearme.com/tools/brick-calculator
```

## Type Safety

The hook is fully typed and infers state types from the default state:

```typescript
const { state, setState } = useUrlState({
  count: 0,      // inferred as number
  name: '',      // inferred as string
  enabled: true  // inferred as boolean
})

// TypeScript enforces types
setState({ count: 5 })        // ✅
setState({ count: 'five' })   // ❌ Type error
setState({ unknown: 123 })    // ❌ Type error
```

## Integration with Forms

Works seamlessly with `react-hook-form`:

```tsx
import { useForm } from 'react-hook-form'
import { useUrlState } from '@/components/tools/ToolSharing'

const { state, setState, getShareableUrl } = useUrlState({
  length: 0,
  width: 0
})

const form = useForm({
  defaultValues: state
})

// Sync form changes to URL
const handleSubmit = (data: FormData) => {
  setState(data)
  // ... calculate results
}
```

## Dependencies

- **Next.js 14+**: Uses App Router navigation hooks
- **sonner**: Toast notifications
- **lucide-react**: Icons (Link2, Check)
- **@/components/ui/button**: shadcn/ui button component
- **@/lib/utils**: `cn` utility for className merging

## Notes

- URL updates are debounced to avoid excessive history entries
- Uses `router.replace()` instead of `push()` to avoid polluting browser history
- All URL updates preserve scroll position (`scroll: false`)
- Shareable URLs always include full origin for easy sharing
