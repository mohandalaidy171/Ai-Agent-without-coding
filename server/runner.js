import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'server', 'public', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Directory for recorded videos per test card
const VIDEOS_DIR = path.join(process.cwd(), 'server', 'public', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// ==========================================
// 1. محرك التنظيف والتوحيد اللغوي
// ==========================================
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\b(?:ال|لل|ب|و|في|على|زر|حقل|ايقونة|أيقونة|رابط|لينك)\s*/g, '')
    .replace(/\b(?:the|button|link|icon|input|field|click|press)\s*/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTargetUrlCandidates(rawUrl) {
  const targetUrl = String(rawUrl || '').trim();
  if (!targetUrl) throw new Error('Target URL is required.');
  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    return [targetUrl];
  }
  return [`https://${targetUrl}`, `http://${targetUrl}`];
}

async function gotoTargetUrl(page, rawUrl, options = {}) {
  const candidates = getTargetUrlCandidates(rawUrl);
  let lastError;
  for (const targetUrl of candidates) {
    try {
      await page.goto(targetUrl, {
        waitUntil: options.waitUntil || 'load',
        timeout: options.timeout || 20000
      });
      return targetUrl;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Unable to open target URL: ${String(rawUrl || '').trim()}`);
}

// ==========================================
// 2. محرك البحث الذكي المزود بآلية الانتظار والـ Retry
// ==========================================
async function findSmartElement(page, userIntent) {
  const matchId = `universal-match-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  let found = false;
  const maxRetries = 10;

  for (let i = 0; i < maxRetries; i++) {
    found = await page.evaluate(({ userIntent, matchId }) => {
      const normalize = (str) => String(str || '').toLowerCase()
        .replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/\b(?:ال|لل|ب|و|في|على|زر|حقل|ايقونة|أيقونة|رابط|لينك)\s*/g, '')
        .replace(/\b(?:the|button|link|icon|input|field|click|press)\s*/g, '')
        .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const iconDictionary = {
        سلة: ['cart', 'shopping', 'basket', 'bag'],
        شراء: ['cart', 'shopping', 'checkout', 'buy'],
        بحث: ['search', 'magnifier', 'find', 'lookup'],
        إعدادات: ['settings', 'gear', 'cog', 'preferences'],
        بروفايل: ['profile', 'user', 'account', 'person'],
        تسجيل: ['login', 'signin', 'account'],
        خروج: ['logout', 'signout', 'exit'],
        قائمة: ['menu', 'nav', 'navigation'],
        إشعار: ['notification', 'bell', 'alert'],
        عقود: ['contract', 'contracts', 'file', 'invoice']
      };

      const rawIntent = String(userIntent || '').trim();
      const goal = normalize(rawIntent);
      const goalWords = goal.split(' ').filter(w => w.length > 1);
      const iconKeywords = Object.entries(iconDictionary)
        .flatMap(([arabic, synonyms]) => goal.includes(arabic) ? synonyms : []);

      const clickables = 'button, a, input, textarea, select, [role="button"], [role="link"], svg, img, i';
      const elements = [...document.querySelectorAll(clickables)];
      let bestMatch = null;

      const buildMetadata = (element) => {
        if (!element) return '';
        const attrs = [
          element.innerText,
          element.textContent,
          element.getAttribute('placeholder'),
          element.getAttribute('aria-label'),
          element.getAttribute('title'),
          element.getAttribute('alt'),
          element.id,
          element.className,
          element.getAttribute('role'),
          element.getAttribute('name'),
          element.getAttribute('type'),
          element.getAttribute('href')
        ].filter(Boolean).join(' ');

        const childrenText = Array.from(element.children)
          .map(child => child.innerText || child.getAttribute('title') || child.getAttribute('aria-label'))
          .filter(Boolean)
          .join(' ');

        const svgInner = element.tagName.toLowerCase() === 'svg'
          ? element.innerHTML
          : (element.querySelector('svg')?.innerHTML || '');

        return `${attrs} ${childrenText} ${svgInner}`.trim();
      };

      for (const el of elements) {
        const tagName = el.tagName.toLowerCase();
        const contextElement = (tagName === 'svg' || tagName === 'img' || tagName === 'i')
          ? (el.parentElement || el)
          : el;

        const rect = contextElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const metadata = [
          buildMetadata(el),
          buildMetadata(contextElement),
          el.getAttribute('href'),
          contextElement.getAttribute('href')
        ].filter(Boolean).join(' ');

        const visibleText = normalize(metadata);
        if (!visibleText) continue;

        let score = 0;
        if (visibleText === goal) score += 100;
        else if (visibleText.includes(goal) || goal.includes(visibleText)) score += 70;
        else {
          const elWords = visibleText.split(' ');
          let matchedWords = 0;
          for (const w of goalWords) {
            if (elWords.includes(w)) matchedWords++;
          }
          if (matchedWords > 0) score += (matchedWords / goalWords.length) * 50;
        }

        const targetText = normalize(`${contextElement.tagName} ${metadata}`);
        for (const keyword of iconKeywords) {
          if (targetText.includes(keyword)) {
            score += 60;
            break;
          }
        }

        if (tagName === 'button' || contextElement.type === 'submit' || contextElement.getAttribute('role') === 'button') score += 15;
        if (tagName === 'a' || contextElement.getAttribute('role') === 'link') score += 10;
        if (tagName === 'input') score += 12;

        if (score > 15 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { element: contextElement, score };
        }
      }

      if (!bestMatch) return false;

      bestMatch.element.setAttribute('data-universal-match', matchId);
      return true;
    }, { userIntent, matchId });

    if (found) break;
    await page.waitForTimeout(500);
  }

  if (found) {
    return page.locator(`[data-universal-match="${matchId}"]`).first();
  }
  throw new Error(`تعذر على المحرك الذكي العثور على العنصر أو الأيقونة المطلوبة لـ: "${userIntent}"`);
}

// ==========================================
// 3. دوال المؤشر البصري والحركة الافتراضية
// ==========================================
async function ensureVisualCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('aethertest-visual-cursor')) return;
    const style = document.createElement('style');
    style.id = 'aethertest-visual-cursor-style';
    style.textContent = `
      #aethertest-visual-cursor {
        position: fixed; left: 0; top: 0; z-index: 2147483647;
        width: 28px; height: 28px; border: 3px solid #22d3ee; border-radius: 999px;
        background: rgba(34, 211, 238, 0.16);
        box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.12), 0 8px 22px rgba(0, 0, 0, 0.28);
        pointer-events: none; transform: translate(-100px, -100px);
        transition: transform 180ms ease, background 140ms ease, box-shadow 140ms ease;
      }
      #aethertest-visual-cursor::after {
        content: attr(data-label); position: absolute; left: 32px; top: -2px;
        min-width: max-content; padding: 4px 8px; border-radius: 6px;
        background: rgba(15, 23, 42, 0.92); color: #ffffff;
        font: 600 12px/1.2 system-ui, sans-serif; box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
      }
      #aethertest-visual-cursor.is-clicking {
        background: rgba(34, 197, 94, 0.28);
        box-shadow: 0 0 0 12px rgba(34, 197, 94, 0.18), 0 8px 22px rgba(0, 0, 0, 0.28);
      }
    `;
    const cursor = document.createElement('div');
    cursor.id = 'aethertest-visual-cursor';
    cursor.setAttribute('data-label', 'moving');
    document.documentElement.appendChild(style);
    document.documentElement.appendChild(cursor);
  });
}

