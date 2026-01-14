/**
 * Customer Interaction Agents - OpenAI and Gemini agents for customer-facing tasks
 * These agents handle all contractor interactions, sales, support, and research
 */

import { Agent, tool, hostedMcpTool, MCPServerStdio } from '@openai/agents';
import { z } from 'zod';

class CustomerInteractionAgents {
  constructor(config) {
    this.config = config;
    this.agents = new Map();
    this.initializeAgents();
  }

  initializeAgents() {
    // CEO Agent - O3 for strategic decisions
    this.agents.set('ceo', this.createCEOAgent());
    
    // Customer-facing agents - GPT-4o for natural conversation
    this.agents.set('interviewer', this.createInterviewAgent());
    this.agents.set('sales_rep', this.createSalesAgent());
    this.agents.set('customer_support', this.createSupportAgent());
    this.agents.set('account_manager', this.createAccountManagerAgent());
    
    // Research agents - Gemini for analysis and research
    this.agents.set('market_research', this.createMarketResearchAgent());
    this.agents.set('seo_research', this.createSEOResearchAgent());
    this.agents.set('business_analytics', this.createAnalyticsAgent());
  }

  // CEO Agent - O3 for strategic leadership
  createCEOAgent() {
    return new Agent({
      name: "KnearMe CEO",
      model: "o3",
      instructions: `You are the CEO of KnearMe, leading the contractor story platform revolution.

**COMPANY MISSION**: Transform contractor discovery through authentic project stories vs fake reviews.

**BUSINESS MODEL**: 
- Contractor subscriptions: $99-299/month for story publishing
- Target: Excavators and post hole contractors
- Value: Credibility showcase vs lead generation bidding wars

**STRATEGIC PRIORITIES**:
1. Contractor acquisition and retention
2. Story quality and SEO performance  
3. Platform scalability and technology
4. Revenue growth and profitability
5. Market expansion and competitive positioning

**DECISION AUTHORITY**:
- Approve pricing strategies and major partnerships
- Set quarterly goals and resource allocation
- Review and approve significant platform changes
- Guide overall business strategy and market positioning

You think strategically, make data-driven decisions, and focus on sustainable growth.`,
      tools: [
        // Hosted tools for file operations and analysis
        'file_search',
        'code_interpreter',
        
        // Custom skill tools with proper validation
        tool({
          name: 'strategic_decision_making',
          description: 'Make strategic business decisions based on data and context',
          parameters: z.object({
            decision_context: z.string(),
            options: z.array(z.string()),
            risk_factors: z.array(z.string()).optional()
          })
        }, async ({ decision_context, options, risk_factors }) => {
          return this.strategicDecisionMaking(decision_context, options, risk_factors);
        }),
        
        tool({
          name: 'set_business_priorities',
          description: 'Set quarterly priorities and resource allocation',
          parameters: z.object({
            quarter: z.string(),
            priorities: z.array(z.object({
              area: z.string(),
              importance: z.enum(['critical', 'high', 'medium', 'low']),
              resources_needed: z.string()
            }))
          })
        }, async ({ quarter, priorities }) => {
          return this.setPriorities(quarter, priorities);
        }),
        
        // MCP tools for external integrations
        hostedMcpTool({
          name: 'business_analytics',
          description: 'Access business analytics and reporting'
        })
      ]
    });
  }

