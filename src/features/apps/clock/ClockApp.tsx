"use client";

import { Clock3, Pause, Play, Plus, RotateCcw, TimerReset } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { useAnalytics } from "@/lib/analytics/use-analytics";
import { cn } from "@/lib/utils";

type ClockTab = "world" | "alarms" | "stopwatch" | "timer";
type Alarm = { id: string; time: string; label: string; enabled: boolean };

const tabs: Array<{ id: ClockTab; label: string }> = [
  { id: "world", label: "World Clock" },
  { id: "alarms", label: "Alarms" },
  { id: "stopwatch", label: "Stopwatch" },
  { id: "timer", label: "Timer" },
];

const worldClocks = [
  ["Sonipat", "Asia/Kolkata"],
  ["Sydney", "Australia/Sydney"],
  ["Cupertino", "America/Los_Angeles"],
];

export function ClockApp() {
  const [tab, setTab] = useState<ClockTab>("world");
  const [now, setNow] = useState(() => new Date());
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5 * 60);
  const [timerPreset, setTimerPreset] = useState(5 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: "morning", time: "08:00", label: "Morning check-in", enabled: false },
    { id: "night", time: "22:30", label: "Goodnight reminder", enabled: true },
  ]);
  const { track } = useAnalytics();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stopwatchRunning) return;

    const interval = window.setInterval(() => setStopwatchSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [stopwatchRunning]);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = window.setInterval(() => {
      setTimerSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          setTimerRunning(false);
          setTimerDone(true);
          track({ eventType: "CLOCK_TIMER_FINISHED", appId: "clock" });
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning, track]);

  const enabledAlarmCount = useMemo(() => alarms.filter((alarm) => alarm.enabled).length, [alarms]);

  function addAlarm() {
    const id = `alarm-${Date.now()}`;
    setAlarms((value) => [
      ...value,
      { id, time: "07:30", label: "New alarm", enabled: true },
    ]);
    track({ eventType: "CLOCK_ALARM_ADDED", appId: "clock" });
  }

  function toggleAlarm(id: string) {
    setAlarms((value) =>
      value.map((alarm) =>
        alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm,
      ),
    );
    track({ eventType: "CLOCK_ALARM_TOGGLED", appId: "clock", metadata: { alarmId: id } });
  }

  function chooseTimerPreset(seconds: number) {
    setTimerPreset(seconds);
    setTimerSeconds(seconds);
    setTimerDone(false);
    setTimerRunning(false);
    track({ eventType: "CLOCK_TIMER_PRESET_SELECTED", appId: "clock", metadata: { seconds } });
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerDone(false);
    setTimerSeconds(timerPreset);
    track({ eventType: "CLOCK_TIMER_RESET", appId: "clock" });
  }

  return (
    <div className="h-full overflow-auto bg-[#f5f5f7] p-6 text-slate-950">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-normal">Clock</h1>
          <p className="mt-1 text-sm text-slate-500">{enabledAlarmCount} alarm{enabledAlarmCount === 1 ? "" : "s"} enabled</p>
        </div>
        <div className="flex rounded-lg bg-slate-200/75 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tab === item.id ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-950")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {tab === "world" ? <WorldClockPanel now={now} /> : null}
      {tab === "alarms" ? <AlarmsPanel alarms={alarms} onAdd={addAlarm} onToggle={toggleAlarm} /> : null}
      {tab === "stopwatch" ? (
        <StopwatchPanel
          seconds={stopwatchSeconds}
          running={stopwatchRunning}
          onToggle={() => {
            setStopwatchRunning((value) => !value);
            track({ eventType: "CLOCK_STOPWATCH_TOGGLED", appId: "clock" });
          }}
          onReset={() => {
            setStopwatchSeconds(0);
            setStopwatchRunning(false);
            track({ eventType: "CLOCK_STOPWATCH_RESET", appId: "clock" });
          }}
        />
      ) : null}
      {tab === "timer" ? (
        <TimerPanel
          seconds={timerSeconds}
          preset={timerPreset}
          running={timerRunning}
          done={timerDone}
          onPreset={chooseTimerPreset}
          onToggle={() => {
            setTimerRunning((value) => !value);
            setTimerDone(false);
            track({ eventType: "CLOCK_TIMER_TOGGLED", appId: "clock" });
          }}
          onReset={resetTimer}
        />
      ) : null}
    </div>
  );
}

