/**
 * Audio Transcription API - Transcribe voice recordings using Whisper.
 *
 * POST /api/ai/transcribe
 *
 * Transcribes voice interview recordings into text for content generation.
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { transcribeAudio, cleanTranscription } from '@/lib/ai/transcription';

/**
 * Transcription constraints.
 *
 * @see Whisper limits: https://platform.openai.com/docs/guides/speech-to-text
 */
/** Allowed MIME types for audio transcription */
const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Type guard for allowed MIME types */
function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

const TRANSCRIPTION_CONSTRAINTS = {
  /** Maximum file size in bytes (10MB - conservative limit, Whisper max is 25MB) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Minimum file size in bytes (1KB - prevents empty recordings) */
  MIN_FILE_SIZE_BYTES: 1000,
} as const;

/**
 * Request schema for audio transcription.
 */
const transcribeSchema = z.object({
  /** Project ID for the interview */
  project_id: z.string().uuid(),
  /** Question ID being answered */
  question_id: z.string(),
  /** Question text for context */
  question_text: z.string(),
});

/**
 * POST /api/ai/transcribe
 *
 * Accepts multipart form data with audio file and metadata.
 * Returns transcribed text.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const metadataJson = formData.get('metadata') as string | null;

    if (!audioFile) {
      return apiError('VALIDATION_ERROR', 'No audio file provided');
    }

    // Validate audio file size
    if (audioFile.size > TRANSCRIPTION_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
      const maxMB = TRANSCRIPTION_CONSTRAINTS.MAX_FILE_SIZE_BYTES / (1024 * 1024);
      return apiError(
        'VALIDATION_ERROR',
        `Audio file too large. Maximum size is ${maxMB}MB.`
      );
    }

    if (audioFile.size < TRANSCRIPTION_CONSTRAINTS.MIN_FILE_SIZE_BYTES) {
      return apiError(
        'VALIDATION_ERROR',
        'Recording is too short. Please try again with a longer recording.'
      );
    }

    // Validate audio MIME type
    const mimeType = audioFile.type.split(';')[0] ?? ''; // Strip codec params like "audio/webm;codecs=opus"
    if (!mimeType || !isAllowedMimeType(mimeType)) {
      return apiError(
        'VALIDATION_ERROR',
        `Unsupported audio format: ${mimeType}. Please use webm, mp4, mp3, or wav.`
      );
    }

    // Convert File to Blob for transcription
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

    // Transcribe audio
    const result = await transcribeAudio(audioBlob, audioFile.name);

    if ('error' in result) {
      return apiError('AI_SERVICE_ERROR', result.error);
    }

    // Clean up the transcription
    const cleanedText = cleanTranscription(result.text);

    // If metadata provided, store in interview session (interview flow)
    // Otherwise, just return transcription (chat flow)
    if (metadataJson) {
      // Parse and validate metadata
      let metadata: unknown;
      try {
        metadata = JSON.parse(metadataJson);
      } catch {
        return apiError('VALIDATION_ERROR', 'Invalid metadata JSON');
      }

      const parsed = transcribeSchema.safeParse(metadata);
      if (!parsed.success) {
        return apiError('VALIDATION_ERROR', 'Invalid metadata', {
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { project_id, question_id, question_text } = parsed.data;
      const supabase = await createClient();

      // Verify project ownership
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, contractor_id')
        .eq('id', project_id)
        .eq('contractor_id', contractor.id)
        .single();

      if (projectError || !project) {
        return apiError('NOT_FOUND', 'Project not found');
      }

      // Store the Q&A in interview session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingSession } = await (supabase as any)
        .from('interview_sessions')
        .select('*')
        .eq('project_id', project_id)
        .single();

      // Type assertion for session data
      type TranscribeSessionData = {
        questions?: Array<{
          id: string;
          text?: string;
          purpose?: string;
          answer?: string;
          raw_transcription?: string;
          duration?: number;
        }>;
        raw_transcripts?: string[];
      };
      const sessionData = existingSession as TranscribeSessionData | null;

      // Build questions array with this response (preserve order and metadata)
      const existingQuestions = (sessionData?.questions || []) as TranscribeSessionData['questions'];
      const hasExisting = existingQuestions?.some((q) => q.id === question_id) ?? false;
      const updatedQuestions = (existingQuestions || []).map((question) => {
        if (question.id !== question_id) return question;
        return {
          ...question,
          id: question_id,
          text: question_text,
          answer: cleanedText,
          raw_transcription: result.text,
          duration: result.duration,
        };
      });

      if (!hasExisting) {
        updatedQuestions.push({
          id: question_id,
          text: question_text,
          answer: cleanedText,
          raw_transcription: result.text,
          duration: result.duration,
        });
      }

      // Update raw transcripts array
      const existingTranscripts = sessionData?.raw_transcripts || [];

      // Upsert interview session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: sessionError } = await (supabase as any).from('interview_sessions').upsert(
        {
          project_id,
          questions: updatedQuestions,
          raw_transcripts: [...existingTranscripts, result.text],
          status: 'in_progress',
        },
        {
          onConflict: 'project_id',
        }
      );

      if (sessionError) {
        console.error('[POST /api/ai/transcribe] Session error:', sessionError);
        // Don't fail - transcription still succeeded
      }
    }

    return apiSuccess({
      text: cleanedText,
      transcription: cleanedText, // Alias for compatibility
      raw: result.text,
      duration: result.duration,
      language: result.language,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