  // Interview Agent - GPT-4o for contractor conversations
  createInterviewAgent() {
    return new Agent({
      name: "Contractor Interview Specialist",
      model: "gpt-4o",
      instructions: `You conduct engaging interviews with excavators and post hole contractors about their projects.

**INTERVIEW STYLE**:
- Conversational and friendly, like talking to a skilled neighbor
- Show genuine interest in their craftsmanship and expertise
- Ask follow-up questions that reveal interesting details
- Help contractors feel proud of their work

**INTERVIEW STRUCTURE**:
1. **Warm-up**: "Tell me about your business and how you got started"
2. **Project Focus**: "What's a project that really showcased your skills?"
3. **Challenge Deep-dive**: "What made this project particularly challenging?"
4. **Solution Process**: "Walk me through how you solved that problem"
5. **Technical Details**: "What equipment/techniques were crucial?"
6. **Client Impact**: "How did the client react to the final result?"
7. **Lessons Learned**: "What would surprise homeowners about this type of work?"

**STORY ELEMENTS TO CAPTURE**:
- Specific challenges that required expertise
- Technical solutions and equipment choices
- Timeline and project complexity
- Client satisfaction and relationship
- Professional insights and advice

**TONE**: Professional but warm, respecting their expertise while making them comfortable sharing details.

Transform contractor expertise into compelling narratives that build trust with homeowners.`,
      tools: [
        // File tools for managing interview transcripts and photos
        'file_search',
        'code_interpreter',
        
        // Custom interview tools
        tool({
          name: 'schedule_contractor_interview',
          description: 'Schedule an interview with a contractor about their project',
          parameters: z.object({
            contractor_id: z.string(),
            project_type: z.enum(['excavation', 'post_holes', 'foundation', 'grading', 'other']),
            preferred_times: z.array(z.string()),
            project_details: z.string().optional()
          })
        }, async ({ contractor_id, project_type, preferred_times, project_details }) => {
          return this.scheduleInterview(contractor_id, project_type, preferred_times, project_details);
        }),
        
        tool({
          name: 'conduct_project_interview',
          description: 'Conduct structured interview about contractor project',
          parameters: z.object({
            contractor_id: z.string(),
            interview_questions: z.array(z.string()),
            project_photos: z.array(z.string()).optional()
          })
        }, async ({ contractor_id, interview_questions, project_photos }) => {
          return this.conductInterview(contractor_id, interview_questions, project_photos);
        }),
        
        tool({
          name: 'extract_story_elements',
          description: 'Extract key story elements from interview transcript',
          parameters: z.object({
            transcript: z.string(),
            story_type: z.enum(['project_showcase', 'problem_solving', 'expertise_demo']),
            seo_keywords: z.array(z.string()).optional()
          })
        }, async ({ transcript, story_type, seo_keywords }) => {
          return this.extractStoryElements(transcript, story_type, seo_keywords);
        })
      ]
    });
  }

  // Sales Agent - GPT-4o for demos and onboarding
  createSalesAgent() {
    return new Agent({
      name: "KnearMe Sales Representative",
      model: "gpt-4o", 
      instructions: `You help excavators and post hole contractors understand KnearMe's value and choose the right subscription.

**SALES PHILOSOPHY**:
- Consultative approach focused on contractor success
- No pressure tactics - solve real credibility problems
- Emphasize long-term value over quick sales
- Treat contractors as partners, not just revenue

**VALUE PROPOSITIONS**:
- **Credibility**: Real project stories vs basic listings
- **SEO Benefits**: Each story = potential Google traffic for their specialty
- **No Bidding Wars**: Focus on expertise showcase vs price competition
- **Professional Image**: Detailed case studies demonstrate capability

**SUBSCRIPTION TIERS**:
- **Basic ($99/month)**: 2 project stories, basic profile
- **Pro ($199/month)**: 4 stories, featured placement, analytics
- **Premium ($299/month)**: Unlimited stories, priority interviews, advanced features

**SALES PROCESS**:
1. **Discovery**: Understand their current marketing challenges
2. **Demo**: Show how stories showcase their expertise
3. **Value Calculation**: Help them see ROI potential
4. **Objection Handling**: Address concerns about time/cost
5. **Right-Fit Pricing**: Recommend appropriate tier
6. **Smooth Onboarding**: Ensure immediate value delivery

**COMMON OBJECTIONS & RESPONSES**:
- "I don't have time" → "Our AI handles the writing, you just tell your story"
- "I get leads from word of mouth" → "This amplifies your reputation to more homeowners"
- "Sounds expensive" → "What's the value of one quality excavation project?"

Focus on helping contractors build their reputation and attract better clients.`,
      tools: [
        // File tools for managing demos and proposals
        'file_search',
        
        // Custom sales tools
        tool({
          name: 'conduct_platform_demo',
          description: 'Conduct personalized demo of KnearMe platform for contractor',
          parameters: z.object({
            contractor_id: z.string(),
            demo_type: z.enum(['basic_overview', 'story_showcase', 'seo_benefits', 'full_platform']),
            contractor_specialty: z.enum(['excavation', 'post_holes', 'foundation', 'general']),
            pain_points: z.array(z.string()).optional()
          })
        }, async ({ contractor_id, demo_type, contractor_specialty, pain_points }) => {
          return this.conductDemo(contractor_id, demo_type, contractor_specialty, pain_points);
        }),
        
        tool({
          name: 'calculate_contractor_roi',
          description: 'Calculate ROI potential for contractor subscription',
          parameters: z.object({
            current_marketing_spend: z.number(),
            average_project_value: z.number(),
            projects_per_month: z.number(),
            subscription_tier: z.enum(['basic', 'pro', 'premium'])
          })
        }, async ({ current_marketing_spend, average_project_value, projects_per_month, subscription_tier }) => {
          return this.calculateROI(current_marketing_spend, average_project_value, projects_per_month, subscription_tier);
        }),
        
        tool({
          name: 'handle_sales_objections',
          description: 'Address contractor objections with data-driven responses',
          parameters: z.object({
            objection_type: z.enum(['cost_concern', 'time_constraint', 'skepticism', 'competition', 'technical']),
            objection_details: z.string(),
            contractor_context: z.string()
          })
        }, async ({ objection_type, objection_details, contractor_context }) => {
          return this.handleObjections(objection_type, objection_details, contractor_context);
        })
      ]
    });
  }

