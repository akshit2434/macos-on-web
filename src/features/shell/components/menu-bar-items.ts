export type MenuItem = { type?: "item"; label: string; shortcut?: string; disabled?: boolean } | { type: "separator" };

export function getDropdownItems(menuId: string, appName: string): MenuItem[] {
  if (menuId === "apple") {
    return [
      { label: "About This Mac" },
      { type: "separator" },
      { label: "System Settings..." },
      { label: "App Store..." },
      { type: "separator" },
      { label: "Recent Items" },
      { label: "Force Quit...", shortcut: "⌥⌘⎋" },
      { type: "separator" },
      { label: "Sleep" },
      { label: "Restart..." },
      { label: "Shut Down..." },
    ];
  }

  if (menuId === "app") {
    return [
      { label: `About ${appName}` },
      { label: "Settings...", shortcut: "⌘," },
      { type: "separator" },
      { label: "Services" },
      { type: "separator" },
      { label: `Hide ${appName}`, shortcut: "⌘H" },
      { label: "Hide Others", shortcut: "⌥⌘H" },
      { label: "Show All", disabled: true },
    ];
  }

  const menuName = menuId.replace("menu:", "");
  const itemsByMenu: Record<string, MenuItem[]> = {
    File: [
      { label: "New Window", shortcut: "⌘N" },
      { label: "New Folder", shortcut: "⇧⌘N" },
      { label: "Open", shortcut: "⌘O" },
      { type: "separator" },
      { label: "Close Window", shortcut: "⌘W" },
      { label: "Get Info", shortcut: "⌘I" },
    ],
    Edit: [
      { label: "Undo", shortcut: "⌘Z" },
      { label: "Redo", shortcut: "⇧⌘Z" },
      { type: "separator" },
      { label: "Cut", shortcut: "⌘X" },
      { label: "Copy", shortcut: "⌘C" },
      { label: "Paste", shortcut: "⌘V" },
      { label: "Select All", shortcut: "⌘A" },
    ],
    View: [
      { label: "as Icons", shortcut: "⌘1" },
      { label: "as List", shortcut: "⌘2" },
      { label: "as Columns", shortcut: "⌘3" },
      { label: "as Gallery", shortcut: "⌘4" },
      { type: "separator" },
      { label: "Show Preview" },
    ],
    Format: [
      { label: "Bold", shortcut: "⌘B" },
      { label: "Italic", shortcut: "⌘I" },
      { label: "Underline", shortcut: "⌘U" },
      { type: "separator" },
      { label: "Make Plain Text" },
    ],
    Window: [
      { label: "Minimize", shortcut: "⌘M" },
      { label: "Zoom" },
      { type: "separator" },
      { label: "Bring All to Front" },
    ],
    Help: [
      { label: `${appName} Help` },
      { label: "Search" },
    ],
  };

  return itemsByMenu[menuName] ?? [{ label: `${menuName} Commands`, disabled: true }];
}
