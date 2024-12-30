export type LocationType = 'PROPHECY' | 'USER_LOCATION';
export type LocationStatus = 'PENDING' | 'FULFILLED' | 'FAILED';
export type ProphecyStatus = 'PENDING' | 'FULFILLED' | 'FAILED';

export interface UserSettings {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  language?: string;
}

export interface ProphecyMetadata {
  source_url?: string;
  confidence?: number;
  references?: string[];
  media_urls?: string[];
} 