import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsApp } from "@/features/apps/settings/SettingsApp";

describe("Settings account avatar", () => {
  it("uses the shared demo account image in the profile row", () => {
    render(<SettingsApp />);

    expect(decodeURIComponent(screen.getByAltText("Demo user account").getAttribute("src") ?? "")).toContain("/account/demo-user.svg");
  });
});