function WorldClockPanel({ now }: { now: Date }) {
  return (
    <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      {worldClocks.map(([name, zone]) => (
        <div key={zone} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-slate-500">{name}</p>
          <p className="mt-2 text-4xl font-semibold tracking-normal">
            {new Intl.DateTimeFormat("en", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(now)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {new Intl.DateTimeFormat("en", { timeZone: zone, weekday: "long", month: "short", day: "numeric" }).format(now)}
          </p>
        </div>
      ))}
    </div>
  );
}

function AlarmsPanel({ alarms, onAdd, onToggle }: { alarms: Alarm[]; onAdd: () => void; onToggle: (id: string) => void }) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Alarms</p>
          <p className="mt-1 text-xs text-slate-500">Local reminders inside the simulator.</p>
        </div>
        <button type="button" onClick={onAdd} className="grid size-9 place-items-center rounded-full bg-blue-500 text-white" aria-label="Add alarm">
          <Plus className="size-5" />
        </button>
      </div>
      {alarms.map((alarm) => (
        <div key={alarm.id} className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4 last:border-b-0">
          <div className={cn(!alarm.enabled && "opacity-45")}>
            <p className="text-3xl font-light tracking-normal">{alarm.time}</p>
            <p className="mt-1 text-sm text-slate-500">{alarm.label}</p>
          </div>
          <Switch checked={alarm.enabled} onChange={() => onToggle(alarm.id)} />
        </div>
      ))}
    </section>
  );
}

function StopwatchPanel({ seconds, running, onToggle, onReset }: { seconds: number; running: boolean; onToggle: () => void; onReset: () => void }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <Clock3 className="mx-auto size-8 text-slate-400" />
      <p className="mt-4 text-7xl font-light tracking-normal">{formatStopwatch(seconds)}</p>
      <div className="mt-6 flex justify-center gap-4">
        <RoundButton label={running ? "Pause stopwatch" : "Start stopwatch"} tone="green" onClick={onToggle}>
          {running ? <Pause className="size-5" /> : <Play className="size-5" />}
        </RoundButton>
        <RoundButton label="Reset stopwatch" tone="gray" onClick={onReset}>
          <RotateCcw className="size-5" />
        </RoundButton>
      </div>
    </section>
  );
}

function TimerPanel({ seconds, preset, running, done, onPreset, onToggle, onReset }: { seconds: number; preset: number; running: boolean; done: boolean; onPreset: (seconds: number) => void; onToggle: () => void; onReset: () => void }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <TimerReset className="mx-auto size-8 text-slate-400" />
      <p className={cn("mt-4 text-7xl font-light tracking-normal", done && "text-orange-600")}>{formatTimer(seconds)}</p>
      <p className="mt-2 text-sm text-slate-500">{done ? "Timer complete" : running ? "Running" : "Ready"}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {[60, 5 * 60, 10 * 60, 15 * 60].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPreset(value)}
            className={cn("rounded-full px-3 py-1.5 text-sm font-medium", preset === value ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
          >
            {value / 60} min
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <RoundButton label={running ? "Pause timer" : "Start timer"} tone="green" onClick={onToggle}>
          {running ? <Pause className="size-5" /> : <Play className="size-5" />}
        </RoundButton>
        <RoundButton label="Reset timer" tone="gray" onClick={onReset}>
          <RotateCcw className="size-5" />
        </RoundButton>
      </div>
    </section>
  );
}

function RoundButton({ label, tone, onClick, children }: { label: string; tone: "green" | "gray"; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn("grid size-12 place-items-center rounded-full", tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")}
    >
      {children}
    </button>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className={cn("relative h-7 w-12 rounded-full transition", checked ? "bg-[#34c759]" : "bg-slate-300")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition", checked ? "left-5" : "left-0.5")} />
    </button>
  );
}

function formatStopwatch(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}
