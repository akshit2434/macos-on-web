type InlineCommand = "bold" | "italic";

export function insertInlineFormat(editor: HTMLDivElement, command: InlineCommand) {
  const range = getEditorRange(editor);
  const element = document.createElement(command === "bold" ? "strong" : "em");
  element.textContent = getRangeText(range, command === "bold" ? "Bold text" : "Italic text").join(" ");
  replaceSelection(editor, [element], element.firstChild ?? element);
}

export function insertBulletList(editor: HTMLDivElement) {
  const range = getEditorRange(editor);
  const list = document.createElement("ul");

  getRangeText(range, "List item").forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  });

  replaceSelection(editor, [list], list.lastChild);
}

export function insertChecklist(editor: HTMLDivElement) {
  const range = getEditorRange(editor);
  const label = getRangeText(range, "Checklist item").join(" ");
  const checklist = document.createElement("div");
  const row = document.createElement("div");
  const check = document.createElement("span");
  const text = document.createElement("span");

  checklist.className = "notes-checklist";
  checklist.dataset.notesChecklist = "true";
  row.className = "notes-check-row";
  row.dataset.checked = "false";
  check.className = "notes-check";
  check.contentEditable = "false";
  check.setAttribute("role", "checkbox");
  check.setAttribute("aria-checked", "false");
  check.setAttribute("aria-label", label);
  check.tabIndex = 0;
  text.className = "notes-check-text";
  text.textContent = label;

  row.append(check, text);
  checklist.append(row);
  replaceSelection(editor, [checklist], text.firstChild ?? text);
}

export function toggleChecklistTarget(target: HTMLElement) {
  const checkbox = target.closest<HTMLElement>(".notes-check");
  const item = checkbox?.closest<HTMLElement>("[data-checked]");
  if (!checkbox || !item) return false;

  const checked = item.dataset.checked !== "true";
  item.dataset.checked = checked ? "true" : "false";
  checkbox.setAttribute("aria-checked", checked ? "true" : "false");
  return true;
}

function getEditorRange(editor: HTMLDivElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return placeRangeAtEditorEnd(editor);
  }

  const range = selection.getRangeAt(0);
  if (editor.contains(range.commonAncestorContainer)) {
    return range;
  }

  return placeRangeAtEditorEnd(editor);
}

function placeRangeAtEditorEnd(editor: HTMLDivElement) {
  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);

  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  return range;
}

function replaceSelection(editor: HTMLDivElement, nodes: Node[], caretTarget: Node | null) {
  const range = getEditorRange(editor);
  const fragment = document.createDocumentFragment();
  nodes.forEach((node) => fragment.appendChild(node));
  range.deleteContents();
  range.insertNode(fragment);
  editor.focus();

  if (caretTarget) {
    placeCaretAtEnd(caretTarget);
  }
}

function placeCaretAtEnd(node: Node) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  if (node.nodeType === Node.TEXT_NODE) {
    range.setStart(node, node.textContent?.length ?? 0);
  } else {
    range.selectNodeContents(node);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

function getRangeText(range: Range, fallback: string) {
  const text = range.toString().trim();
  return text ? text.split(/\n+/).map((line) => line.trim()).filter(Boolean) : [fallback];
}
