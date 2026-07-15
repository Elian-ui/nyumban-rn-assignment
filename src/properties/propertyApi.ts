import { apiRequest } from '../api';
import type { Property, PropertyRegion, PropertyStatus, Room } from '../domain';

interface PropertyDto {
  id: string;
  name: string;
  address: string | null;
  unit_count: number | null;
  region: PropertyRegion;
  last_inspected_at: string | null;
  status: PropertyStatus;
  version: number;
}

interface RoomDto {
  id: string;
  label: string;
  floor: number;
}

interface PropertyDetailDto extends PropertyDto {
  rooms: RoomDto[];
}

interface PropertyPageDto {
  data: PropertyDto[];
  next_cursor: string | null;
}

export interface PropertyPage {
  properties: Property[];
  nextCursor: string | null;
}

function normalizeProperty(dto: PropertyDto, cachedAt: number): Property {
  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    unitCount: dto.unit_count,
    region: dto.region,
    lastInspectedAt: dto.last_inspected_at,
    status: dto.status,
    version: dto.version,
    cachedAt,
    detailsCachedAt: null,
  };
}

export async function fetchPropertyPage(
  cursor?: string,
): Promise<PropertyPage> {
  const query = new URLSearchParams({ limit: '50' });
  if (cursor) {
    query.set('cursor', cursor);
  }

  const response = await apiRequest<PropertyPageDto>(
    `/properties?${query.toString()}`,
  );
  const cachedAt = Date.now();

  return {
    properties: response.data.map(dto => normalizeProperty(dto, cachedAt)),
    nextCursor: response.next_cursor,
  };
}

export async function fetchPropertyDetail(id: string): Promise<Property> {
  const response = await apiRequest<PropertyDetailDto>(
    `/properties/${encodeURIComponent(id)}`,
  );
  const property = normalizeProperty(response, Date.now());
  const rooms: Room[] = response.rooms.map(room => ({
    id: room.id,
    propertyId: response.id,
    label: room.label,
    floor: room.floor,
  }));

  return { ...property, rooms, detailsCachedAt: Date.now() };
}
