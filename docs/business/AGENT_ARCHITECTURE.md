# KnearMe Agent Architecture

## Agent Responsibility Matrix

### **Claude Code Agents** (Building & Development)
*Use Claude Code for file operations, code generation, and system building*

- **Documentation Agent**: Updates all business documentation
- **Development Agent**: Builds platform code and features  
- **DevOps Agent**: Infrastructure and deployment automation
- **Content Generation Agent**: Creates website content and marketing materials
- **Quality Assurance Agent**: Code review and testing automation

### **OpenAI Agents** (Customer Interaction & Business Logic)
*Use latest OpenAI models for customer-facing interactions*

#### **O3 Model Agents** (Strategic & Complex Reasoning)
- **CEO Agent** (`o3`): Strategic decisions and business direction
- **Sales Strategy Agent** (`o3`): Complex deal negotiations and pricing strategies
- **Market Analysis Agent** (`o3`): Competitive intelligence and market positioning

#### **GPT-4o Agents** (Customer Interaction)
- **Interview Agent** (`gpt-4o`): Conducts contractor interviews
- **Customer Support Agent** (`gpt-4o`): Handles contractor questions and issues
- **Sales Representative Agent** (`gpt-4o`): Manages demo calls and onboarding
- **Account Manager Agent** (`gpt-4o`): Contractor success and retention

### **Google Gemini Agents** (Research & Analysis)
*Use latest Gemini models for research and data processing*

#### **Gemini 2.0 Flash Experimental** (Research & Outreach)
- **Market Research Agent** (`gemini-2.0-flash-experimental`): Finds potential contractors
- **Competitive Intelligence Agent** (`gemini-2.0-flash-experimental`): Monitors competitor activities
- **SEO Research Agent** (`gemini-2.0-flash-experimental`): Keyword research and optimization
- **Content Research Agent** (`gemini-2.0-flash-experimental`): Industry trends and story ideas

#### **Gemini 2.5 Pro** (Complex Analysis)
- **Business Analytics Agent** (`gemini-2.5-pro-experimental`): Revenue and performance analysis
- **Story Optimization Agent** (`gemini-2.5-pro-experimental`): Story performance and SEO improvement

## Interaction Patterns

### **Customer-Facing Workflow**
```
Contractor Inquiry → GPT-4o Sales Agent → O3 Strategy Agent (if complex) → GPT-4o Interview Agent → Claude Story Writer
```

### **Business Operations Workflow**  
```
Gemini Research Agent → O3 CEO Agent → Claude Code Builder → GPT-4o Customer Success Agent
```

### **Platform Development Workflow**
```
O3 CEO Agent (requirements) → Claude Code Development Agent → Claude Code DevOps Agent → GPT-4o Support Agent (user testing)
```

## Model Selection Rationale

### **OpenAI Models**
- **O3**: Best for strategic reasoning, complex decision making, and high-stakes interactions
- **GPT-4o**: Excellent for natural conversation, customer empathy, and real-time interactions
- **Claude Code Integration**: Perfect for file operations and code generation

### **Google Gemini Models**  
- **Gemini 2.0 Flash Experimental**: Superior for research, data analysis, and web scraping
- **Gemini 2.5 Pro**: Excellent for complex analysis and optimization tasks
- **1M+ token context**: Ideal for processing large datasets and comprehensive analysis

### **Claude Code**
- **File Operations**: Direct file editing and code generation
- **Non-Interactive Mode**: Perfect for automated system building
- **Development Tasks**: Code creation, testing, and deployment automation

## Communication Protocols

### **Inter-Agent Communication**
- **OpenAI ↔ Gemini**: JSON-based task handoffs via shared database
- **Claude Code**: Executes based on instructions from other agents
- **Notification System**: Slack/email for human oversight

### **Human Oversight Points**
- **Strategic Decisions**: O3 CEO agent recommendations require human approval for >$10K decisions
- **Customer Escalations**: GPT-4o agents escalate complex issues to humans
- **Code Deployment**: Claude Code agents require approval for production deployments

## Agent Coordination Example

### **New Contractor Onboarding Process**

1. **Research Phase** (Gemini 2.0 Flash)
   - Find potential contractors in target markets
   - Research their specialties and current online presence
   - Identify best outreach approach

2. **Outreach Phase** (GPT-4o)
   - Personalized email outreach
   - Schedule discovery calls
   - Handle initial questions

3. **Sales Phase** (O3 + GPT-4o)
   - O3 determines pricing strategy
   - GPT-4o conducts demo calls
   - O3 handles complex negotiations

4. **Onboarding Phase** (GPT-4o + Claude Code)
   - GPT-4o conducts onboarding interview
   - Claude Code creates contractor profile
   - GPT-4o schedules story interviews

5. **Story Creation** (GPT-4o + Claude Code + Gemini)
   - GPT-4o conducts project interview
   - Claude Code writes and publishes story
   - Gemini optimizes for SEO

6. **Success Management** (GPT-4o + Gemini)
   - GPT-4o monitors contractor satisfaction
   - Gemini analyzes story performance
   - GPT-4o provides optimization recommendations

## Performance Metrics by Agent Type

### **OpenAI Agents**
- **Customer Satisfaction**: >4.8/5 rating
- **Conversation Completion**: >95% successful interactions
- **Response Time**: <2 minutes for customer inquiries

### **Google Gemini Agents**  
- **Research Accuracy**: >90% relevant results
- **Analysis Quality**: Actionable insights in 80%+ of reports
- **Data Processing Speed**: <5 minutes for standard research tasks

### **Claude Code Agents**
- **Code Quality**: 100% functional deployments
- **Documentation Accuracy**: All docs reflect current business state
- **Deployment Success**: >99% successful automated deployments

This architecture ensures each agent type is used for its strengths while maintaining seamless coordination across the platform.