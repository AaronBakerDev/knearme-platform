# Deep Research Agents: Architecture Comparison

> Comparing KnearMe's Discovery Agent architecture against industry deep research agent patterns from OpenAI, Google, and emerging multi-agent frameworks.

---

## Executive Summary

Deep Research Agents represent a new class of autonomous AI systems designed for complex, multi-step information gathering tasks. This document compares:

| System | Architecture | Use Case | Duration |
|--------|-------------|----------|----------|
| **OpenAI Deep Research** | Multi-agent pipeline (o3 + GPT-4) | Comprehensive research reports | 5-30 minutes |
| **Gemini Deep Research** | Single-agent with RL-trained planning | Autonomous research synthesis | Several minutes |
| **KnearMe Discovery Agent** | Single-agent streaming with tools | Business onboarding | 2-5 minutes |

---

## Architecture Taxonomy

Research identifies two paradigms for agentic systems:

```mermaid
graph TB
    subgraph "Symbolic/Classical"
        S1[Algorithmic Planning]
        S2[Persistent State]
        S3[Deterministic Workflows]
    end

    subgraph "Neural/Generative"
        N1[Stochastic Generation]
        N2[Prompt-Driven Orchestration]
        N3[Adaptive Workflows]
    end

    subgraph "Hybrid Approaches"
        H1[ReAct Pattern]
        H2[Multi-Agent + Tools]
        H3[Plan-and-Execute]
    end

    S1 --> H1
    N1 --> H1
    S2 --> H2
    N2 --> H2

    style H1 fill:#4CAF50,color:#fff
    style H2 fill:#2196F3,color:#fff
```

**KnearMe Discovery Agent** uses a **Neural/Generative** approach with tool-based state transitions, while deep research agents typically use **Hybrid** approaches combining planning with adaptive execution.

---

## OpenAI Deep Research Architecture

OpenAI's Deep Research is built on the o3 reasoning model with a modular multi-agent design.

### System Overview

```mermaid
graph TB
    subgraph "User Interface"
        USER[User Query]
    end

    subgraph "Agent Pipeline"
        TRIAGE[Triage Agent<br/>Route & classify]
        CLARIFY[Clarification Agent<br/>GPT-4o refines scope]
        INSTRUCT[Instruction Agent<br/>Generate research plan]
        RESEARCH[Research Agent<br/>o3-deep-research]
    end

    subgraph "Tools & Capabilities"
        SEARCH[Web Search<br/>Dozens of queries]
        BROWSE[Web Browsing<br/>Read full pages]
        PDF[PDF Parser<br/>Academic papers]
        CODE[Python Execution<br/>Data analysis]
    end

    subgraph "Output"
        REPORT[Structured Report<br/>With inline citations]
    end

    USER --> TRIAGE
    TRIAGE --> CLARIFY
    CLARIFY --> INSTRUCT
    INSTRUCT --> RESEARCH

    RESEARCH --> SEARCH
    RESEARCH --> BROWSE
    RESEARCH --> PDF
    RESEARCH --> CODE

    RESEARCH --> REPORT

    style RESEARCH fill:#10A37F,color:#fff
    style TRIAGE fill:#FF6B6B,color:#fff
```

### Key Characteristics

| Aspect | Details |
|--------|---------|
| **Model** | o3-deep-research (specialized o3 variant) |
| **Planning** | Implicit decomposition into subtopics |
| **Iteration** | 20-50+ search queries per task |
| **Duration** | 5-30 minutes |
| **Output** | Long-form report with citations |
| **Cost** | High (extended reasoning + many tool calls) |

### Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant Triage as Triage Agent
    participant Clarify as Clarify Agent
    participant Research as Research Agent (o3)
    participant Web as Web Tools

    User->>Triage: Submit research query
    Triage->>Clarify: Route for clarification
    Clarify->>User: Request additional context
    User->>Clarify: Provide details
    Clarify->>Research: Scoped research task

    loop Iterative Research (5-30 min)
        Research->>Research: Plan next search
        Research->>Web: Execute search query
        Web-->>Research: Results
        Research->>Research: Analyze & identify gaps
        Research->>Web: Follow-up queries
        Web-->>Research: More results
    end

    Research->>Research: Synthesize findings
    Research->>User: Comprehensive report
