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

    if (!metadataJson) {
      return apiError('VALIDATION_ERROR', 'No metadata provided');
    }

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

    // Convert File to Blob for transcription
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

    // Transcribe audio
    const result = await transcribeAudio(audioBlob, audioFile.name);

    if ('error' in result) {
      return apiError('AI_SERVICE_ERROR', result.error);
    }

    // Clean up the transcription
    const cleanedText = cleanTranscription(result.text);

    // Store the Q&A in interview session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSession } = await (supabase as any)
      .from('interview_sessions')
      .select('*')
      .eq('project_id', project_id)
      .single();

    // Type assertion for session data
    type TranscribeSessionData = {
      questions?: Record<string, unknown>[];
      raw_transcripts?: string[];
    };
    const sessionData = existingSession as TranscribeSessionData | null;

    // Build questions array with this response
    const existingQuestions = (sessionData?.questions || []) as Record<string, unknown>[];
    const updatedQuestions = [
      ...existingQuestions.filter((q: Record<string, unknown>) => q.id !== question_id),
      {
        id: question_id,
        text: question_text,
        answer: cleanedText,
        raw_transcription: result.text,
        duration: result.duration,
      },
    ];

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

    return apiSuccess({
      transcription: cleanedText,
      raw: result.text,
      duration: result.duration,
      language: result.language,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
