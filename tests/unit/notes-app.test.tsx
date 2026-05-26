import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { NotesApp } from "@/features/apps/notes/NotesApp";

afterEach(() => {
  window.localStorage.clear();
});

describe("NotesApp", () => {
  it("keeps the typing cursor at the end while editing a new note", async () => {
    const user = userEvent.setup();
    render(<NotesApp />);

    await user.click(screen.getByRole("button", { name: "New Note" }));
    const editor = document.querySelector('[contenteditable="true"]');

    expect(editor).toBeInstanceOf(HTMLElement);
    await user.click(editor as HTMLElement);
    await user.keyboard("abc");

    expect(editor).toHaveTextContent("abc");
  });

  it("keeps the cursor at the end after the note preview syncs", async () => {
    const user = userEvent.setup();
    render(<NotesApp />);

    await user.click(screen.getByRole("button", { name: "New Note" }));
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;

    await user.click(editor);
    await user.keyboard("a");

    await waitFor(() => expect(editor).toHaveTextContent("a"));

    await user.keyboard("b");

    expect(editor).toHaveTextContent("ab");
  });

  it("turns selected text into a bullet list", async () => {
    const user = userEvent.setup();
    render(<NotesApp />);

    await user.click(screen.getByRole("button", { name: "New Note" }));
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;

    await user.click(editor);
    await user.keyboard("First");
    await user.keyboard("{Control>}a{/Control}");
    await user.click(screen.getByRole("button", { name: "Bullets" }));

    expect(editor.querySelector("ul li")).toHaveTextContent("First");
  });

  it("inserts a usable checklist row", async () => {
    const user = userEvent.setup();
    render(<NotesApp />);

    await user.click(screen.getByRole("button", { name: "New Note" }));
    await user.click(screen.getByRole("button", { name: "Checklist" }));

    const checkbox = screen.getByRole("checkbox", { name: "Checklist item" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await user.click(checkbox);

    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });
});