```

---

## Gemini Deep Research Architecture

Google's approach uses reinforcement learning to train the planning capability directly into the model.

### System Overview

```mermaid
graph TB
    subgraph "Core Model"
        GEMINI[Gemini 3 Pro<br/>RL-trained planner]
    end

    subgraph "Planning Phase"
        PLAN[Generate Multi-Step Plan]
        APPROVE[User Review & Approval]
    end

    subgraph "Execution Phase"
        PARALLEL[Parallel Task Execution]
        SEQUENTIAL[Sequential Dependencies]
        STATE[Shared State Manager]
    end

    subgraph "Tools"
        SEARCH[Google Search]
        BROWSE[Web Browsing]
        REASON[Extended Reasoning]
    end

    subgraph "Synthesis"
        CRITIQUE[Self-Critique Passes]
        REPORT[Final Report]
    end

    GEMINI --> PLAN
    PLAN --> APPROVE
    APPROVE --> PARALLEL
    APPROVE --> SEQUENTIAL

    PARALLEL --> STATE
    SEQUENTIAL --> STATE

    STATE --> SEARCH
    STATE --> BROWSE
    STATE --> REASON

    STATE --> CRITIQUE
    CRITIQUE --> REPORT

    style GEMINI fill:#4285F4,color:#fff
    style STATE fill:#FBBC04,color:#000
```

### Key Characteristics

| Aspect | Details |
|--------|---------|
| **Model** | Gemini 3 Pro (most factual, reduced hallucinations) |
| **Planning** | Explicit multi-step plan shown to user |
| **Scale** | 80-160 search queries, 250K-900K tokens |
| **Recovery** | Async task manager with graceful error recovery |
| **Output** | Multi-pass self-critiqued report |

### Novel Features

1. **User-Approved Plans**: Unlike OpenAI, Gemini shows its research plan before execution
2. **Parallel Execution**: Intelligently runs independent subtasks concurrently
3. **Graceful Recovery**: Single failures don't restart the entire pipeline
4. **RL-Trained Planning**: Model learned planning through reinforcement learning, not prompting

```mermaid
stateDiagram-v2
    [*] --> Planning: Query received

    Planning --> UserReview: Plan generated
    UserReview --> Planning: User requests changes
    UserReview --> Executing: User approves

    Executing --> Executing: Parallel tasks
    Executing --> Recovery: Task fails
    Recovery --> Executing: Retry from checkpoint

    Executing --> Synthesizing: All tasks complete
    Synthesizing --> SelfCritique: Draft complete
    SelfCritique --> Synthesizing: Needs improvement
    SelfCritique --> [*]: Report finalized
```

---

## KnearMe Discovery Agent Architecture

KnearMe uses a simpler single-agent streaming architecture optimized for quick business onboarding.

### System Overview

```mermaid
graph TB
    subgraph "User Interface"
        CHAT[OnboardingChat<br/>Streaming UI]
    end

    subgraph "Single Agent"
        DISCOVERY[Discovery Agent<br/>Gemini 2.5 Flash]
        PROMPT[Static Persona<br/>~2.5K tokens, cached]
        STATE[Dynamic State Context]
    end

    subgraph "Tools"
        T1[showBusinessSearchResults<br/>Parallel: DataForSEO + Web]
        T2[confirmBusiness]
        T3[fetchReviews]
        T4[saveProfile]
        T5[showProfileReveal]
    end

    subgraph "Persistence"
        DB[(Supabase<br/>conversations + businesses)]
    end

    CHAT --> DISCOVERY
    PROMPT --> DISCOVERY
    STATE --> DISCOVERY

    DISCOVERY --> T1
    DISCOVERY --> T2
    DISCOVERY --> T3
    DISCOVERY --> T4
    DISCOVERY --> T5

    T1 --> DB
    T4 --> DB

    style DISCOVERY fill:#4CAF50,color:#fff
    style PROMPT fill:#9C27B0,color:#fff
```

### Key Characteristics

| Aspect | Details |
|--------|---------|
| **Model** | Gemini 2.5 Flash (fast, cost-effective) |
| **Planning** | Implicit via tool availability + state |
| **Iteration** | 1-3 tool calls per turn |
| **Duration** | 2-5 minutes total |
| **Output** | Profile data + celebration artifact |
| **Cost** | Low (cached prompt, minimal tokens) |

### Design Philosophy Comparison

```mermaid
quadrantChart
    title Agent Design Trade-offs
    x-axis Simple → Complex
    y-axis Fast → Thorough

    quadrant-1 Deep Research Territory
    quadrant-2 Over-engineered
    quadrant-3 Basic Chatbots
    quadrant-4 Task-Specific Agents

    OpenAI Deep Research: [0.85, 0.9]
    Gemini Deep Research: [0.75, 0.85]
    KnearMe Discovery: [0.3, 0.4]
    Basic RAG: [0.2, 0.2]
