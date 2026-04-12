const STRIP_TAGS = ["nav", "footer", "script", "style", "noscript", "header", "aside"];
const STRIP_ATTRS = /\s+(class|style|data-[\w-]+)="[^"]*"/g;

export function normalizeHtml(html: string): string {
  if (!html.trim()) return "";

  let result = html;

  // Strip unwanted tags and their content
  for (const tag of STRIP_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    result = result.replace(regex, "");
  }

  // Extract main content area
  const mainMatch = result.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatch = result.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const bodyMatch = result.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (mainMatch) {
    result = mainMatch[1];
  } else if (articleMatch) {
    result = articleMatch[1];
  } else if (bodyMatch) {
    result = bodyMatch[1];
  }

  // Remove styling/data attributes
  result = result.replace(STRIP_ATTRS, "");

  // Collapse whitespace
  result = result.replace(/\s+/g, " ").trim();

  // Clean up empty tags left behind
  result = result.replace(/<(\w+)[^>]*>\s*<\/\1>/g, "").trim();

  return result;
}
