# UI Guidelines for ChatGPT Apps

> Source: https://developers.openai.com/apps-sdk/concepts/ui-guidelines

## Overview

Apps extend ChatGPT's capabilities through lightweight cards, carousels, fullscreen views, and other display modes that integrate seamlessly into the platform's interface. Before visual design, review the recommended UX principles.

## Design System

The Apps SDK UI design system provides:
- Styling foundations with Tailwind
- CSS variable design tokens
- Accessible, well-crafted components

A Figma component library is available to start designing before coding implementation.

## Display Modes

### Inline
Appears directly in conversation flow, featuring:
- **Icon & tool call**: App name and icon label
- **Inline display**: Lightweight content above model response
- **Follow-up**: Model-generated suggestions for next steps

#### Inline Cards
Lightweight, single-purpose widgets for quick confirmations, simple actions, or visual data presentation.

**Guidelines:**
- Include title for document-based or parent-element content
- Maximum two actions (one primary, one secondary)
- Auto-fit height to viewport
- Avoid nested scrolling, deep navigation, or duplicative inputs

#### Inline Carousel
Side-by-side card sets for presenting similar items.

**Guidelines:**
- 3–8 items maximum for scannability
- Always include images
- Limit metadata to three lines maximum
- Single optional CTA per item

### Fullscreen
Immersive experiences for multi-step workflows or detailed exploration. The ChatGPT composer remains overlaid for continued conversation.

**Use cases:** Complex maps, editing canvases, interactive diagrams, detailed browsing

**Rule:** Design UX to support the system composer naturally

### Picture-in-Picture (PiP)
Persistent floating windows for parallel activities like games or live sessions.

**Principles:**
- Update dynamically based on chat input
- Close automatically when sessions end
- Avoid overloading with static controls

## Visual Design Guidelines

### Color
- Use system-defined palettes for text, icons, dividers
- Apply brand accents to logos and icons only
- Avoid custom gradients or background color overrides

### Typography
- Inherit platform-native system fonts (SF Pro/Roboto)
- Use partner styling sparingly within content areas
- Limit font size variation

### Spacing & Layout
- Apply system grid spacing consistently
- Maintain clear visual hierarchy
- Respect system corner radius specifications

### Icons & Imagery
- Use monochromatic, outlined iconography matching ChatGPT's aesthetic
- Provide alt text for all images
- Maintain enforced aspect ratios

### Accessibility
- Maintain WCAG AA contrast ratios minimum
- Support text resizing without layout breaks
- Include alt text for all visual content
