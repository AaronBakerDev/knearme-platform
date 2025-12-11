# EPIC-003: AI Interview Flow

> **Version:** 1.1
> **Last Updated:** December 10, 2025
> **Status:** Ready for Development
> **Priority:** Must Have (MVP) - CRITICAL PATH

---

## Overview

The AI Interview is the core value proposition of KnearMe. This epic covers the complete flow from image analysis through voice interview to AI-generated content. The contractor uploads photos, AI analyzes them, asks 3-5 targeted questions via voice or text, then generates a professional project showcase.

### Business Value

- **Core Differentiator**: "Post in 30 seconds" relies entirely on this flow working smoothly
- **Content Quality**: AI-generated descriptions are SEO-optimized and professional
- **Time Savings**: Replaces 30+ minutes of writing with 2-3 minutes of voice input
- **Accessibility**: Voice-first design works for contractors who don't type well

### AI Provider Strategy (OpenAI Unified)

| Component | Provider | API | Cost |
|-----------|----------|-----|------|
| **Image Analysis** | OpenAI GPT-4o | `responses.parse()` | $2.50/1M in, $10/1M out |
| **Voice Transcription** | OpenAI Whisper | `audio.transcriptions.create()` | $0.006/minute |
| **Content Generation** | OpenAI GPT-4o | `responses.parse()` | $2.50/1M in, $10/1M out |

**Why OpenAI Only:**
- Unified provider = single API key, single billing, consistent error handling
- Type-safe outputs with Zod schemas via Responses API
- GPT-4o excels at construction/trade image understanding
- See [ADR-003](/docs/05-decisions/adr/ADR-003-openai.md) for full rationale

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Interview completion rate | >85% | Funnel analytics |
| AI content first-try approval | >70% | Track regenerations |
| Average completion time | <3 min | Event timestamps |
| Voice vs text usage | 60/40 | Input tracking |

---

## User Stories

### US-003-01: Image Analysis & Project Type Detection

**As a** contractor who uploaded photos
**I want to** have the AI automatically detect what type of project this is
**So that** I don't have to manually categorize my work

#### Acceptance Criteria

- Given I have uploaded 1-10 photos
- When the AI analysis begins
- Then I see "Analyzing your photos..." with a loading state
- And analysis completes within 10 seconds

- Given analysis is complete
- When results are ready
- Then I see "Looks like a [Project Type] project with [Materials]"
- And I can confirm or correct the detection

- Given AI has low confidence (<70%)
- When showing results
- Then I see "Not sure about this one. What type of project is this?"
- And I can select from a list or type custom

**Detection Outputs:**
| Field | Example | Confidence Shown |
|-------|---------|------------------|
| Project Type | "Chimney Rebuild" | Yes, if <90% |
| Materials | ["red brick", "portland mortar"] | No |
| Image Classification | [before, after, process] | No |

#### Technical Notes

- **Provider**: OpenAI GPT-4o (vision)
- **API**: Responses API with `responses.parse()` and Zod schemas
- **Endpoint**: `POST /api/ai/analyze-images`
- **Input**: Array of image URLs from storage
- **Output**: Type-safe `ImageAnalysisResult` via Zod validation
- **Fallback**: Manual selection if API fails or timeout

```typescript
// OpenAI Responses API call with structured outputs
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ImageAnalysisSchema } from './schemas';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeImages = async (imageUrls: string[]) => {
  const inputContent: OpenAI.Responses.ResponseInputItem[] = [
    {
      type: 'message',
      role: 'user',
      content: [
        { type: 'input_text', text: 'Analyze these masonry project images...' },
        ...imageUrls.map(url => ({
          type: 'input_image' as const,
          image_url: url,
        })),
      ],
    },
  ];

  const response = await openai.responses.parse({
    model: 'gpt-4o',
    instructions: IMAGE_ANALYSIS_PROMPT,
    input: inputContent,
    text: {
      format: zodResponseFormat(ImageAnalysisSchema, 'image_analysis'),
    },
    max_output_tokens: 500,
  });

  return response.output_parsed; // Type-safe ImageAnalysisResult
};
```

---

### US-003-02: Project Type Confirmation

**As a** contractor reviewing AI detection
**I want to** confirm or correct the project type
**So that** my project is categorized accurately