```

---

## Side-by-Side Comparison

### Architecture Patterns

| Pattern | OpenAI | Gemini | KnearMe |
|---------|--------|--------|---------|
| **Agent Type** | Multi-agent pipeline | Single agent + task manager | Single streaming agent |
| **Planning** | Implicit decomposition | Explicit user-approved plan | Tool-driven state machine |
| **Orchestration** | Sequential agents | Parallel task execution | Turn-by-turn streaming |
| **State Management** | Cross-agent context | Shared async state | DB-persisted conversation |
| **Error Recovery** | Retry individual agents | Checkpoint-based recovery | Circuit breaker + fallback |

### Capability Comparison

```mermaid
graph LR
    subgraph "Research Depth"
        RD1[OpenAI: 21+ sources, 28 min]
        RD2[Gemini: 80-160 queries]
        RD3[KnearMe: 1-2 API calls]
    end

    subgraph "Use Case Fit"
        UC1[OpenAI: Analyst-level reports]
        UC2[Gemini: Comprehensive synthesis]
        UC3[KnearMe: Quick data gathering]
    end

    subgraph "Cost Profile"
        CP1[OpenAI: $$$$ Extended reasoning]
        CP2[Gemini: $$$ Many tokens]
        CP3[KnearMe: $ Cached prompts]
    end

    style RD3 fill:#4CAF50,color:#fff
    style UC3 fill:#4CAF50,color:#fff
    style CP3 fill:#4CAF50,color:#fff
```

### Tool Usage Patterns

| Aspect | OpenAI | Gemini | KnearMe |
|--------|--------|--------|---------|
| **Search Queries** | 20-50+ iterative | 80-160 parallel | 1-2 targeted |
| **Content Analysis** | Full page reads, PDFs | Multi-format parsing | API responses only |
| **Code Execution** | Python for analysis | Available | Not needed |
| **Output Artifacts** | Long reports | Structured reports | UI artifacts (cards, reveal) |

---

## ReAct vs Plan-and-Execute

The 7 foundational agentic design patterns:

```mermaid
graph TB
    subgraph "Core Patterns"
        REACT[ReAct<br/>Thought → Action → Observe]
        REFLECT[Reflection<br/>Self-critique loop]
        TOOL[Tool Use<br/>External capabilities]
        PLAN[Planning<br/>Decomposition]
    end

    subgraph "Advanced Patterns"
        MULTI[Multi-Agent<br/>Specialized collaboration]
        SEQ[Sequential Workflows<br/>Deterministic pipelines]
        HUMAN[Human-in-the-Loop<br/>Approval gates]
    end

    REACT --> MULTI
    PLAN --> MULTI
    TOOL --> SEQ
    REFLECT --> HUMAN

    style REACT fill:#FF6B6B,color:#fff
    style MULTI fill:#4ECDC4,color:#fff
```

### Pattern Usage by System

| Pattern | OpenAI | Gemini | KnearMe |
|---------|--------|--------|---------|
| **ReAct** | ✅ Core loop | ✅ Internal | ✅ Implicit |
| **Reflection** | ✅ Multi-pass | ✅ Self-critique | ❌ Not needed |
| **Tool Use** | ✅ Heavy | ✅ Heavy | ✅ Moderate |
| **Planning** | ✅ Implicit | ✅ Explicit | ❌ State-driven |
| **Multi-Agent** | ✅ Pipeline | ❌ Single + tasks | ❌ Single |
| **Sequential** | ✅ Agent chain | ✅ Task ordering | ✅ Tool sequence |
| **Human-in-Loop** | ❌ Autonomous | ✅ Plan approval | ✅ Business confirmation |

---

## When to Use Each Pattern

```mermaid
flowchart TD
    START[Task Requirements] --> Q1{Needs comprehensive<br/>research?}

    Q1 -->|Yes| Q2{User needs to<br/>approve approach?}
    Q1 -->|No| Q3{Multiple specialized<br/>capabilities needed?}

    Q2 -->|Yes| GEMINI[Gemini Deep Research<br/>Explicit plan + approval]
    Q2 -->|No| OPENAI[OpenAI Deep Research<br/>Autonomous multi-agent]

    Q3 -->|Yes| MULTI[Multi-Agent System<br/>Specialized agents]
    Q3 -->|No| Q4{Interactive<br/>data gathering?}

    Q4 -->|Yes| KNEARME[Single Agent + Tools<br/>Like KnearMe Discovery]
    Q4 -->|No| SIMPLE[Basic ReAct Agent<br/>or RAG]

    style GEMINI fill:#4285F4,color:#fff
    style OPENAI fill:#10A37F,color:#fff
    style KNEARME fill:#4CAF50,color:#fff