async function moveVisualCursorToLocator(page, locator, label = 'target') {
  await ensureVisualCursor(page);
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Unable to locate the target position on screen.');

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.evaluate(({ x, y, label }) => {
    const cursor = document.getElementById('aethertest-visual-cursor');
    if (cursor) {
      cursor.dataset.label = label;
      cursor.style.transform = `translate(${x - 14}px, ${y - 14}px)`;
    }
  }, { x, y, label });

  await page.mouse.move(x, y, { steps: 18 });
  await page.waitForTimeout(250);
}

async function pulseVisualCursor(page, label = 'click') {
  await page.evaluate((label) => {
    const cursor = document.getElementById('aethertest-visual-cursor');
    if (!cursor) return;
    cursor.dataset.label = label;
    cursor.classList.add('is-clicking');
  }, label);
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    const cursor = document.getElementById('aethertest-visual-cursor');
    if (cursor) cursor.classList.remove('is-clicking');
  });
}

// ==========================================
// 4. العمليات التلقائية والديناميكية الهجينة
// ==========================================
async function performAutoLogin(page, credentials, onEvent, cardId = 'auto-login') {
  const targetUrlPreview = getTargetUrlCandidates(credentials.url).join(' or ');
  onEvent('step-start', { cardId, stepIndex: 0, stepText: `Open ${targetUrlPreview}` });
  const startTime = Date.now();

  await gotoTargetUrl(page, credentials.url, { waitUntil: 'load', timeout: 20000 });
  await ensureVisualCursor(page);

  const usernameInput = page.locator(
    'input[type="email"], input[type="text"], input[name*="user" i], input[name*="email" i], input[id*="user" i], input[id*="email" i]'
  ).first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (credentials.username && await usernameInput.isVisible({ timeout: 3500 }).catch(() => false)) {
    await moveVisualCursorToLocator(page, usernameInput, 'username');
    await pulseVisualCursor(page, 'type');
    await usernameInput.fill('');
    await usernameInput.type(credentials.username, { delay: 55 });
  }

  if (credentials.password && await passwordInput.isVisible({ timeout: 3500 }).catch(() => false)) {
    await moveVisualCursorToLocator(page, passwordInput, 'password');
    await pulseVisualCursor(page, 'type');
    await passwordInput.fill('');
    await passwordInput.type(credentials.password, { delay: 55 });
  }

  if (credentials.username || credentials.password) {
    const submitButton = page.locator(
      'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in"), button:has-text("دخول"), button:has-text("تسجيل")'
    ).first();

    if (await submitButton.isVisible({ timeout: 2500 }).catch(() => false)) {
      await moveVisualCursorToLocator(page, submitButton, 'login');
      await pulseVisualCursor(page, 'click');
      
      await submitButton.click();
      await Promise.race([
        page.waitForLoadState('networkidle', { timeout: 7000 }),
        submitButton.waitFor({ state: 'detached', timeout: 7000 }),
        page.waitForTimeout(4000)
      ]).catch(() => null);

    } else if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.press('Enter');
      await page.waitForLoadState('load', { timeout: 8000 }).catch(() => null);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  onEvent('step-success', { cardId, stepIndex: 0, duration });
}

async function openTargetPage(page, credentials, onEvent, cardId = 'open-target') {
  const targetUrlPreview = getTargetUrlCandidates(credentials.url).join(' or ');
  onEvent('step-start', { cardId, stepIndex: 0, stepText: `Open ${targetUrlPreview}` });
  const startTime = Date.now();

  await gotoTargetUrl(page, credentials.url, { waitUntil: 'load', timeout: 20000 });
  await ensureVisualCursor(page);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  onEvent('step-success', { cardId, stepIndex: 0, duration });
}

async function runDynamicAction(page, step, credentials, systemVariables = {}, onEvent) {
  // Capture unresolved value BEFORE resolution for variable assignments
  const unresolvedValue = String(step.value || step.extraValue || '');

  // Resolve placeholders {VAR_NAME} in step fields
  const resolve = (text) => replaceVariablesInText(text, systemVariables);

  step.targetValue = resolve(step.targetValue || step.target || '');
  step.extraValue = resolve(step.extraValue || step.value || '');
  step.value = resolve(step.value || step.extraValue || '');

  const action = String(step.action || '').toLowerCase().trim();
  const attrType = String(step.attributeType || step.selector || '').toLowerCase().trim();
  const targetValue = String(step.targetValue || step.target || '').trim();
  const extraValue = String(step.extraValue || step.value || '').trim();
  const fieldAssertion = Boolean(step.fieldAssertion);

  if (attrType === 'النية البشرية') {
    const clickRegex = /^(?:اضغط\s+على|انقر\s+على|اكبس\s+على|اضغط|انقر|اكبس|افتح|click\s+on|click|open|press)\s+(.+)$/i;
    if (action === 'click' && targetValue.match(clickRegex)) {
      const clickMatch = targetValue.match(clickRegex);
      const elementToClick = await findSmartElement(page, clickMatch[1].trim());
      await moveVisualCursorToLocator(page, elementToClick, 'click');
      await pulseVisualCursor(page, 'click');
      
      await elementToClick.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => null);
      return true;
    }

    const typeRegex = /^(?:اكتب|ادخل|أدخل|type|fill|write)\s+(.+?)\s+(?:في|في\s+حقل|في\s+بلاسهولدر|في\s+ليبل|in|into|field)\s+(.+)$/i;
    if (action === 'type' && targetValue.match(typeRegex)) {
      const typeMatch = targetValue.match(typeRegex);
      if (typeMatch) {
        let finalValue = typeMatch[1].replace(/['"]/g, '').trim();
        let fieldTarget = typeMatch[2].trim();
        if (['{username}', 'username'].includes(finalValue)) finalValue = credentials.username;
        if (['{password}', 'password'].includes(finalValue)) finalValue = credentials.password;

        const inputElement = await findSmartElement(page, fieldTarget);
        await moveVisualCursorToLocator(page, inputElement, 'type');
        await pulseVisualCursor(page, 'focus');
        await inputElement.click();
        await inputElement.fill('');
        await inputElement.type(finalValue, { delay: 75 });
        return true;
      }
    }
  }

 // =================================================================
  // تحديث دالة السكرول المتطورة: لتدعم النزول لعنصر محدد أو لآخر الصفحة
  // =================================================================
  if (action === 'scroll' || action === 'مرر') {
    const rawTarget = String(targetValue || extraValue || '').trim();
    const direction = rawTarget.toLowerCase();
    const isTop = /^(?:اعلى|أعلى|فوق|up|top|scroll\s*to\s*top)$/i.test(direction);
    const isBottom = /^(?:أسفل|اسفل|تحت|down|bottom|scroll\s*to\s*bottom)$/i.test(direction);
    const isLeft = /^(?:يسار|left|scroll\s*to\s*left)$/i.test(direction);
    const isRight = /^(?:يمين|right|scroll\s*to\s*right)$/i.test(direction);
    
    // إذا كان المكتوب ليس اتجاهاً عاماً، بل معرف (ID أو Class) لعنصر محدد
    const shouldScrollElement = rawTarget.length > 0 && !isTop && !isBottom && !isLeft && !isRight;

    if (shouldScrollElement) {
      // جلب العنصر بناءً على نوع المحدد المختار من الدروب داون في الواجهة
      const element = await getElementBySelectorType(page, attrType, rawTarget);
      await element.scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(700);
      return true;
    }

    // التمرير العام للصفحة (الديفولت هو لأسفل الصفحة بالكامل)
    await page.evaluate(({ isTop, isBottom, isLeft, isRight }) => {
      if (isLeft) {
        window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
        return;
      }
      if (isRight) {
        window.scrollTo({ left: document.body.scrollWidth, top: 0, behavior: 'smooth' });
        return;
      }
      if (isTop) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        return;
      }
      const maxHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.documentElement.clientHeight);
      window.scrollTo({ top: maxHeight, left: 0, behavior: 'smooth' });
    }, { isTop, isBottom, isLeft, isRight });

    await page.waitForTimeout(700);
    return true;
  }

  // =================================================================
  // تحديث دالة الانتظار الهجينة: تدعم الملي ثانية والانتظار المرتبط بعنصر خياري
  // =================================================================
  if (action === 'wait' || action === 'انتظر') {
    const waitType = String(step.waitType || 'time').toLowerCase().trim();

    // 1) في حال اختار المستخدم في الواجهة: "انتظار زمني ثابت"
    if (waitType === 'time') {
      const ms = parseInt(targetValue || step.timeValue, 10) || 3000;
      await page.waitForTimeout(ms);
      return true;
    }

    // 2) في حال اختار المستخدم في الواجهة: "انتظار مرتبط بعنصر" (مثل صورتك تماماً)
    if (waitType === 'element') {
      const waitCondition = String(step.waitCondition || 'visible').toLowerCase().trim();
      
      // قراءة الـ Checkbox الخاص بـ (عدم إفشال الاختبار)
      const failOnTimeout = step.failOnTimeout !== false; 
      const attributeType = attrType || step.selector || 'id';
      
      if (!targetValue) {
        throw new Error("فشل إجراء الانتظار: تم اختيار انتظار مرتبط بعنصر ولكن حقل المعرف فارغ.");
      }

      try {
        const element = await getElementBySelectorType(page, attributeType, targetValue);
        // تقليص المهلة لـ 4 ثوانٍ إذا كان خيارياً توفيراً للوقت، و8 ثوانٍ إن كان إلزامياً
        const timeoutMs = failOnTimeout ? 8000 : 4000;

        if (waitCondition === 'hidden' || waitCondition === 'اختفاء') {
          await element.waitFor({ state: 'detached', timeout: timeoutMs });
        } else {
          await element.waitFor({ state: 'visible', timeout: timeoutMs });
        }
        return true;

      } catch (e) {
        // طوق النجاة: تجاوز الخطأ تماماً إذا كان الزر اختياري (failOnTimeout === false)
        if (!failOnTimeout) {
          console.log(`ℹ️ [Optional Wait]: تخطي عدم ظهور العنصر "${targetValue}" بسلام بناءً على رغبة المستخدم.`);
          return true; 
        }
        throw new Error(`فشل الانتظار ❌: العنصر المستهدف عبر [${attributeType}] وقيمته "${targetValue}" لم يحقق شرط (${waitCondition})`);
      }
    }
  }

  // (Removed variable action logic since it is now a selector type)

  if (action === 'type' || action === 'اكتب في' || action === 'ادخل في') {
    const inputElement = await getElementBySelectorType(page, attrType, targetValue);
    await moveVisualCursorToLocator(page, inputElement, 'type');
    await pulseVisualCursor(page, 'focus');
    await inputElement.click();
    await inputElement.fill('');

    let finalValue = extraValue;
    if (['{username}', 'username'].includes(finalValue)) finalValue = credentials.username;
    if (['{password}', 'password'].includes(finalValue)) finalValue = credentials.password;

    await inputElement.type(finalValue, { delay: 75 });
    return true;
  }

  if (action === 'click' || action === 'انقر على' || action === 'اضغط على') {
    const elementToClick = await getElementBySelectorType(page, attrType, targetValue);
    await moveVisualCursorToLocator(page, elementToClick, 'click');
    await pulseVisualCursor(page, 'click');
    
    await elementToClick.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => null);
    return true;
  }

  if (action === 'assert' || action === 'assertion' || action === 'تحقق من' || action === 'تاكد من وجود') {
    const assertType = String(step.assertionType || 'visible').toLowerCase().trim();
    const expectedValue = String(extraValue || targetValue || '').trim();
    // resolve placeholders inside assertions too
    const resolvedExpectedValue = replaceVariablesInText(expectedValue, systemVariables);

    // ─────────────────────────────────────────────────────────────
    // [visible] => عنصر موجود ومرئي
    // ─────────────────────────────────────────────────────────────
    if (assertType === 'visible' || assertType === 'element_visibility') {
      const element = await getElementBySelectorType(page, attrType, targetValue);
      await element.waitFor({ state: 'visible', timeout: 6000 });
      return true;
    }

    // ─────────────────────────────────────────────────────────────
    // [disabled] => عنصر معطل
    // ─────────────────────────────────────────────────────────────
    if (assertType === 'disabled' || assertType === 'element_disabled') {
      const element = await getElementBySelectorType(page, attrType, targetValue);
      await element.waitFor({ state: 'attached', timeout: 6000 });
      const isDisabled = await element.isDisabled();
      if (!isDisabled) {
        throw new Error(`فشل التحقق: العنصر "${targetValue}" ليس في حالة تعطيل (disabled) كما هو متوقع`);
      }
      return true;
    }

    // ─────────────────────────────────────────────────────────────
    // [enabled] => عنصر مفعّل وقابل للتفاعل (غير معطل)
    // ─────────────────────────────────────────────────────────────
    if (assertType === 'enabled') {
      const element = await getElementBySelectorType(page, attrType, targetValue);
      await element.waitFor({ state: 'attached', timeout: 6000 });
      const isDisabled = await element.isDisabled();
      if (isDisabled) {
        throw new Error(`فشل التحقق: العنصر "${targetValue}" معطل (disabled) بينما يتوقع enabled`);
      }
      return true;
    }

    // ─────────────────────────────────────────────────────────────
    // [text_match] => مقارنة نص/قيمة العنصر مع المتوقع
    // ─────────────────────────────────────────────────────────────
    if (assertType === 'text_match') {
      const element = await getElementBySelectorType(page, attrType, targetValue);
      await element.waitFor({ state: 'visible', timeout: 6000 });

      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      let actualValue;

      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        actualValue = await element.inputValue();
      } else {
        actualValue = await element.innerText();
      }

      const actualNorm = String(actualValue || '').trim().toLowerCase();
      const expectedNorm = String(resolvedExpectedValue || '').trim().toLowerCase();

      if (!actualNorm || !expectedNorm) {
        throw new Error(`فشل التحقق: expected/actual text is empty (actual="${actualValue}", expected="${expectedValue}")`);
      }

      // case-insensitive includes match (robust to whitespace differences)
      if (!actualNorm.includes(expectedNorm)) {
        throw new Error(`فشل التحقق: النص الفعلي "${actualValue}" لا يحتوي على المتوقع "${expectedValue}"`);
      }

      return true;
    }

    // Fallback: keep backward compatibility for old assertionType values
    const legacyType = assertType;
    if (legacyType === 'text') {
      const element = await getElementBySelectorType(page, attrType, targetValue);
      await element.waitFor({ state: 'visible', timeout: 5000 });
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      let actualValue;
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        actualValue = await element.inputValue();
      } else {
        actualValue = await element.innerText() || await element.getAttribute('value');
      }

      const actualNorm = String(actualValue || '').toLowerCase();
      const expectedNorm = String(expectedValue || '').toLowerCase();
      if (!actualNorm.includes(expectedNorm)) {
        throw new Error(`فشل التحقق: القيمة الفعلية هي "${actualValue}" والمستهدفة تطابق "${expectedValue}"`);
      }
      return true;
    }

    throw new Error(`نوع التحقق غير مدعوم: "${assertType}"`);
  }

  if (action === 'wait' || action === 'انتظر') {
    const waitType = String(step.waitType || 'time');

    // 1) Static time wait
    if (waitType === 'time') {
      const ms = parseInt(targetValue, 10) || 0;
      await page.waitForTimeout(ms);
      return true;
    }

    // 2) Element wait
    if (waitType === 'element') {
      const waitCondition = String(step.waitCondition || 'visible').toLowerCase().trim();
      const failOnTimeout = step.failOnTimeout !== false; // default true

      const attributeType = attrType || step.selector || 'id';
      const element = await getElementBySelectorType(page, attributeType, targetValue);

      try {
        // only visible is implemented for now (matches UI spec)
        if (waitCondition === 'visible') {
          await element.waitFor({ state: 'visible', timeout: 8000 });
        } else {
          await element.waitFor({ state: 'visible', timeout: 8000 });
        }
      } catch (e) {
        if (failOnTimeout) {
          throw new Error(`فشل الانتظار: العنصر لم يظهر ضمن المهلة المحددة (${targetValue})`);
        }
      }

      return true;
    }
  }

  if (action === 'navigate' || action === 'اذهب الى') {
    let url = targetValue;
    if (url === '{url}' || url === 'url') url = credentials.url;
    await gotoTargetUrl(page, url, { waitUntil: 'load', timeout: 15000 });
    await ensureVisualCursor(page);
    return true;
  }

  return false;
}

