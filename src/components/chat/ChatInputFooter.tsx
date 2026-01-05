'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MicPermissionPrompt } from '@/components/voice';
import { cn } from '@/lib/utils';
import { ChatInput } from './ChatInput';
import { CollectedDataPeekBar } from './CollectedDataPeekBar';
import { QuickActionChips } from './QuickActionChips';
import { VoiceLiveControls, type VoiceTalkMode } from './VoiceLiveControls';
import type { ChatPhase } from '@/lib/chat/chat-types';
import type { ProjectPreviewData } from './hooks/useProjectData';
import type { CompletenessState } from './hooks/useCompleteness';
import type { QuickActionItem, QuickActionType } from './hooks/useQuickActions';
import type { MicPermissionStatus, VoiceInteractionMode } from '@/types/voice';
import type { LiveVoiceStatus } from './hooks/live-voice-state';

interface LiveVoiceSessionControls {
  status: LiveVoiceStatus;
  isConnected: boolean;
  isContinuousMode: boolean;
  audioLevel: number;
  liveUserTranscript: string;
  liveAssistantTranscript: string;
  error: string | null;
  startTalking: () => Promise<void>;
  stopTalking: () => void;
  disconnect: () => void;
}

interface ChatInputFooterProps {
  projectData: ProjectPreviewData;
  completeness: CompletenessState;
  onExpandPreview: () => void;
  phase: ChatPhase;
  messagesCount: number;
  quickActions: QuickActionItem[];
  onInsertPrompt: (text: string) => void;
  onQuickAction: (action: Exclude<QuickActionType, 'insert'>) => void;
  canGenerate: boolean;
  onGenerate: () => void;
  isLoading: boolean;
  showMicPermissionPrompt: boolean;
  micPermissionStatus: MicPermissionStatus;
  onRequestMicPermission: () => void;
  isRequestingMicPermission: boolean;
  voiceMode: VoiceInteractionMode;
  liveVoiceSession: LiveVoiceSessionControls;
  canStartLiveVoice: boolean;
  onTalkModeChange: (mode: VoiceTalkMode) => void;
  onReturnToText: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  inputPlaceholder: string;
  onSendMessage: (value: string) => void;
  onAttachPhotos: () => void;
  uploadedImageCount: number;
  onImageDrop: (files: File[]) => Promise<void>;
  enableVoiceInput: boolean;
  voiceChatAvailable: boolean;
  onVoiceModeChange: (mode: VoiceInteractionMode) => void;
}

export function ChatInputFooter({
  projectData,
  completeness,
  onExpandPreview,
  phase,
  messagesCount,
  quickActions,
  onInsertPrompt,
  onQuickAction,
  canGenerate,
  onGenerate,
  isLoading,
  showMicPermissionPrompt,
  micPermissionStatus,
  onRequestMicPermission,
  isRequestingMicPermission,
  voiceMode,
  liveVoiceSession,
  canStartLiveVoice,
  onTalkModeChange,
  onReturnToText,
  inputValue,
  onInputChange,
  inputPlaceholder,
  onSendMessage,
  onAttachPhotos,
  uploadedImageCount,
  onImageDrop,
  enableVoiceInput,
  voiceChatAvailable,
  onVoiceModeChange,
}: ChatInputFooterProps) {
  const enableVoiceModeChange = voiceChatAvailable ? onVoiceModeChange : undefined;

  return (
    <>
      <div className="lg:hidden">
        <CollectedDataPeekBar
          data={projectData}
          completeness={completeness}
          onExpand={onExpandPreview}
        />
      </div>

      {phase !== 'analyzing' && phase !== 'generating' && (
        <div className="sticky bottom-0 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
          <div className="max-w-[720px] mx-auto px-4">
            {messagesCount <= 2 && quickActions.length > 0 && (
              <QuickActionChips
                actions={quickActions}
                onInsertPrompt={onInsertPrompt}
                onAction={onQuickAction}
                disabled={isLoading}
                className="mb-3"
              />
            )}

            {canGenerate && (
              <Button
                onClick={onGenerate}
                disabled={isLoading}
                className={cn(
                  'w-full mb-3 rounded-full h-11',
                  completeness.visualState === 'ready' && 'animate-glow-pulse'
                )}
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Portfolio Page
              </Button>
            )}

            {showMicPermissionPrompt && (
              <MicPermissionPrompt
                status={micPermissionStatus}
                onRequestPermission={onRequestMicPermission}
                isRequesting={isRequestingMicPermission}
                compact
                className="mb-2"
              />
            )}

            {voiceMode === 'voice_chat' ? (
              <VoiceLiveControls
                status={liveVoiceSession.status}
                isConnected={liveVoiceSession.isConnected}
                isContinuousMode={liveVoiceSession.isContinuousMode}
                audioLevel={liveVoiceSession.audioLevel}
                liveUserTranscript={liveVoiceSession.liveUserTranscript}
                liveAssistantTranscript={liveVoiceSession.liveAssistantTranscript}
                error={liveVoiceSession.error}
                onPressStart={canStartLiveVoice
                  ? liveVoiceSession.startTalking
                  : onRequestMicPermission}
                onPressEnd={liveVoiceSession.stopTalking}
                onDisconnect={liveVoiceSession.disconnect}
                onTalkModeChange={onTalkModeChange}
                onReturnToText={onReturnToText}
              />
            ) : (
              <ChatInput
                onSend={onSendMessage}
                onAttachPhotos={onAttachPhotos}
                photoCount={uploadedImageCount}
                disabled={isLoading}
                isLoading={isLoading}
                value={inputValue}
                onChange={onInputChange}
                placeholder={inputPlaceholder}
                enableVoice={enableVoiceInput}
                onImageDrop={onImageDrop}
                voiceMode={voiceMode}
                onVoiceModeChange={enableVoiceModeChange}
                voiceChatEnabled={voiceChatAvailable}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
