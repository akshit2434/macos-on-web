"use client";

import { AlertTriangle, Loader2, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { resetLocalRuntimeState } from "./admin-reset";

type ResetState = "idle" | "confirming" | "resetting" | "done" | "error";

export function AdminResetButton({ disabled }: { disabled?: boolean }) {
  const [state, setState] = useState<ResetState>("idle");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const canReset = confirmation.trim().toUpperCase() === "RESET" && state !== "resetting";

  async function resetDatabase() {
    if (!canReset) return;

    setState("resetting");
    setMessage("");

    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: "RESET" }),
    });
    const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (!response.ok || !result.ok) {
      setState("error");
      setMessage(result.error ?? "Reset failed.");
      return;
    }

    resetLocalRuntimeState();
    setConfirmation("");
    setState("done");
    setMessage("Fresh start ready. Cloud logs and this browser's local test progress were cleared.");
    window.setTimeout(() => window.location.reload(), 900);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        title={disabled ? "Cloud admin credentials are required before database reset is available." : undefined}
        onClick={() => setState("confirming")}
        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-red-700/20 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        <RotateCcw className="size-4" />
        Reset test data
      </button>

      {state === "confirming" || state === "resetting" || state === "error" || state === "done" ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/24 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-3xl bg-white p-5 text-slate-950 shadow-2xl ring-1 ring-black/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-normal">Reset testing data?</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    This clears sessions, activity, puzzle attempts/streaks, notes/photos sync state, music history,
                    camera captures, and Face ID/PIN unlock logs. Stored level banks and bundled content stay intact.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={state === "resetting"}
                onClick={() => {
                  setState("idle");
                  setConfirmation("");
                  setMessage("");
                }}
                aria-label="Cancel reset"
                className="grid size-8 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-40"
              >
                <X className="size-4" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-semibold">
              Type RESET to confirm
              <input
                value={confirmation}
                disabled={state === "resetting" || state === "done"}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 disabled:bg-slate-50"
                autoFocus
              />
            </label>

            {message ? (
              <p className={`mt-3 text-sm ${state === "error" ? "text-red-600" : "text-emerald-700"}`}>
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={state === "resetting"}
                onClick={() => {
                  setState("idle");
                  setConfirmation("");
                  setMessage("");
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canReset}
                onClick={resetDatabase}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {state === "resetting" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                Reset everything
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
