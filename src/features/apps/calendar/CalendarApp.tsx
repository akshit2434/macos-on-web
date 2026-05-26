"use client";

import { CalendarPlus, ChevronLeft, ChevronRight, Circle, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";

import { calendarContent } from "@/content/apps/calendar";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";
import { useAnalytics } from "@/lib/analytics/use-analytics";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(left: Date, right: Date) {
  return toDateKey(left) === toDateKey(right);
}

function buildMonthGrid(viewDate: Date) {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function CalendarApp() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [visibleCalendars, setVisibleCalendars] = useState(() => new Set(calendarContent.calendars.map((calendar) => calendar.id)));
  const { track } = useAnalytics();
  const notify = useWindowStore((state) => state.notify);

  const monthDays = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const month = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(viewDate);
  const selectedKey = toDateKey(selectedDate);
  const visibleEvents = calendarContent.events.filter((event) => visibleCalendars.has(event.calendarId));
  const selectedEvents = visibleEvents.filter((event) => event.date === selectedKey);
  const upcomingEvents = visibleEvents
    .filter((event) => event.date >= selectedKey)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 5);
  const selectedEvent = selectedEventId ? visibleEvents.find((event) => event.id === selectedEventId) : null;

  const selectDate = (date: Date) => {
    const key = toDateKey(date);
    const events = visibleEvents.filter((event) => event.date === key);
    setSelectedDate(date);
    setSelectedEventId(events[0]?.id ?? null);
    track({ eventType: "CALENDAR_DATE_OPENED", appId: "calendar", metadata: { date: key } });
  };

  const goToToday = () => {
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setViewDate(currentMonth);
    selectDate(today);
    notify({ appId: "calendar", title: "Today", body: new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(today) });
  };

  const toggleCalendar = (calendarId: string) => {
    setVisibleCalendars((current) => {
      const next = new Set(current);
      if (next.has(calendarId) && next.size > 1) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
    track({ eventType: "CALENDAR_FILTER_TOGGLED", appId: "calendar", metadata: { calendarId } });
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[180px_minmax(300px,1fr)_220px] bg-white text-slate-950">
      <aside className="flex min-h-0 flex-col border-r border-black/10 bg-[#f5f5f7] p-4">
        <h1 className="text-[26px] font-semibold tracking-normal">Calendar</h1>
        <button
          type="button"
          onClick={() => notify({ appId: "calendar", title: "New Event", body: "Event creation is ready for the real date details." })}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-red-600"
        >
          <CalendarPlus className="size-4" />
          New Event
        </button>
        <div className="mt-6">
          <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <ListFilter className="size-3.5" />
            Calendars
          </p>
          <div className="space-y-1">
            {calendarContent.calendars.map((calendar) => {
              const isVisible = visibleCalendars.has(calendar.id);
              return (
                <button
                  key={calendar.id}
                  type="button"
                  onClick={() => toggleCalendar(calendar.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${isVisible ? "bg-white shadow-sm" : "text-slate-400 hover:bg-white/60"}`}
                  aria-pressed={isVisible}
                >
                  <span className="grid size-4 place-items-center rounded-full" style={{ background: isVisible ? calendar.color : "#d1d5db" }}>
                    {isVisible ? <Circle className="size-2 fill-white text-white" /> : null}
                  </span>
                  {calendar.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-auto rounded-xl bg-white/70 p-3 text-[12px] leading-relaxed text-slate-600 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
          <p className="font-semibold text-slate-800">{selectedEvents.length || "No"} events selected</p>
          <p className="mt-1">{new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(selectedDate)}</p>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const previousMonth = addMonths(viewDate, -1);
                setViewDate(previousMonth);
                track({ eventType: "CALENDAR_MONTH_CHANGED", appId: "calendar", metadata: { direction: "previous", month: toDateKey(previousMonth) } });
              }}
              aria-label="Previous month"
              className="grid size-8 place-items-center rounded-full hover:bg-black/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMonth = addMonths(viewDate, 1);
                setViewDate(nextMonth);
                track({ eventType: "CALENDAR_MONTH_CHANGED", appId: "calendar", metadata: { direction: "next", month: toDateKey(nextMonth) } });
              }}
              aria-label="Next month"
              className="grid size-8 place-items-center rounded-full hover:bg-black/10"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h2 className="text-lg font-semibold">{month}</h2>
          <button type="button" onClick={goToToday} className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600">
            Today
          </button>
        </header>

        <div className="grid h-8 shrink-0 grid-cols-7 border-b border-black/10 bg-[#fafafa] text-center text-[12px] font-medium text-slate-500">
          {weekDays.map((day) => (
            <div key={day} className="flex items-center justify-center border-r border-black/5 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-h-[420px] flex-1 grid-cols-7 grid-rows-6">
          {monthDays.map((date) => {
            const dateKey = toDateKey(date);
            const dayEvents = visibleEvents.filter((event) => event.date === dateKey);
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => selectDate(date)}
                className={`min-h-0 border-b border-r border-black/10 p-2 text-left transition hover:bg-slate-50 ${isSelected ? "bg-red-50" : ""} ${isCurrentMonth ? "text-slate-950" : "text-slate-400"}`}
              >
                <span className={`grid size-6 place-items-center rounded-full text-sm ${isToday ? "bg-red-500 text-white" : isSelected ? "bg-red-100 text-red-700" : ""}`}>
                  {date.getDate()}
                </span>
                <span className="mt-1 block space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className="block truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                      style={{ background: calendarContent.calendars.find((calendar) => calendar.id === event.calendarId)?.color }}
                    >
                      {event.time !== "All day" ? `${event.time} ` : ""}
                      {event.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 ? <span className="block text-[11px] text-slate-500">+{dayEvents.length - 3} more</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col border-l border-black/10 bg-[#f9fafb] p-4">
        <h2 className="text-[17px] font-semibold">Events</h2>
        <p className="mt-1 text-[12px] text-slate-500">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(selectedDate)}</p>
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto">
          {selectedEvents.length ? (
            selectedEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => {
                  setSelectedEventId(event.id);
                  track({ eventType: "CALENDAR_EVENT_OPENED", appId: "calendar", metadata: { eventId: event.id } });
                }}
                className={`w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 hover:ring-red-200 ${selectedEvent?.id === event.id ? "outline outline-2 outline-red-200" : ""}`}
              >
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-slate-500">
                  {event.date} - {event.time}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.notes}</p>
              </button>
            ))
          ) : (
            <div className="rounded-xl bg-white p-3 text-sm text-slate-500 shadow-sm ring-1 ring-black/5">No events for this day.</div>
          )}

          <div className="pt-2">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Upcoming</p>
          </div>
          {upcomingEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                setSelectedEventId(event.id);
                setSelectedDate(new Date(`${event.date}T12:00:00`));
                setViewDate(new Date(Number(event.date.slice(0, 4)), Number(event.date.slice(5, 7)) - 1, 1));
                track({ eventType: "CALENDAR_EVENT_OPENED", appId: "calendar", metadata: { eventId: event.id } });
              }}
              className={`w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 hover:ring-red-200 ${selectedEvent?.id === event.id ? "outline outline-2 outline-red-200" : ""}`}
            >
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-slate-500">
                {event.date} - {event.time}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.notes}</p>
            </button>
          ))}
        </div>

        {selectedEvent ? (
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-3 text-sm shadow-sm">
            <p className="font-semibold">{selectedEvent.title}</p>
            <p className="mt-1 text-slate-500">
              {selectedEvent.date} - {selectedEvent.time}
            </p>
            <p className="mt-2 text-slate-600">{selectedEvent.notes}</p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