  // Customer Support Agent - GPT-4o for contractor assistance
  createSupportAgent() {
    return new Agent({
      name: "KnearMe Customer Success Manager",
      model: "gpt-4o",
      instructions: `You ensure contractor success and satisfaction with the KnearMe platform.

**SUPPORT PHILOSOPHY**:
- Proactive assistance before contractors ask for help
- Quick resolution of issues with empathy and expertise
- Educational approach that helps contractors maximize platform value
- Build long-term relationships that drive retention

**COMMON SUPPORT SCENARIOS**:
- **Interview Preparation**: Help contractors prepare stories and gather photos
- **Platform Navigation**: Guide through profile setup and story management
- **Performance Questions**: Explain story views, SEO rankings, and analytics
- **Billing Issues**: Handle subscription changes and payment questions
- **Feature Requests**: Collect feedback and coordinate with development team

**SUPPORT CHANNELS**:
- Email support (primary, <2 hour response)
- Live chat for urgent issues
- Video calls for complex problems
- Self-service knowledge base maintenance

**ESCALATION CRITERIA**:
- Technical platform issues → Development team
- Billing disputes >$500 → Sales manager
- Cancellation requests → Account manager for retention
- Feature requests → Product team for evaluation

**SUCCESS METRICS**:
- Customer satisfaction: >4.8/5 rating
- First-response time: <2 hours
- Resolution time: <24 hours for 90% of issues
- Contractor retention rate: >95% monthly

Your goal is making every contractor feel valued and successful on the platform.`,
      tools: [
        // File tools for support documentation and ticket management
        'file_search',
        'code_interpreter',
        
        // Custom support tools
        tool({
          name: 'resolve_contractor_issue',
          description: 'Resolve contractor support issues efficiently',
          parameters: z.object({
            ticket_id: z.string(),
            issue_category: z.enum(['technical', 'billing', 'content', 'feature_request', 'account']),
            issue_description: z.string(),
            contractor_tier: z.enum(['basic', 'pro', 'premium']),
            urgency: z.enum(['low', 'medium', 'high', 'critical'])
          })
        }, async ({ ticket_id, issue_category, issue_description, contractor_tier, urgency }) => {
          return this.resolveIssues(ticket_id, issue_category, issue_description, contractor_tier, urgency);
        }),
        
        tool({
          name: 'track_satisfaction_metrics',
          description: 'Track and analyze contractor satisfaction',
          parameters: z.object({
            contractor_id: z.string(),
            interaction_type: z.enum(['support_ticket', 'survey_response', 'platform_usage', 'retention_signal']),
            satisfaction_score: z.number().min(1).max(5).optional(),
            feedback: z.string().optional()
          })
        }, async ({ contractor_id, interaction_type, satisfaction_score, feedback }) => {
          return this.trackSatisfaction(contractor_id, interaction_type, satisfaction_score, feedback);
        })
      ]
    });
  }

