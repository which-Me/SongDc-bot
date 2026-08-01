export enum LoopMode {
  None = 'none',
  Track = 'track',
  Queue = 'queue',
}

/** Normalized track metadata stored in the queue. */
export interface QueueTrack {
  encoded: string;
  identifier: string;
  title: string;
  author: string;
  uri: string | null;
  length: number;
  isStream: boolean;
  artworkUrl: string | null;
  sourceName: string | null;
  requestedBy: string;
}

export interface NowPlaying {
  track: QueueTrack;
  position: number;
  volume: number;
  loop: LoopMode;
  autoplay: boolean;
  paused: boolean;
}

export type PlaySource =
  | { type: 'track'; track: QueueTrack }
  | { type: 'playlist'; name: string; tracks: QueueTrack[] }
  | { type: 'search'; tracks: QueueTrack[] };