```

### Recommendations

| Use Case | Recommended Pattern |
|----------|-------------------|
| **Analyst-level research reports** | OpenAI Deep Research |
| **User-guided comprehensive research** | Gemini Deep Research |
| **Quick interactive data gathering** | Single agent + tools (KnearMe style) |
| **Complex multi-domain tasks** | Multi-agent orchestration |
| **Simple Q&A with context** | Basic ReAct or RAG |

---

## Emerging Trends (2025-2026)

### Industry Shifts

1. **Multi-Agent Surge**: Gartner reports 1,445% increase in multi-agent system inquiries (Q1 2024 → Q2 2025)
2. **Framework Consolidation**: Microsoft merging AutoGen + Semantic Kernel (GA Q1 2026)
3. **Task Duration Growth**: AI task duration doubling every 7 months (1hr → 8hr by late 2026)
4. **Enterprise Adoption**: 40% of enterprise apps will embed AI agents by end of 2026

### Architectural Evolution

```mermaid
timeline
    title Agent Architecture Evolution
    2024 : Single agents with tools
         : ReAct pattern dominance
         : Basic orchestration
    2025 : Multi-agent pipelines
         : Deep research agents
         : MCP standardization
    2026 : Agent teams/factories
         : 8-hour autonomous tasks
         : Universal tool protocols
```

### Protocol Standards

- **MCP (Model Context Protocol)**: Anthropic's "USB-C for AI" standardizing tool connections
- **AG-UI / A2UI**: Emerging standards for agent user interfaces
- **Intent-Driven Surfaces**: Agents that "show, not just tell"

---

## KnearMe Architecture Alignment

### Current State Assessment

| Aspect | Industry Best Practice | KnearMe Status |
|--------|----------------------|----------------|
| **Single vs Multi-Agent** | Start simple, scale when needed | ✅ Appropriately simple |
| **Tool Abstraction** | MCP-style standardization | ⚠️ Custom implementation |
| **State Management** | Persistent, recoverable | ✅ DB-persisted |
| **Error Resilience** | Circuit breakers, fallbacks | ✅ Implemented |
| **User Control** | Approval gates where needed | ✅ Business confirmation |

### Potential Evolution Path

```mermaid
graph LR
    subgraph "Current"
        NOW[Single Discovery Agent<br/>Business onboarding]
    end

    subgraph "Near-term"
        STORY[Story Agent<br/>Project narratives]
        DESIGN[Design Agent<br/>Portfolio layout]
    end

    subgraph "Future"
        ORCH[Account Manager<br/>Orchestrator]
        RESEARCH[Research Agent<br/>Competitor analysis]
    end

    NOW --> STORY
    NOW --> DESIGN
    STORY --> ORCH
    DESIGN --> ORCH
    ORCH --> RESEARCH

    style NOW fill:#4CAF50,color:#fff
    style ORCH fill:#9C27B0,color:#fff
```

### When KnearMe Should Evolve

| Trigger | Response |
|---------|----------|
| Single agent degrading with more tools | Add specialized sub-agents |
| Users need comprehensive market research | Consider deep research pattern |
| Cross-domain tasks (design + content + SEO) | Multi-agent orchestration |
| Tasks exceeding 10-minute duration | Plan-and-execute with checkpoints |

---

## Sources

- [Deep Research Agents: A Systematic Examination And Roadmap](https://arxiv.org/abs/2506.18096) - arXiv
- [How OpenAI's Deep Research Works](https://blog.promptlayer.com/how-deep-research-works/) - PromptLayer
- [Deep Research API with the Agents SDK](https://cookbook.openai.com/examples/deep_research_api/introduction_to_deep_research_api_agents) - OpenAI Cookbook
- [Gemini Deep Research Agent](https://ai.google.dev/gemini-api/docs/deep-research) - Google AI
- [Build with Gemini Deep Research](https://blog.google/technology/developers/deep-research-agent-gemini-api/) - Google Blog
- [How OpenAI, Gemini, and Claude Use Agents to Power Deep Research](https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use) - ByteByteGo
- [7 Must-Know Agentic AI Design Patterns](https://machinelearningmastery.com/7-must-know-agentic-ai-design-patterns/) - MachineLearningMastery
- [Choose a design pattern for your agentic AI system](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system) - Google Cloud
- [Demystifying AI Agents: ReAct-Style Agents vs Agentic Workflows](https://medium.com/@DanGiannone/demystifying-ai-agents-react-style-agents-vs-agentic-workflows-cedca7e26471) - Medium
- [Model Context Protocol (MCP)](https://www.anthropic.com/news/model-context-protocol) - Anthropic
- [Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) - Anthropic Engineering

---

*Last updated: January 2026*
