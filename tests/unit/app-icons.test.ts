import { describe, expect, it } from "vitest";

import { getAppDefinition } from "@/features/shell/apps";

describe("app icons", () => {
  it("uses a dedicated Zip game icon asset", () => {
    expect(getAppDefinition("zip")?.iconSrc).toBe("/app-icons/zip.svg");
  });
});
