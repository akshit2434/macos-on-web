export type WeatherCity = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export const weatherCities: WeatherCity[] = [
  { id: "sydney", name: "Sydney", latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" },
  { id: "sonipat", name: "Sonipat", latitude: 28.9931, longitude: 77.0151, timezone: "Asia/Kolkata" },
];

export type WeatherCondition = "Clear" | "Partly Cloudy" | "Cloudy" | "Rain" | "Storm" | "Fog";

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitation: number;
  condition: WeatherCondition;
};

export type DailyForecast = {
  date: string;
  high: number;
  low: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
  condition: WeatherCondition;
};

export type AirQualityDetail = {
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  carbonMonoxide: number | null;
  nitrogenDioxide: number | null;
};

export type WeatherSummary = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  uv: number;
  visibility: number;
  precipitation: number;
  aqi: number | null;
  airQuality: AirQualityDetail;
  condition: WeatherCondition;
  sunrise: string;
  sunset: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
};

type OpenMeteoForecast = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
    visibility?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
};

type OpenMeteoAir = {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    ozone?: number;
    carbon_monoxide?: number;
    nitrogen_dioxide?: number;
  };
};

export function getFallbackWeather(cityId: string): WeatherSummary {
  if (cityId === "sonipat") {
    return {
      temperature: 34,
      feelsLike: 38,
      humidity: 46,
      wind: 11,
      uv: 8,
      visibility: 8,
      precipitation: 4,
      aqi: 118,
      airQuality: {
        pm25: 42,
        pm10: 88,
        ozone: 86,
        carbonMonoxide: 410,
        nitrogenDioxide: 31,
      },
      condition: "Clear",
      sunrise: "05:29",
      sunset: "19:12",
      hourly: [
        { time: "Now", temperature: 34, precipitation: 4, condition: "Clear" },
        { time: "1 PM", temperature: 36, precipitation: 3, condition: "Clear" },
        { time: "2 PM", temperature: 37, precipitation: 3, condition: "Clear" },
        { time: "3 PM", temperature: 37, precipitation: 5, condition: "Partly Cloudy" },
        { time: "4 PM", temperature: 36, precipitation: 7, condition: "Partly Cloudy" },
        { time: "5 PM", temperature: 35, precipitation: 6, condition: "Clear" },
      ],
      daily: [
        { date: "Today", high: 37, low: 27, precipitation: 7, sunrise: "05:29", sunset: "19:12", condition: "Clear" },
        { date: "Fri", high: 38, low: 28, precipitation: 6, sunrise: "05:29", sunset: "19:13", condition: "Clear" },
        { date: "Sat", high: 39, low: 29, precipitation: 9, sunrise: "05:28", sunset: "19:13", condition: "Partly Cloudy" },
        { date: "Sun", high: 37, low: 28, precipitation: 18, sunrise: "05:28", sunset: "19:14", condition: "Partly Cloudy" },
        { date: "Mon", high: 36, low: 27, precipitation: 22, sunrise: "05:28", sunset: "19:14", condition: "Cloudy" },
      ],
    };
  }

  return {
    temperature: 17,
    feelsLike: 16,
    humidity: 62,
    wind: 18,
    uv: 3,
    visibility: 10,
    precipitation: 18,
    aqi: 34,
    airQuality: {
      pm25: 7,
      pm10: 18,
      ozone: 44,
      carbonMonoxide: 240,
      nitrogenDioxide: 12,
    },
    condition: "Partly Cloudy",
    sunrise: "06:45",
    sunset: "16:58",
    hourly: [
      { time: "Now", temperature: 17, precipitation: 18, condition: "Partly Cloudy" },
      { time: "3 PM", temperature: 17, precipitation: 22, condition: "Cloudy" },
      { time: "4 PM", temperature: 16, precipitation: 26, condition: "Cloudy" },
      { time: "5 PM", temperature: 15, precipitation: 34, condition: "Rain" },
      { time: "6 PM", temperature: 14, precipitation: 41, condition: "Rain" },
      { time: "7 PM", temperature: 14, precipitation: 35, condition: "Cloudy" },
    ],
    daily: [
      { date: "Today", high: 18, low: 12, precipitation: 41, sunrise: "06:45", sunset: "16:58", condition: "Partly Cloudy" },
      { date: "Fri", high: 17, low: 11, precipitation: 36, sunrise: "06:46", sunset: "16:58", condition: "Rain" },
      { date: "Sat", high: 18, low: 12, precipitation: 22, sunrise: "06:47", sunset: "16:57", condition: "Cloudy" },
      { date: "Sun", high: 19, low: 13, precipitation: 18, sunrise: "06:47", sunset: "16:57", condition: "Partly Cloudy" },
      { date: "Mon", high: 20, low: 13, precipitation: 12, sunrise: "06:48", sunset: "16:56", condition: "Clear" },
    ],
  };
}

