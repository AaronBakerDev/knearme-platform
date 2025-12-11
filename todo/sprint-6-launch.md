# Sprint 6: Launch

> **Status:** ⏳ Upcoming
> **Epic References:** Launch Plan, Ops documentation
> **Estimated Duration:** 1 week

## Overview

Deploy to production, set up monitoring, onboard initial users, and prepare for soft launch.

---

## 1. Production Environment

### Vercel Setup
- [ ] Create production Vercel project
- [ ] Connect to GitHub repository
- [ ] Configure production branch (main)
- [ ] Set up preview deployments for PRs
- [ ] Configure build settings

### Environment Variables
- [ ] Set all production environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  GOOGLE_AI_API_KEY
  OPENAI_API_KEY
  NEXT_PUBLIC_SITE_URL
  ```
- [ ] Verify no secrets in client bundle
- [ ] Set up variable groups for staging/production

### Domain Configuration
- [ ] Purchase/configure domain (knearme.com or similar)
- [ ] Set up DNS records
- [ ] Configure SSL certificate (auto via Vercel)
- [ ] Set up www redirect
- [ ] Configure email domain (if needed)

### Supabase Production
- [ ] Create production Supabase project
- [ ] Run database migrations
- [ ] Verify RLS policies
- [ ] Set up storage buckets
- [ ] Configure auth settings
- [ ] Enable connection pooling

---

## 2. Monitoring & Observability

### Error Tracking
- [ ] Set up Sentry (or similar)
- [ ] Configure source maps
- [ ] Set up error alerts
- [ ] Create error grouping rules
- [ ] Test error capture

### Application Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure Web Vitals tracking
- [ ] Set up custom event tracking:
  - Signup completed
  - Project published
  - AI generation completed
  - Interview abandoned
- [ ] Create monitoring dashboard

### Uptime Monitoring
- [ ] Set up uptime checks (Better Uptime, Pingdom)
- [ ] Monitor critical endpoints:
  - Homepage
  - Dashboard
  - API health
- [ ] Configure alerts (Slack/Email)

### Log Management
- [ ] Configure structured logging
- [ ] Set up log aggregation (Vercel logs or external)
- [ ] Create log queries for common issues
- [ ] Set log retention policy

### AI Cost Monitoring
- [ ] Set up OpenAI usage dashboard
- [ ] Set up Google AI usage dashboard
- [ ] Create cost alerts at 80% budget
- [ ] Monitor per-user usage

### Database Monitoring
- [ ] Enable Supabase monitoring
- [ ] Set up slow query alerts
- [ ] Monitor connection pool usage
- [ ] Set up storage alerts

---

## 3. Security Checklist

### Authentication
- [ ] Verify password hashing (bcrypt)
- [ ] Confirm session security (httpOnly, secure, sameSite)
- [ ] Test rate limiting on auth endpoints
- [ ] Verify email verification required

### Authorization
- [ ] Audit all RLS policies
- [ ] Test contractor data isolation
- [ ] Verify public vs private data access
- [ ] Check API route authorization

### Data Protection
- [ ] Verify no secrets in client code
- [ ] Confirm HTTPS everywhere
- [ ] Check CORS configuration
- [ ] Review CSP headers

### Input Validation
- [ ] Audit all user inputs
- [ ] Verify file upload restrictions
- [ ] Check for SQL injection (should be prevented by Supabase SDK)
- [ ] Check for XSS vulnerabilities

### Compliance
- [ ] Add privacy policy page
- [ ] Add terms of service page
- [ ] Implement cookie consent (if needed)
- [ ] Document data handling

---

## 4. Pre-Launch Testing

### Smoke Tests
- [ ] Homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Project creation works
- [ ] Project publish works
- [ ] Public pages render

### Load Testing
- [ ] Run k6 load test (100 concurrent users)
- [ ] Test API endpoints under load
- [ ] Test image upload under load
- [ ] Verify database handles load
- [ ] Check for memory leaks

### Security Testing
- [ ] Run OWASP ZAP scan
- [ ] Test authentication bypass attempts
- [ ] Test authorization bypass attempts
- [ ] Verify rate limiting works

### Mobile Testing
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test PWA installation
- [ ] Test camera/gallery upload
- [ ] Test voice recording

### Cross-Browser Testing
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## 5. Launch Checklist

### Technical
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Lighthouse scores ≥ 90
- [ ] Sitemap accessible
- [ ] Robots.txt correct
- [ ] 404 page works
- [ ] Error pages work

### Content
- [ ] Homepage copy finalized
- [ ] All placeholder text replaced
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Contact information accurate

### SEO
- [ ] Google Search Console set up
- [ ] Sitemap submitted
- [ ] Meta tags on all pages
- [ ] Schema.org validates
- [ ] Open Graph working

### Analytics
- [ ] Google Analytics/Vercel Analytics active
- [ ] Conversion tracking set up
- [ ] Event tracking working
- [ ] Dashboard accessible

### Operations
- [ ] Error monitoring active
- [ ] Uptime monitoring active
- [ ] Alert channels configured
- [ ] On-call rotation (if applicable)
- [ ] Runbook documented

---

## 6. Initial User Onboarding

### Contractor Recruitment
- [ ] Identify 5-10 local masonry contractors
- [ ] Prepare outreach message
- [ ] Schedule onboarding calls
- [ ] Prepare demo script

### Onboarding Flow
- [ ] Create onboarding guide document
- [ ] Prepare video walkthrough (optional)
- [ ] Set up support channel (email/chat)
- [ ] Plan feedback collection

### Beta User Support
- [ ] Monitor first user signups
- [ ] Watch for errors in real-time
- [ ] Respond to feedback quickly
- [ ] Document common issues

### Feedback Collection
- [ ] Set up feedback form
- [ ] Schedule user interviews
- [ ] Track feature requests
- [ ] Prioritize quick wins

---

## 7. Post-Launch Monitoring

### Day 1
- [ ] Monitor error rates (target: < 1%)
- [ ] Watch performance metrics
- [ ] Check AI service health
- [ ] Respond to user issues immediately
- [ ] Verify analytics data flowing

### Week 1
- [ ] Review user signup funnel
- [ ] Analyze project creation completion rate
- [ ] Review AI generation success rate
- [ ] Check Core Web Vitals in field
- [ ] Compile feedback themes

### Ongoing
- [ ] Weekly error review
- [ ] Weekly performance review
- [ ] Monthly cost review
- [ ] User feedback triage

---

## 8. Rollback Plan

### Triggers for Rollback
- Error rate > 5%
- Critical security vulnerability
- Data corruption detected
- AI services unavailable > 1 hour

### Rollback Procedure
1. [ ] Document rollback steps
2. [ ] Test rollback to previous version
3. [ ] Verify database compatibility
4. [ ] Notify affected users (if needed)

### Recovery Steps
1. Identify root cause
2. Fix in development
3. Test thoroughly
4. Deploy fix
5. Post-mortem document

---

## 9. Success Metrics (Week 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Contractor signups | 10+ | Database count |
| Projects published | 20+ | Database count |
| Error rate | < 1% | Monitoring |
| Lighthouse Performance | ≥ 90 | Lighthouse CI |
| Uptime | > 99.5% | Uptime monitoring |
| Avg time to publish | < 3 min | Analytics |
| First-try approval rate | > 80% | Analytics |

---

## 10. Phase 2 Preparation

### Document Learnings
- [ ] What worked well
- [ ] What needs improvement
- [ ] Feature requests collected
- [ ] Technical debt identified

### Phase 2 Prioritization
- [ ] Review Jobber integration priority
- [ ] Assess homeowner features need
- [ ] Evaluate analytics dashboard
- [ ] Plan next sprint

### Technical Debt
- [ ] List known shortcuts taken
- [ ] Prioritize refactoring needs
- [ ] Plan test coverage improvements

---

## Definition of Done - MVP Launch

- [ ] Production environment live and stable
- [ ] 5+ contractors onboarded
- [ ] 10+ projects published
- [ ] Error rate < 1%
- [ ] Uptime > 99.5%
- [ ] Monitoring and alerting active
- [ ] Feedback collection in place
- [ ] Team knows rollback procedure

---

---

## 11. December Quick Wins (SEO Foundation)

### Google Search Console Setup
- [ ] Verify site property in Google Search Console
- [ ] Submit sitemap.xml to GSC
- [ ] Configure domain property (if applicable)

### Schema Validation
- [ ] Verify BreadcrumbList schema injection on all public pages
- [ ] Run Google Rich Results Test on sample project page
- [ ] Run Rich Results Test on sample contractor profile page (when implemented)
- [ ] Run Rich Results Test on sample city hub page (when implemented)
- [ ] Fix any schema errors found

### Analytics Setup
- [ ] Set up basic GA4 events (page_view, contractor_profile_click)
- [ ] Verify event tracking in GA4 debug mode
- [ ] Create dashboard for key metrics

### Technical SEO Validation
- [ ] Verify robots.txt is accessible at /robots.txt
- [ ] Test robots.txt syntax with Google tool
- [ ] Verify sitemap.xml is accessible at /sitemap.xml
- [ ] Test sitemap in GSC

### Social Media Meta Tags
- [ ] Test OG tags with Facebook Debugger
- [ ] Test Twitter Cards with Twitter Card Validator
- [ ] Verify images render correctly in social previews

---

## Notes

- Launch is just the beginning - stay vigilant
- Respond to user feedback within 24 hours
- Don't over-engineer fixes - quick wins first
- Document everything for future reference
- Celebrate the launch, then get back to work!