  // Account Manager Agent - GPT-4o for retention and growth
  createAccountManagerAgent() {
    return new Agent({
      name: "Contractor Success Manager",
      model: "gpt-4o",
      instructions: `You drive contractor success, retention, and account growth.

**ACCOUNT MANAGEMENT GOALS**:
- Ensure contractors see clear value from KnearMe platform
- Proactively identify and resolve satisfaction issues
- Drive upgrades to higher subscription tiers when appropriate
- Maintain >95% monthly retention rate

**PROACTIVE OUTREACH SCHEDULE**:
- **Week 1**: Welcome call and onboarding verification
- **Month 1**: First story published check-in
- **Month 3**: Performance review and optimization
- **Month 6**: Subscription review and tier assessment
- **Quarterly**: Business review and growth planning

**VALUE REALIZATION TRACKING**:
- Story publication rate and quality
- SEO performance and traffic metrics
- Lead generation and business impact
- Contractor satisfaction and engagement

**GROWTH OPPORTUNITIES**:
- **Basic → Pro**: When contractors need more stories or better placement
- **Pro → Premium**: For high-volume contractors or those wanting priority
- **Additional Services**: Video stories, social media amplification, premium SEO

**RETENTION STRATEGIES**:
- Regular check-ins focused on their business success
- Personalized performance reports and insights
- Early warning system for satisfaction issues
- Quick resolution of any platform concerns

**COMMUNICATION STYLE**:
- Business-focused conversations about their success
- Data-driven insights and recommendations
- Consultative approach to subscription optimization
- Long-term partnership mindset

Drive contractor success through the platform while growing revenue per account.`,
      tools: [
        // File tools for account data analysis
        'file_search',
        'code_interpreter',
        
        // Custom account management tools
        tool({
          name: 'track_contractor_success_metrics',
          description: 'Track contractor success and platform value realization',
          parameters: z.object({
            contractor_id: z.string(),
            metrics_period: z.enum(['weekly', 'monthly', 'quarterly']),
            success_indicators: z.array(z.enum(['story_views', 'lead_generation', 'seo_rankings', 'engagement']))
          })
        }, async ({ contractor_id, metrics_period, success_indicators }) => {
          return this.trackContractorSuccess(contractor_id, metrics_period, success_indicators);
        }),
        
        tool({
          name: 'identify_upsell_opportunities',
          description: 'Identify opportunities for subscription tier upgrades',
          parameters: z.object({
            contractor_id: z.string(),
            current_tier: z.enum(['basic', 'pro', 'premium']),
            usage_patterns: z.object({
              stories_published: z.number(),
              monthly_views: z.number(),
              feature_usage: z.array(z.string())
            })
          })
        }, async ({ contractor_id, current_tier, usage_patterns }) => {
          return this.identifyGrowthOpportunities(contractor_id, current_tier, usage_patterns);
        })
      ]
    });
  }

  // Market Research Agent - Gemini for contractor research
  createMarketResearchAgent() {
    return new Agent({
      name: "Market Research Specialist", 
      model: "gemini-2.0-flash-experimental",
      instructions: `You research and identify potential contractors for KnearMe platform outreach.

**RESEARCH MISSION**: Find excavators and post hole contractors who would benefit from credibility showcase through project stories.

**TARGET CONTRACTOR PROFILE**:
- 5+ years in business with established reputation
- Specializes in excavation, foundations, or post hole work
- Currently has weak online presence despite good work quality
- Located in markets with decent population density (>50K people)
- Values craftsmanship and expertise over lowest-price bidding

**RESEARCH METHODS**:
- Google searches for local excavators by city
- Better Business Bureau contractor listings
- Industry association member directories
- LinkedIn profiles and company pages
- Local permit records and project databases
- Trade publication mentions and awards

**RESEARCH OUTPUTS**:
- Contractor contact information and business details
- Assessment of current online presence and reputation
- Identification of recent projects and specialties
- Competitive landscape analysis by market
- Prioritized outreach recommendations

**MARKET PRIORITIZATION**:
1. **Tier 1**: Mid-size cities (50K-300K population) - less competition
2. **Tier 2**: Suburban areas near major cities - good project volume
3. **Tier 3**: Rural areas with construction activity - underserved online

**RESEARCH QUALITY STANDARDS**:
- Verify contractor licensing and insurance status
- Confirm business is actively operating
- Assess project quality through available photos/reviews
- Evaluate potential for compelling project stories

Provide actionable contractor prospects that align with KnearMe's value proposition.`,
      tools: [
        // Hosted tools for web research and data analysis
        'web_search',
        'code_interpreter',
        
        // Custom research tools
        tool({
          name: 'research_contractor_prospects',
          description: 'Research and identify potential contractor prospects',
          parameters: z.object({
            location: z.string(),
            contractor_type: z.enum(['excavation', 'post_holes', 'foundation', 'general']),
            market_size: z.enum(['small_town', 'mid_city', 'major_metro']),
            research_depth: z.enum(['basic_scan', 'detailed_analysis', 'comprehensive_profile'])
          })
        }, async ({ location, contractor_type, market_size, research_depth }) => {
          return this.researchContractors(location, contractor_type, market_size, research_depth);
        }),
        
        tool({
          name: 'analyze_market_competition',
          description: 'Analyze local market competition and opportunities',
          parameters: z.object({
            target_market: z.string(),
            competitor_analysis: z.boolean().default(true),
            opportunity_assessment: z.boolean().default(true)
          })
        }, async ({ target_market, competitor_analysis, opportunity_assessment }) => {
          return this.analyzeMarkets(target_market, competitor_analysis, opportunity_assessment);
        })
      ]
    });
  }

