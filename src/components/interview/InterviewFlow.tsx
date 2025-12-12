'use client';

/**
 * AI Interview Flow component.
 * Guides contractors through voice/text questions after image analysis.
 *
 * Flow:
 * 1. Load questions based on image analysis
 * 2. Present each question one at a time
 * 3. Capture voice or text response
 * 4. Move to next question
 * 5. Generate content when complete
 *
 * @see /docs/02-requirements/user-journeys.md J2
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VoiceRecorder } from './VoiceRecorder';
import { cn } from '@/lib/utils';

export interface InterviewQuestion {
  id: string;
  text: string;
  purpose: string;
}

export interface InterviewResponse {
  question_id: string;
  question_text: string;
  answer: string;
}

interface InterviewFlowProps {
  /** Project ID for API calls */
  projectId: string;
  /** Pre-loaded questions or null to fetch */
  questions?: InterviewQuestion[];
  /** Called when all questions are answered */
  onComplete: (responses: InterviewResponse[]) => void;
  /** Called if user wants to skip interview */
  onSkip?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * InterviewFlow component - guides contractors through Q&A.
 */
export function InterviewFlow({
  projectId,
  questions: initialQuestions,
  onComplete,
  onSkip,
  className,
}: InterviewFlowProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(!initialQuestions);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai/generate-content?action=questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to load questions');
      }

      const data = await res.json();
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch questions if not provided
  useEffect(() => {
    if (!initialQuestions) {
      fetchQuestions();
    }
  }, [initialQuestions, fetchQuestions]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  /**
   * Handle voice recording completion.
   */
  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!currentQuestion) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append(
        'metadata',
        JSON.stringify({
          project_id: projectId,
          question_id: currentQuestion.id,
          question_text: currentQuestion.text,
        })
      );

      // Transcribe audio
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Transcription failed');
      }

      const data = await res.json();

      // Store response
      const response: InterviewResponse = {
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        answer: data.transcription,
      };

      const newResponses = [...responses, response];
      setResponses(newResponses);

      // Move to next question or complete
      if (isLastQuestion) {
        onComplete(newResponses);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process response');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle text response (fallback from voice).
   */
  const handleTextResponse = async (text: string) => {
    if (!currentQuestion) return;

    setIsProcessing(true);

    try {
      // Store response directly (no transcription needed)
      const response: InterviewResponse = {
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        answer: text,
      };

      const newResponses = [...responses, response];
      setResponses(newResponses);

      // Update interview session in DB
      // (This happens automatically via transcribe endpoint for voice,
      // but for text we need to do it manually)
      // For now, just proceed - the generate-content endpoint will handle it

      // Move to next question or complete
      if (isLastQuestion) {
        onComplete(newResponses);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Skip current question.
   */
  const handleSkipQuestion = () => {
    if (isLastQuestion) {
      // If skipping last question, complete with what we have
      onComplete(responses);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('text-center py-12', className)}>
        <CardContent>
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Preparing interview questions...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <Card className={cn('text-center py-12', className)}>
        <CardContent>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchQuestions}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <Card className={cn('text-center py-12', className)}>
        <CardContent>
          <p className="text-muted-foreground mb-4">No interview questions available.</p>
          {onSkip && (
            <Button variant="outline" onClick={onSkip}>
              Skip Interview
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Completed questions summary */}
      {responses.length > 0 && (
        <div className="space-y-2">
          {responses.map((resp, idx) => (
            <div
              key={resp.question_id}
              className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded"
            >
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{questions[idx]?.text}</p>
                <p className="text-muted-foreground line-clamp-1">{resp.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
            <CardDescription>{currentQuestion.purpose}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onTextResponse={handleTextResponse}
              isProcessing={isProcessing}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handleSkipQuestion}
          disabled={isProcessing}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip
        </Button>

        {onSkip && responses.length > 0 && (
          <Button
            variant="outline"
            onClick={() => onComplete(responses)}
            disabled={isProcessing}
          >
            Finish with {responses.length} answers
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
