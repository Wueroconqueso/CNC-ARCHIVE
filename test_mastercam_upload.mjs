// Automated smoke test for the Mastercam PDF upload flow (extract -> upload
// -> chunk -> save). Not part of the app's own dependencies.
//
// To run:
//   1. npm install playwright --no-save   (and `npx playwright install chromium`
//      once, if you haven't already)
//   2. npm run dev                        (in another terminal/background)
//   3. node test_mastercam_upload.mjs
//
// Uses a throwaway synthetic test PDF, not any real document.

import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

await page.goto("http://localhost:5173");

// Open sidebar, click Mastercam
await page.click('button[aria-label="Toggle menu"]');
await page.click("text=Mastercam");

// Upload the test PDF
const fileInput = await page.locator('input[type="file"]');
// Regenerate this test PDF if it's missing (needs `pip install reportlab`):
//   python -c "
//   from reportlab.pdfgen import canvas
//   c = canvas.Canvas(r'C:\Users\Isaac\AppData\Local\Temp\test_mastercam.pdf')
//   c.drawString(100, 750, 'Mastercam Test Document')
//   c.drawString(100, 700, 'To create a contour toolpath, select the Mill Contour operation')
//   c.drawString(100, 680, 'from the Toolpaths menu, then chain the geometry to cut.')
//   c.save()"
await fileInput.setInputFiles("C:\\Users\\Isaac\\AppData\\Local\\Temp\\test_mastercam.pdf");

// Wait for the status message to show completion or an error
await page.waitForFunction(
  () => {
    const el = [...document.querySelectorAll("p")].find(
      (p) => p.textContent.includes("Done") || p.textContent.includes("Error")
    );
    return el?.textContent;
  },
  { timeout: 30000 }
);

const statusText = await page.evaluate(() => {
  const el = [...document.querySelectorAll("p")].find(
    (p) => p.textContent.includes("Done") || p.textContent.includes("Error")
  );
  return el?.textContent;
});

console.log("STATUS:", statusText);
console.log("CONSOLE ERRORS:", JSON.stringify(consoleErrors, null, 2));

// Check the document list shows the upload
await page.waitForTimeout(1000);
const docListText = await page.evaluate(() => document.body.innerText);
console.log("HAS DOC IN LIST:", docListText.includes("test_mastercam.pdf"));

await browser.close();
