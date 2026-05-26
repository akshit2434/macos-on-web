"use client";

import {
  CalendarDays,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  SunMedium,
  Umbrella,
  Wind,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { useEffect, useState } from "react";

import { fetchWeatherSummary, getFallbackWeather, weatherCities, type WeatherCondition, type WeatherSummary } from "@/lib/weather/open-meteo";

function getAqiLabel(aqi: number | null) {
  if (aqi === null) return "Unavailable";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Sensitive";
  return "Unhealthy";
}

export function WeatherApp() {
  const [cityId, setCityId] = useState(weatherCities[0].id);
  const [summary, setSummary] = useState<WeatherSummary>(() => getFallbackWeather(weatherCities[0].id));
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");
  const city = weatherCities.find((item) => item.id === cityId) ?? weatherCities[0];

  useEffect(() => {
    let cancelled = false;

    fetchWeatherSummary(city)
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setStatus("live");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(getFallbackWeather(city.id));
          setStatus("fallback");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const details = [
    ["Feels Like", `${summary.feelsLike}C`, Gauge],
    ["Humidity", `${summary.humidity}%`, Droplets],
    ["Wind", `${summary.wind} km/h`, Wind],
    ["UV Index", `${summary.uv}`, SunMedium],
    ["Visibility", `${summary.visibility} km`, Eye],
    ["AQI", `${summary.aqi ?? "N/A"} - ${getAqiLabel(summary.aqi)}`, CloudSun],
  ] satisfies Array<[string, string, LucideIcon]>;
  const airDetails = [
    ["PM2.5", summary.airQuality.pm25 === null ? "N/A" : `${summary.airQuality.pm25}`],
    ["PM10", summary.airQuality.pm10 === null ? "N/A" : `${summary.airQuality.pm10}`],
    ["Ozone", summary.airQuality.ozone === null ? "N/A" : `${summary.airQuality.ozone}`],
    ["CO", summary.airQuality.carbonMonoxide === null ? "N/A" : `${summary.airQuality.carbonMonoxide}`],
    ["NO2", summary.airQuality.nitrogenDioxide === null ? "N/A" : `${summary.airQuality.nitrogenDioxide}`],
  ];

  return (
    <div className="h-full overflow-auto bg-[#10233f] text-white">
      <div className="min-h-full bg-[linear-gradient(180deg,#315f9f_0%,#214267_38%,#151c2f_72%,#10151f_100%)] p-5">
        <div className="flex flex-wrap gap-2">
          {weatherCities.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSummary(getFallbackWeather(item.id));
                setStatus("loading");
                setCityId(item.id);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cityId === item.id ? "bg-white text-slate-950 shadow-sm" : "bg-white/14 text-white hover:bg-white/22"}`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <section className="mt-7 rounded-[28px] bg-white/12 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/15 backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-[42px] font-semibold tracking-normal">{city.name}</h1>
              <p className="mt-1 text-sm text-white/70">{status === "live" ? "Live weather" : status === "loading" ? "Updating with local fallback ready" : "Showing local fallback"}</p>
              <div className="mt-6 flex items-center gap-5">
                <WeatherIcon condition={summary.condition} className="size-16 text-amber-200" strokeWidth={1.5} />
                <div>
                  <p className="text-[76px] font-thin leading-none tracking-normal">{summary.temperature}C</p>
                  <p className="mt-2 text-lg text-white/78">{summary.condition}</p>
                </div>
              </div>
            </div>
            <div className="grid min-w-[230px] gap-3">
              <div className="rounded-2xl bg-black/16 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                  <Sunrise className="size-4 text-amber-200" />
                  Sunrise
                </div>
                <p className="mt-2 text-2xl font-semibold">{summary.sunrise}</p>
              </div>
              <div className="rounded-2xl bg-black/16 p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                  <Sunset className="size-4 text-orange-200" />
                  Sunset
                </div>
                <p className="mt-2 text-2xl font-semibold">{summary.sunset}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/12 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
            <ClockLikeIcon />
            Hourly Forecast
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] gap-2">
            {summary.hourly.map((hour) => (
              <div key={`${hour.time}-${hour.temperature}`} className="rounded-2xl bg-black/14 px-3 py-4 text-center ring-1 ring-white/8">
                <p className="text-xs font-semibold text-white/62">{hour.time}</p>
                <WeatherIcon condition={hour.condition} className="mx-auto mt-3 size-6 text-amber-100" strokeWidth={1.7} />
                <p className="mt-3 text-xl font-semibold">{hour.temperature}C</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-sky-100/75">
                  <Umbrella className="size-3" />
                  {hour.precipitation}%
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
          <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/12 backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
              <CalendarDays className="size-4" />
              5-Day Forecast
            </div>
            <div className="space-y-2">
              {summary.daily.map((day) => (
                <div key={day.date} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl bg-black/14 px-3 py-3 text-sm ring-1 ring-white/8">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="w-14 shrink-0 font-semibold">{day.date}</span>
                    <WeatherIcon condition={day.condition} className="size-5 shrink-0 text-amber-100" />
                    <span className="truncate text-white/68">{day.condition}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-white/75">
                    <span>{day.low} / {day.high}C</span>
                    <span className="min-w-10 text-right text-sky-100/75">{day.precipitation}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {details.map(([label, value, Icon]) => (
              <div key={label} className="rounded-3xl bg-white/10 p-4 shadow-lg ring-1 ring-white/12 backdrop-blur">
                <Icon className="mb-4 size-5 text-white/70" />
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/12 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
            <CloudSun className="size-4" />
            Air Quality Details
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2">
            {airDetails.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-black/14 p-3 ring-1 ring-white/8">
                <p className="text-xs uppercase tracking-[0.14em] text-white/45">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ClockLikeIcon() {
  return (
    <span className="grid size-4 place-items-center rounded-full border border-white/60">
      <span className="block size-1 rounded-full bg-white/70" />
    </span>
  );
}

function WeatherIcon({ condition, ...props }: { condition: WeatherCondition } & LucideProps) {
  if (condition === "Clear") return <SunMedium {...props} />;
  if (condition === "Rain") return <CloudRain {...props} />;
  if (condition === "Storm") return <CloudLightning {...props} />;
  if (condition === "Fog") return <CloudFog {...props} />;
  if (condition === "Cloudy") return <Cloud {...props} />;
  return <CloudSun {...props} />;
}
