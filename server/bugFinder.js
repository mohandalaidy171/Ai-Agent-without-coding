import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'server', 'public', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function toAbsoluteUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) throw new Error('Target URL is required.');
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function sameOrigin(url, origin) {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function makeBug({ severity = 'medium', category, title, description, evidence, recommendation, url, screenshotUrl }) {
  return {
    id: `bug-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    severity,
    category,
    title,
    description,
    evidence,
    recommendation,
    url,
    screenshotUrl
  };
}

function parseScenarioSteps(prompt) {
  return String(prompt || '')
    .split(/\r?\n|(?:\s+ثم\s+)|(?:\s+then\s+)/i)
    .map(step => step.trim())
    .filter(step => step && !step.startsWith('#') && !step.startsWith('//'));
}

function extractQuotedText(text) {
  const quoted = String(text || '').match(/["']([^"']+)["']/);
  return quoted ? quoted[1].trim() : '';
}

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTarget(text) {
  return String(text || '')
    .replace(/^(click on|click|press|open|tap|اضغط على|انقر على|اكبس على|اضغط|انقر|اكبس|افتح)\s+/i, '')
    .replace(/^(verify|assert|check|تاكد من وجود|تأكد من وجود|تحقق من|شوف)\s+/i, '')
    .replace(/^(type|fill|write|اكتب|ادخل)\s+/i, '')
    .replace(/\s+(button|field|input|label|زر|حقل|ليبل|نص)$/i, '')
    .replace(/["']/g, '')
    .trim();
}

function getPromptFocus(prompt) {
  const text = String(prompt || '').toLowerCase();
  return {
    wantsTranslation: /ترجم|ترجمة|translation|translate|language|لغة|عربي|انجليزي|english|arabic/i.test(text),
    wantsLabels: /label|ليبل|تسمية|نص|copy|wording|placeholder|رسالة|message/i.test(text),
    wantsForms: /form|input|field|login|signup|checkout|حقل|فورم|دخول|تسجيل|دفع/i.test(text),
    wantsLinks: /link|route|navigation|broken|رابط|روابط|تنقل|صفحة/i.test(text)
  };
}

async function tryLogin(page, credentials) {
  if (!credentials.username && !credentials.password) return false;

  const usernameInput = page.locator(
    'input[type="email"], input[type="text"], input[name*="user" i], input[name*="email" i], input[id*="user" i], input[id*="email" i]'
  ).first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (!(await usernameInput.isVisible().catch(() => false)) || !(await passwordInput.isVisible().catch(() => false))) {
    return false;
  }

  await usernameInput.fill(credentials.username || '');
  await passwordInput.fill(credentials.password || '');

  const submitButton = page.locator(
    'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("تسجيل"), button:has-text("دخول")'
  ).first();

  if (await submitButton.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null),
      submitButton.click()
    ]);
  } else {
    await passwordInput.press('Enter');
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
  }

  return true;
}

async function discoverLinks(page, baseOrigin, prompt) {
  const promptWords = String(prompt || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);

  const links = await page.locator('a[href]').evaluateAll((anchors) => anchors
    .map(anchor => ({ href: anchor.href, text: anchor.innerText || anchor.getAttribute('aria-label') || '' }))
    .filter(item => item.href && !item.href.startsWith('mailto:') && !item.href.startsWith('tel:')));

  return links
    .filter(item => sameOrigin(item.href, baseOrigin))
    .map(item => ({
      ...item,
      score: promptWords.some(word => `${item.href} ${item.text}`.toLowerCase().includes(word)) ? 2 : 1
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.href);
}

async function collectContentQualityBugs(page, url, prompt) {
  const focus = getPromptFocus(prompt);
  const findings = await page.evaluate((focus) => {
    const result = [];
    const visibleTextNodes = [];
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (!text || text.length < 2) continue;

      const parent = node.parentElement;
      if (!parent) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;

      visibleTextNodes.push(text);
    }

    const pageText = visibleTextNodes.join(' \n ');
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    const dir = (document.documentElement.dir || document.body?.dir || '').toLowerCase();
    const arabicChars = (pageText.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (pageText.match(/[A-Za-z]/g) || []).length;

    const badTextPatterns = [
      { pattern: /\bundefined\b/i, title: 'Visible text contains "undefined"' },
      { pattern: /\bnull\b/i, title: 'Visible text contains "null"' },
      { pattern: /\bNaN\b/, title: 'Visible text contains "NaN"' },
      { pattern: /\[object Object\]/i, title: 'Visible text contains "[object Object]"' },
      { pattern: /\bTODO\b|\bFIXME\b|lorem ipsum/i, title: 'Placeholder or developer text is visible' },
      { pattern: /Ø.|Ù.|Û.|â€™|â€œ|â€|ï¸|ðŸ/i, title: 'Text appears corrupted or incorrectly encoded' }
    ];

    badTextPatterns.forEach(({ pattern, title }) => {
      const match = pageText.match(pattern);
      if (match) {
        result.push({
          severity: title.includes('corrupted') ? 'high' : 'medium',
          category: 'Content Quality',
          title,
          evidence: match[0]
        });
      }
    });

    if ((focus.wantsTranslation || focus.wantsLabels) && arabicChars > 30 && latinChars > 30) {
      result.push({
        severity: 'medium',
        category: 'Translation / Localization',
        title: 'Mixed Arabic and English text found on the same page',
        evidence: `Arabic chars: ${arabicChars}, Latin chars: ${latinChars}`
      });
    }

    if (arabicChars > latinChars * 2 && dir !== 'rtl') {
      result.push({
        severity: 'medium',
        category: 'Translation / Localization',
        title: 'Arabic page does not use RTL direction',
        evidence: `html dir="${dir || '(empty)'}", lang="${htmlLang || '(empty)'}"`
      });
    }

    if (latinChars > arabicChars * 2 && dir === 'rtl') {
      result.push({
        severity: 'low',
        category: 'Translation / Localization',
        title: 'English-heavy page is using RTL direction',
        evidence: `html dir="${dir}", lang="${htmlLang || '(empty)'}"`
      });
    }

    document.querySelectorAll('label').forEach((label, index) => {
      const text = label.innerText.replace(/\s+/g, ' ').trim();
      if (!text || /^(label|field|input|name|text)$/i.test(text)) {
        result.push({
          severity: 'medium',
          category: 'Labels / UX Copy',
          title: 'Form label is missing or too generic',
          evidence: `Label #${index + 1}: "${text || '(empty)'}"`
        });
      }
    });

    document.querySelectorAll('input, textarea').forEach((field, index) => {
      if (field.type === 'hidden') return;
      const placeholder = field.getAttribute('placeholder') || '';
      if (/enter|type|write|input|ادخل|اكتب/i.test(placeholder) && placeholder.trim().split(/\s+/).length <= 2) {
        result.push({
          severity: 'low',
          category: 'Labels / UX Copy',
          title: 'Placeholder is too generic',
          evidence: `Field #${index + 1}: placeholder="${placeholder}"`
        });
      }
    });

    document.querySelectorAll('[required]').forEach((field, index) => {
      const label = field.labels?.[0]?.innerText || field.getAttribute('aria-label') || field.getAttribute('placeholder') || '';
      if (!/required|\*|مطلوب/i.test(label)) {
        result.push({
          severity: 'low',
          category: 'Forms / Validation',
          title: 'Required field is not visibly marked as required',
          evidence: `Required field #${index + 1}: "${label || field.outerHTML.slice(0, 120)}"`
        });
      }
    });

    return result;
  }, focus);

  return findings.map(finding => makeBug({
    ...finding,
    description: 'This looks like a user-facing quality issue: wrong wording, missing label, broken translation, or unclear form copy.',
    recommendation: 'Review the visible text and labels with the product language/design standard, then update the copy or localization files.',
    url
  }));
}

