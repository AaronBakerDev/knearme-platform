export type LiveVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export type LiveVoiceEvent =
  | { type: 'CONNECTING' }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'LISTENING' }
  | { type: 'SPEAKING' }
  | { type: 'IDLE' }
  | { type: 'ERROR' };

export interface LiveVoiceConnectionState {
  status: LiveVoiceStatus;
  isConnected: boolean;
}

export const initialLiveVoiceConnectionState: LiveVoiceConnectionState = {
  status: 'idle',
  isConnected: false,
};

export function liveVoiceConnectionReducer(
  state: LiveVoiceConnectionState,
  event: LiveVoiceEvent
): LiveVoiceConnectionState {
  switch (event.type) {
    case 'CONNECTING':
      return { ...state, status: 'connecting' };
    case 'CONNECTED':
      return { status: 'idle', isConnected: true };
    case 'DISCONNECTED':
      return { status: 'idle', isConnected: false };
    case 'LISTENING':
      return { ...state, status: 'listening' };
    case 'SPEAKING':
      return { ...state, status: 'speaking' };
    case 'ERROR':
      return { ...state, status: 'error' };
    case 'IDLE':
    default:
      return { ...state, status: 'idle' };
  }
}
