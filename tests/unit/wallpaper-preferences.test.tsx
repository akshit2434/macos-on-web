import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  resolveWallpaperPreference,
  useWallpaperPreference,
  wallpaperPreferenceStorageKey,
} from "@/features/shell/wallpaper-preferences";

function WallpaperProbe() {
  const { selectedWallpaperId, setWallpaperId, wallpaper } = useWallpaperPreference();

  return (
    <div>
      <p>{selectedWallpaperId}</p>
      <p>{wallpaper.src}</p>
      <button type="button" onClick={() => setWallpaperId("studio")}>
        Use studio
      </button>
    </div>
  );
}

describe("wallpaper preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back to the default wallpaper for unknown ids", () => {
    expect(resolveWallpaperPreference("missing").id).toBe("dawn");
  });

  it("loads, updates, and persists the selected wallpaper locally", async () => {
    window.localStorage.setItem(wallpaperPreferenceStorageKey, "dawn");
    const user = userEvent.setup();

    render(<WallpaperProbe />);

    expect(await screen.findByText("dawn")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use studio" }));

    await waitFor(() => expect(screen.getByText("studio")).toBeInTheDocument());
    expect(screen.getByText("/wallpapers/studio.svg")).toBeInTheDocument();
    expect(window.localStorage.getItem(wallpaperPreferenceStorageKey)).toBe("studio");
  });
});
