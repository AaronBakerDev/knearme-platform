# ADR-004: PWA as Mobile Strategy

> **Status:** Accepted
> **Date:** December 8, 2025
> **Deciders:** Technical Architect, Product Owner
> **Related:** ADR-001 (Next.js)

---

## Context

We need to provide a mobile experience for contractors who will primarily use KnearMe from their smartphones. The options are:

1. **Native mobile apps** (iOS + Android)
2. **React Native / cross-platform**
3. **Progressive Web App (PWA)**
4. **Mobile-responsive website only**

Key requirements:
- Camera access for photo capture
- Microphone access for voice recording
- Works on job sites (potentially poor connectivity)
- Fast time-to-market for MVP
- Low maintenance overhead

---

## Decision

**We will build a Progressive Web App (PWA) as our primary mobile strategy for MVP.**

Specifically:
- **next-pwa** plugin for service worker and manifest
- **Add to Home Screen** prompt for app-like installation
- **Offline indicator** (not full offline support initially)
- **Camera and microphone access** via Web APIs
- **Push notifications** (Should Have, if time permits)

Native apps will be considered for Phase 3 if PWA limitations become blockers.

---

## Consequences

### Positive

| Benefit | Details |
|---------|---------|
| **Single codebase** | No separate iOS/Android development |
| **Instant updates** | No app store review process |
| **Faster MVP** | 4-6 weeks vs 8-12 weeks for native |
| **Lower cost** | No native developers needed |
| **Web APIs sufficient** | Camera, microphone, geolocation all available |
| **Shareable URLs** | Projects can be shared via link |
| **SEO benefits** | All content indexable (unlike native apps) |
| **No app store fees** | No Apple/Google 15-30% cuts |

### Negative

| Trade-off | Mitigation |
|-----------|------------|
| **iOS limitations** | Safari PWA support improving; test thoroughly |
| **No app store presence** | Organic discovery via search; not relying on store |
| **Limited push on iOS** | iOS 16.4+ supports web push; older devices limited |
| **Less "native" feel** | Invest in smooth animations, haptic feedback |
| **Offline complexity** | Start with online-only; add offline incrementally |
| **Voice recording UX** | MediaRecorder API works but less polished than native |

### Neutral

- Users must "install" manually (no automatic install)
- Some contractors may expect a "real" app
- Need to educate users on Add to Home Screen

---

## Alternatives Considered

### 1. Native iOS + Android Apps

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Best UX, full device access, app store presence |
| **Cons** | 2x development cost, longer timeline, maintenance burden |
| **Why not** | Overkill for MVP; validate product-market fit first |

### 2. React Native

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Cross-platform, native performance, single codebase |
| **Cons** | Different skill set, separate deployment, still needs stores |
| **Why not** | Adds complexity without solving core problem |

### 3. Capacitor (Ionic)

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Wrap web app in native shell, access native APIs |
| **Cons** | Additional build step, hybrid compromises |
| **Why not** | PWA provides sufficient capabilities; Capacitor is fallback |

### 4. Mobile Web Only (No PWA)

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Simplest approach |
| **Cons** | No home screen icon, no push notifications, feels like website |
| **Why not** | PWA features provide meaningful UX improvement |

---

## Implementation Details

### PWA Configuration (next-pwa)

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'project-images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
});

module.exports = withPWA({
  // Next.js config
});
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "KnearMe - Masonry Portfolio",
  "short_name": "KnearMe",
  "description": "Build your masonry portfolio in 30 seconds",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### Camera Access

```typescript
// components/PhotoCapture.tsx
export function PhotoCapture({ onCapture }: { onCapture: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async () => {
    // Opens native camera on mobile
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onCapture(files);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment" // Rear camera
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <button onClick={handleCapture}>
        📷 Take Photo
      </button>
    </>
  );
}
```

### Voice Recording

```typescript
// hooks/useVoiceRecorder.ts
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      // Fallback to text input
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, audioBlob, startRecording, stopRecording };
}
```

### Offline Indicator

```typescript
// components/OfflineIndicator.tsx
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2">
      You're offline. Some features may be unavailable.
    </div>
  );
}
```

---

## PWA Audit Checklist

Before launch, validate:

- [ ] Manifest loads correctly
- [ ] Service worker registers
- [ ] App installable (Lighthouse check)
- [ ] Works offline (shows indicator)
- [ ] Camera works on iOS Safari
- [ ] Camera works on Android Chrome
- [ ] Microphone permissions work
- [ ] Push notifications work (iOS 16.4+)
- [ ] Lighthouse PWA score >90

---

## Native App Triggers (Phase 3)

Consider native development if:

1. **PWA limitations block key features** (unlikely with current scope)
2. **User feedback indicates strong preference** for native
3. **App store presence becomes necessary** for marketing
4. **Push notification reliability** becomes critical
5. **Revenue justifies investment** (1000+ paying users)

---

## Validation

This decision will be validated by:

1. **Install rate** - >20% of returning users add to home screen
2. **Mobile usage** - >70% of sessions from mobile devices
3. **Feature parity** - Camera/voice work on 95%+ of test devices
4. **User feedback** - No major complaints about "not being a real app"

---

## References

- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [iOS PWA Support](https://firt.dev/ios-16.4/)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)

---

*This ADR is subject to revision if significant blockers are discovered during implementation.*