#### Acceptance Criteria

- Given AI detected a project type with high confidence
- When I see the confirmation screen
- Then I see two options: "Yes, that's right" / "No, let me describe it"

- Given I tap "Yes, that's right"
- When confirmed
- Then the project type is saved
- And I proceed to interview questions

- Given I tap "No, let me describe it"
- When the correction screen opens
- Then I see a list of project types to select
- Or I can type a custom description

**Project Type Options:**
- Chimney Repair
- Chimney Rebuild
- Tuckpointing
- Brick Repair
- Stone Work
- Retaining Wall
- Concrete Steps
- Foundation Repair
- Historic Restoration
- Other (specify)

#### Technical Notes

- **UI**: Bottom sheet or modal with large touch targets
- **Database**: Updates `project_type` and `project_type_slug`
- **Slug Generation**: Auto-generate URL-friendly slug

---

### US-003-03: Voice Recording Interface

**As a** contractor answering interview questions
**I want to** hold a button and speak my answer
**So that** I can respond naturally without typing

#### Acceptance Criteria

- Given I am on an interview question
- When I press and hold the microphone button
- Then recording begins immediately
- And I see a visual indicator (pulse animation)
- And elapsed time is displayed

- Given I am recording
- When I release the button
- Then recording stops
- And my audio is sent for transcription
- And I see "Processing..." briefly

- Given I recorded my answer
- When transcription completes
- Then I see my words displayed as text
- And I can re-record if needed

**Voice Recording Specs:**
| Parameter | Value |
|-----------|-------|
| Min duration | 1 second |
| Max duration | 60 seconds |
| Format | WebM/Opus or WAV |
| Sample rate | 16kHz mono |

#### Technical Notes

- **API**: MediaRecorder Web API
- **Format**: WebM/Opus preferred (smaller), WAV fallback
- **Streaming**: Optional real-time transcription (Phase 2)
- **Permissions**: Request mic on first use

```typescript
const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, audioBlob, startRecording, stopRecording };
};
```

---

### US-003-04: Voice Transcription

**As a** contractor who recorded an answer
**I want to** see my words converted to text
**So that** I can verify my answer was captured correctly

#### Acceptance Criteria

- Given I have recorded audio
- When sent for transcription
- Then transcription completes within 5 seconds
- And text appears below the audio waveform

- Given transcription fails
- When the error occurs
- Then I see "Couldn't transcribe. Try again or type instead."
- And I can re-record or switch to text

- Given background noise is high
- When transcription completes
- Then low-confidence words are highlighted
- And I can tap to correct them (Phase 2)

#### Technical Notes

