/**
 * A Zod issue as a sentence, not a path.
 *
 * Joining `issue.path` produced strings like "items 0 title must not be empty",
 * which reads as a stack trace. The field name on its own is enough: the form
 * shows which control is wrong.
 */
export function firstIssueMessage(
  error: { issues: { path: PropertyKey[]; message: string }[] },
  fallback = "Something in that does not look right.",
) {
  const issue = error.issues[0];
  if (!issue) return fallback;

  const message = issue.message.trim();
  return message.charAt(0).toUpperCase() + message.slice(1);
}