async function runPromptScenario(page, prompt, credentials, url, onEvent) {
  const bugs = [];
  const steps = parseScenarioSteps(prompt).slice(0, 12);
  if (steps.length === 0) return bugs;

  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    const lowerStep = step.toLowerCase();
    onEvent('bug-scan-scenario-step', { step, index: index + 1, total: steps.length });

    try {
      const quotedText = extractQuotedText(step);

      if (/^(click on|click|press|tap|open|اضغط|انقر|اكبس|افتح)/i.test(step)) {
        const target = quotedText || normalizeTarget(step);
        const targetPattern = new RegExp(escapeRegex(target), 'i');
        const locator = page.getByRole('button', { name: targetPattern })
          .or(page.getByRole('link', { name: targetPattern }))
          .or(page.locator(`text=${target}`))
          .first();

        if (!(await locator.isVisible({ timeout: 3500 }).catch(() => false))) {
          bugs.push(makeBug({
            severity: 'high',
            category: 'Prompt Scenario',
            title: 'Scenario target was not found',
            description: 'The scan tried to execute a click/open step from your prompt, but the requested UI element was not visible.',
            evidence: `Step ${index + 1}: ${step}`,
            recommendation: 'Check whether the button/link text is wrong, translated incorrectly, hidden, disabled, or missing from the page.',
            url
          }));
          continue;
        }

        await Promise.all([
          page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => null),
          locator.click({ timeout: 5000 })
        ]);
        continue;
      }

      if (/^(type|fill|write|اكتب|ادخل)/i.test(step)) {
        const value = quotedText || (
          lowerStep.includes('password') || step.includes('كلمة') ? credentials.password :
          lowerStep.includes('user') || lowerStep.includes('email') || step.includes('مستخدم') || step.includes('ايميل') ? credentials.username :
          'test'
        );

        const fieldTarget = normalizeTarget(step.split(/\s+(?:in|into|في)\s+/i).pop() || step);
        const fieldPattern = new RegExp(escapeRegex(fieldTarget), 'i');
        const field = page.getByLabel(fieldPattern)
          .or(page.getByPlaceholder(fieldPattern))
          .or(page.locator('input:not([type="hidden"]), textarea').first())
          .first();

        if (!(await field.isVisible({ timeout: 3500 }).catch(() => false))) {
          bugs.push(makeBug({
            severity: 'high',
            category: 'Prompt Scenario',
            title: 'Scenario field was not found',
            description: 'The scan tried to fill a field from your prompt, but no matching input was visible.',
            evidence: `Step ${index + 1}: ${step}`,
            recommendation: 'Check the field label, placeholder, translation, visibility, or form state.',
            url
          }));
          continue;
        }

        await field.fill(value);
        continue;
      }

      if (/^(verify|assert|check|تاكد|تأكد|تحقق|شوف)/i.test(step)) {
        const expected = quotedText || normalizeTarget(step);
        const found = await page.locator(`text=${expected}`).first().isVisible({ timeout: 3500 }).catch(() => false);
        if (!found) {
          bugs.push(makeBug({
            severity: 'medium',
            category: 'Prompt Scenario',
            title: 'Expected scenario text was not found',
            description: 'The prompt expected a certain text or state to appear, but the scanner did not find it.',
            evidence: `Step ${index + 1}: ${step}`,
            recommendation: 'Check if the scenario failed, the text is translated differently, or the page does not show the expected confirmation/error.',
            url
          }));
        }
      }
    } catch (error) {
      bugs.push(makeBug({
        severity: 'high',
        category: 'Prompt Scenario',
        title: 'Scenario step failed while running',
        description: 'The scanner hit an error while executing a step from your prompt.',
        evidence: `Step ${index + 1}: ${step}. Error: ${error.message}`,
        recommendation: 'Make the prompt step more specific, or inspect whether the UI changed before this action.',
        url
      }));
    }
  }

  return bugs;
}

