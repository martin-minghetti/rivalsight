import { createHash } from "crypto";

export function hashHtml(html: string): string {
  return createHash("sha256").update(html).digest("hex");
}

export const SAMPLE_HTML = `
<html><body>
  <nav>Menu</nav>
  <main>
    <h1>Pricing</h1>
    <div class="plan">
      <h2>Starter</h2>
      <span>$29/mo</span>
      <ul><li>5 users</li><li>Basic features</li></ul>
    </div>
    <div class="plan">
      <h2>Pro</h2>
      <span>$79/mo</span>
      <ul><li>25 users</li><li>All features</li></ul>
    </div>
  </main>
  <footer>Copyright</footer>
</body></html>
`;
