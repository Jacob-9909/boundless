// End-to-end check of the core flows against a running server in dev-mail mode
// (EMAIL_SENDER unset, so the login screen shows the code).
//   BASE_URL=http://localhost:3100 CHROME_PATH=/path/to/chrome node e2e/flow.mjs
// Needs ADMIN_EMAILS to include admin@example.com on the server.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const run = Date.now();
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const pageErrors = [];

async function newUser() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" });
  // Members see their culture's language by default; these flows pick English explicitly.
  await ctx.addCookies([{ name: "lang", value: "en", url: BASE }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));
  return page;
}

async function signIn(page, email, culture) {
  await page.goto(BASE + "/login");
  if (culture) {
    // A click that lands before hydration is dropped (cold dev server in CI); click until the pick sticks.
    const pick = page.getByRole("radio", { name: culture });
    for (let i = 0; (await pick.getAttribute("aria-checked")) !== "true"; i++) {
      assert.ok(i < 20, `culture ${culture} was never selected`);
      await pick.click();
      await page.waitForTimeout(300);
    }
  }
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in code" }).click();
  const code = (await page.locator("b.tracking-widest").textContent()).trim();
  await page.getByLabel("6-digit code").fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByText("That code is wrong or expired").waitFor();
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  const last = page.getByText("One last step");
  await Promise.race([last.waitFor(), page.waitForURL(BASE + "/feed")]);
  if (await last.isVisible()) {
    await page.getByRole("button", { name: "Finish sign-up" }).click();
    await page.getByText("Please confirm you are 14 or older").waitFor();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Finish sign-up" }).click();
    await page.waitForURL(BASE + "/feed");
  }
}

async function comment(page, text) {
  await page.getByLabel("Comment").fill(text);
  await page.getByRole("button", { name: "Reply" }).click();
  await page.getByText(text, { exact: true }).waitFor();
}

// Visitor lands on the intro page, can browse the feed, but not open private pages.
const visitor = await newUser();
await visitor.goto(BASE + "/");
await visitor.getByRole("link", { name: "Browse the feed" }).first().click();
await visitor.waitForURL(BASE + "/feed");
await visitor.getByText("Everyone’s square").waitFor();
await visitor.goto(BASE + "/me");
await visitor.getByText("Sign in to see this page").waitFor();

// A (Japan) asks a question; the culture pick pre-fills the public nationality.
const a = await newUser();
await signIn(a, `e2e-a-${run}@example.com`, "日本");
await a.goto(BASE + "/settings");
assert.equal(await a.getByLabel("Public nationality", { exact: true }).inputValue(), "JP");
await a.goto(BASE + "/write");
await a.getByRole("link", { name: /Housing/ }).first().click();
await a.waitForURL(/board=housing/);
let title = `E2E recycling question ${run}`;
await a.getByLabel("Title").fill(title);
// A phone number in the text gets a warning while typing (no AI involved), and it goes once removed.
await a.getByLabel("Post text").fill("Which day are boxes collected in Mapo? Text me 010-1234-5678");
await a.getByText("Personal details showing: phone number. Please remove them before posting.").waitFor();
await a.getByLabel("Post text").fill("Which day are boxes collected in Mapo?");
await a.getByText(/Personal details showing/).waitFor({ state: "detached" });
// One photo: the browser shrinks it to JPEG, the server checks its bytes, the post shows it.
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
await a.locator('input[name="images"]').setInputFiles({ name: "dot.png", mimeType: "image/png", buffer: png });
await a.locator('img[src^="blob:"]').waitFor();
await a.getByRole("button", { name: "Post", exact: true }).click();
await a.waitForURL(/\/posts\/\d+$/);
const postUrl = a.url();
const postId = postUrl.split("/").pop();
await a.waitForFunction(() => {
  const img = document.querySelector('img[alt="Attached photo 1"]');
  return img?.complete && img.naturalWidth > 0;
});
// The word filter stops profanity before it is saved.
await a.getByLabel("Comment").fill("what the fuck");
await a.getByRole("button", { name: "Reply" }).click();
await a.getByText("contains profanity or hate speech").waitFor();
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
const handles = await c.locator("[data-handle]").allTextContents();
assert.deepEqual(handles.slice(0, 4), ["Author", "Neighbor 1", "Neighbor 1", "Neighbor 2"]);