async function collectPageBugs(page, url, runtime, prompt) {
  const bugs = [];

  const title = await page.title().catch(() => '');
  if (!title || title.trim().length < 3) {
    bugs.push(makeBug({
      severity: 'low',
      category: 'SEO / Usability',
      title: 'Page title is missing or too short',
      description: 'The browser title is empty or not descriptive enough for users, tabs, bookmarks, and search engines.',
      evidence: `Title: "${title || '(empty)'}"`,
      recommendation: 'Add a short descriptive title that explains the page purpose.',
      url
    }));
  }

  const accessibilityFindings = await page.evaluate(() => {
    const findings = [];

    document.querySelectorAll('img').forEach((img, index) => {
      if (!img.getAttribute('alt')) {
        findings.push({
          severity: 'medium',
          category: 'Accessibility',
          title: 'Image is missing alt text',
          evidence: `Image #${index + 1}: ${img.currentSrc || img.src || 'inline image'}`
        });
      }
    });

    document.querySelectorAll('input, textarea, select').forEach((field, index) => {
      const id = field.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
      const hasName = field.getAttribute('aria-label') || field.getAttribute('placeholder') || field.getAttribute('title');
      if (!hasLabel && !hasName && field.type !== 'hidden') {
        findings.push({
          severity: 'medium',
          category: 'Accessibility',
          title: 'Form field has no accessible label',
          evidence: `Field #${index + 1}: ${field.outerHTML.slice(0, 160)}`
        });
      }
    });

    document.querySelectorAll('button, [role="button"]').forEach((button, index) => {
      const text = (button.innerText || button.getAttribute('aria-label') || button.getAttribute('title') || '').trim();
      if (!text) {
        findings.push({
          severity: 'medium',
          category: 'Accessibility',
          title: 'Clickable button has no readable name',
          evidence: `Button #${index + 1}: ${button.outerHTML.slice(0, 160)}`
        });
      }
    });

    document.querySelectorAll('a[href="#"], a:not([href])').forEach((link, index) => {
      findings.push({
        severity: 'low',
        category: 'Navigation',
        title: 'Link has an empty or placeholder destination',
        evidence: `Link #${index + 1}: ${(link.innerText || link.outerHTML).slice(0, 160)}`
      });
    });

    return findings;
  });

  for (const finding of accessibilityFindings) {
    bugs.push(makeBug({
      ...finding,
      description: 'This issue can make the page harder to use with screen readers, keyboards, or automated testing tools.',
      recommendation: 'Add clear text, labels, aria-labels, or valid destinations so users and tools can understand the element.',
      url
    }));
  }

  bugs.push(...await collectContentQualityBugs(page, url, prompt));

  runtime.consoleErrors
    .filter(item => item.url === url)
    .slice(0, 6)
    .forEach(item => {
      bugs.push(makeBug({
        severity: 'high',
        category: 'JavaScript',
        title: 'Console error detected',
        description: 'The page produced a browser console error during the scan.',
        evidence: item.text,
        recommendation: 'Open the browser devtools console, reproduce the flow, and fix the failing script or missing resource.',
        url
      }));
    });

  runtime.failedResponses
    .filter(item => item.pageUrl === url)
    .slice(0, 8)
    .forEach(item => {
      bugs.push(makeBug({
        severity: item.status >= 500 ? 'critical' : 'high',
        category: 'Network',
        title: `HTTP ${item.status} response`,
        description: 'A request failed while the page was loading or interacting.',
        evidence: item.url,
        recommendation: item.status >= 500
          ? 'Check server logs and backend error handling for this endpoint.'
          : 'Verify the route, permissions, asset path, or API request parameters.',
        url
      }));
    });

  if (prompt && bugs.length === 0) {
    bugs.push(makeBug({
      severity: 'info',
      category: 'Scan Result',
      title: 'No obvious bug found for this page',
      description: 'The automated scan did not detect a clear issue on this page for the provided prompt.',
      evidence: `Prompt focus: ${prompt}`,
      recommendation: 'Add more specific reproduction steps in the prompt to guide a deeper functional scan.',
      url
    }));
  }

  return bugs;
}

