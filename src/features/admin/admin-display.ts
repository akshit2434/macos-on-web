export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatAdminDay(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatAdminLevelLabel(levelId: string) {
  return levelId.replace(/^(zip|wordle|arrow-escape)-/, "").replaceAll("-", " ");
}

export function formatAdminTextLabel(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}
