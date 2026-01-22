import { z } from 'zod';

// Precipitation types as defined in OpenAPI spec
export const precipitationTypeSchema = z.enum([
  'none',
  'rain',
  'snow',
  'sleet',
  'freezing_rain',
  'hail',
  'drizzle',
  'thunderstorms',
  'ice_pellets',
  'fog',
  'mist',
  'mixed',
]);

export type PrecipitationType = z.infer<typeof precipitationTypeSchema>;

// Region enum
export const gridRegionSchema = z.enum([
  'northeast',
  'southeast',
  'midwest',
  'southwest',
  'west',
  'pacific_northwest',
]);

export type GridRegion = z.infer<typeof gridRegionSchema>;

// Weather filters schema
export const weatherFiltersSchema = z.object({
  tempMin: z.number().min(-50).max(150).optional(),
  tempMax: z.number().min(-50).max(150).optional(),
  humidityMax: z.number().min(0).max(100).optional(),
  windSpeedMax: z.number().min(0).max(200).optional(),
  precipChanceMax: z.number().min(0).max(100).optional(),
  precipTypesAllowed: z.array(precipitationTypeSchema).optional(),
  precipTypesExcluded: z.array(precipitationTypeSchema).optional(),
  aqiMax: z.number().min(1).max(500).optional(),
});

export type WeatherFilters = z.infer<typeof weatherFiltersSchema>;

// Date range for weather search
export const weatherDateRangeSchema = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .refine(
    data => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    },
    {
      message: 'Date range cannot exceed 90 days',
      path: ['endDate'],
    }
  );

// Weather search request schema
export const weatherSearchRequestSchema = z.object({
  filters: weatherFiltersSchema,
  dateRange: weatherDateRangeSchema,
  options: z
    .object({
      limit: z.number().int().min(1).max(500).default(50).optional(),
      minScore: z.number().int().min(0).max(100).default(0).optional(),
      region: gridRegionSchema.optional(),
      states: z.array(z.string().length(2)).optional(),
    })
    .optional(),
});

export type WeatherSearchRequest = z.infer<typeof weatherSearchRequestSchema>;

// Grid points query params schema
export const gridPointsQuerySchema = z.object({
  region: gridRegionSchema.optional(),
  states: z
    .string()
    .transform(val => val.split(',').map(s => s.trim()))
    .optional(),
  bounds: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/, 'Invalid bounds format')
    .transform(val => {
      const [minLat, minLon, maxLat, maxLon] = val.split(',').map(Number);
      return { minLat, minLon, maxLat, maxLon };
    })
    .optional(),
});

// Grid point weather query params schema
export const gridPointWeatherQuerySchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
});

// Nearest grid point query params schema
export const nearestGridPointQuerySchema = z.object({
  lat: z.coerce.number().min(24.0).max(50.0),
  lon: z.coerce.number().min(-125.0).max(-66.0),
});
