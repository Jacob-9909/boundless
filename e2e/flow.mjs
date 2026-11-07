// End-to-end check of the core flows against a running server in dev-mail mode
// (EMAIL_SENDER unset, so the login screen shows the code).
//   BASE_URL=http://localhost:3100 CHROME_PATH=/path/to/chrome node e2e/flow.mjs
// Needs ADMIN_EMAILS to include admin@example.com on the server.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const run = Date.now();
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const pageErrors = [];

async function newUser() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  return page;
}

async function signIn(page, email, culture) {
  await page.goto(BASE + "/login");
  if (culture) await page.getByRole("radio", { name: culture }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  const code = (await page.locator("b.tracking-widest").textContent()).trim();
  await page.getByLabel("6-digit code").fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByText("That code is wrong or expired").waitFor();
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  const last = page.getByText("One last step");
  await Promise.race([last.waitFor(), page.waitForURL(BASE + "/")]);
  if (await last.isVisible()) {
    await page.getByRole("button", { name: "Finish sign-up" }).click();
    await page.getByText("Please confirm you are 14 or older").waitFor();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Finish sign-up" }).click();
    await page.waitForURL(BASE + "/");
  }
}

async function comment(page, text) {
  await page.getByLabel("Comment").fill(text);
  await page.getByRole("button", { name: "Reply" }).click();
  await page.getByText(text).waitFor();
}

// Visitor can browse but not open private pages.
const visitor = await newUser();
await visitor.goto(BASE + "/");
await visitor.getByText("Latest posts").waitFor();
await visitor.goto(BASE + "/me");
await visitor.getByText("Sign in to see this page").waitFor();

// A (Japan) asks a question; the culture pick pre-fills the public nationality.
const a = await newUser();
await signIn(a, `e2e-a-${run}@example.com`, "日本");
await a.goto(BASE + "/settings");
assert.equal(await a.getByLabel("Public nationality", { exact: true }).inputValue(), "JP");
await a.goto(BASE + "/write");
let title = `E2E recycling question ${run}`;
await a.getByLabel("Title").fill(title);
await a.getByLabel("Topic").selectOption("daily");
await a.getByLabel("Post text").fill("Which day are boxes collected in Mapo?");
await a.getByRole("button", { name: "Post", exact: true }).click();
await a.waitForURL(/\/posts\/\d+$/);
const postUrl = a.url();
const postId = postUrl.split("/").pop();
await comment(a, "Author follow-up");

// B and C reply: per-post anonymous handles.
const b = await newUser();
await signIn(b, `e2e-b-${run}@example.com`, "Việt Nam");
await b.goto(postUrl);
await comment(b, "B first reply");
await comment(b, "B second reply");
const c = await newUser();
await signIn(c, `e2e-c-${run}@example.com`);
await c.goto(postUrl);
await comment(c, "C reply");
const handles = await c.locator("li > div > div > span.font-bold").allTextContents();
assert.deepEqual(handles.slice(0, 4), ["Author", "Neighbor 1", "Neighbor 1", "Neighbor 2"]);

// Community features: helpful vote, save, nested reply, reply alert, solved, edit, delete own reply.
await b.goto(postUrl);
await b.getByRole("button", { name: /^Helpful \d+$/ }).first().click();
await b.getByRole("button", { name: "Helpful 1" }).first().waitFor();
await b.getByRole("button", { name: "Save" }).click();
await b.getByRole("button", { name: "Saved" }).waitFor();
await b.goto(BASE + "/me?tab=saved");
await b.getByText(title).waitFor();
await b.goto(postUrl);
const thread = b.locator("li", { hasText: "Author follow-up" });
await thread.locator("summary", { hasText: "Reply" }).click();
await thread.getByLabel("Reply").fill("B nested reply");
await thread.getByRole("button", { name: "Post reply" }).click();
await thread.getByText("B nested reply").waitFor();
const mine = b.locator("div.rounded-xl", { hasText: "B second reply" });
await mine.locator("summary", { hasText: "Delete" }).click();
await mine.getByRole("button", { name: "Delete" }).click();
await b.getByText("B second reply").waitFor({ state: "detached" });

await a.goto(BASE + "/me");
await a.getByText(/\d+ new replies/).waitFor();
await a.goto(postUrl);
await a.getByRole("button", { name: "Mark as solved" }).click();
await a.getByText("Solved", { exact: true }).waitFor();
await a.getByRole("link", { name: "Edit" }).click();
title = `E2E recycling question (edited) ${run}`;
await a.getByLabel("Title").fill(title);
await a.getByRole("button", { name: "Save" }).click();
await a.waitForURL(postUrl);
assert.equal((await a.locator("h1").textContent()).trim(), title);

// Search finds the post by its original text.
await visitor.goto(BASE + `/search?q=${encodeURIComponent(String(run))}`);
await visitor.getByText(title).waitFor();

// B reports the post, then blocks the author.
await b.goto(BASE + `/report?post=${postId}`);
await b.getByLabel("Reason").selectOption("privacy");
await b.getByRole("button", { name: "Send report" }).click();
await b.getByText("Report received").waitFor();
await b.goto(BASE + "/settings");
await b.getByText("Received").first().waitFor();
await b.goto(BASE + `/report?post=${postId}`);
await b.getByRole("button", { name: "Block author" }).click();
await b.waitForURL(BASE + "/");
assert.equal(await b.getByText(title).count(), 0, "blocked author's post must leave B's feed");
await b.goto(postUrl);
await b.getByText("account you blocked").waitFor();

// Admin hides the reported post; everyone then sees it as hidden.
const admin = await newUser();
await signIn(admin, "admin@example.com");
await admin.goto(BASE + "/admin");
const item = admin.locator("li", { hasText: title });
await item.getByRole("button", { name: "Hide" }).click();
await item.waitFor({ state: "detached" });
await visitor.goto(postUrl);
await visitor.getByText("hidden by moderators").waitFor();

// C deletes the account; signing in again starts a fresh sign-up.
await c.goto(BASE + "/settings");
await c.getByText("Delete account").click();
await c.getByLabel("I understand everything will be deleted").check();
await c.getByRole("button", { name: "Delete", exact: true }).click();
await c.waitForURL(BASE + "/");
await c.getByRole("link", { name: "Sign in" }).waitFor();

assert.deepEqual(pageErrors, [], "no uncaught page errors");
await browser.close();
console.log("e2e ok");
