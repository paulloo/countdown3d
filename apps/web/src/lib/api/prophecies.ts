import type { Prophecy, ProphecyStatus } from '@countdown3d/database';

export interface CreateProphecyInput {
  title: string;
  description: string;
  date: Date;
  status: ProphecyStatus;
  source?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface GetPropheciesParams {
  status?: ProphecyStatus;
  tag?: string;
}

export const createProphecy = async (data: CreateProphecyInput): Promise<Prophecy> => {
  const res = await fetch('/api/prophecies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error('Failed to create prophecy');
  }

  return res.json();
};

export const getProphecies = async (params?: GetPropheciesParams): Promise<Prophecy[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set('status', params.status);
  if (params?.tag) queryParams.set('tag', params.tag);

  const res = await fetch(`/api/prophecies?${queryParams.toString()}`);

  if (!res.ok) {
    throw new Error('Failed to fetch prophecies');
  }

  return res.json();
}; 