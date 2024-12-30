import type { Location, LocationType, LocationStatus } from '@countdown3d/database';

export interface CreateLocationInput {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  type?: LocationType;
  status?: LocationStatus;
}

export interface GetLocationsParams {
  type?: LocationType;
  status?: LocationStatus;
  userId?: string;
}

export const createLocation = async (data: CreateLocationInput): Promise<Location> => {
  const res = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error('Failed to create location');
  }

  return res.json();
};

export const getLocations = async (params?: GetLocationsParams): Promise<Location[]> => {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.set('type', params.type);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.userId) queryParams.set('userId', params.userId);

  const res = await fetch(`/api/locations?${queryParams.toString()}`);

  if (!res.ok) {
    throw new Error('Failed to fetch locations');
  }

  return res.json();
}; 