  // SEO Research Agent - Gemini for keyword and content optimization
  createSEOResearchAgent() {
    return new Agent({
      name: "SEO Research Specialist",
      model: "gemini-2.0-flash-experimental", 
      instructions: `You optimize KnearMe's SEO strategy for local contractor discovery.

**SEO MISSION**: Dominate local search results for contractor-related queries through strategic content optimization.

**PRIMARY KEYWORDS**:
- "excavator near me [city]"
- "post hole digger [city]" 
- "foundation excavation [city]"
- "excavation contractor [city]"
- "[contractor name] reviews"
- "[specific project type] contractor [city]"

**CONTENT OPTIMIZATION STRATEGY**:
- Each contractor story targets specific local + service keywords
- Story titles optimized for search intent
- Meta descriptions that drive clicks from search results
- Internal linking between related contractor stories
- Local business schema markup implementation

**RESEARCH ACTIVITIES**:
- Keyword research and search volume analysis
- Competitor content analysis and gap identification  
- Local search ranking monitoring and reporting
- Google My Business optimization recommendations
- Content performance analysis and optimization

**SEO TOOLS & METHODS**:
- Google Keyword Planner for search volume data
- SEMrush/Ahrefs for competitor analysis
- Google Search Console for performance monitoring
- Local search result tracking by city/service
- Content gap analysis for story opportunities

**REPORTING & INSIGHTS**:
- Weekly keyword ranking reports
- Monthly content performance analysis
- Quarterly competitive landscape assessment
- Story optimization recommendations
- Local SEO opportunity identification

Drive organic traffic growth that connects homeowners with quality contractors through compelling stories.`,
      tools: [
        // Hosted tools for SEO research and optimization
        'web_search',
        'code_interpreter',
        
        // Custom SEO tools
        tool({
          name: 'research_local_keywords',
          description: 'Research local SEO keywords for contractor services',
          parameters: z.object({
            location: z.string(),
            service_types: z.array(z.enum(['excavation', 'post_holes', 'foundation', 'grading'])),
            keyword_intent: z.enum(['informational', 'commercial', 'transactional']),
            competition_level: z.enum(['low', 'medium', 'high']).optional()
          })
        }, async ({ location, service_types, keyword_intent, competition_level }) => {
          return this.researchKeywords(location, service_types, keyword_intent, competition_level);
        }),
        
        tool({
          name: 'optimize_story_content',
          description: 'Optimize contractor stories for SEO performance',
          parameters: z.object({
            story_content: z.string(),
            target_keywords: z.array(z.string()),
            local_area: z.string(),
            optimization_type: z.enum(['title', 'meta_description', 'content', 'full_optimization'])
          })
        }, async ({ story_content, target_keywords, local_area, optimization_type }) => {
          return this.optimizeContent(story_content, target_keywords, local_area, optimization_type);
        })
      ]
    });
  }

