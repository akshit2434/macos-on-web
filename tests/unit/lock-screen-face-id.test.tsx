import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setFaceIdEnabled } from "@/features/face-id/face-id-preferences";
import { LockScreen } from "@/features/shell/components/LockScreen";

const captureFaceIdSnapshotMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/face-id/face-id-camera", () => ({
  captureFaceIdSnapshot: captureFaceIdSnapshotMock,
  logFaceIdEvent: vi.fn(),
}));

describe("LockScreen Face ID availability", () => {
  beforeEach(() => {
    window.localStorage.clear();
    captureFaceIdSnapshotMock.mockReset();
  });

  it("hides camera unlock by default and points to Settings", () => {
    render(<LockScreen onUnlocked={() => {}} />);

    expect(screen.queryByRole("button", { name: "Use Camera Unlock" })).not.toBeInTheDocument();
    expect(screen.getByText("Face ID is off. Open Settings > Face ID to enable camera unlock.")).toBeInTheDocument();
  });

  it("shows camera unlock after Face ID is enabled", () => {
    setFaceIdEnabled(true);

    render(<LockScreen onUnlocked={() => {}} />);

    expect(screen.getByRole("button", { name: "Use Camera Unlock" })).toBeInTheDocument();
  });

  it("uses the account image and keeps unlock controls disabled until ready", () => {
    setFaceIdEnabled(true);

    render(<LockScreen onUnlocked={() => {}} ready={false} />);

    expect(decodeURIComponent(screen.getByAltText("Demo user account").getAttribute("src") ?? "")).toContain("/account/demo-user.svg");
    expect(screen.getByText("Demo workstation")).toBeInTheDocument();
    expect(screen.getByText("Preparing secure login...")).toBeInTheDocument();
    expect(screen.getByLabelText("Access password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Use Camera Unlock" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enter" })).toBeDisabled();
  });

  it("unlocks immediately when camera unlock is pressed and captures afterward", async () => {
    setFaceIdEnabled(true);
    captureFaceIdSnapshotMock.mockResolvedValue(null);
    const onUnlocked = vi.fn();
    const user = userEvent.setup();

    render(<LockScreen onUnlocked={onUnlocked} />);

    await user.click(screen.getByRole("button", { name: "Use Camera Unlock" }));

    expect(onUnlocked).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(captureFaceIdSnapshotMock).toHaveBeenCalledWith(1000));
  });
});
