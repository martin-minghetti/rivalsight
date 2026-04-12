import { describe, it, expect } from "vitest";
import { normalizeHtml } from "@/lib/pipeline/normalize";

describe("normalizeHtml", () => {
  it("strips nav, footer, script, style, noscript tags", () => {
    const html = `
      <html><body>
        <nav>Navigation</nav>
        <main><h1>Content</h1><p>Hello</p></main>
        <footer>Footer</footer>
        <script>alert('x')</script>
        <style>.x { color: red }</style>
        <noscript>Enable JS</noscript>
      </body></html>
    `;
    const result = normalizeHtml(html);
    expect(result).not.toContain("Navigation");
    expect(result).not.toContain("Footer");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("color: red");
    expect(result).not.toContain("Enable JS");
    expect(result).toContain("Content");
    expect(result).toContain("Hello");
  });

  it("extracts main content if <main> exists", () => {
    const html = `
      <html><body>
        <header>Header</header>
        <main><h1>Main Content</h1></main>
        <aside>Sidebar</aside>
      </body></html>
    `;
    const result = normalizeHtml(html);
    expect(result).toContain("Main Content");
    expect(result).not.toContain("Header");
    expect(result).not.toContain("Sidebar");
  });

  it("extracts article content if <article> exists and no <main>", () => {
    const html = `
      <html><body>
        <header>Header</header>
        <article><h1>Article</h1></article>
        <aside>Sidebar</aside>
      </body></html>
    `;
    const result = normalizeHtml(html);
    expect(result).toContain("Article");
    expect(result).not.toContain("Header");
  });

  it("falls back to body if no main or article", () => {
    const html = `
      <html><body>
        <div><h1>Page</h1><p>Text</p></div>
      </body></html>
    `;
    const result = normalizeHtml(html);
    expect(result).toContain("Page");
    expect(result).toContain("Text");
  });

  it("removes class, style, and data-* attributes", () => {
    const html = `
      <html><body><main>
        <div class="foo" style="color:red" data-testid="bar">
          <span data-analytics="click">Text</span>
        </div>
      </main></body></html>
    `;
    const result = normalizeHtml(html);
    expect(result).not.toContain('class=');
    expect(result).not.toContain('style=');
    expect(result).not.toContain('data-');
    expect(result).toContain("Text");
  });

  it("collapses whitespace", () => {
    const html = `
      <html><body><main>
        <p>Hello     world</p>
        <p>  Multiple   spaces  </p>
      </main></body></html>
    `;
    const result = normalizeHtml(html);
    expect(result).not.toMatch(/  +/);
  });

  it("handles empty html gracefully", () => {
    const result = normalizeHtml("");
    expect(result).toBe("");
  });

  it("handles html with only stripped tags", () => {
    const html = `<html><body><nav>Nav</nav><footer>Foot</footer></body></html>`;
    const result = normalizeHtml(html);
    expect(result.trim()).toBe("");
  });
});
