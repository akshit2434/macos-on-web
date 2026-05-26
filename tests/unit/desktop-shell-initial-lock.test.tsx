import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DesktopShellSimulator } from "@/features/shell/DesktopShellSimulator";

describe("DesktopShellSimulator initial lock", () => {
  it("keeps the desktop hidden and login controls gated until the shell is ready", async () => {
    render(<DesktopShellSimulator />);

    expect(screen.queryByText("Finder")).not.toBeInTheDocument();
    expect(screen.getByText("Preparing secure login...")).toBeInTheDocument();
    expect(screen.getByLabelText("Access password")).toBeDisabled();

    await waitFor(() => expect(screen.getByLabelText("Access password")).toBeEnabled());
  });
});
