"use client";

import { CheckCircle2, Info, RotateCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { appRegistry } from "@/features/shell/apps";
import { AppIcon } from "@/features/shell/components/AppIcon";
import type { AppDefinition } from "@/features/shell/types";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { cn } from "@/lib/utils";
import { editorialCards, storeSections, type StoreSectionId } from "./app-store-content";

export function AppStoreApp() {
  const [selectedSectionId, setSelectedSectionId] = useState<StoreSectionId>("discover");
  const [query, setQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [updatedAppIds, setUpdatedAppIds] = useState(() => new Set<string>());
  const [toast, setToast] = useState<string | null>(null);
  const openApp = useWindowStore((state) => state.openApp);
  const { track } = useAnalytics();
  const apps = useMemo(() => appRegistry.filter((app) => app.id !== "app-store"), []);
  const section = storeSections.find((item) => item.id === selectedSectionId) ?? storeSections[0];
  const selectedApp = apps.find((app) => app.id === selectedAppId) ?? null;
  const normalizedQuery = query.trim().toLowerCase();

  const visibleApps = apps.filter((app) => {
    const matchesSection = section.categories === "all" || section.categories.includes(app.category);
    const matchesQuery = `${app.name} ${app.category}`.toLowerCase().includes(normalizedQuery);
    return matchesSection && (!normalizedQuery || matchesQuery);
  });

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  function runUpdate(app: AppDefinition) {
    setUpdatedAppIds((current) => new Set(current).add(app.id));
    showToast(`${app.name} is up to date`);
    track({ eventType: "APP_STORE_UPDATE_TAPPED", appId: "app-store", metadata: { targetAppId: app.id } });
  }

  function openInstalledApp(app: AppDefinition) {
    openApp(app.id);
    showToast(`Opening ${app.name}`);
    track({ eventType: "APP_STORE_OPEN_APP", appId: "app-store", metadata: { targetAppId: app.id } });
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[210px_minmax(0,1fr)] overflow-hidden bg-[#f5f5f7] text-slate-950">
      <aside className="min-h-0 border-r border-black/10 bg-[#ececf0]/92 p-3">
        <div className="mb-3 flex h-8 items-center gap-2 rounded-md bg-white/75 px-2 text-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
          <Search className="size-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
          />
        </div>
        <nav className="space-y-1" aria-label="App Store sections">
          {storeSections.map((item) => {
            const Icon = item.icon;
            const active = item.id === selectedSectionId;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={() => {
                  setSelectedSectionId(item.id);
                  track({ eventType: "APP_STORE_SECTION_OPENED", appId: "app-store", metadata: { section: item.id } });
                }}
                className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px]", active ? "bg-white font-semibold shadow-sm" : "text-slate-700 hover:bg-white/55")}
              >
                <Icon className={cn("size-4", active ? "text-[#007aff]" : "text-slate-500")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-5 rounded-lg bg-white/65 p-3 text-[12px] leading-5 text-slate-600 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
          <p className="font-semibold text-slate-900">Updates</p>
          <p>{updatedAppIds.size ? `${updatedAppIds.size} local checks complete.` : "All installed apps can be checked locally."}</p>
        </div>
      </aside>

      <main className="min-h-0 overflow-auto px-7 pb-5 pt-0">
        <header data-testid="app-store-header" className="-mx-7 mb-5 border-b border-black/10 bg-[#f5f5f7] px-7 pb-4 pt-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#007aff]">{section.label}</p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-bold leading-tight tracking-normal">App Store</h1>
              <p className="text-sm text-slate-500">{section.subtitle}</p>
            </div>
            <button type="button" onClick={() => showToast("Account details are local in this build.")} className="grid size-9 place-items-center rounded-full bg-white text-sm font-semibold text-[#007aff] shadow-sm">
              N
            </button>
          </div>
        </header>

        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="text-xl font-bold">Today</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {editorialCards.map((card) => {
              const app = apps.find((item) => item.id === card.appId);
              return (
                <article key={card.id} className="min-h-[170px] overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{card.kicker}</p>
                    <h3 className="mt-2 max-w-[360px] text-2xl font-bold leading-7">{card.title}</h3>
                    <p className="mt-2 max-w-[420px] text-sm leading-5 text-slate-500">{card.body}</p>
                  </div>
                  <div className="mt-5 space-y-2">
                    {app ? <AppPill app={app} onOpen={() => openInstalledApp(app)} /> : null}
                    {app ? (
                      <button type="button" onClick={() => setSelectedAppId(app.id)} className="w-full rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#007aff] hover:bg-slate-200">
                        View Story
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-7" aria-labelledby="installed-heading">
          <div className="flex items-center justify-between">
            <h2 id="installed-heading" className="text-xl font-bold">{selectedSectionId === "updates" ? "Available Updates" : "Installed"}</h2>
            <button type="button" onClick={() => visibleApps.forEach(runUpdate)} className="rounded-full bg-[#007aff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006de5]">
              Update All
            </button>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            {visibleApps.length ? visibleApps.map((app) => (
              <InstalledAppRow
                key={app.id}
                app={app}
                updated={updatedAppIds.has(app.id)}
                onOpen={() => openInstalledApp(app)}
                onUpdate={() => runUpdate(app)}
                onInfo={() => {
                  setSelectedAppId(app.id);
                  track({ eventType: "APP_STORE_VERSION_HISTORY_OPENED", appId: "app-store", metadata: { targetAppId: app.id } });
                }}
              />
            )) : (
              <p className="p-6 text-sm text-slate-500">No apps match this search.</p>
            )}
          </div>
        </section>

        <div className="h-8" />
      </main>

      {selectedApp ? <VersionModal app={selectedApp} updated={updatedAppIds.has(selectedApp.id)} onClose={() => setSelectedAppId(null)} onOpen={() => openInstalledApp(selectedApp)} onUpdate={() => runUpdate(selectedApp)} /> : null}
      {toast ? <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-xl">{toast}</div> : null}
    </div>
  );
}

function InstalledAppRow({ app, updated, onOpen, onUpdate, onInfo }: { app: AppDefinition; updated: boolean; onOpen: () => void; onUpdate: () => void; onInfo: () => void }) {
  return (
    <article className="flex items-center gap-4 border-b border-black/5 p-4 last:border-b-0">
      <AppIcon app={app} size="sm" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold">{app.name}</h3>
        <p className="text-xs capitalize text-slate-500">{app.category}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onOpen} className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase text-[#007aff] hover:bg-slate-200">Open</button>
        <button type="button" onClick={onInfo} className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" title="Version history" aria-label={`Version history for ${app.name}`}>
          <Info className="size-4" />
        </button>
        <button type="button" onClick={onUpdate} className={cn("grid size-8 place-items-center rounded-full", updated ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")} title={updated ? "Updated" : "Update"} aria-label={updated ? `${app.name} updated` : `Update ${app.name}`}>
          {updated ? <CheckCircle2 className="size-4" /> : <RotateCw className="size-4" />}
        </button>
      </div>
    </article>
  );
}

function AppPill({ app, onOpen }: { app: AppDefinition; onOpen: () => void }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 rounded-lg bg-slate-50 p-2">
      <AppIcon app={app} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{app.name}</p>
        <p className="text-xs capitalize text-slate-500">{app.category}</p>
      </div>
      <button type="button" onClick={onOpen} className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-[#007aff] shadow-sm hover:bg-slate-100">
        Open
      </button>
    </div>
  );
}

function VersionModal({ app, updated, onClose, onOpen, onUpdate }: { app: AppDefinition; updated: boolean; onClose: () => void; onOpen: () => void; onUpdate: () => void }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/30 p-6 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <AppIcon app={app} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold">{app.name}</h2>
            <p className="text-sm capitalize text-slate-500">{app.category}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Close version history">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <p className="font-semibold">Version 1.0.{app.id.length}</p>
            <p className="mt-1 text-slate-600">Local-first build with native window behavior, richer controls, and app-specific logging.</p>
          </div>
          <div>
            <p className="font-semibold">Latest changes</p>
            <p className="mt-1 text-slate-600">Polished icon, launch, resize, and interaction states for the current simulator build.</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onOpen} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-[#007aff] hover:bg-slate-200">
            Open
          </button>
          <button type="button" onClick={onUpdate} className="rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006de5]">
            {updated ? "Recheck" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