function escapeCssValue(value) {
  return String(value || '')
    .replace(/([\\"'`!@#$%^&*()=+\[\]{};:,<>\/\?~`])/g, '\\$1')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getElementBySelectorType(page, type, value) {
  const cleanValue = String(value || '').trim();
  const lowerType = String(type || '').toLowerCase();

  if (lowerType === 'الايدي' || lowerType === 'id') {
    const escaped = escapeCssValue(cleanValue);
    return page.locator(`#${escaped}`).first();
  }
  if (lowerType === 'الكلاس' || lowerType === 'class') {
    const escaped = escapeCssValue(cleanValue);
    return page.locator(`.${escaped}`).first();
  }
  if (lowerType === 'aria' || lowerType === 'aria-label') {
    return page.locator(`[aria-label="${cleanValue}"]`).first();
  }
  if (lowerType === 'name') {
    const escaped = escapeCssValue(cleanValue);
    return page.locator(`[name="${escaped}"]`).first();
  }
  if (lowerType === 'data-test') {
    const escaped = escapeCssValue(cleanValue);
    return page.locator(`[data-test="${escaped}"]`).first();
  }
  if (lowerType === 'data-testid') {
    const escaped = escapeCssValue(cleanValue);
    return page.locator(`[data-testid="${escaped}"]`).first();
  }
  if (lowerType === 'xpath') {
    return page.locator(`xpath=${cleanValue}`).first();
  }
  if (lowerType === 'text') {
    return page.locator(`text=${cleanValue}`).first();
  }
  if (lowerType === 'css' || lowerType === 'selector' || lowerType === 'اسم العنصر' || lowerType === 'title' || lowerType === 'variable' || lowerType === 'متغيرات') {
    return page.locator(cleanValue).first();
  }

  return await findSmartElement(page, cleanValue);
}

// ==========================================
// 5. الدالة الرئيسية لتشغيل كروت الاختبار (معزولة ومطورة للتقارير الشاشات)
// ==========================================
function replaceVariablesInText(text, systemVariables = {}) {
  return String(text ?? '').replace(/\{([A-Z0-9_]+)\}/g, (match, varName) => {
    if (Object.prototype.hasOwnProperty.call(systemVariables, varName)) {
      return String(systemVariables[varName]);
    }
    // fallback: keep placeholder as-is for backward compatibility
    return match;
  });
}

export async function runTests(testCards, credentials, onEvent, systemVariables) {
  const safeCredentials = {
    url: '', username: '', password: '', autoLogin: true, ...(credentials || {})
  };

  let cardsToRun = Array.isArray(testCards) ? [...testCards] : [];
  if (cardsToRun.length === 0 && safeCredentials.url) {
    cardsToRun = [{ id: 'auto-open-login', title: 'Open target website and login', priority: 1, steps: [] }];
  }

  // فرز وترتيب الكروت تصاعدياً بناءً على الـ priority
  cardsToRun.sort((a, b) => {
    const priorityA = parseInt(a.priority, 10) || 999;
    const priorityB = parseInt(b.priority, 10) || 999;
    return priorityA - priorityB;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    targetUrl: safeCredentials.url,
    totalCards: cardsToRun.length,
    passedTests: 0,
    failedTests: 0,
    duration: '0.00',
    cards: []
  };

  // تشغيل كل كارد باختبار مستقل تماماً بدورة حياة منفصلة للمتصفح
  // مع دعم Retry لكل كارد (retryCount = إجمالي مرات تشغيل الكارت)
  // تشغيل كل كارد باختبار مستقل تماماً بدورة حياة منفصلة للمتصفح
  for (let cardIndex = 0; cardIndex < cardsToRun.length; cardIndex++) {
    const card = cardsToRun[cardIndex];
    
    // 1️⃣ تأمين قراءة عنوان الاختبار بجميع الصيغ المحتملة القادمة من الـ UI (تغطية شاملة)
    const exactCardTitle = card.title || card.testTitle || card.cardTitle || card.name || card.cardName || '';
    
    // 2️⃣ إذا كان الحقل فارغاً تماماً في الواجهة، هنا فقط نلجأ للاسم التلقائي
    const finalCardTitle = exactCardTitle.trim().length > 0 
      ? exactCardTitle.trim() 
      : `Test Card (Priority: ${card.priority || cardIndex + 1})`;
    
    // إرسال الحدث للواجهة بالاسم الصحيح المكتوب
    onEvent('test-start', { cardId: card.id, cardTitle: finalCardTitle });

    // 3️⃣ بناء تقرير الكارد واعتماد العنوان المحفوظ بنجاح
    const cardReport = {
      id: card.id,
      title: finalCardTitle, // ✅ الآن سيُحفظ العنوان المخصص المكتوب في الواجهة دائماً
      status: 'passed',
      steps: [],
      recordVideo: Boolean(card.recordVideo),
      videoUrl: null
    };

    let browser;
    let context;
    let page;
    let cardFailed = false;
    let openedTargetPage = false;
    let videoFilesBefore = new Set();

    // retryCount = إجمالي مرات تشغيل الكارت (افتراضي = 1)
    const retryCount = Math.max(1, parseInt(card.retryCount, 10) || 1);

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      cardFailed = false;
      openedTargetPage = false;
      videoFilesBefore = new Set();
      let screencastSession = null;

      try {
      const isHeadlessServer = Boolean(process.env.RENDER || process.env.NODE_ENV === 'production' || process.env.HEADLESS === 'true' || !process.env.DISPLAY);
      browser = await chromium.launch({
        headless: isHeadlessServer,
        slowMo: isHeadlessServer ? 0 : 100,
        args: isHeadlessServer ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : ['--start-maximized']
      });

      const enableVideo = Boolean(card.recordVideo);
      const contextOptions = { viewport: null };
      if (enableVideo) {
        contextOptions.recordVideo = { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } };
      }
      context = await browser.newContext(contextOptions);

      // capture list of existing video files so we can detect the new video after context closes
      if (enableVideo) {
        try { videoFilesBefore = new Set(fs.readdirSync(VIDEOS_DIR)); } catch (e) { videoFilesBefore = new Set(); }
      } else {
        videoFilesBefore = new Set();
      }

      page = await context.newPage();

      // Use Chrome's native screencast instead of repeatedly requesting screenshots.
      // Screenshot polling competes with the test itself and is particularly slow over
      // a remote Socket.IO connection. The frame is already base64-encoded by CDP.
      let lastStreamFrameAt = 0;
      try {
        screencastSession = await context.newCDPSession(page);
        screencastSession.on('Page.screencastFrame', ({ data, sessionId }) => {
          // Always acknowledge frames so Chrome does not pause the screencast, but only
          // send up to 12 fps to keep the socket and browser UI responsive.
          void screencastSession.send('Page.screencastFrameAck', { sessionId }).catch(() => null);
          const now = Date.now();
          if (data && now - lastStreamFrameAt >= 83) {
            lastStreamFrameAt = now;
            onEvent('screencast-frame', { cardId: card.id, frameData: data });
          }
        });
        await screencastSession.send('Page.startScreencast', {
          format: 'jpeg',
          quality: 45,
          maxWidth: 960,
          maxHeight: 540,
          everyNthFrame: 2
        });
      } catch (streamError) {
        console.warn('Live stream unavailable:', streamError.message);
        screencastSession = null;
      }

      // نرسل حدث محاولة جديدة للواجهة (اختياري للتتبع)
      onEvent('test-retry-start', { cardId: card.id, attempt });


      // إجبار النافذة وجلسة المتصفح الحالية على القفز والتركيز (Focus) أمام عينيك مباشرة فوق كل التطبيقات
      await page.bringToFront(); 
      await ensureVisualCursor(page);

      // التعامل مع فتح الرابط التلقائي لكل كارد بما أنه في بيئة معزولة
      if (safeCredentials.url) {
        try {
          if (safeCredentials.autoLogin) {
            // resolve credentials placeholders too (url/username/password)
            const resolved = {
              ...safeCredentials,
              url: replaceVariablesInText(safeCredentials.url, systemVariables),
              username: replaceVariablesInText(safeCredentials.username, systemVariables),
              password: replaceVariablesInText(safeCredentials.password, systemVariables)
            };
            await performAutoLogin(page, resolved, onEvent, card.id);
          } else {
            const resolved = {
              ...safeCredentials,
              url: replaceVariablesInText(safeCredentials.url, systemVariables),
              username: replaceVariablesInText(safeCredentials.username, systemVariables),
              password: replaceVariablesInText(safeCredentials.password, systemVariables)
            };
            await openTargetPage(page, resolved, onEvent, card.id);
          }
          openedTargetPage = true;
          await page.waitForTimeout(1000);
        } catch (error) {
          onEvent('step-failure', {
            cardId: card.id, stepIndex: 0, error: error.message, duration: '0.00', screenshotUrl: ''
          });
          cardFailed = true;
        }
      }

      // بناء وتحضير الخطوات للكارد الحالي وصياغة عنوان واضح وجديد للتقرير
      let steps = [];
      if (Array.isArray(card.steps) && card.steps.length > 0) {
        steps = card.steps.map(step => {
          let customText = step.stepText || '';
          
          // توليد عنوان مقروء بدلاً من الموضع/الهدف بناءً على الأكشن المختار
          if (!customText) {
            const action = String(step.action || '').toLowerCase().trim();
            const target = String(step.targetValue || step.target || '').trim();
            const value = String(step.extraValue || step.value || '').trim();

            if (action === 'click' || action === 'انقر على' || action === 'اضغط على') {
              customText = `اضغط على: ${target}`;
            } else if (action === 'type' || action === 'اكتب في' || action === 'ادخل في') {
              customText = `اكتب "${value}" في حقل: ${target}`;
            } else if (action === 'assert' || action === 'assertion' || action === 'تحقق من' || action === 'تاكد من وجود') {
              customText = `التحقق من وجود: ${value || target}`;
            } else if (action === 'scroll' || action === 'مرر') {
              customText = `تمرير الصفحة إلى: ${target || 'الأسفل'}`;
            } else if (action === 'wait' || action === 'انتظر') {
              customText = `انتظار لمدة ${target || 3} ثوانٍ`;
            } else if (action === 'navigate' || action === 'اذهب الى') {
              customText = `الانتقال إلى الرابط: ${target}`;
            } else {
              customText = `${step.action} -> ${target || value}`;
            }
          }

          return {
            action: step.action || 'click',
            attributeType: step.attributeType || step.selector || 'goal',
            targetValue: String(step.targetValue || step.target || '').trim(),
            extraValue: String(step.extraValue || step.value || '').trim(),
            assertionType: step.assertionType || 'text',
            attributeName: step.attributeName || '',
            fieldAssertion: Boolean(step.fieldAssertion),
            title: String(step.title || '').trim(),
            stepText: step.title && step.title.trim().length > 0 ? step.title.trim() : customText
          };
        });
      } else if (card.prompt) {
        const rawLines = String(card.prompt || '').split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('#') && !s.startsWith('//'));

        steps = rawLines.map(line => {
          let action = 'click';
          if (line.match(/انزل|مرر|اسحب|scroll/i)) action = 'scroll';
          else if (line.match(/^(?:اكتب|ادخل|أدخل|type|fill|write)/i)) action = 'type';
          else if (line.match(/^(?:اضغط|انقر|اكبس|افتح|click|press)/i)) action = 'click';
          else if (line.match(/^(?:تاكد|تأكد|تحقق|verify|assert|check)/i)) action = 'assert';
          else if (line.match(/wait|انتظر|استنى/i)) action = 'wait';
          else if (line.match(/^(?:اذهب|روح|افتح|go to|navigate)/i)) action = 'navigate';

          return { 
            action, 
            attributeType: 'النية البشرية', 
            targetValue: line, 
            extraValue: line,
            title: line,
            stepText: line // في النية البشرية (الـ Prompt)، يظهر السطر المكتوب كاملاً كعنوان للخطوة
          };
        });
      }

      // تنفيذ خطوات الـ Test Card التتابعية
      for (let stepIndex = 0; stepIndex < steps.length && !cardFailed; stepIndex++) {
        const step = steps[stepIndex];
        const stepTitle = step.title || step.stepText || `${step.action} ${step.targetValue || step.extraValue}`;
        const stepText = step.stepText || stepTitle;
        const displayedStepIndex = (openedTargetPage) ? stepIndex + 1 : stepIndex;
        
        onEvent('step-start', { cardId: card.id, stepIndex: displayedStepIndex, stepText, stepTitle });
        const startTime = Date.now();

        try {
          const handled = await runDynamicAction(page, step, safeCredentials, systemVariables, onEvent);
          if (!handled) {
            throw new Error(`النظام لم يستطع معالجة الإجراء المختار دلالياً: "${step.action}"`);
          }

          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          cardReport.steps.push({
            title: stepTitle,
            text: stepText,
            status: 'passed',
            duration
          });
          onEvent('step-success', { cardId: card.id, stepIndex: displayedStepIndex, duration });
        } catch (error) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const screenshotName = `fail_${card.id}_step_${stepIndex}_${Date.now()}.png`;
          const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
          try { await page.screenshot({ path: screenshotPath, fullPage: true }); } catch (e) { }

          cardReport.steps.push({
            title: stepTitle,
            text: stepText,
            status: 'failed',
            duration,
            error: error.message,
            screenshotUrl: `/screenshots/${screenshotName}`
          });

          onEvent('step-failure', {
            cardId: card.id,
            stepIndex: displayedStepIndex,
            error: error.message,
            duration,
            screenshotUrl: `/screenshots/${screenshotName}`
          });
          cardFailed = true;
          break;
        }
      }
      // Finalize and save recorded video only when recording was enabled for this card
      try {
        if (enableVideo && context) {
          await context.close();

          // list files after context close and find new .webm files
          let afterFiles = [];
          try { afterFiles = fs.readdirSync(VIDEOS_DIR).filter(f => f.toLowerCase().endsWith('.webm')); } catch (e) { afterFiles = []; }

          const beforeSet = videoFilesBefore || new Set();
          const newFiles = afterFiles.filter(f => !beforeSet.has(f));

          if (newFiles.length > 0) {
            // choose the newest by mtime
            let newest = newFiles[0];
            let newestMtime = 0;
            for (const fname of newFiles) {
              try {
                const stat = fs.statSync(path.join(VIDEOS_DIR, fname));
                if (stat.mtimeMs > newestMtime) { newestMtime = stat.mtimeMs; newest = fname; }
              } catch (e) { }
            }

            try {
              const videoName = `video_${card.id}_${Date.now()}.webm`;
              const src = path.join(VIDEOS_DIR, newest);
              const dest = path.join(VIDEOS_DIR, videoName);
              fs.renameSync(src, dest);
              cardReport.videoUrl = `/videos/${videoName}`;
            } catch (e) {
              // leave as-is if rename fails
            }
          }
        } else if (context) {
          await context.close();
        }
      } catch (e) {
        // ignore video finalization errors
      }

      cardReport.status = cardFailed ? 'failed' : 'passed';
      report.cards.push(cardReport);
      if (cardFailed) report.failedTests += 1; else report.passedTests += 1;
      onEvent('test-end', { cardId: card.id, status: cardFailed ? 'failed' : 'passed', videoUrl: cardReport.videoUrl || null });

      // بعد حفظ التقرير/إرسال test-end: إذا فشلنا يمكن إعادة المحاولة
      // (سيستمر الكود تلقائياً للمحاولة التالية داخل حلقة attempt)
    } catch (err) {
        onEvent('global-error', { error: err.message });
        cardFailed = true;
      } finally {
        if (screencastSession) {
          await screencastSession.send('Page.stopScreencast').catch(() => null);
          await screencastSession.detach().catch(() => null);
        }
        // إغلاق المتصفح المنفصل فوراً بعد إنهاء المحاولة وقبل المحاولة التالية/الكارد التالي
        if (browser) {
          try {
            if (page) await page.waitForTimeout(1500); // مهلة رؤية سريعة قبل الإغلاق التلقائي
            await browser.close();
          } catch (e) { }
        }
      }

      // إذا نجحنا في أي محاولة، نوقف باقي المحاولات
      if (!cardFailed) {
        break;
      }
    }
  }

  report.duration = ((Date.now() - new Date(report.generatedAt).getTime()) / 1000).toFixed(2);
  onEvent('all-tests-end', {});
  return report;
}