export async function fetchWeatherSummary(city: WeatherCity): Promise<WeatherSummary> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
    hourly: "temperature_2m,precipitation_probability,weather_code,visibility",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset,uv_index_max",
    forecast_days: "5",
    forecast_hours: "8",
    timezone: city.timezone,
  });
  const airParams = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "us_aqi,pm2_5,pm10,ozone,carbon_monoxide,nitrogen_dioxide",
    timezone: city.timezone,
  });

  const [forecastResult, airResult] = await Promise.allSettled([
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`),
  ]);

  if (forecastResult.status === "rejected") {
    throw new Error("Weather forecast unavailable");
  }

  const forecastResponse = forecastResult.value;
  if (!forecastResponse.ok) {
    throw new Error("Weather forecast unavailable");
  }

  const forecast = (await forecastResponse.json()) as OpenMeteoForecast;
  const air =
    airResult.status === "fulfilled" && airResult.value.ok
      ? ((await airResult.value.json()) as OpenMeteoAir)
      : {};
  const fallback = getFallbackWeather(city.id);

  return {
    temperature: Math.round(forecast.current?.temperature_2m ?? fallback.temperature),
    feelsLike: Math.round(forecast.current?.apparent_temperature ?? fallback.feelsLike),
    humidity: Math.round(forecast.current?.relative_humidity_2m ?? fallback.humidity),
    wind: Math.round(forecast.current?.wind_speed_10m ?? fallback.wind),
    uv: Math.round(forecast.daily?.uv_index_max?.[0] ?? fallback.uv),
    visibility: Math.round((forecast.hourly?.visibility?.[0] ?? fallback.visibility * 1000) / 1000),
    precipitation: Math.round(forecast.current?.precipitation ?? fallback.precipitation),
    aqi: air.current?.us_aqi ?? fallback.aqi,
    airQuality: {
      pm25: roundNullable(air.current?.pm2_5, fallback.airQuality.pm25),
      pm10: roundNullable(air.current?.pm10, fallback.airQuality.pm10),
      ozone: roundNullable(air.current?.ozone, fallback.airQuality.ozone),
      carbonMonoxide: roundNullable(air.current?.carbon_monoxide, fallback.airQuality.carbonMonoxide),
      nitrogenDioxide: roundNullable(air.current?.nitrogen_dioxide, fallback.airQuality.nitrogenDioxide),
    },
    condition: mapWeatherCode(forecast.current?.weather_code),
    sunrise: formatLocalTime(forecast.daily?.sunrise?.[0]) ?? fallback.sunrise,
    sunset: formatLocalTime(forecast.daily?.sunset?.[0]) ?? fallback.sunset,
    hourly: buildHourlyForecast(forecast, fallback),
    daily: buildDailyForecast(forecast, fallback),
  };
}

function buildHourlyForecast(forecast: OpenMeteoForecast, fallback: WeatherSummary) {
  const times = forecast.hourly?.time ?? [];
  const temperatures = forecast.hourly?.temperature_2m ?? [];
  const precipitation = forecast.hourly?.precipitation_probability ?? [];
  const codes = forecast.hourly?.weather_code ?? [];

  if (times.length === 0) {
    return fallback.hourly;
  }

  return times.slice(0, 8).map((time, index) => ({
    time: index === 0 ? "Now" : formatHour(time),
    temperature: Math.round(temperatures[index] ?? fallback.temperature),
    precipitation: Math.round(precipitation[index] ?? 0),
    condition: mapWeatherCode(codes[index]),
  }));
}

function buildDailyForecast(forecast: OpenMeteoForecast, fallback: WeatherSummary) {
  const dates = forecast.daily?.time ?? [];
  const highs = forecast.daily?.temperature_2m_max ?? [];
  const lows = forecast.daily?.temperature_2m_min ?? [];
  const precipitation = forecast.daily?.precipitation_probability_max ?? [];
  const codes = forecast.daily?.weather_code ?? [];
  const sunrises = forecast.daily?.sunrise ?? [];
  const sunsets = forecast.daily?.sunset ?? [];

  if (dates.length === 0) {
    return fallback.daily;
  }

  return dates.slice(0, 5).map((date, index) => ({
    date: index === 0 ? "Today" : formatWeekday(date),
    high: Math.round(highs[index] ?? fallback.daily[index]?.high ?? fallback.temperature),
    low: Math.round(lows[index] ?? fallback.daily[index]?.low ?? fallback.temperature),
    precipitation: Math.round(precipitation[index] ?? fallback.daily[index]?.precipitation ?? 0),
    sunrise: formatLocalTime(sunrises[index]) ?? fallback.daily[index]?.sunrise ?? fallback.sunrise,
    sunset: formatLocalTime(sunsets[index]) ?? fallback.daily[index]?.sunset ?? fallback.sunset,
    condition: mapWeatherCode(codes[index]),
  }));
}

function mapWeatherCode(code?: number): WeatherCondition {
  if (code === undefined) {
    return "Partly Cloudy";
  }
  if ([0, 1].includes(code)) return "Clear";
  if ([2].includes(code)) return "Partly Cloudy";
  if ([3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if (code >= 95) return "Storm";
  if (code >= 51) return "Rain";
  return "Partly Cloudy";
}

function formatHour(value: string) {
  const hour = Number(value.slice(11, 13));
  if (!Number.isFinite(hour)) {
    return value;
  }

  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${value}T12:00:00`));
}

function formatLocalTime(value?: string) {
  if (!value) {
    return null;
  }

  return value.slice(11, 16);
}

function roundNullable(value: number | undefined, fallback: number | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  return fallback;
}