export async function runBugScan(input, onEvent) {
  const startedAt = new Date().toISOString();
  const targetUrl = toAbsoluteUrl(input.url);
  const baseOrigin = new URL(targetUrl).origin;
  const credentials = {
    username: input.username || '',
    password: input.password || ''
  };

  const runtime = {
    consoleErrors: [],
    failedResponses: []
  };

  const report = {
    scanner: 'AetherTest MCP Bug Finder',
    startedAt,
    targetUrl,
    prompt: input.prompt || '',
    bugs: [],
    pages: []
  };

  let browser;

  try {
    onEvent('bug-scan-start', { targetUrl, startedAt });
    browser = await chromium.launch({ headless: false, slowMo: 250 });
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();

    page.on('console', message => {
      if (message.type() === 'error') {
        runtime.consoleErrors.push({ url: page.url(), text: message.text() });
      }
    });

    page.on('pageerror', error => {
      runtime.consoleErrors.push({ url: page.url(), text: error.message });
    });

    page.on('response', response => {
      const status = response.status();
      if (status >= 400) {
        runtime.failedResponses.push({ pageUrl: page.url(), url: response.url(), status });
      }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
    const loggedIn = await tryLogin(page, credentials);

    const queue = [page.url()];
    const discovered = await discoverLinks(page, baseOrigin, input.prompt);
    queue.push(...discovered);

    const visited = new Set();
    const maxPages = Math.min(Number(input.maxPages) || 12, 20);
    let scenarioExecuted = false;

    while (queue.length > 0 && visited.size < maxPages) {
      const nextUrl = queue.shift();
      if (!nextUrl || visited.has(nextUrl) || !sameOrigin(nextUrl, baseOrigin)) continue;

      visited.add(nextUrl);
      onEvent('bug-scan-page', { url: nextUrl, index: visited.size, maxPages });

      await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(error => {
        report.bugs.push(makeBug({
          severity: 'critical',
          category: 'Navigation',
          title: 'Page could not be opened',
          description: 'The scanner could not navigate to this page.',
          evidence: error.message,
          recommendation: 'Check if the page URL is valid, protected, redirected incorrectly, or timing out.',
          url: nextUrl
        }));
      });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);

      const pageUrl = page.url();
      const pageBugs = await collectPageBugs(page, pageUrl, runtime, input.prompt);
      if (!scenarioExecuted) {
        scenarioExecuted = true;
        const scenarioBugs = await runPromptScenario(page, input.prompt, credentials, page.url(), onEvent);
        pageBugs.push(...scenarioBugs);
      }
      let screenshotUrl = null;

      if (pageBugs.some(bug => bug.severity !== 'info')) {
        const screenshotName = `bug_scan_${Date.now()}_${visited.size}.png`;
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, screenshotName), fullPage: true }).catch(() => null);
        screenshotUrl = `/screenshots/${screenshotName}`;
        pageBugs.forEach(bug => {
          if (!bug.screenshotUrl) bug.screenshotUrl = screenshotUrl;
        });
      }

      report.pages.push({ url: pageUrl, bugCount: pageBugs.length, screenshotUrl });
      report.bugs.push(...pageBugs);
      pageBugs.forEach(bug => onEvent('bug-found', { bug }));

      const moreLinks = await discoverLinks(page, baseOrigin, input.prompt).catch(() => []);
      moreLinks.forEach(link => {
        if (!visited.has(link) && queue.length < 20) queue.push(link);
      });
    }

    report.finishedAt = new Date().toISOString();
    report.summary = {
      scannedPages: visited.size,
      totalBugs: report.bugs.filter(bug => bug.severity !== 'info').length,
      critical: report.bugs.filter(bug => bug.severity === 'critical').length,
      high: report.bugs.filter(bug => bug.severity === 'high').length,
      medium: report.bugs.filter(bug => bug.severity === 'medium').length,
      low: report.bugs.filter(bug => bug.severity === 'low').length,
      loggedIn
    };

    onEvent('bug-scan-end', { report });
  } catch (error) {
    onEvent('bug-scan-error', { error: error.message });
  } finally {
    if (browser) {
      await browser.close().catch(() => null);
    }
  }
}
