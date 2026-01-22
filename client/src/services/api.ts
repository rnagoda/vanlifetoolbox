import { supabase } from '../lib/supabase';
import type { components, paths } from '../types/api';

// Re-export commonly used types from the generated API types
export type User = components['schemas']['User'];
export type GridPoint = components['schemas']['GridPoint'];
export type WeatherFilters = components['schemas']['WeatherFilters'];
export type DateRange = components['schemas']['DateRange'];
export type WeatherSearchResult = components['schemas']['WeatherSearchResult'];
export type DailyWeather = components['schemas']['DailyWeather'];
export type SavedSearch = components['schemas']['SavedSearch'];
export type ElectricalConfig = components['schemas']['ElectricalConfig'];
export type ElectricalConfigData = components['schemas']['ElectricalConfigData'];
export type Device = components['schemas']['Device'];
export type BatteryConfig = components['schemas']['BatteryConfig'];
export type SolarConfig = components['schemas']['SolarConfig'];
export type InverterConfig = components['schemas']['InverterConfig'];
export type Resource = components['schemas']['Resource'];
export type ResourceCategory = components['schemas']['ResourceCategory'];
export type PrecipitationType = components['schemas']['PrecipitationType'];
export type Pagination = components['schemas']['Pagination'];
export type ErrorResponse = components['schemas']['ErrorResponse'];

// API response types
type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
};

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// API error class
export class ApiError extends Error {
  code: string;
  details?: Array<{ field: string; message: string }>;

  constructor(response: ApiErrorResponse) {
    super(response.error.message);
    this.name = 'ApiError';
    this.code = response.error.code;
    this.details = response.error.details;
  }
}

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new ApiError(data as ApiErrorResponse);
  }

  return data.data;
}

// ==================== User API ====================
export const userApi = {
  getCurrentUser: () => apiFetch<User>('/user/me'),
};

// ==================== Weather API ====================
type WeatherSearchRequest =
  paths['/weather/search']['post']['requestBody']['content']['application/json'];
type WeatherSearchResponse =
  paths['/weather/search']['post']['responses']['200']['content']['application/json']['data'];
type GridPointsResponse =
  paths['/weather/grid-points']['get']['responses']['200']['content']['application/json']['data'];
type GridPointWeatherResponse =
  paths['/weather/grid-points/{id}']['get']['responses']['200']['content']['application/json']['data'];
type NearestGridPointResponse =
  paths['/weather/nearest']['get']['responses']['200']['content']['application/json']['data'];

export const weatherApi = {
  search: (params: WeatherSearchRequest) =>
    apiFetch<WeatherSearchResponse>('/weather/search', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getGridPoints: (params?: {
    region?: string;
    states?: string[];
    bounds?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.region) searchParams.set('region', params.region);
    if (params?.states) searchParams.set('states', params.states.join(','));
    if (params?.bounds) searchParams.set('bounds', params.bounds);
    const query = searchParams.toString();
    return apiFetch<GridPointsResponse>(`/weather/grid-points${query ? `?${query}` : ''}`);
  },

  getGridPointWeather: (id: string, startDate: string, endDate: string) =>
    apiFetch<GridPointWeatherResponse>(
      `/weather/grid-points/${id}?startDate=${startDate}&endDate=${endDate}`
    ),

  findNearest: (lat: number, lon: number) =>
    apiFetch<NearestGridPointResponse>(`/weather/nearest?lat=${lat}&lon=${lon}`),
};

// ==================== Saved Searches API ====================
type SavedSearchesResponse =
  paths['/searches']['get']['responses']['200']['content']['application/json']['data'];
type CreateSearchRequest =
  paths['/searches']['post']['requestBody']['content']['application/json'];
type UpdateSearchRequest =
  paths['/searches/{id}']['put']['requestBody']['content']['application/json'];

export const searchesApi = {
  getAll: () => apiFetch<SavedSearchesResponse>('/searches'),

  getById: (id: string) => apiFetch<SavedSearch>(`/searches/${id}`),

  create: (params: CreateSearchRequest) =>
    apiFetch<SavedSearch>('/searches', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  update: (id: string, params: UpdateSearchRequest) =>
    apiFetch<SavedSearch>(`/searches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/searches/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== Electrical Configs API ====================
type ConfigsResponse =
  paths['/configs']['get']['responses']['200']['content']['application/json']['data'];
type CreateConfigRequest =
  paths['/configs']['post']['requestBody']['content']['application/json'];
type UpdateConfigRequest =
  paths['/configs/{id}']['put']['requestBody']['content']['application/json'];

export const configsApi = {
  getAll: () => apiFetch<ConfigsResponse>('/configs'),

  getById: (id: string) => apiFetch<ElectricalConfig>(`/configs/${id}`),

  create: (params: CreateConfigRequest) =>
    apiFetch<ElectricalConfig>('/configs', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  update: (id: string, params: UpdateConfigRequest) =>
    apiFetch<ElectricalConfig>(`/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/configs/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== Resources API ====================
type ResourcesResponse =
  paths['/resources']['get']['responses']['200']['content']['application/json']['data'];

export const resourcesApi = {
  getAll: (params?: {
    category?: ResourceCategory;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return apiFetch<ResourcesResponse>(`/resources${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => apiFetch<Resource>(`/resources/${id}`),
};

// Default export with all APIs
export const api = {
  user: userApi,
  weather: weatherApi,
  searches: searchesApi,
  configs: configsApi,
  resources: resourcesApi,
};

export default api;
