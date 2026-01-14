# Unit Economics Model

*Last updated: 2026-01-01*

## Current Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0/mo | 5 projects, voice-to-text |
| Pro | $29/mo | Unlimited projects, voice-to-voice |

## Key Metrics (Targets)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LTV | >$300 | $348 (12mo) | ✅ On target |
| CAC | <$50 | Unknown | ⏳ Pre-launch |
| LTV:CAC | >3:1 | Unknown | ⏳ Pre-launch |
| Payback | <3 mo | Unknown | ⏳ Pre-launch |
| Gross Margin | >80% | ~85% est | ✅ On target |

## Revenue Model

### Monthly Recurring Revenue (MRR)
```
MRR = Pro Users × $29
```

### Annual Run Rate (ARR)
```
ARR = MRR × 12
```

### Lifetime Value (LTV)
```
LTV = ARPU × Average Lifespan
LTV = $29 × 12 months = $348 (assuming 12-month retention)
```

### Customer Acquisition Cost (CAC)
```
CAC = Total Sales & Marketing / New Customers Acquired
```

## Cost Structure

### Variable Costs (per user/month)
- AI API usage: ~$0.50-2.00 (depends on usage)
- Storage: ~$0.10 (images)
- Infrastructure: ~$0.20

**Estimated variable cost per Pro user: ~$2-3/month**
**Gross margin: ~90%**

### Fixed Costs (monthly)
- Vercel hosting: $20
- Supabase: $25
- Domain/DNS: ~$2

**Total fixed: ~$50/month**

## Break-even Analysis

```
Break-even users = Fixed Costs / (Price - Variable Cost)
Break-even = $50 / ($29 - $3) = ~2 Pro users
```

## Scenarios

### Conservative (10% conversion, 5% churn)
| Month | Free | Pro | MRR |
|-------|------|-----|-----|
| 1 | 20 | 2 | $58 |
| 3 | 50 | 5 | $145 |
| 6 | 100 | 10 | $290 |
| 12 | 200 | 20 | $580 |

### Optimistic (20% conversion, 3% churn)
| Month | Free | Pro | MRR |
|-------|------|-----|-----|
| 1 | 20 | 4 | $116 |
| 3 | 50 | 10 | $290 |
| 6 | 100 | 20 | $580 |
| 12 | 200 | 40 | $1,160 |

## Open Questions

- [ ] What's the actual CAC in different channels?
- [ ] What's the conversion rate from free to pro?
- [ ] What's the churn rate after first month?
- [ ] Should we consider annual pricing for better retention?

---
*This document is maintained by the Finance Advisor*
