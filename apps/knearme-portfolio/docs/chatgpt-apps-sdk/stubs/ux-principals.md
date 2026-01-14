# UX Principles

> Source: https://developers.openai.com/apps-sdk/concepts/ux-principles

## Overview

Creating a great ChatGPT app focuses on delivering a "focused, conversational experience that feels native to ChatGPT."

The objective is designing experiences that remain consistent and valuable while enhancing ChatGPT conversations with genuine utility. Favorable applications include booking transportation, ordering meals, checking availability, or monitoring deliveries—conversational tasks that are time-sensitive with clear visual summaries and actionable outcomes.

Unfavorable examples encompass replicating extensive website content, demanding intricate workflows, or incorporating advertisements or irrelevant communications.

## Principles for Great App UX

An app should excel at something _better_ by existing in ChatGPT through:

- **Conversational leverage** – Natural language, thread context, and iterative guidance enable workflows traditional interfaces cannot support
- **Native fit** – The app appears seamlessly integrated into ChatGPT with smooth transitions between language model and custom tools
- **Composability** – Operations function as discrete, reusable components the model combines with other applications for comprehensive task resolution

Apps should also _improve ChatGPT user experience_ by delivering novel information, new capabilities, or superior information presentation.

### 1. Extract, Don't Port

Concentrate on primary user jobs within your product. Rather than replicating complete websites or native applications, isolate several foundational actions as tools. Each tool should expose only essential inputs and outputs enabling the model to proceed confidently.

### 2. Design for Conversational Entry

Anticipate users arriving mid-conversation with specific objectives or uncertain intent. Support:

- Open-ended requests (e.g., "Help me plan a team offsite")
- Precise instructions (e.g., "Book the conference room Thursday at 3pm")
- Initial onboarding (train new users for ChatGPT engagement)

### 3. Design for the ChatGPT Environment

ChatGPT supplies conversational interface. Deploy your UI strategically to clarify actions, solicit inputs, or display organized findings. Exclude decorative elements not advancing the current objective; depend on conversation for relevant history, verification, and continuation.

### 4. Optimize for Conversation, Not Navigation

The model manages state and navigation. Your app delivers:

- "Clear, declarative actions with well-typed parameters"
- Succinct responses maintaining conversation momentum (tables, lists, brief passages rather than comprehensive dashboards)
- Constructive suggestions supporting continued user engagement

### 5. Embrace the Ecosystem Moment

Emphasize your app's ChatGPT distinctiveness:

- Accommodate sophisticated natural language instead of structured forms
- Customize using conversation-derived context
- (Optional) Integrate with alternate apps when reducing user time or cognitive effort

## Checklist Before Publishing

Evaluate your app against these yes/no criteria. Negative responses reveal enhancement opportunities for improved distribution eligibility once submissions open.

Note: Individual app evaluations occur case-by-case; affirmative responses to all questions don't guarantee distribution—they establish baseline ChatGPT suitability.

Reference the [App Developer Guidelines](/apps-sdk/app-developer-guidelines) for mandatory publishing requirements.

- **Conversational value** – Does a primary capability leverage ChatGPT's abilities (natural language, conversation context, iterative dialog)?
- **Beyond base ChatGPT** – Does the app supply knowledge, actions, or presentation unavailable without it (proprietary data, specialized interface, structured workflow)?
- **Atomic, model-friendly actions** – Are tools independent, standalone, and explicitly parameterized allowing model invocation without supplementary questions?
- **Helpful UI only** – Would replacing custom elements with plain text substantially diminish user experience?
- **End-to-end in-chat completion** – Can users accomplish meaningful objectives without exiting ChatGPT or managing external windows?
- **Performance & responsiveness** – Does the app react promptly maintaining chat rhythm?
- **Discoverability** – Can you envision prompts where the model would select this app with confidence?
- **Platform fit** – Does the app leverage core platform capabilities (comprehensive prompts, existing context, multi-tool integration, multimodality, or memory)?

### Avoid:

- "Long-form or static content better suited for a website or app"
- "Complex multi-step workflows" exceeding inline or fullscreen capabilities
- Advertising, upgrades, or extraneous communications
- Direct exposure of confidential information visible to observers
- Duplicating ChatGPT system operations (e.g., recreating input composition)

## Next Steps

After confirming your app delivers strong UX, enhance the interface using [UI guidelines](/apps-sdk/concepts/ui-guidelines).
