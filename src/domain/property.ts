export type PropertyRegion = 'central' | 'eastern' | 'western' | 'northern';

export type PropertyStatus = 'active' | 'inactive' | 'under_renovation';

export interface Room {
  id: string;
  propertyId: string;
  label: string;
  floor: number;
}

export interface Property {
  id: string;
  name: string;
  address: string | null;
  unitCount: number | null;
  region: PropertyRegion;
  lastInspectedAt: string | null;
  status: PropertyStatus;
  version: number;
  rooms?: Room[];
  cachedAt: number;
}

export interface PropertyFilters {
  query?: string;
  region?: PropertyRegion;
  status?: PropertyStatus;
}
