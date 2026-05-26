import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { type AdminDashboardData } from "@/features/admin/admin-analytics";

describe("AdminDashboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders note doodle previews stored in content state", () => {
    const data: AdminDashboardData = {
      mode: "cloud",
      sessions: [],
      attempts: [],
      events: [],
      captures: [],
      music: [],
      unlocks: [],
      contentState: [
        {
          id: "content-1",
          content_type: "note",
          content_id: "note-1",
          state: "available",
          unlocked_at: null,
          created_at: "2026-05-23T09:00:00.000Z",
          metadata: {
            title: "Sketch",
            folder: "Personal",
            body: "<p>hello</p>",
            doodlePreviewUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
          },
        },
      ],
    };

    render(<AdminDashboard data={data} />);

    expect(screen.getByAltText("Note doodle preview for Sketch")).toHaveAttribute(
      "src",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
    );
  });

  it("keeps non-note content state rows visible when notes exist", () => {
    const data: AdminDashboardData = {
      mode: "cloud",
      sessions: [],
      attempts: [],
      events: [],
      captures: [],
      music: [],
      unlocks: [],
      contentState: [
        {
          id: "note-content",
          content_type: "note",
          content_id: "note-1",
          state: "available",
          unlocked_at: null,
          created_at: "2026-05-23T09:00:00.000Z",
          metadata: { title: "Sketch", folder: "Personal", body: "hello" },
        },
        {
          id: "calendar-content",
          content_type: "calendar-event",
          content_id: "anniversary-2026",
          state: "seen",
          unlocked_at: null,
          created_at: "2026-05-23T10:00:00.000Z",
          metadata: { title: "Anniversary" },
        },
      ],
    };

    render(<AdminDashboard data={data} />);

    expect(screen.getByRole("heading", { name: "All content state" })).toBeInTheDocument();
    expect(screen.getByText("calendar-event")).toBeInTheDocument();
    expect(screen.getByText("anniversary-2026")).toBeInTheDocument();
    expect(screen.getByText("seen")).toBeInTheDocument();
  });

  it("shows session, duration, and metadata details for activity rows", () => {
    const data: AdminDashboardData = {
      mode: "cloud",
      sessions: [],
      attempts: [],
      captures: [],
      music: [],
      unlocks: [],
      contentState: [],
      events: [
        {
          session_id: "session-abcdef123",
          app_id: "notes",
          event_type: "NOTE_FORMAT_APPLIED",
          occurred_at: "2026-05-23T11:00:00.000Z",
          duration: 42,
          metadata: { command: "bold", noteId: "note-1" },
        },
      ],
    };

    render(<AdminDashboard data={data} />);

    expect(screen.getByText("session session-abcdef")).toBeInTheDocument();
    expect(screen.getByText("42s")).toBeInTheDocument();
    expect(screen.getByText("command: bold")).toBeInTheDocument();
    expect(screen.getByText("noteId: note-1")).toBeInTheDocument();
  });

  it("shows session duration, end state, and device context", () => {
    const data: AdminDashboardData = {
      mode: "cloud",
      attempts: [],
      events: [],
      captures: [],
      music: [],
      unlocks: [],
      contentState: [],
      sessions: [
        {
          id: "session-device-1",
          started_at: "2026-05-23T11:00:00.000Z",
          ended_at: "2026-05-23T11:02:05.000Z",
          duration: 125,
          device_info: { browser: "Safari", platform: "MacIntel" },
          created_at: "2026-05-23T11:00:00.000Z",
        },
      ],
    };

    render(<AdminDashboard data={data} />);

    expect(screen.getByText("ended")).toBeInTheDocument();
    expect(screen.getByText("2m 5s")).toBeInTheDocument();
    expect(screen.getByText("Safari")).toBeInTheDocument();
    expect(screen.getByText("MacIntel")).toBeInTheDocument();
  });

  it("requires typed confirmation before enabling the destructive reset", async () => {
    const user = userEvent.setup();
    const data: AdminDashboardData = {
      mode: "cloud",
      sessions: [],
      attempts: [],
      events: [],
      captures: [],
      music: [],
      unlocks: [],
      contentState: [],
    };

    render(<AdminDashboard data={data} />);

    await user.click(screen.getByRole("button", { name: "Reset test data" }));

    const resetButton = screen.getByRole("button", { name: "Reset everything" });
    expect(screen.getByText("Reset testing data?")).toBeInTheDocument();
    expect(resetButton).toBeDisabled();

    await user.type(screen.getByLabelText("Type RESET to confirm"), "RESET");
    expect(resetButton).toBeEnabled();
  });

  it("submits the destructive reset through the admin session without sending the password", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "blocked" }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const data: AdminDashboardData = {
      mode: "cloud",
      sessions: [],
      attempts: [],
      events: [],
      captures: [],
      music: [],
      unlocks: [],
      contentState: [],
    };

    render(<AdminDashboard data={data} />);

    await user.click(screen.getByRole("button", { name: "Reset test data" }));
    await user.type(screen.getByLabelText("Type RESET to confirm"), "RESET");
    await user.click(screen.getByRole("button", { name: "Reset everything" }));

    const fetchCalls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>;
    const payload = JSON.parse(String(fetchCalls[0]?.[1]?.body ?? "{}")) as Record<string, unknown>;
    expect(payload).toEqual({ confirmation: "RESET" });
  });

  it("surfaces unlock images and the full puzzle trail", () => {
    const data: AdminDashboardData = {
      mode: "cloud",
      sessions: [],
      events: [],
      captures: [],
      music: [],
      contentState: [],
      unlocks: [
        {
          id: "unlock-face-1",
          session_id: "session-1",
          event_type: "face_unlock",
          success: true,
          occurred_at: "2026-05-23T11:10:00.000Z",
          metadata: { storagePath: "face-1.png" },
          imageUrl: "https://example.com/face-1.png",
        },
      ],
      attempts: [
        {
          session_id: "session-1",
          puzzle_type: "zip",
          level_id: "zip-level-001",
          completed_at: "2026-05-23T11:20:00.000Z",
          created_at: "2026-05-23T11:20:00.000Z",
          duration: 83,
          moves: 12,
          hints_used: 0,
          resets: 0,
          result: "completed",
          metadata: { daily: true },
        },
        {
          session_id: "session-1",
          puzzle_type: "arrow-escape",
          level_id: "arrow-escape-level-017",
          completed_at: "2026-05-23T11:30:00.000Z",
          created_at: "2026-05-23T11:30:00.000Z",
          duration: 142,
          moves: 18,
          hints_used: 0,
          resets: 1,
          result: "completed",
          metadata: {},
        },
      ],
    };

    render(<AdminDashboard data={data} />);

    expect(screen.getByRole("heading", { name: "Face ID and entry history" })).toBeInTheDocument();
    expect(screen.getByAltText("Face unlock capture")).toHaveAttribute("src", "https://example.com/face-1.png");
    expect(screen.getByRole("heading", { name: "Puzzle trail" })).toBeInTheDocument();
    expect(screen.getByText("levels solved")).toBeInTheDocument();
    expect(screen.getByText("1m 23s")).toBeInTheDocument();
    expect(screen.getByText("2m 22s")).toBeInTheDocument();
    expect(screen.getByText("level 017")).toBeInTheDocument();
  });
});