  // Business Analytics Agent - Gemini Pro for complex analysis
  createAnalyticsAgent() {
    return new Agent({
      name: "Business Analytics Manager",
      model: "gemini-2.5-pro-experimental",
      instructions: `You analyze KnearMe's business performance and provide strategic insights.

**ANALYTICS MISSION**: Provide data-driven insights that optimize contractor acquisition, retention, and revenue growth.

**KEY METRICS TO TRACK**:
- **Revenue**: MRR, ARPU, revenue growth rate, subscription tier distribution
- **Acquisition**: Contractor sign-ups, conversion rates, customer acquisition cost
- **Retention**: Churn rate, renewal rates, satisfaction scores, feature adoption
- **Content**: Story publication rates, quality scores, SEO performance
- **Platform**: Usage analytics, feature adoption, support ticket trends

**ANALYSIS FRAMEWORKS**:
- Cohort analysis for contractor retention patterns
- Funnel analysis for conversion optimization
- Segmentation analysis by contractor type and market
- Correlation analysis between features and retention
- Predictive modeling for churn risk and growth opportunities

**REPORTING SCHEDULE**:
- **Daily**: Revenue and acquisition dashboard updates
- **Weekly**: Performance trends and anomaly detection
- **Monthly**: Comprehensive business review with insights
- **Quarterly**: Strategic analysis and forecasting

**ACTIONABLE INSIGHTS**:
- Identify highest-value contractor segments
- Recommend pricing and packaging optimizations
- Predict churn risk and suggest retention strategies
- Analyze story performance patterns for content optimization
- Forecast revenue and growth trajectory

**ANALYSIS OUTPUTS**:
- Executive dashboard with key metrics
- Detailed analytical reports with recommendations
- Performance alerts and trend notifications
- Segmentation insights for marketing and sales
- Predictive models for business planning

Transform raw data into strategic intelligence that drives business growth and contractor success.`,
      tools: [
        // Hosted tools for advanced data analysis
        'code_interpreter',
        'file_search',
        
        // Custom analytics tools
        tool({
          name: 'analyze_business_metrics',
          description: 'Comprehensive analysis of KnearMe business performance',
          parameters: z.object({
            metrics_timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
            metric_categories: z.array(z.enum(['revenue', 'acquisition', 'retention', 'content', 'platform'])),
            analysis_depth: z.enum(['summary', 'detailed', 'comprehensive']),
            include_predictions: z.boolean().default(false)
          })
        }, async ({ metrics_timeframe, metric_categories, analysis_depth, include_predictions }) => {
          return this.analyzeMetrics(metrics_timeframe, metric_categories, analysis_depth, include_predictions);
        }),
        
        tool({
          name: 'generate_strategic_insights',
          description: 'Generate actionable business insights from data analysis',
          parameters: z.object({
            data_sources: z.array(z.string()),
            insight_focus: z.enum(['growth_opportunities', 'retention_risks', 'market_trends', 'operational_efficiency']),
            recommendation_level: z.enum(['tactical', 'strategic', 'both'])
          })
        }, async ({ data_sources, insight_focus, recommendation_level }) => {
          return this.generateInsights(data_sources, insight_focus, recommendation_level);
        }),
        
        // MCP integration for external analytics tools
        hostedMcpTool({
          name: 'google_analytics',
          description: 'Access Google Analytics data for website performance'
        })
      ]
    });
  }

  // Tool implementations for each agent type
  async strategicDecisionMaking(context, decision, options) {
    // CEO decision making logic
    return "Strategic decision analysis completed";
  }

  async conductInterview(context, contractorId, projectDetails) {
    // Interview conducting logic
    return "Interview completed successfully";
  }

  async conductDemo(context, prospectId, demoType) {
    // Sales demo logic
    return "Demo completed, next steps scheduled";
  }

  async resolveIssues(context, ticketId, issueDescription) {
    // Support issue resolution
    return "Issue resolved successfully";
  }

  async trackContractorSuccess(context, contractorId, metrics) {
    // Account management tracking
    return "Success metrics updated";
  }

  async researchContractors(context, location, criteria) {
    // Market research logic
    return "Contractor research completed";
  }

  async researchKeywords(context, location, serviceType) {
    // SEO keyword research
    return "Keyword research completed";
  }

  async analyzeMetrics(context, timeframe, metrics) {
    // Business analytics
    return "Metrics analysis completed";
  }

  getAgent(agentType) {
    return this.agents.get(agentType);
  }

  getAllAgents() {
    return Array.from(this.agents.keys());
  }

  getAgentStatus() {
    return {
      totalAgents: this.agents.size,
      activeAgents: this.getAllAgents(),
      agentTypes: {
        openai: ['ceo', 'interviewer', 'sales_rep', 'customer_support', 'account_manager'],
        gemini: ['market_research', 'seo_research', 'business_analytics']
      }
    };
  }
}

export { CustomerInteractionAgents };