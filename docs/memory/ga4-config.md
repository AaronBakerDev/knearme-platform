# GA4 Configuration – KNearMe Prod (Created Dec 12, 2025)

- **Account / Property:** KNearMe / KNearMe Prod
- **Timezone / Currency:** (GMT-07:00) Denver, US Dollar (USD)
- **Web Stream:**
  - Name: KNearMe Web
  - URL: https://knearme.co
  - Stream ID: 13130304655
  - Measurement ID: G-2E0G33JVRN
- **Measurement Protocol:**
  - API Secret (knearme-server): `-oIU5Cv1RJKgyMqQhSwiyw`
  - Use with Measurement ID above for server-side events.
- **Custom Dimensions (event scope):**
  - City Slug → `city_slug`
  - Service Type → `service_type`
  - Contractor ID → `contractor_id`
- **Enhanced Measurement:** Enabled (scrolls, outbound clicks, search, video, file downloads).
- **Next steps:** Once frontend emits events, mark `project_view`, `contractor_profile_click`, `related_project_click`, and `contractor_signup` as key events (Configure → Events) so they count as conversions.

## App Instrumentation (Dec 12, 2025)

- Frontend + server helpers live in `src/lib/analytics.ts`. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `GA_MEASUREMENT_PROTOCOL_SECRET` in `.env.local`.
- Layout injects GA via `AnalyticsProvider` (`src/components/providers/analytics-provider.tsx`) so `page_view` fires on every route change.
- Client helpers (`trackClientEvent`) power UI-level events; server routes can call `sendMeasurementEvent` for Measurement Protocol hits when needed.

### Event Map

| Event | Trigger | Payload Highlights |
| --- | --- | --- |
| `page_view` | App Router navigation via `AnalyticsProvider` | `page_path`, `page_location`, `page_title` |
| `project_view` | Project detail page mount (`src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx`) | `project_id`, `city_slug`, `service_type`, `contractor_id` |
| `related_project_click` | Card click inside `RelatedProjects` component | Clicked project metadata + source project context |
| `contractor_profile_click` | Back link + CTA on project page | `project_id`, `contractor_id`, `cta_location` |
| `contractor_signup` | Successful signup submission (`src/app/(auth)/signup/page.tsx`) | `method`, `email_domain` |

Custom dimensions (`city_slug`, `service_type`, `contractor_id`) are attached wherever data is available so they can be registered in GA4.

### DebugView Validation

1. Run the Next.js app locally (`npm run dev`) with `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-2E0G33JVRN`.
2. Open GA → Admin → DebugView, then browse https://localhost:3000?debug_mode=1 (or use the GA Debug Chrome extension). Events from your session will stream live.
3. Confirm the sequence: `page_view` → `project_view` when loading a project, click a related project (expect `related_project_click` + another `project_view`), click contractor CTA (`contractor_profile_click`), and complete a signup flow for `contractor_signup`.
4. For server-originated events, call `sendMeasurementEvent` from a route handler or server action and verify payloads appear in DebugView with correct params/custom dimensions.

Once events flow, star them under Configure → Events so marketing can promote them to key events/conversions.