- **Provider**: OpenAI Whisper API
- **Endpoint**: `POST /api/ai/transcribe`
- **Model**: `whisper-1`
- **Cost**: ~$0.006/minute
- **Language**: English (en)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await openai.audio.transcriptions.create({
    file: formData.get('file') as File,
    model: 'whisper-1',
  });

  return response.text;
};
```

---

### US-003-05: Text Input Fallback

**As a** contractor who prefers typing
**I want to** type my answers instead of speaking
**So that** I can use the app in quiet situations

#### Acceptance Criteria

- Given I am on an interview question
- When I tap "Type instead"
- Then the voice button is replaced with a text area
- And I can type my answer

- Given I started with voice but want to switch
- When I tap "Type instead"
- Then any partial transcription is preserved in the text field
- And I can edit or replace it

- Given I typed a short answer (<20 chars)
- When I try to continue
- Then I see a suggestion "Add more detail for a better showcase"
- But I can still proceed

#### Technical Notes

- **UI**: Expandable textarea, auto-grows
- **Min chars**: Soft warning at 20 chars
- **Max chars**: 500 per answer (prevent abuse)
- **Persistence**: Answers saved on blur

---

### US-003-06: Quick-Select Options

**As a** contractor answering common questions
**I want to** tap pre-written options
**So that** I can answer quickly without speaking or typing

#### Acceptance Criteria

- Given I am on the duration question
- When I see the question
- Then I see quick-select buttons: "1 day" / "2-3 days" / "4-5 days" / "1 week+"

- Given I tap a quick-select option
- When selected
- Then my answer is recorded
- And I automatically proceed to the next question

- Given quick-select doesn't match my situation
- When I want to customize
- Then I can tap "Other" and type/speak a custom answer

**Questions with Quick-Select:**
| Question | Options |
|----------|---------|
| How long did this take? | 1 day / 2-3 days / 4-5 days / 1 week+ |
| What was the main challenge? | Weather / Access / Materials / Structural |

#### Technical Notes

- **UI**: Large button chips, single-select
- **Analytics**: Track which options are most used
- **Customization**: "Other" option always available

---

### US-003-07: Question Skip

**As a** contractor in a hurry
**I want to** skip optional questions
**So that** I can complete the interview faster

#### Acceptance Criteria

- Given I am on an optional question
- When I tap "Skip"
- Then I proceed to the next question
- And no answer is recorded for that question

- Given I am on a required question (first 2)
- When I view the question
- Then there is no skip option visible

- Given I skipped questions
- When AI generates content
- Then it works with available information
- And may produce shorter descriptions

**Question Requirements:**
| Question | Required | Skip Allowed |
|----------|----------|--------------|
| Q1: What was the problem? | Yes | No |
| Q2: How did you solve it? | Yes | No |
| Q3: Anything special? | No | Yes |
| Q4: How long? | No | Yes |

#### Technical Notes

- **Database**: Null answer stored for skipped questions
- **AI Prompt**: Adjust to handle missing information
- **Analytics**: Track skip rates per question

---

### US-003-08: Re-Record Capability

**As a** contractor who made a mistake
**I want to** re-record my answer
**So that** I can correct errors before submission

#### Acceptance Criteria

- Given I have recorded and transcribed an answer
- When I tap "Re-record"
- Then the previous recording is discarded
- And I can record a new answer

- Given I want to edit the transcription
- When I tap on the text
- Then it becomes editable
- And I can make corrections manually

- Given I re-record multiple times
- When I do
- Then only the final recording is saved
- And previous attempts are not stored

#### Technical Notes

- **UX**: Clear visual indication of "recorded" state
- **Storage**: Only final audio stored (conserve space)
- **Timeout**: Auto-advance after 30s of inactivity

---

### US-003-09: Interview Question Flow

**As a** contractor going through the interview
**I want to** answer 3-5 contextual questions
**So that** the AI has enough information to write a good description

#### Acceptance Criteria

- Given I confirmed the project type
- When the interview begins
- Then I see questions one at a time
- And progress indicator shows current/total

- Given the AI detected "Chimney Rebuild"
- When generating questions
- Then questions are tailored to chimney work
- Example: "What was wrong with the old chimney?"

- Given I answered all questions
- When complete
- Then I see "Generating your project showcase..."
- And AI generation begins

**Standard Question Set:**
1. "What problem did the customer have?" (Required)
2. "How did you solve it? Walk me through the work." (Required)
3. "Anything special about this project?" (Optional)
4. "How long did the job take?" (Optional, quick-select)

#### Technical Notes

- **State Machine**: Track interview progress
- **Question Generation**: Can be dynamic based on project type (Phase 2)
- **Timeout**: Save progress if user leaves

```typescript
type InterviewState =
  | 'uploading'
  | 'analyzing'
  | 'confirming'
  | 'question_1'
  | 'question_2'
  | 'question_3'
  | 'question_4'
  | 'generating'
  | 'reviewing'
  | 'complete';

