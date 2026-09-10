/** Build a stable path for a task with or without project. */
export function taskHref(task: {
  id: string;
  projectId?: string | null;
}): string {
  if (task.projectId) {
    return `/projects/${task.projectId}/tasks/${task.id}`;
  }
  return `/tasks/${task.id}`;
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function summarizeHtml(
  html: string | null | undefined,
  max = 140,
): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}
