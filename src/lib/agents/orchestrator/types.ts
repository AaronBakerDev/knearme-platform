import type { SharedProjectState } from '../types';
import type { DelegationResult, SubagentType } from '../subagents';

export type OrchestratorAction =
  | { type: 'extract_story'; message: string }
  | { type: 'generate_content' }
  | { type: 'check_quality' }
  | { type: 'request_clarification'; fields: string[] }
  | { type: 'prompt_images' }
  | { type: 'ready_to_publish' }
  | { type: 'delegate'; subagent: SubagentType; result: DelegationResult }
  | { type: 'parallel_delegation'; results: DelegationResult[] }
  | { type: 'compose_layout' };

export interface OrchestratorResult {
  state: SharedProjectState;
  actions: OrchestratorAction[];
  message?: string;
  error?: { message: string; retryable: boolean };
}

export type PhaseHint = 'gathering' | 'images' | 'generating' | 'review' | 'ready';

export interface OrchestratorContext {
  state: SharedProjectState;
  message: string;
  phase?: PhaseHint;
}

export interface DelegationContext extends OrchestratorContext {
  businessContext?: {
    name?: string;
    type?: string;
    voice?: 'formal' | 'casual' | 'technical';
  };
  images?: SharedProjectState['images'];
}