interface InterviewSession {
  id: string;
  projectId: string;
  state: InterviewState;
  imageAnalysis: ImageAnalysisResult | null;
  questions: QuestionAnswer[];
  generatedContent: GeneratedContent | null;
}
```

---

### US-003-10: AI Content Generation

**As a** contractor who completed the interview
**I want to** have AI generate a professional project description
**So that** I don't have to write it myself

#### Acceptance Criteria

- Given I completed all required questions
- When AI generation starts
- Then I see "Creating your showcase..." (5-15 seconds)
- And a progress indicator

- Given generation completes
- When results are ready
- Then I see the generated title and description
- And image gallery with AI-suggested order
- And tags/keywords

- Given generation fails
- When the error occurs
- Then I see "Something went wrong. Trying again..."
- And auto-retry once
- If still failing: "Please try again or contact support"

**Generated Content:**
| Field | Length | Example |
|-------|--------|---------|
| Title | 60-80 chars | "Historic Brick Chimney Rebuild in Denver" |
| Description | 400-600 words | Full narrative (see prompt below) |
| Tags | 5-10 | chimney, brick, denver, rebuild, masonry |
| SEO Meta | 150-160 chars | "Professional chimney rebuild services..." |
| Alt Text | Per image | "Before photo showing damaged chimney..." |

#### Technical Notes

- **Provider**: OpenAI GPT-4o
- **API**: Responses API with `responses.parse()` and Zod schemas
- **Endpoint**: `POST /api/ai/generate-content`
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Output Tokens**: 1500

```typescript
// OpenAI Responses API with type-safe structured outputs
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { GeneratedContentSchema } from './schemas';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateContent = async (
  imageAnalysis: ImageAnalysisResult,
  interviewResponses: Array<{ question: string; answer: string }>,
  businessContext: BusinessContext
): Promise<GeneratedContent> => {
  const response = await openai.responses.parse({
    model: 'gpt-4o',
    instructions: CONTENT_GENERATION_PROMPT,
    input: buildContentGenerationMessage(imageAnalysis, interviewResponses, businessContext),
    text: {
      format: zodResponseFormat(GeneratedContentSchema, 'generated_content'),
    },
    max_output_tokens: 1500,
    temperature: 0.7,
  });

  return response.output_parsed; // Type-safe GeneratedContent
};
```

---

### US-003-11: Content Regeneration

**As a** contractor reviewing AI-generated content
**I want to** request a new version if I don't like it
**So that** I have control over my portfolio content

#### Acceptance Criteria

- Given I am reviewing generated content
- When I tap "Regenerate"
- Then a new version is generated
- And I can compare to the previous version

- Given I regenerate multiple times
- When viewing options
- Then I can see up to 3 previous versions
- And select the one I prefer

- Given I regenerated 5 times
- When I try again
- Then I see "Reached regeneration limit. Edit manually or contact support."

#### Technical Notes

- **Limit**: 5 regenerations per project
- **Variation**: Slightly different prompt each time
- **Storage**: Store all versions in `generated_content` JSONB
- **Analytics**: Track regeneration rate for prompt tuning

---

### US-003-12: Interview Session Persistence

**As a** contractor who gets interrupted
**I want to** resume my interview where I left off
**So that** I don't lose my progress

#### Acceptance Criteria

- Given I started an interview but didn't finish
- When I return to the app within 24 hours
- Then I see "Continue your project?" prompt
- And I can resume from where I stopped

- Given my session expired (>24 hours)
- When I return
- Then I see my photos but must restart the interview
- And previous answers are discarded

- Given I want to start over
- When I tap "Start Fresh"
- Then interview resets
- And photos are kept

#### Technical Notes

- **Database**: `interview_sessions` table with `status`
- **Cleanup**: Cron job expires sessions >24 hours
- **Recovery**: localStorage backup of current question

---

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Image analysis time | <10s | Gemini API |
| Voice transcription time | <5s | Whisper API |
| Content generation time | <15s | GPT-4o |
| Interview completion rate | >85% | Funnel metric |
| Voice recording quality | 16kHz mono | Whisper optimal |

---

## Cost Projections (OpenAI Unified)

**Per Project (Average Case):**

| Component | Usage | Cost |
|-----------|-------|------|
| GPT-4o Image Analysis | ~500 tokens in/out | ~$0.08 |
| Whisper Transcription | ~2 minutes | ~$0.02 |
| GPT-4o Content Generation | ~2000 tokens | ~$0.05 |
| **Total per project** | | **~$0.15** |

**Monthly Projections:**

| Projects/Month | AI Cost | Notes |
|----------------|---------|-------|
| 100 | $15 | Soft launch |
| 500 | $75 | Growth phase |
| 2,000 | $300 | Scale |

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| EPIC-002 | Internal | Requires uploaded photos |
| EPIC-004 | Internal | Feeds into publishing |
| OpenAI API | External | GPT-4o (vision + generation) + Whisper |

---

## Out of Scope

- Real-time streaming transcription (Phase 2)
- Multi-language support (English only MVP)
- Voice assistant mode (Phase 3)
- Custom question sets per contractor (Phase 2)

---

## UI/UX Specifications

### Analysis Screen

```
┌─────────────────────────────────────┐
│                                       │
│        🔍 Analyzing Photos...         │
│                                       │
│        [========      ] 60%           │
│                                       │
│    Looking for project details        │
│                                       │
└─────────────────────────────────────┘
```

### Confirmation Screen

```
┌─────────────────────────────────────┐
│                                       │
│    📷 [Photo thumbnails]              │
│                                       │
│    Looks like a...                    │
│                                       │
│    ┌─────────────────────────────┐   │
│    │                             │   │
│    │     Chimney Rebuild         │   │
│    │     with red brick          │   │
│    │                             │   │
│    └─────────────────────────────┘   │
│                                       │
│    [Yes, that's right]                │
│                                       │
│    [No, let me describe it]           │
│                                       │
└─────────────────────────────────────┘
```

### Voice Recording Screen

```
┌─────────────────────────────────────┐
│    Question 1 of 4                    │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                       │
│    What problem did the               │
│    customer have?                     │
│                                       │
│                                       │
│              ┌────────┐               │
│              │        │               │
│              │   🎤   │               │
│              │ HOLD   │               │
│              │        │               │
│              └────────┘               │
│         Hold to speak                 │
│                                       │
│         [Type instead]                │
│                                       │
│    ┌─────────────────────────────┐   │
│    │ "The chimney was falling    │   │
│    │ apart, bricks were loose    │   │
│    │ and the mortar was..."      │   │
│    └─────────────────────────────┘   │
│                                       │
│    [Re-record]       [Continue →]     │
│                                       │
└─────────────────────────────────────┘
```

### Generation Loading Screen

```
┌─────────────────────────────────────┐
│                                       │
│        ✨ Creating Your Showcase      │
│                                       │
│        [================  ] 80%       │
│                                       │
│    Writing professional description   │
│                                       │
│    ┌─────────────────────────────┐   │
│    │ ✓ Analyzed photos           │   │
│    │ ✓ Transcribed responses     │   │
│    │ ⟳ Generating content...     │   │
│    │ ○ Adding SEO optimization   │   │
│    └─────────────────────────────┘   │
│                                       │
└─────────────────────────────────────┘
```

---

## Error Handling

| Error | User Message | Recovery |
|-------|--------------|----------|
| Mic permission denied | "Please allow microphone access" | Link to settings |
| Analysis timeout | "Taking longer than expected..." | Auto-retry |
| Transcription failed | "Couldn't hear that clearly" | Re-record option |
| Generation failed | "Something went wrong" | Auto-retry, then support |
| API rate limit | "High demand, please wait" | Retry after delay |

---

## Test Scenarios

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| AI-T01 | Upload chimney photos | Correctly identifies type |
| AI-T02 | Upload unclear photos | Low confidence, asks for input |
| AI-T03 | Record 30-second answer | Transcription accurate |
| AI-T04 | Record with background noise | Reasonable transcription |
| AI-T05 | Skip optional questions | Generation still works |
| AI-T06 | Complete all questions | High-quality description |
| AI-T07 | Regenerate 3 times | Different variations |
| AI-T08 | Resume interrupted session | Continues from last question |
| AI-T09 | API timeout | Graceful error, retry |
| AI-T10 | Voice button on desktop | Works with USB mic |

---

## Interview Session Data Model

```typescript
interface InterviewSession {
  id: string;
  project_id: string;
  status: 'in_progress' | 'completed' | 'approved';

  // Image analysis results (Gemini)
  image_analysis: {
    project_type: string;
    project_type_confidence: number;
    materials: string[];
    image_classifications: ('before' | 'after' | 'process')[];
  };

  // Q&A pairs
  questions: {
    question: string;
    answer: string | null;
    voice_url: string | null;
    answered_at: string | null;
    skipped: boolean;
  }[];

  // Raw transcripts for debugging
  raw_transcripts: string[];

  // Generated content (GPT-4o)
  generated_content: {
    title: string;
    description: string;
    tags: string[];
    seo_meta_description: string;
    image_alt_texts: string[];
    version: number;
  } | null;

  created_at: string;
  updated_at: string;
}
```

---

*This epic is the critical path. The entire value proposition depends on a smooth, fast AI interview experience.*
