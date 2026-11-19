/** Tiny class-name joiner (keeps JSX tidy without a classnames dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