// Community features: helpful vote, save, nested reply, reply alert, solved, edit, delete own reply.
await b.goto(postUrl);
await b.getByRole("button", { name: /^Helpful \d+$/ }).first().click();
await b.getByRole("button", { name: "Helpful 1" }).first().waitFor();
await b.getByRole("button", { name: "Save" }).click();
await b.getByRole("button", { name: "Saved" }).waitFor();
await b.goto(BASE + "/me?tab=saved");
await b.getByText(title).waitFor();
// Following an author gathers their posts on the Following tab.
await b.goto(postUrl);
await b.getByRole("button", { name: "Follow", exact: true }).click();
await b.getByRole("button", { name: "Following", exact: true }).waitFor();
await b.goto(BASE + "/me?tab=following");
await b.getByText("Following 1 neighbors").waitFor();
await b.getByRole("link", { name: title }).first().waitFor();
await b.goto(postUrl);
const thread = b.locator("li", { hasText: "Author follow-up" });
await thread.locator("summary", { hasText: "Reply" }).click();
await thread.getByLabel("Reply").fill("B nested reply");
await thread.getByRole("button", { name: "Post reply" }).click();
await thread.getByText("B nested reply").waitFor();
const mine = b.locator("[data-comment]", { hasText: "B second reply" });
await mine.locator("summary", { hasText: "Delete" }).click();
await mine.getByRole("button", { name: "Delete" }).click();
await b.getByText("B second reply", { exact: true }).waitFor({ state: "detached" });

await a.goto(BASE + "/me");
await a.getByText(/\d+ new replies/).waitFor();
await a.goto(postUrl);
await a.getByRole("button", { name: "Mark as solved" }).click();
// Solved reads as neighbors from different countries solving it together (A: Japan, B: Vietnam).
await a.getByText(/^Solved together · \d+ countries$/).first().waitFor();
await a.getByRole("link", { name: "Edit" }).click();
title = `E2E recycling question (edited) ${run}`;
await a.getByLabel("Title").fill(title);
await a.getByRole("button", { name: "Save" }).click();
await a.waitForURL(postUrl);
assert.equal((await a.locator("h1").textContent()).trim(), `[Question]${title}`);

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
await b.waitForURL(BASE + "/feed?blocked=1");
await b.getByText("You blocked this author").waitFor();
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

// A appeals once; the admin restores the post and it is public again.
await a.goto(postUrl);
await a.getByText("Ask for a second look").click();
await a.getByLabel("Tell us why it should be looked at again").fill("This only asks about recycling days, no personal data.");
await a.getByRole("button", { name: "Send appeal" }).click();
await a.getByText("Appeal received").waitFor();
await admin.goto(BASE + "/admin");
const appealItem = admin.locator("li", { hasText: "no personal data" });
await appealItem.getByRole("button", { name: "Restore" }).click();
await appealItem.waitFor({ state: "detached" });
await visitor.goto(postUrl);
await visitor.getByRole("heading", { level: 1, name: title }).waitFor();

// C deletes the account; signing in again starts a fresh sign-up.
await c.goto(BASE + "/settings");
await c.getByText("Delete account").click();
await c.getByLabel("I understand everything will be deleted").check();
await c.getByRole("button", { name: "Delete", exact: true }).click();
await c.waitForURL(BASE + "/");
await c.getByRole("link", { name: "Sign in" }).waitFor();

// Judges: one click on the intro page enters as a country's sample neighbor.
const judge = await newUser();
await judge.goto(BASE + "/#demo");
await judge.locator("#demo form button", { hasText: "Vietnam" }).first().click();
await judge.waitForURL(BASE + "/feed");
// Switching to a sample neighbor shows the app in that country's language.
const VI = JSON.parse(readFileSync("src/lib/locales/vi.json", "utf8"));
assert.equal(await judge.locator("html").getAttribute("lang"), "vi");
// The greeting heading, not getByText: Next's route announcer sometimes copies the same text after navigation.
await judge.getByRole("heading", { name: VI["{hello}, 이웃님"].replace("{hello}", "Xin chào") }).waitFor();

// Country lounges: the Vietnam lounge is visible to the Vietnamese sample neighbor, not to A (Japan).
await judge.goto(BASE + "/lounge");
const loungeUrl = BASE + (await judge.locator("a[href^='/posts/']").first().getAttribute("href"));
await judge.goto(loungeUrl);
await judge.getByText(VI["{country} 라운지"].replace("{country}", new Intl.DisplayNames(["vi"], { type: "region" }).of("VN"))).last().waitFor();
await a.goto(loungeUrl);
await a.getByText("only for neighbors from Vietnam").waitFor();

// The language menu switches the interface for this browser.
await judge.locator("header summary").click();
await judge.getByRole("button", { name: "한국어", exact: true }).click();
await judge.waitForFunction(() => document.documentElement.lang === "ko");

assert.deepEqual(pageErrors, [], "no uncaught page errors");
await browser.close();
console.log("e2e ok");
