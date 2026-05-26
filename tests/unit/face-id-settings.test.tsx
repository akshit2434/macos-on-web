import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FaceIdSettingsPane } from "@/features/apps/settings/FaceIdSettingsPane";
import { isFaceIdEnabled } from "@/features/face-id/face-id-preferences";

const captureFaceIdSnapshotMock = vi.hoisted(() => vi.fn());
const logFaceIdEventMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/face-id/face-id-camera", () => ({
  captureFaceIdSnapshot: captureFaceIdSnapshotMock,
  logFaceIdEvent: logFaceIdEventMock,
}));

describe("FaceIdSettingsPane", () => {
  beforeEach(() => {
    window.localStorage.clear();
    captureFaceIdSnapshotMock.mockResolvedValue(new Blob(["face"], { type: "image/jpeg" }));
    logFaceIdEventMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("enables Face ID only after camera enrollment completes", async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    let resolveCapture: (snapshot: Blob) => void = () => {};
    captureFaceIdSnapshotMock.mockReturnValue(new Promise((resolve) => {
      resolveCapture = resolve;
    }));

    render(<FaceIdSettingsPane notify={notify} />);

    expect(screen.getByText("Set Up Face ID")).toBeInTheDocument();
    expect(isFaceIdEnabled()).toBe(false);

    await user.click(screen.getByRole("button", { pressed: false }));

    expect(await screen.findByText("Requesting camera permission...")).toBeInTheDocument();
    expect(isFaceIdEnabled()).toBe(false);

    resolveCapture(new Blob(["face"], { type: "image/jpeg" }));
    await waitFor(() => expect(screen.getByText("Face ID is active")).toBeInTheDocument(), { timeout: 2500 });
    expect(isFaceIdEnabled()).toBe(true);
    expect(captureFaceIdSnapshotMock).toHaveBeenCalledTimes(1);
    expect(logFaceIdEventMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "face_id_enrollment",
      success: true,
    }));
  });
});
