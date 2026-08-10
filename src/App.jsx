import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  Play, Square, Plus, Trash2, Copy, FileText, CheckCircle2,
  XCircle, Clock, Eye, EyeOff, Sparkles, Terminal, FileCheck,
  HelpCircle, Trash, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Maximize2,
  Moon, Sun, Languages, Bug, ShieldAlert, Search
} from 'lucide-react';
import './App.css';

// Initial test cases empty by default so user can enter custom dynamic tests
const INITIAL_CARDS = [];

const UI_TEXT = {
  ar: {
    smartVersion: 'النسخة الذكية 1.0',
    languageLabel: 'English',
    languageTitle: 'Switch to English',
    reportButton: 'توليد التقرير الذكي',
    reportButtonTitle: 'عرض وتوليد تقرير الاختبار',
    projectsPanel: 'لوحة إدارة المشاريع والأنظمة',
    currentProject: 'اسم النظام / المشروع الحالي',
    projectPlaceholder: 'مثال: نظام اختبار المبيعات',
    savedProjects: 'المشاريع المحفوظة بالمتصفح',
    chooseProject: '-- اختر مشروعا لتحميله --',
    deleteSavedProject: 'حذف هذا المشروع المحفوظ',
    saveLocal: 'حفظ محلي',
    exportJson: 'تصدير JSON',
    importFile: 'استيراد ملف',
    newProject: 'مشروع جديد',
    credentialsPanel: 'البيانات والمحددات العامة للموقع المستهدف',
    targetUrl: 'رابط الموقع المستهدف (URL)',
    username: 'اسم المستخدم / البريد الإلكتروني',
    password: 'كلمة المرور (Password)',
    hidePassword: 'إخفاء كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    autoLogin: 'تفعيل الدخول التلقائي الذكي قبل تشغيل خطوات الكارت (Auto-Login & Auto-Navigate)',
    testCards: 'بطاقات الاختبارات الذكية',
    resetStatus: 'إعادة ضبط الحالة',
    runAll: 'تشغيل جميع الاختبارات',
    stopNow: 'إيقاف الجلسة فورا',
    quickPresets: 'قوالب جاهزة سريعة:',
    runThisTest: 'تشغيل هذا الاختبار فقط',
    duplicateTest: 'نسخ الاختبار',
    deleteTest: 'حذف الاختبار',
    testTitle: 'عنوان الاختبار',
    cardReady: 'جاهز',
    cardRunning: 'جاري الاختبار...',
    cardPassed: 'نجح',
    cardFailed: 'فشل',
    promptSteps: 'خطوات التست (Prompt Steps):',
    promptPlaceholder: 'اذهب الى google.com\nاكتب كلمة البحث في حقل البحث\nاضغط على زر البحث',
    writtenSteps: 'الخطوات المكتوبة',
    completedSteps: 'خطوات مكتملة',
    addCustomCard: 'إضافة كارت اختبار مخصص جديد',
    recordVideoLabel: 'تسجيل فيديو لهذا الكارت',
    consoleTitle: 'شاشة كونسول المتابعة الحية (Playwright Logs)',
    clearConsole: 'مسح الشاشة',
    consoleEmpty: 'شاشة الكونسول فارغة. اضغط "تشغيل" لبدء الاختبار ومتابعة تحركات المتصفح مباشرة هنا.',
    reportTitle: 'التقرير الفني الشامل لاختبارات الجودة',
    printReport: 'طباعة / حفظ التقرير PDF',
    downloadHtmlReport: 'تحميل التقرير كملف HTML',
    sendReportByEmail: 'إرسال التقرير عبر البريد الإلكتروني',
    senderEmail: 'البريد الإلكتروني المرسل',
    recipientEmail: 'البريد الإلكتروني للمستقبل',
    emailSubject: 'عنوان البريد الإلكتروني',
    emailBody: 'نص البريد الإلكتروني',
    sendEmailButton: 'إرسال التقرير',
    sendingEmail: 'جاري إرسال البريد...',
    emailSentSuccess: 'تم إرسال التقرير بنجاح!',
    emailSentSuccessEthereal: 'تم إنشاء تقرير تجريبي عبر Ethereal (بيئة وهمية للاختبار). عاين التقرير من هنا:',
    etherealNotice: '💡 ملاحظة: معاينة Ethereal مخصصة للتجربة فقط ولا ترسل رسائل فعلياً إلى صندوق البريد الحقيقي (Inbox). للإرسال إلى إيميل حقيقي، يرجى تعبئة بيانات خادم SMTP.',
    emailSentError: 'فشل إرسال التقرير:',
    emailValidationError: 'يرجى ملء الحقول المطلوبة قبل الإرسال.',
    emailIncompleteSmtpError: 'يرجى إدخال عنوان خادم SMTP (Host) عند إدخال اسم المستخم أو كلمة المرور.',
    autoSendReport: 'إرسال التقرير تلقائياً عبر البريد بعد انتهاء الاختبارات',
    saveEmailSettings: '💾 حفظ الإعدادات',
    emailSettingsSaved: '✅ تم حفظ إعدادات البريد الإلكتروني و SMTP في المتصفح بنجاح!',
    smtpSettingsSection: 'إعدادات إرسال البريد (SMTP)',
    smtpHost: 'خادم SMTP',
    smtpPort: 'منفذ SMTP',
    smtpSecure: 'استخدام اتصال آمن (TLS)',
    smtpSecureHelp: 'TLS',
    smtpUser: 'اسم مستخدم SMTP',
    smtpPass: 'كلمة مرور SMTP',
    smtpHint: 'اترك إعدادات SMTP فارغة لاستخدام معاينة بريد Ethereal التجريبية. للإرسال الحقيقي استخدم إعدادات SMTP الصحيحة: منفذ 465 مع TLS مفعّل، أو منفذ 587 مع TLS غير مفعّل (STARTTLS).',
    runDetails: 'بيانات ومحددات تشغيل الاختبار',
    targetWebsite: 'الموقع المستهدف (URL):',
    reportUsername: 'اسم المستخدم:',
    notEntered: 'لم يتم إدخاله',
    autoLoginStatus: 'ميزة الدخول التلقائي:',
    enabled: 'مفعلة (Auto-Login)',
    disabled: 'معطلة',
    totalCards: 'إجمالي التست كاردز',
    passedTests: 'الاختبارات الناجحة',
    failedTests: 'الاختبارات الفاشلة',
    passRate: 'نسبة النجاح',
    detailedResults: 'تفاصيل نتائج الخطوات لكل اختبار',
    noReportData: 'لا توجد أي بيانات لعرضها في التقرير حاليا.',
    scheduleTypeLabel: 'نوع التكرار والجدولة',
    scheduleOnce: '📅 مرة واحدة (تاريخ ووقت محدد)',
    scheduleDaily: '☀️ يومي (كل يوم في ساعة محددة)',
    scheduleWeekly: '📆 أسبوعي (يوم محدد وساعة محددة كل أسبوع)',
    scheduleDayOfWeekLabel: 'اليوم المفضل من الأسبوع',
    scheduleTimeLabel: 'وقت التنفيذ (ساعة : دقيقة)',
    executionDateTime: 'تاريخ ووقت التنفيذ',
    timezone: 'المنطقة الزمنية',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    notRun: 'لم يتم تشغيلها',
    running: 'جاري الاختبار',
    passed: 'ناجح',
    failed: 'فاشل',
    noTrackedSteps: 'لم يتم تتبع أي خطوات لهذا الاختبار بعد.',
    secondsSuffix: 'ث',
    failureReason: 'سبب الفشل:',
    screenshotLabel: 'لقطة شاشة لحظة حدوث المشكلة:',
    screenshotAlt: 'صورة الخطأ البرمجي',
    lightboxAlt: 'لقطة شاشة بالحجم الكامل',
    newProjectName: 'مشروع جديد',
    newCardTitle: 'كارت اختبار جديد',
    duplicateSuffix: 'نسخة',
    defaultCardPrompt: '# اكتب خطوات الاختبار هنا\nاذهب الى {url}\nاكتب اسم المستخدم\nاكتب كلمة المرور\nاضغط على زر الدخول',
    testTypeLabel: 'نوع الاختبار',
    testTypeAll: 'الكل',
    testTypeSmoke: 'Smoke',
    testTypeRegression: 'Regression',
  },
  en: {
    smartVersion: 'Smart Edition 1.0',
    languageLabel: 'العربية',
    languageTitle: 'التبديل إلى العربية',
    reportButton: 'Generate Smart Report',
    reportButtonTitle: 'View and generate the test report',
    projectsPanel: 'Systems & Projects Manager',
    currentProject: 'Current system / project name',
    projectPlaceholder: 'Example: Sales testing system',
    savedProjects: 'Saved browser projects',
    chooseProject: '-- Choose a project to load --',
    deleteSavedProject: 'Delete this saved project',
    saveLocal: 'Save Local',
    exportJson: 'Export JSON',
    importFile: 'Import File',
    newProject: 'New Project',
    credentialsPanel: 'Global Target Website Settings',
    targetUrl: 'Target website URL',
    username: 'Username / Email',
    password: 'Password',
    hidePassword: 'Hide password',
    showPassword: 'Show password',
    autoLogin: 'Enable smart auto-login before running card steps (Auto-Login & Auto-Navigate)',
    testCards: 'Smart Test Cards',
    resetStatus: 'Reset Status',
    runAll: 'Run All Tests',
    stopNow: 'Stop Session Now',
    quickPresets: 'Quick presets:',
    runThisTest: 'Run this test only',
    duplicateTest: 'Duplicate test',
    deleteTest: 'Delete test',
    testTitle: 'Test title',
    cardReady: 'Ready',
    cardRunning: 'Running...',
    cardPassed: 'Passed',
    cardFailed: 'Failed',
    promptSteps: 'Test steps (Prompt Steps):',
    promptPlaceholder: 'go to google.com\ntype search keyword into search field\nclick search button',
    writtenSteps: 'Written steps',
    completedSteps: 'Completed steps',
    addCustomCard: 'Add New Custom Test Card',
    recordVideoLabel: 'Record video for this card',
    consoleTitle: 'Live Playwright Console Logs',
    clearConsole: 'Clear Console',
    consoleEmpty: 'Console is empty. Press "Run" to start testing and watch browser actions here.',
    reportTitle: 'Comprehensive Quality Test Report',
    printReport: 'Print / Save PDF Report',
    downloadHtmlReport: 'Download HTML report',
    sendReportByEmail: 'Send report by email',
    senderEmail: 'Sender email',
    recipientEmail: 'Recipient email',
    emailSubject: 'Email subject',
    emailBody: 'Email body',
    sendEmailButton: 'Send Report',
    sendingEmail: 'Sending email...',
    emailSentSuccess: 'Report sent successfully!',
    emailSentSuccessEthereal: 'Created a test report via Ethereal (mock preview environment). Preview report here:',
    etherealNotice: '💡 Note: Ethereal preview is for testing layout only and does NOT deliver to real inboxes. To deliver to a real inbox, fill in your SMTP server settings.',
    emailSentError: 'Failed to send report:',
    emailValidationError: 'Please fill in all required email fields before sending.',
    emailIncompleteSmtpError: 'Please enter the SMTP Host when providing SMTP credentials.',
    autoSendReport: 'Automatically send report by email after test run completes',
    saveEmailSettings: '💾 Save Settings',
    emailSettingsSaved: '✅ Email & SMTP settings saved to browser successfully!',
    smtpSettingsSection: 'Email Delivery Settings (SMTP)',
    smtpHost: 'SMTP host',
    smtpPort: 'SMTP port',
    smtpSecure: 'Use secure connection (TLS)',
    smtpSecureHelp: 'TLS',
    smtpUser: 'SMTP username',
    smtpPass: 'SMTP password',
    smtpHint: 'Leave SMTP empty to use Ethereal test email preview. For real delivery use valid SMTP settings: port 465 with secure checked, or port 587 with secure unchecked for STARTTLS.',
    runDetails: 'Test Run Details',
    targetWebsite: 'Target website (URL):',
    reportUsername: 'Username:',
    notEntered: 'Not entered',
    autoLoginStatus: 'Auto-login:',
    enabled: 'Enabled (Auto-Login)',
    disabled: 'Disabled',
    totalCards: 'Total test cards',
    passedTests: 'Passed tests',
    failedTests: 'Failed tests',
    passRate: 'Pass rate',
    detailedResults: 'Step results for each test',
    noReportData: 'No report data available yet.',
    scheduleTypeLabel: 'Repeat Frequency & Schedule Type',
    scheduleOnce: '📅 Once (Specific date & time)',
    scheduleDaily: '☀️ Daily (Every day at specific time)',
    scheduleWeekly: '📆 Weekly (Specific day of week & time)',
    scheduleDayOfWeekLabel: 'Day of week',
    scheduleTimeLabel: 'Execution time (HH:mm)',
    executionDateTime: 'Execution date & time',
    timezone: 'Timezone',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    notRun: 'Not run',
    running: 'Running',
    passed: 'Passed',
    failed: 'Failed',
    noTrackedSteps: 'No tracked steps for this test yet.',
    secondsSuffix: 's',
    failureReason: 'Failure reason:',
    screenshotLabel: 'Screenshot at the moment of failure:',
    screenshotAlt: 'Failure screenshot',
    lightboxAlt: 'Full size screenshot',
    newProjectName: 'New Project',
    newCardTitle: 'New Test Card',
    duplicateSuffix: 'Copy',
    defaultCardPrompt: '# Write test steps here\ngo to {url}\ntype username {username}\ntype password {password}\nclick login',
    testTypeLabel: 'Test type',
    testTypeAll: 'All',
    testTypeSmoke: 'Smoke',
    testTypeRegression: 'Regression',
  }
};

const TEST_CARD_TYPES = [
  { key: 'all', label: { ar: 'الكل', en: 'All' } },
  { key: 'smoke', label: { ar: 'Smoke', en: 'Smoke' } },
  { key: 'regression', label: { ar: 'Regression', en: 'Regression' } },
  { key: 'functional', label: { ar: 'Functional', en: 'Functional' } },
  { key: 'integration', label: { ar: 'Integration', en: 'Integration' } },
  { key: 'sanity', label: { ar: 'Sanity', en: 'Sanity' } },
  { key: 'performance', label: { ar: 'Performance', en: 'Performance' } },
  { key: 'security', label: { ar: 'Security', en: 'Security' } },
  { key: 'exploratory', label: { ar: 'Exploratory', en: 'Exploratory' } },
  { key: 'acceptance', label: { ar: 'Acceptance', en: 'Acceptance' } }
];

// Presets template list for users to quickly add
const PRESET_TEMPLATES = [
  {
    title: 'تصفح سلة Swag Labs (Saucedemo)',
    prompt: `# يجب كتابة رابط www.saucedemo.com بالأعلى\n# واسم المستخدم standard_user والرمز secret_sauce\n# نتحقق من الدخول الناجح بوجود عنوان المنتجات\nتاكد من وجود "Products"\n\n# نضغط على زر إضافة المنتج للسلة\nاضغط على "Add to cart"\n\n# نتحقق من ظهور رقم 1 في أيقونة السلة\nتاكد من وجود "1"`
  },
  {
    title: 'تسجيل دخول مخصص (Manual Login Flow)',
    prompt: `اذهب الى url\nاكتب اسم المستخدم username\nاكتب كلمة المرور password\nاضغط على "تسجيل الدخول"\nتاكد من وجود "مرحباً بك"`
  },
  {
    title: 'البحث في الموقع (Search Flow)',
    prompt: `اكتب "حقيبة" في البحث\nاضغط على زر البحث\nتاكد من وجود "نتائج البحث"`
  }
];

const PRESET_TRANSLATIONS = [
  {
    title: {
      ar: 'تصفح سلة Swag Labs (Saucedemo)',
      en: 'Swag Labs Cart Flow (Saucedemo)'
    },
    prompt: {
      ar: '# يجب كتابة رابط www.saucedemo.com بالأعلى\n# واسم المستخدم standard_user والرمز secret_sauce\nتأكد من وجود "Products"\nاضغط على "Add to cart"\nتأكد من وجود "1"',
      en: '# Set URL to www.saucedemo.com above\n# Use username standard_user and password secret_sauce\nverify "Products"\nclick "Add to cart"\nverify "1"'
    }
  },
  {
    title: {
      ar: 'تسجيل دخول مخصص (Manual Login Flow)',
      en: 'Manual Login Flow'
    },
    prompt: {
      ar: 'اذهب الى url\nاكتب اسم المستخدم username\nاكتب كلمة المرور password\nاضغط على "تسجيل الدخول"\nتأكد من وجود "مرحبا بك"',
      en: 'go to url\ntype username username\ntype password password\nclick "Login"\nverify "Welcome"'
    }
  },
  {
    title: {
      ar: 'البحث في الموقع (Search Flow)',
      en: 'Site Search Flow'
    },
    prompt: {
      ar: 'اكتب "حقيبة" في البحث\nاضغط على زر البحث\nتأكد من وجود "نتائج البحث"',
      en: 'type "bag" into search\nclick search button\nverify "Search results"'
    }
  }
];

const ACTION_TYPES = [
  { value: 'click', label: { ar: 'انقر على', en: 'Click' } },
  { value: 'type', label: { ar: 'اكتب في', en: 'Type' } },
  { value: 'scroll', label: { ar: 'مرر', en: 'Scroll' } },
  { value: 'assertion', label: { ar: 'تحقق من', en: 'Assertion' } },
  { value: 'wait', label: { ar: 'انتظر', en: 'Wait' } }
];

const SELECTOR_TYPES = [
  { value: 'goal', label: { ar: 'النية البشرية', en: 'Goal-Driven' } },
  { value: 'id', label: { ar: 'الايدي', en: 'ID' } },
  { value: 'class', label: { ar: 'الكلاس', en: 'Class' } },
  { value: 'aria', label: { ar: 'Aria-Label', en: 'Aria-Label' } },
  { value: 'css', label: { ar: 'CSS Selector', en: 'CSS Selector' } },
  { value: 'xpath', label: { ar: 'XPath', en: 'XPath' } },
  { value: 'text', label: { ar: 'نص', en: 'Text' } },
  { value: 'name', label: { ar: 'اسم الحقل', en: 'Name' } },
  { value: 'data-test', label: { ar: 'Data-Test', en: 'Data-Test' } },
  { value: 'data-testid', label: { ar: 'Data-testid', en: 'Data-testid' } },
  { value: 'variable', label: { ar: 'متغيرات', en: 'Variables' } }
];

const ASSERTION_TYPES = [
  { value: 'visible', label: { ar: '[visible] مرئي', en: '[visible] Visible' } },
  { value: 'enabled', label: { ar: '[enabled] مفعّل', en: '[enabled] Enabled' } },
  { value: 'disabled', label: { ar: '[disabled] معطل', en: '[disabled] Disabled' } },
  { value: 'text_match', label: { ar: '[text_match] مطابقة نص', en: '[text_match] Text Match' } }
];


const createBuilderStep = () => ({
  id: `builder-step-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  action: 'click',
  selector: 'goal',
  target: '',
  value: '',
  assertionType: 'text',
  attributeName: '',
  fieldAssertion: false,
  title: ''
});

// ============================================================
// محرك التحليل الذكي للخطوات (Smart NLP Step Parser Engine)
// يحوّل النية البشرية (عربي/إنجليزي) إلى JSON مهيكل بدقة
// ============================================================

/**
 * يستخرج نوع المحدد (selector type) من قيمة المستهدف
 * مثلاً: "#submit-btn" → { selectorType: 'selector', cleanValue: '#submit-btn' }
 *        ".some-class"  → { selectorType: 'selector', cleanValue: '.some-class' }
 *        "submit-btn"   → { selectorType: 'goal', cleanValue: 'submit-btn' }
 */
const detectSelectorType = (rawValue) => {
  const val = String(rawValue || '').trim();
  if (/^#[\w\-]+$/.test(val)) return { selectorType: 'id', cleanValue: val.slice(1) };
  if (/^\.[\w\-]+$/.test(val)) return { selectorType: 'class', cleanValue: val.slice(1) };
  if (/^\[aria-label/i.test(val) || /^aria:/i.test(val)) return { selectorType: 'aria', cleanValue: val.replace(/^aria:/i, '').replace(/^\[aria-label=["']?|["']?\]$/g, '').trim() };
  if (/^xpath:\/\//i.test(val) || /^\.\/\//.test(val) || /^\/\//.test(val)) return { selectorType: 'xpath', cleanValue: val };
  if (/^text:/i.test(val)) return { selectorType: 'text', cleanValue: val.replace(/^text:\s*/i, '').trim() };
  if (/^name:/i.test(val)) return { selectorType: 'name', cleanValue: val.replace(/^name:\s*/i, '').trim() };
  if (/^data-test:/i.test(val)) return { selectorType: 'data-test', cleanValue: val.replace(/^data-test:\s*/i, '').trim() };
  if (/^data-testid:/i.test(val)) return { selectorType: 'data-testid', cleanValue: val.replace(/^data-testid:\s*/i, '').trim() };
  if (/[.#\[\]>~+]/.test(val) && !/ /.test(val.trim())) return { selectorType: 'css', cleanValue: val };
  return { selectorType: 'goal', cleanValue: val };
};

/**
 * يُبسّط النص المستهدف بحذف الكلمات الوظيفية (زر، حقل، رابط...)
 */
const cleanTarget = (text) => String(text || '')
  .replace(/^(?:زر|الزر|حقل|الحقل|أيقونة|ايقونة|رابط|اللينك)\s+/i, '')
  .replace(/\s+(?:button|field|input|link|icon|btn)$/i, '')
  .replace(/["'«»]/g, '')
  .trim();

/**
 * المحرك الرئيسي: يحوّل سطراً واحداً من اللغة الطبيعية إلى builderStep
 * الأولويات مرتبة من الأكثر تخصصاً إلى الأعم
 */
const parsePromptLineToBuilderStep = (line) => {
  const text = String(line || '').trim();
  if (!text || text.startsWith('#') || text.startsWith('//')) return null;

  // ──────────────────────────────────────────────────────────
  // 1. أولوية عالية: assert attribute (attribute assertion)
  // المثال: assert attribute aria-label equals "تفعيل" in #submit-btn
  // ──────────────────────────────────────────────────────────
  const assertionAttrPattern = /^(?:assert|تاكد|تأكد)\s+attribute\s+([\w\-_:]+)\s+(?:equals|=|==|يساوي)\s+"?(.+?)"?\s+(?:in|into|في)\s+(.+)$/i;
  if (assertionAttrPattern.test(text)) {
    const [, attrName, expected, rawTarget] = text.match(assertionAttrPattern);
    const { selectorType, cleanValue } = detectSelectorType(rawTarget.trim());
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: expected.trim(), assertionType: 'text_match', fieldAssertion: false };
  }

  // ──────────────────────────────────────────────────────────
  // 2. أولوية عالية: التحقق من تعطّل عنصر (element_disabled)
  // المثال: "تحقق من أن زر إرسال العقود معطل وغير فعال"
  // المثال: "assert disabled button#submit-contracts"
  // ──────────────────────────────────────────────────────────
  const disabledPatternAr = /^(?:تحقق|تاكد|تأكد)\s+(?:من\s+)?(?:أن\s+|ان\s+)?(.+?)\s+(?:معطل|غير\s+فعال|disabled|غير\s+مفعل|متوقف)/i;
  const disabledPatternEn = /^(?:assert|verify|check)\s+(?:that\s+)?(.+?)\s+(?:is\s+)?(?:disabled|inactive|not\s+enabled)/i;
  const disabledDirectEn = /^(?:assert|verify)\s+disabled\s+(.+)$/i;

  if (disabledPatternAr.test(text)) {
    const [, rawTarget] = text.match(disabledPatternAr);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: '', assertionType: 'element_disabled', fieldAssertion: true };
  }
  if (disabledPatternEn.test(text)) {
    const [, rawTarget] = text.match(disabledPatternEn);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: '', assertionType: 'element_disabled', fieldAssertion: true };
  }
  if (disabledDirectEn.test(text)) {
    const [, rawTarget] = text.match(disabledDirectEn);
    const { selectorType, cleanValue } = detectSelectorType(rawTarget.trim());
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: '', assertionType: 'element_disabled', fieldAssertion: true };
  }

  // ──────────────────────────────────────────────────────────
  // 3. التحقق من قيمة/نص في حقل محدد (text assertion on field)
  // المثال: "تأكد من أن النص الظاهر في حقل الإجمالي يساوي 150$"
  // المثال: "assert text "Welcome" in #header-title"
  // ──────────────────────────────────────────────────────────
  const textAssertFieldAr = /^(?:تحقق|تاكد|تأكد)\s+(?:من\s+)?(?:أن\s+|ان\s+)?(?:النص|الرسالة|القيمة|المحتوى)?\s*(?:الظاهر(?:ة)?\s+)?(?:في\s+)?(?:حقل|خانة|عنصر|المربع|الخانة|قسم)?\s*(.+?)\s+(?:يساوي|يحتوي|يعرض|تساوي|هو|هي|=|equals|contains|is)\s+"?(.+?)"?$/i;
  const textAssertFieldEn = /^(?:assert|verify|check)\s+(?:text\s+)?"?(.+?)"?\s+(?:in|inside|within)\s+(.+)$/i;

  if (textAssertFieldAr.test(text)) {
    const [, rawTarget, expected] = text.match(textAssertFieldAr);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: expected.trim().replace(/["']/g, ''), assertionType: 'text', fieldAssertion: true };
  }
  if (textAssertFieldEn.test(text)) {
    const [, expected, rawTarget] = text.match(textAssertFieldEn);
    const { selectorType, cleanValue } = detectSelectorType(rawTarget.trim());
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: expected.trim().replace(/["']/g, ''), assertionType: 'text', fieldAssertion: true };
  }

  // ──────────────────────────────────────────────────────────
  // 4. التحقق من وجود عنصر مرئي (element_visibility)
  // المثال: "تأكد من وجود زر الحفظ" / "verify button save exists"
  // ──────────────────────────────────────────────────────────
  const elementVisibilityPatternAr = /^(?:تحقق|تاكد|تأكد)\s+(?:من\s+)?(?:وجود|ظهور|عرض)\s+(.+)$/i;
  const elementVisibilityPatternEn = /^(?:assert|verify|check)\s+(?:that\s+)?(.+?)\s+(?:exists?|is\s+visible|is\s+shown?|appears?)/i;

  if (elementVisibilityPatternAr.test(text)) {
    const [, rawTarget] = text.match(elementVisibilityPatternAr);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: '', assertionType: 'element_visibility', fieldAssertion: true };
  }
  if (elementVisibilityPatternEn.test(text)) {
    const [, rawTarget] = text.match(elementVisibilityPatternEn);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    return { ...createBuilderStep(), action: 'assertion', selector: selectorType, target: cleanValue, value: '', assertionType: 'element_visibility', fieldAssertion: true };
  }

  // ──────────────────────────────────────────────────────────
  // 5. التحقق من وجود نص في الصفحة (global text assertion)
  // المثال: "تاكد من وجود Products" / "verify \"Welcome\""
  // ──────────────────────────────────────────────────────────
  if (/^(?:تاكد من وجود|تأكد من وجود|تحقق من وجود|تحقق من|verify|assert|check)\s+/i.test(text)) {
    const rawTarget = text.replace(/^(?:تاكد من وجود|تأكد من وجود|تحقق من وجود|تحقق من|verify|assert|check)\s+/i, '').trim();
    const cleanedText = rawTarget.replace(/["'«»]/g, '').trim();
    return { ...createBuilderStep(), action: 'assertion', selector: 'goal', target: cleanedText, value: cleanedText, assertionType: 'text', fieldAssertion: false };
  }

  // ──────────────────────────────────────────────────────────
  // 6. الكتابة في حقل (type action)
  // المثال: "اكتب 'أحمد' في حقل الاسم" / "type \"test@email.com\" into email"
  // ──────────────────────────────────────────────────────────
  // 1. تعريف المتغيرات والأنماط (Regex Patterns) مرة واحدة فقط
  const typePatternAr = /^(?:اكتب|ادخل|أدخل|اكتب في|ادخل في)\s+"?'?(.+?)'?'?\s+(?:في|في\s+حقل|في\s+خانة|في\s+مربع|داخل)\s+(.+)$/i;
  const typePatternEn = /^(?:type|fill|write|enter|input)\s+"?'?(.+?)'?'?\s+(?:in|into|inside|within|to)\s+(?:the\s+)?(.+)$/i;

  const loginFieldPatternAr = /^(?:اكتب|ادخل|أدخل|املأ)\s+(?:اسم\s+المستخدم(?:\s+أو\s+الايميل)?|الايميل|البريد\s+الإلكتروني|username|user\s*name|email)(?:\s+(?:بقيمة|بـ|ب|as|with))?\s*(?:"([^"]+)"|'([^']+)'|(\{[^}]+\})|(.+))?$/i;
  const passwordFieldPatternAr = /^(?:اكتب|ادخل|أدخل|املأ)\s+(?:كلمة\s+السر|كلمة\s+المرور|الباس|password)(?:\s+(?:بقيمة|بـ|ب|as|with))?\s*(?:"([^"]+)"|'([^']+)'|(\{[^}]+\})|(.+))?$/i;
  const loginFieldPatternEn = /^(?:type|fill|write|enter|input)\s+(?:username|user\s*name|email)(?:\s+(?:with|as|to|value))?\s*(?:"([^"]+)"|'([^']+)'|(\{[^}]+\})|(.+))?$/i;
  const passwordFieldPatternEn = /^(?:type|fill|write|enter|input)\s+(?:password)(?:\s+(?:with|as|to|value))?\s*(?:"([^"]+)"|'([^']+)'|(\{[^}]+\})|(.+))?$/i;

  // 2. دالة مساعدة لاستخراج القيمة
  const extractFieldValue = (match) => {
    if (!match) return '';
    return (match[1] || match[2] || match[3] || match[4] || '').trim();
  };

  // 3. الشروط والمنطق الخاص بالتطبيق (Conditions)
  if (loginFieldPatternAr.test(text)) {
    const match = text.match(loginFieldPatternAr);
    const value = extractFieldValue(match) || '{USERNAME}';
    return { ...createBuilderStep(), action: 'type', selector: 'goal', target: 'username', value };
  }

  if (passwordFieldPatternAr.test(text)) {
    const match = text.match(passwordFieldPatternAr);
    const value = extractFieldValue(match) || '{PASSWORD}';
    return { ...createBuilderStep(), action: 'type', selector: 'goal', target: 'password', value };
  }

  if (loginFieldPatternEn.test(text)) {
    const match = text.match(loginFieldPatternEn);
    const value = extractFieldValue(match) || '{USERNAME}';
    return { ...createBuilderStep(), action: 'type', selector: 'goal', target: 'username', value };
  }

  if (passwordFieldPatternEn.test(text)) {
    const match = text.match(passwordFieldPatternEn);
    const value = extractFieldValue(match) || '{PASSWORD}';
    return { ...createBuilderStep(), action: 'type', selector: 'goal', target: 'password', value };
  }

  if (typePatternAr.test(text)) {
    const [, typedValue, rawTarget] = text.match(typePatternAr);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);

    const finalValue = (typedValue || '').replace(/^["'{ ]+|["'} ]+$/g, '').trim();

    return {
      ...createBuilderStep(),
      action: 'type',
      selector: selectorType,
      target: cleanValue,
      value: finalValue
    };
  }

  if (typePatternEn.test(text)) {
    const [, typedValue, rawTarget] = text.match(typePatternEn);
    const cleaned = cleanTarget(rawTarget);
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    const finalValue = (typedValue || '').replace(/^['"{ ]+|['"} ]+$/g, '').trim();

    return {
      ...createBuilderStep(),
      action: 'type',
      selector: selectorType,
      target: cleanValue,
      value: finalValue
    };
  }

  // ──────────────────────────────────────────────────────────
  // 7. النقر على عنصر (click action)
  // المثال: "اضغط على زر الإرسال" / "click submit button"
  // ──────────────────────────────────────────────────────────
  if (/^(?:اضغط على|انقر على|اكبس على|اضغط|انقر|اكبس|افتح|click\s+on|click|press|tap)/i.test(text)) {
    const rawTarget = text.replace(/^(?:اضغط على|انقر على|اكبس على|اضغط|انقر|اكبس|افتح|click\s+on|click|press|tap)\s*/i, '').trim();
    const cleaned = cleanTarget(rawTarget) || 'button';
    const { selectorType, cleanValue } = detectSelectorType(cleaned);
    return { ...createBuilderStep(), action: 'click', selector: selectorType, target: cleanValue, value: '' };
  }

  // ──────────────────────────────────────────────────────────
  // 8. محرك التمرير المطور (Advanced Scroll Engine)
  // تمرير الصفحة الكاملة أو عنصر محدد
  // ──────────────────────────────────────────────────────────
  if (/^(?:مرر|انزل|اسحب|scroll)/i.test(text)) {
    const rawTarget = text
      .replace(/^(?:مرر|انزل|اسحب|scroll)\s*/i, '')
      .replace(/^(?:الى|إلى|لـ|لـل|to|towards)\s*/i, '')
      .trim();

    // تمرير لأسفل الصفحة
    if (!rawTarget || /^(?:أسفل|اسفل|تحت|نهاية\s*الصفحة?|آخر\s*الصفحة?|أخر\s*الصفحة?|bottom|down|end)$/i.test(rawTarget)) {
      return { ...createBuilderStep(), action: 'scroll', selector: 'goal', target: 'bottom', value: '' };
    }
    // تمرير لأعلى الصفحة
    if (/^(?:أعلى|اعلى|فوق|بداية\s*الصفحة?|top|up|start)$/i.test(rawTarget)) {
      return { ...createBuilderStep(), action: 'scroll', selector: 'goal', target: 'top', value: '' };
    }
    // تمرير لليسار
    if (/^(?:يسار|left)$/i.test(rawTarget)) {
      return { ...createBuilderStep(), action: 'scroll', selector: 'goal', target: 'left', value: '' };
    }
    // تمرير لليمين
    if (/^(?:يمين|right)$/i.test(rawTarget)) {
      return { ...createBuilderStep(), action: 'scroll', selector: 'goal', target: 'right', value: '' };
    }
    // تمرير إلى عنصر محدد
    const { selectorType, cleanValue } = detectSelectorType(rawTarget);
    return { ...createBuilderStep(), action: 'scroll', selector: selectorType, target: cleanValue, value: '' };
  }

  // ──────────────────────────────────────────────────────────
  // 9. الانتظار (wait action)
  // المثال: "انتظر 3 ثوانٍ" / "wait 5"
  // ──────────────────────────────────────────────────────────
  if (/^(?:انتظر|استنى|wait)\s*/i.test(text)) {
    const numMatch = text.match(/\d+/);
    return { ...createBuilderStep(), action: 'wait', selector: 'goal', target: '', value: numMatch ? numMatch[0] : '3' };
  }

  // ──────────────────────────────────────────────────────────
  // 10. الانتقال إلى رابط (navigate action)
  // المثال: "اذهب الى /dashboard" / "go to https://example.com"
  // ──────────────────────────────────────────────────────────
  if (/^(?:اذهب الى|اذهب إلى|روح على|انتقل الى|انتقل إلى|go\s+to|navigate\s+to|navigate|open)\s*/i.test(text)) {
    const rawTarget = text.replace(/^(?:اذهب الى|اذهب إلى|روح على|انتقل الى|انتقل إلى|go\s+to|navigate\s+to|navigate|open)\s*/i, '').trim();
    return { ...createBuilderStep(), action: 'navigate', selector: 'goal', target: rawTarget || '{url}', value: '' };
  }

  // ──────────────────────────────────────────────────────────
  // Fallback: النية البشرية (goal-driven — يعتمد على المحرك الذكي)
  // ──────────────────────────────────────────────────────────
  return { ...createBuilderStep(), action: 'click', selector: 'goal', target: text, value: '' };
};

/**
 * يحوّل كتلة نص (برومبت متعدد الأسطر) إلى مصفوفة builderSteps كاملة
 */
const parseFullPromptToBuilderSteps = (promptText) => {
  const lines = String(promptText || '').split(/\r?\n/);
  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))
    .map(parsePromptLineToBuilderStep)
    .filter(Boolean)
    .map(step => ({ ...step, id: `builder-step-${Date.now()}-${Math.random().toString(16).slice(2)}` }));
};

const buildPromptFromBuilderSteps = (steps) => steps.map(step => {
  const target = String(step.target || '').trim();
  const rawValue = String(step.value || '').trim() || (step.action === 'wait' ? '3' : '');
  switch (step.action) {
    case 'navigate': return `go to ${target || rawValue}`;
    case 'click': return `click ${target}`;
    case 'type': return `type "${rawValue}" into ${target}`;
    case 'scroll': return `scroll ${target || rawValue || 'bottom'}`;
    case 'assertion':
      if (step.assertionType === 'attribute' && step.attributeName) {
        return `assert attribute ${step.attributeName} equals "${rawValue}"${step.fieldAssertion && target ? ` in ${target}` : ''}`;
      }
      if (step.assertionType === 'element_disabled') {
        return `assert disabled ${target}`;
      }
      if (step.assertionType === 'element_visibility') {
        return `verify ${target} exists`;
      }
      return `assert text "${rawValue}"${step.fieldAssertion && target ? ` in ${target}` : ''}`;
    case 'wait': return `wait ${rawValue}`;
    default: return target || rawValue;
  }
}).join('\n');

const stripPlaywrightStringLiteral = (raw) => {
  const value = String(raw || '').trim();
  const match = value.match(/^([`'"])([\s\S]*)\1$/);
  return match ? match[2] : value;
};

const parsePlaywrightLocatorExpression = (rawExpression) => {
  const normalized = stripPlaywrightStringLiteral(rawExpression || '');
  if (!normalized) return { selectorType: 'goal', cleanValue: '' };

  const prefixMatch = normalized.match(/^(text|xpath|css)=\s*(.+)$/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    const selectorText = prefixMatch[2].trim();
    if (prefix === 'text') return { selectorType: 'text', cleanValue: selectorText };
    if (prefix === 'xpath') return { selectorType: 'xpath', cleanValue: selectorText };
    if (prefix === 'css') return { selectorType: 'css', cleanValue: selectorText };
  }

  return detectSelectorType(normalized);
};

const parsePlaywrightStepFromLine = (line) => {
  const cleanLine = String(line || '').trim().replace(/^await\s+/i, '').replace(/;$/, '').trim();
  if (!cleanLine) return null;

  const parseArgs = (text) => {
    const args = [];
    let current = '';
    let depth = 0;
    let quote = null;
    let escape = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (escape) {
        current += char;
        escape = false;
        continue;
      }
      if (char === '\\') {
        current += char;
        escape = true;
        continue;
      }
      if (quote) {
        current += char;
        if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        current += char;
        quote = char;
        continue;
      }
      if (char === '(') {
        depth += 1;
        current += char;
        continue;
      }
      if (char === ')') {
        depth -= 1;
        current += char;
        continue;
      }
      if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) args.push(current.trim());
    return args;
  };

  const lineBody = cleanLine.replace(/^page\./i, 'page.');
  let match;

  if (/^page\.goto\s*\(/i.test(lineBody)) {
    match = lineBody.match(/^page\.goto\s*\((.*)\)$/i);
    if (match) {
      const rawTarget = parseArgs(match[1])[0] || '{url}';
      return { ...createBuilderStep(), action: 'navigate', selector: 'goal', target: stripPlaywrightStringLiteral(rawTarget), value: '' };
    }
  }

  if (/^page\.click\s*\(/i.test(lineBody)) {
    match = lineBody.match(/^page\.click\s*\((.*)\)$/i);
    if (match) {
      const args = parseArgs(match[1]);
      const locator = parsePlaywrightLocatorExpression(args[0] || '');
      return { ...createBuilderStep(), action: 'click', selector: locator.selectorType, target: locator.cleanValue, value: '' };
    }
  }

  if (/^page\.fill\s*\(/i.test(lineBody)) {
    match = lineBody.match(/^page\.fill\s*\((.*)\)$/i);
    if (match) {
      const args = parseArgs(match[1]);
      const locator = parsePlaywrightLocatorExpression(args[0] || '');
      const value = stripPlaywrightStringLiteral(args[1] || '');
      return { ...createBuilderStep(), action: 'type', selector: locator.selectorType, target: locator.cleanValue, value };
    }
  }

  if (/^page\.waitForTimeout\s*\(/i.test(lineBody)) {
    match = lineBody.match(/^page\.waitForTimeout\s*\((.*)\)$/i);
    if (match) {
      const timeout = parseInt(stripPlaywrightStringLiteral(match[1] || '0'), 10) || 3;
      return { ...createBuilderStep(), action: 'wait', selector: 'goal', target: String(timeout), value: String(timeout) };
    }
  }

  if (/^page\.waitForSelector\s*\(/i.test(lineBody)) {
    match = lineBody.match(/^page\.waitForSelector\s*\((.*)\)$/i);
    if (match) {
      const locator = parsePlaywrightLocatorExpression(parseArgs(match[1])[0] || '');
      return { ...createBuilderStep(), action: 'wait', selector: locator.selectorType, target: locator.cleanValue, value: '' };
    }
  }

  if (/^page\.locator\s*\(/i.test(lineBody)) {
    match = lineBody.match(/^page\.locator\s*\(([^)]+)\)\.(click|fill|scrollIntoViewIfNeeded|hover)\s*\((.*)\)$/i);
    if (match) {
      const locator = parsePlaywrightLocatorExpression(match[1]);
      const action = match[2].toLowerCase();
      const args = parseArgs(match[3] || '');
      if (action === 'click') {
        return { ...createBuilderStep(), action: 'click', selector: locator.selectorType, target: locator.cleanValue, value: '' };
      }
      if (action === 'fill') {
        const value = stripPlaywrightStringLiteral(args[0] || '');
        return { ...createBuilderStep(), action: 'type', selector: locator.selectorType, target: locator.cleanValue, value };
      }
      if (action === 'scrollintoviewifneeded') {
        return { ...createBuilderStep(), action: 'scroll', selector: locator.selectorType, target: locator.cleanValue, value: '' };
      }
      if (action === 'hover') {
        return { ...createBuilderStep(), action: 'click', selector: locator.selectorType, target: locator.cleanValue, value: '' };
      }
    }
  }

  match = lineBody.match(/^expect\s*\(\s*page\.locator\s*\(([^)]+)\)\s*\)\.(toBeVisible|toBeEnabled|toBeDisabled|toHaveText|toContainText)\s*\((.*)\)$/i);
  if (match) {
    const locator = parsePlaywrightLocatorExpression(match[1]);
    const assertion = match[2].toLowerCase();
    const assertionValue = stripPlaywrightStringLiteral(match[3] || '').trim();
    if (assertion === 'tobevisible') {
      return { ...createBuilderStep(), action: 'assertion', selector: locator.selectorType, target: locator.cleanValue, value: assertionValue, assertionType: 'visible', fieldAssertion: false };
    }
    if (assertion === 'tobeenabled') {
      return { ...createBuilderStep(), action: 'assertion', selector: locator.selectorType, target: locator.cleanValue, value: assertionValue, assertionType: 'enabled', fieldAssertion: false };
    }
    if (assertion === 'tobedisabled') {
      return { ...createBuilderStep(), action: 'assertion', selector: locator.selectorType, target: locator.cleanValue, value: assertionValue, assertionType: 'element_disabled', fieldAssertion: false };
    }
    if (assertion === 'tohavetext' || assertion === 'tocontaintext') {
      return { ...createBuilderStep(), action: 'assertion', selector: locator.selectorType, target: locator.cleanValue, value: assertionValue, assertionType: 'text', fieldAssertion: false };
    }
  }

  match = lineBody.match(/^expect\s*\(\s*page\.(url|title)\(\)\s*\)\.(toHaveURL|toHaveTitle)\s*\((.*)\)$/i);
  if (match) {
    const expected = stripPlaywrightStringLiteral(match[3] || '').trim();
    return { ...createBuilderStep(), action: 'assertion', selector: 'goal', target: expected, value: expected, assertionType: 'text', fieldAssertion: false };
  }

  if (/^await\s+page\.keyboard\.press\s*\(/i.test(line) || /^page\.keyboard\.press\s*\(/i.test(line)) {
    return null;
  }

  return null;
};

const extractPlaywrightTests = (code) => {
  const tests = [];
  const regex = /test\s*\(\s*(['"`])([\s\S]*?)\1\s*,\s*async\s*\([^)]*\)\s*=>\s*\{/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const title = match[2].trim() || 'Playwright test';
    let bodyStart = regex.lastIndex;
    let braceDepth = 1;
    let inString = null;
    let escaped = false;
    for (let cursor = bodyStart; cursor < code.length; cursor += 1) {
      const char = code[cursor];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (inString) {
        if (char === inString) inString = null;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
      }
      if (char === '{') {
        braceDepth += 1;
        continue;
      }
      if (char === '}') {
        braceDepth -= 1;
        if (braceDepth === 0) {
          const body = code.slice(bodyStart, cursor).trim();
          tests.push({ title, body });
          regex.lastIndex = cursor;
          break;
        }
      }
    }
  }
  return tests;
};

const parsePlaywrightCodeToSteps = (codeBody) => {
  if (!codeBody) return [];
  const lines = codeBody
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('/*'));

  const steps = [];
  for (const rawLine of lines) {
    const cleaned = rawLine.replace(/\s+/g, ' ').trim();
    const step = parsePlaywrightStepFromLine(cleaned);
    if (step) {
      steps.push({ ...step, id: `builder-step-${Date.now()}-${Math.random().toString(16).slice(2)}` });
    }
  }
  return steps;
};

const parsePlaywrightCodeToCards = (code, fileName) => {
  const testBlocks = extractPlaywrightTests(code);
  const cards = [];

  if (testBlocks.length === 0) {
    const steps = parsePlaywrightCodeToSteps(code);
    if (steps.length === 0) return [];
    return [{
      id: `test-${Date.now()}`,
      title: fileName ? `Imported ${fileName}` : 'Imported Playwright Test',
      type: 'all',
      prompt: buildPromptFromBuilderSteps(steps),
      status: 'idle',
      steps: [],
      logHistory: [],
      recordVideo: false,
      builderSteps: steps
    }];
  }

  for (const { title, body } of testBlocks) {
    const steps = parsePlaywrightCodeToSteps(body);
    cards.push({
      id: `test-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title || (fileName ? `Imported ${fileName}` : 'Imported Playwright Test'),
      type: 'all',
      prompt: buildPromptFromBuilderSteps(steps),
      status: 'idle',
      steps: [],
      logHistory: [],
      recordVideo: false,
      builderSteps: steps
    });
  }

  return cards;
};

export default function App() {
  const [projectName, setProjectName] = useState('نظام سوس ديمو SwagLabs');
  const [savedProjects, setSavedProjects] = useState([]);

  const [credentials, setCredentials] = useState({
    url: 'https://the-internet.herokuapp.com/login',
    username: 'tomsmith',
    password: 'SuperSecretPassword!',
    autoLogin: true
  });

  // System/global variables (available for all cards + can also be used in global credentials fields)
  const normalizeSystemVariables = (parsed) => {
    // Old format: { [name]: value }
    // New format: { [name]: { type, value } }
    if (!parsed || typeof parsed !== 'object') return {};

    const entries = Object.entries(parsed);
    const out = {};

    for (const [name, val] of entries) {
      if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'type') && Object.prototype.hasOwnProperty.call(val, 'value')) {
        out[name] = {
          type: String(val.type || 'string'),
          value: val.value
        };
      } else {
        out[name] = {
          type: 'string',
          value: val
        };
      }
    }

    return out;
  };

  const [systemVariables, setSystemVariables] = useState({});

  const [pendingSystemVarType, setPendingSystemVarType] = useState('string');
  const [pendingSystemVarName, setPendingSystemVarName] = useState('');
  const [pendingSystemVarValue, setPendingSystemVarValue] = useState('');
  const [editingSystemVarKey, setEditingSystemVarKey] = useState(null);

  const coerceSystemVarValueByType = (type, rawValue) => {
    const val = rawValue === undefined || rawValue === null ? '' : String(rawValue);
    const tpe = String(type || 'string').toLowerCase();

    if (tpe === 'integer') {
      const n = Number.parseInt(val, 10);
      return Number.isFinite(n) ? n : 0;
    }

    if (tpe === 'double') {
      const n = Number.parseFloat(val);
      return Number.isFinite(n) ? n : 0;
    }

    if (tpe === 'boolean') {
      const normalized = val.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
      // default: fallback to JS truthiness of non-empty string
      return normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined';
    }

    // string / characters (keep as text)
    return val;
  };

  const handleAddSystemVariable = () => {
    const name = String(pendingSystemVarName || '').trim();
    if (!name) return;

    const coercedValue = coerceSystemVarValueByType(pendingSystemVarType, pendingSystemVarValue);

    setSystemVariables(prev => ({
      ...(prev || {}),
      [name]: {
        type: pendingSystemVarType,
        value: coercedValue
      }
    }));

    setPendingSystemVarName('');
    setPendingSystemVarValue('');
    setPendingSystemVarType('string');
  };

  const handleUpdateSystemVariable = () => {
    const name = String(pendingSystemVarName || '').trim();
    if (!name) return;

    if (!Object.prototype.hasOwnProperty.call(systemVariables || {}, name)) return;

    const coercedValue = coerceSystemVarValueByType(pendingSystemVarType, pendingSystemVarValue);

    setSystemVariables(prev => ({
      ...(prev || {}),
      [name]: {
        type: pendingSystemVarType,
        value: coercedValue
      }
    }));

    setPendingSystemVarValue('');
    // لا نعيد pendingSystemVarType إلى string بعد الحفظ، حتى يبقى النوع الذي عدلته
  };

  const handleDeleteSystemVariable = (name) => {
    const key = String(name || '').trim();
    if (!key) return;
    setSystemVariables(prev => {
      const next = { ...(prev || {}) };
      delete next[key];
      return next;
    });
  };




  const [showPassword, setShowPassword] = useState(false);
  const [testCards, setTestCards] = useState(INITIAL_CARDS);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCardId, setCurrentCardId] = useState(null);
  const [liveFrame, setLiveFrame] = useState(null);
  const [isStreamFullscreen, setIsStreamFullscreen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [generatedReportUrl, setGeneratedReportUrl] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [scheduledOrder, setScheduledOrder] = useState([]);
  const [scheduleType, setScheduleType] = useState('once'); // 'once' | 'daily' | 'weekly'
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState('1'); // '0'=Sun, '1'=Mon, ..., '6'=Sat
  const [scheduleTimeZone, setScheduleTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Amman');
  const [scheduleStatus, setScheduleStatus] = useState('idle');
  const scheduleTimerRef = useRef(null);

  // Real-time Console logs
  const [logs, setLogs] = useState([]);
  const consoleEndRef = useRef(null);

  // WebSockets Connection
  const socketRef = useRef(null);

  // Report Modal states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeTab, setActiveTab] = useState('tests');
  const [bugScan, setBugScan] = useState({
    url: 'https://the-internet.herokuapp.com/login',
    username: 'tomsmith',
    password: 'SuperSecretPassword!',
    prompt: 'افحص تسجيل الدخول والروابط والفورمات والأخطاء الظاهرة للمستخدم'
  });
  const [isBugScanRunning, setIsBugScanRunning] = useState(false);
  const [bugScanProgress, setBugScanProgress] = useState('');
  const [bugReport, setBugReport] = useState(null);
  const [reportEmail, setReportEmail] = useState(() => {
    const defaults = {
      senderEmail: '',
      recipientEmail: '',
      subject: 'AetherTest Report',
      body: 'Please find the attached test report.',
      smtpHost: '',
      smtpPort: '587',
      smtpSecure: false,
      smtpUser: '',
      smtpPass: '',
      autoSend: false
    };
    try {
      const saved = localStorage.getItem('aethertest_report_email');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aethertest_report_email', JSON.stringify(reportEmail));
    } catch (e) {
      console.warn('Failed to save reportEmail to localStorage:', e);
    }
  }, [reportEmail]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [shouldAutoSendEmail, setShouldAutoSendEmail] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeModalTitle, setCodeModalTitle] = useState('');
  const [codeModalContent, setCodeModalContent] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('aethertest_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('aethertest_language') || 'ar');
  const t = (key) => UI_TEXT[language][key] || UI_TEXT.en[key] || key;

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('aethertest_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.dataset.language = language;
    localStorage.setItem('aethertest_language', language);
  }, [language]);

  // Auto-scroll logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Connect socket
  useEffect(() => {
    // Connect directly to backend port 5000 on localhost, or fallback to deployed Render backend URL
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (isLocalhost ? 'http://localhost:5000' : 'https://ai-agent-server-03cl.onrender.com');
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      addLog('تم الاتصال بالخادم بنجاح ومستعد لبدء الاختبارات', 'system');
    });

    socket.on('connect_error', (error) => {
      setIsRunning(false);
      console.warn(`WebSocket connect error: ${error.message}`);
    });

    socket.on('disconnect', () => {
      setIsRunning(false);
      addLog('تم قطع الاتصال بالخادم', 'error');
    });

    socket.on('suite-accepted', ({ cardsCount, targetUrl }) => {
      addLog(`السيرفر استلم طلب التشغيل (${cardsCount} كارت) للرابط: ${targetUrl || 'بدون رابط'}`, 'system');
    });

    // Handle WebSocket test runner events
    socket.on('test-start', ({ cardId, cardTitle }) => {
      setCurrentCardId(cardId);
      setTestCards(prev => prev.map(c =>
        c.id === cardId ? { ...c, status: 'running', steps: [], logHistory: [`${language === 'ar' ? 'بدء الاختبار' : 'Test started'}: ${cardTitle}`] } : c
      ));
      addLog(`[بدء الاختبار] 🏁 تشغيل كارت التست: "${cardTitle}"`, 'system');
    });

    socket.on('step-start', ({ cardId, stepIndex, stepText, stepTitle }) => {
      const displayText = stepTitle ? `${stepTitle} • ${stepText}` : stepText;
      addLog(`   👉 خطوة ${stepIndex + 1}: ${displayText}`, 'step');

      setTestCards(prev => prev.map(c => {
        if (c.id === cardId) {
          const updatedSteps = [...c.steps];
          updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], title: stepTitle || '', text: stepText, status: 'running' };
          const logHistory = Array.isArray(c.logHistory) ? [...c.logHistory, `${language === 'ar' ? 'بدء خطوة' : 'Step started'} ${stepIndex + 1}: ${displayText}`] : [`${language === 'ar' ? 'بدء خطوة' : 'Step started'} ${stepIndex + 1}: ${displayText}`];
          return { ...c, steps: updatedSteps, logHistory };
        }
        return c;
      }));
    });

    socket.on('step-success', ({ cardId, stepIndex, duration }) => {
      addLog(`   ✅ نجحت الخطوة (المدة: ${duration} ثانية)`, 'success');

      setTestCards(prev => prev.map(c => {
        if (c.id === cardId) {
          const updatedSteps = [...c.steps];
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            status: 'passed',
            duration
          };
          const titlePart = updatedSteps[stepIndex]?.title ? `${updatedSteps[stepIndex].title} • ` : '';
          const logHistory = Array.isArray(c.logHistory) ? [...c.logHistory, `${language === 'ar' ? 'نجحت خطوة' : 'Step passed'} ${stepIndex + 1} (${duration}${t('secondsSuffix')}): ${titlePart}${updatedSteps[stepIndex]?.text || ''}`] : [`${language === 'ar' ? 'نجحت خطوة' : 'Step passed'} ${stepIndex + 1} (${duration}${t('secondsSuffix')}): ${titlePart}${updatedSteps[stepIndex]?.text || ''}`];
          return { ...c, steps: updatedSteps, logHistory };
        }
        return c;
      }));
    });

    socket.on('step-failure', ({ cardId, stepIndex, error, duration, screenshotUrl }) => {
      addLog(`   ❌ فشلت الخطوة: ${error} (المدة: ${duration} ثانية)`, 'error');

      setTestCards(prev => prev.map(c => {
        if (c.id === cardId) {
          const updatedSteps = [...c.steps];
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            status: 'failed',
            error,
            duration,
            screenshotUrl
          };
          const titlePart = updatedSteps[stepIndex]?.title ? `${updatedSteps[stepIndex].title} • ` : '';
          const logHistory = Array.isArray(c.logHistory) ? [...c.logHistory, `${language === 'ar' ? 'فشلت خطوة' : 'Step failed'} ${stepIndex + 1}: ${titlePart}${error}`] : [`${language === 'ar' ? 'فشلت خطوة' : 'Step failed'} ${stepIndex + 1}: ${titlePart}${error}`];
          return { ...c, steps: updatedSteps, status: 'failed', logHistory };
        }
        return c;
      }));
    });

    socket.on('test-end', ({ cardId, status, videoUrl }) => {
      setTestCards(prev => prev.map(c => {
        if (c.id === cardId) {
          const logHistory = Array.isArray(c.logHistory) ? [...c.logHistory, `${language === 'ar' ? 'انتهى الاختبار' : 'Test ended'}: ${status}`] : [`${language === 'ar' ? 'انتهى الاختبار' : 'Test ended'}: ${status}`];
          return { ...c, status, videoUrl: videoUrl || c.videoUrl, logHistory };
        }
        return c;
      }));
      const statusIcon = status === 'passed' ? '🎉 نجح' : '⚠️ فشل';
      addLog(`[نهاية الاختبار] ${statusIcon} اختبار الكارت بنجاح`, status === 'passed' ? 'success' : 'error');
    });

    socket.on('screencast-frame', ({ frameData }) => {
      if (frameData) {
        setLiveFrame(`data:image/jpeg;base64,${frameData}`);
      }
    });

    socket.on('global-error', ({ error }) => {
      setIsRunning(false);
      setCurrentCardId(null);
      addLog(`🚨 خطأ عام في المتصفح التلقائي: ${error}`, 'error');
    });

    socket.on('variable-updated', ({ name, value, type }) => {
      setSystemVariables(prev => {
        const current = (prev || {})[name];
        const nextType = type || current?.type || 'string';

        return {
          ...(prev || {}),
          [name]: { type: nextType, value }
        };
      });
      addLog(`[Variables] تم حفظ "${value}" في المتغير "${name}"`, 'success');
    });

    socket.on('all-tests-end', () => {
      setIsRunning(false);
      setCurrentCardId(null);
      addLog('🏁 تم الانتهاء من تشغيل جميع الاختبارات بنجاح.', 'system');

      // Automatically pop open the report modal at the end of the suite
      setIsReportOpen(true);

      // Calculate overall stats to decide if confetti is shown
      setTestCards(prev => {
        const total = prev.length;
        const passed = prev.filter(c => c.status === 'passed').length;
        if (passed === total && total > 0) {
          triggerConfetti();
        }
        return prev;
      });

      if (reportEmail.autoSend) {
        setShouldAutoSendEmail(true);
      }
    });

    socket.on('bug-scan-start', ({ targetUrl }) => {
      setIsBugScanRunning(true);
      setBugReport(null);
      setBugScanProgress(`بدء فحص البجز على: ${targetUrl}`);
      addLog(`[Bug Finder] بدء فحص البجز على ${targetUrl}`, 'system');
    });

    socket.on('bug-scan-page', ({ url, index, maxPages }) => {
      setBugScanProgress(`فحص الصفحة ${index}/${maxPages}: ${url}`);
      addLog(`[Bug Finder] فحص صفحة ${index}/${maxPages}: ${url}`, 'step');
    });

    socket.on('bug-scan-scenario-step', ({ step, index, total }) => {
      setBugScanProgress(`تنفيذ سيناريو البرومبت ${index}/${total}: ${step}`);
      addLog(`[Bug Finder] سيناريو ${index}/${total}: ${step}`, 'step');
    });

    socket.on('bug-found', ({ bug }) => {
      addLog(`[Bug Finder] ${bug.severity.toUpperCase()} - ${bug.title}`, bug.severity === 'critical' || bug.severity === 'high' ? 'error' : 'info');
    });

    socket.on('bug-scan-end', ({ report }) => {
      setIsBugScanRunning(false);
      setBugReport(report);
      setBugScanProgress(`انتهى الفحص: ${report.summary?.totalBugs || 0} بجز على ${report.summary?.scannedPages || 0} صفحات`);
      addLog(`[Bug Finder] انتهى الفحص وتم توليد التقرير`, 'success');
    });

    socket.on('bug-scan-error', ({ error }) => {
      setIsBugScanRunning(false);
      setBugScanProgress('');
      addLog(`[Bug Finder] فشل الفحص: ${error}`, 'error');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Helper log functions
  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type, time }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  // Project Management Actions
  useEffect(() => {
    loadSavedProjectsList();
  }, []);

  const loadSavedProjectsList = () => {
    const saved = JSON.parse(localStorage.getItem('aethertest_projects') || '{}');
    setSavedProjects(Object.keys(saved));
  };

  const saveProjectToLocal = () => {
    if (!projectName.trim()) {
      alert('يرجى إدخال اسم المشروع أولاً لحفظه');
      return;
    }
    const saved = JSON.parse(localStorage.getItem('aethertest_projects') || '{}');
    saved[projectName] = { credentials, testCards, systemVariables };
    localStorage.setItem('aethertest_projects', JSON.stringify(saved));
    loadSavedProjectsList();
    addLog(`💾 تم حفظ مشروع "${projectName}" محلياً في ذاكرة المتصفح`, 'success');
  };

  const loadProject = (name) => {
    if (!name) return;
    const saved = JSON.parse(localStorage.getItem('aethertest_projects') || '{}');
    const proj = saved[name];
    if (proj) {
      setProjectName(name);
      setCredentials(proj.credentials);
      setSystemVariables(proj.systemVariables || {});
      setTestCards(proj.testCards.map(c => ({ ...c, status: 'idle', steps: [], logHistory: [], videoUrl: '', recordVideo: Boolean(c.recordVideo) })));
      addLog(`📂 تم تحميل مشروع "${name}" من الذاكرة المحلية`, 'system');
    }
  };

  const deleteProjectFromLocal = (name) => {
    if (!name) return;
    if (confirm(`هل أنت متأكد من حذف مشروع "${name}" من الذاكرة المحلية؟`)) {
      const saved = JSON.parse(localStorage.getItem('aethertest_projects') || '{}');
      delete saved[name];
      localStorage.setItem('aethertest_projects', JSON.stringify(saved));
      loadSavedProjectsList();
      if (projectName === name) {
        setProjectName(t('newProjectName'));
      }
      addLog(`🗑️ تم حذف مشروع "${name}" من الذاكرة المحلية`, 'system');
    }
  };

  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      projectName,
      credentials,
      systemVariables,
      testCards
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${projectName || 'system'}-aethertest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog(`📤 تم تصدير مشروع "${projectName}" كملف JSON بنجاح.`, 'success');
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = String(e.target.result || '');
      try {
        const imported = JSON.parse(rawText);
        if (imported.projectName && imported.credentials && imported.testCards) {
          setProjectName(imported.projectName);
          setCredentials(imported.credentials);
          setSystemVariables(imported.systemVariables || {});

          console.log('[Import] imported.testCards preview (raw):', imported.testCards?.slice?.(0, 2));
          setTestCards(
            imported.testCards.map((c, idx) => {
              const titleFromKnownFields =
                (typeof c?.title === 'string' && c.title.trim())
                  ? c.title
                  : (typeof c?.testTitle === 'string' && c.testTitle.trim())
                    ? c.testTitle
                    : (typeof c?.test_title === 'string' && c.test_title.trim())
                      ? c.test_title
                      : (typeof c?.عنوان === 'string' && c.عنوان.trim())
                        ? c.عنوان
                        : (typeof c?.testTitleAr === 'string' && c.testTitleAr.trim())
                          ? c.testTitleAr
                          : (typeof c?.test_title_ar === 'string' && c.test_title_ar.trim())
                            ? c.test_title_ar
                            : (typeof c?.name === 'string' && c.name.trim())
                              ? c.name
                              : '';

              const nextTitle = titleFromKnownFields || c?.title || `Test #${idx + 1}`;
              if (idx < 2) {
                console.log('[Import] card idx', idx, 'raw title=', c?.title, 'resolved title=', nextTitle);
              }

              return {
                ...c,
                // لا نخرب عنوان الاختبار ولا قيم الحقول اللي بتتحكم بالـ UI
                title: nextTitle,

                // إعادة تهيئة حالة التشغيل فقط
                status: 'idle',

                // إذا ملف الاستيراد يحتوي خطوات/سجل، ابقِ قيمها (حتى الشيك بوكسات بتبقى عبر recordVideo/retryEnabled)
                steps: Array.isArray(c.steps) ? c.steps : [],
                logHistory: Array.isArray(c.logHistory) ? c.logHistory : [],
                videoUrl: c.videoUrl || '',
                recordVideo: Boolean(c.recordVideo),

                builderSteps: Array.isArray(c.builderSteps) ? c.builderSteps : undefined
              };
            })
          );

          addLog(`📥 تم استيراد مشروع "${imported.projectName}" بنجاح!`, 'success');
          return;
        }
      } catch (jsonError) {
        // fallback to Playwright code parser
      }

      const parsedCards = parsePlaywrightCodeToCards(rawText, file.name);
      if (parsedCards.length > 0) {
        setProjectName(file.name ? `Imported ${file.name}` : t('newProjectName'));
        setTestCards(parsedCards);
        addLog(`📥 تم استيراد كود Playwright كـ ${parsedCards.length} كارت اختبار.`, 'success');
      } else {
        addLog(`⚠️ الملف غير صالح أو لا يحتوي على بنية مشروع AetherTest / كود Playwright قابل للاستيراد.`, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleNewProject = () => {
    setProjectName(t('newProjectName'));
    setCredentials({
      url: 'https://the-internet.herokuapp.com/login',
      username: '',
      password: '',
      autoLogin: true
    });
    setTestCards([]);
    addLog('➕ تم بدء مشروع جديد فارغ بالكامل.', 'system');
  };

  const getBuilderStepsForCard = (card) => {
    if (Array.isArray(card.builderSteps) && card.builderSteps.length > 0) {
      return card.builderSteps;
    }
    if (card.prompt) {
      return card.prompt.split(/\r?\n/).filter(Boolean).map(parsePromptLineToBuilderStep);
    }
    return [createBuilderStep()];
  };

  const handleSyncCardPrompt = (card) => {
    const builderSteps = getBuilderStepsForCard(card);
    return buildPromptFromBuilderSteps(builderSteps);
  };

  const handleAddStep = (cardId) => {
    setTestCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const builderSteps = getBuilderStepsForCard(card);
      const updatedSteps = [...builderSteps, createBuilderStep()];
      return {
        ...card,
        builderSteps: updatedSteps,
        prompt: buildPromptFromBuilderSteps(updatedSteps)
      };
    }));
  };

  const handleUpdateStep = (cardId, stepId, field, value) => {
    setTestCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const builderSteps = getBuilderStepsForCard(card);
      const updatedSteps = builderSteps.map(step => step.id === stepId ? { ...step, [field]: value } : step);
      return {
        ...card,
        builderSteps: updatedSteps,
        prompt: buildPromptFromBuilderSteps(updatedSteps)
      };
    }));
  };

  const handleMoveStep = (cardId, stepId, direction) => {
    setTestCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const builderSteps = getBuilderStepsForCard(card);
      const index = builderSteps.findIndex(step => step.id === stepId);
      if (index === -1) return card;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= builderSteps.length) return card;
      const reordered = [...builderSteps];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(nextIndex, 0, moved);
      return {
        ...card,
        builderSteps: reordered,
        prompt: buildPromptFromBuilderSteps(reordered)
      };
    }));
  };

  const handleRemoveStep = (cardId, stepId) => {
    setTestCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const builderSteps = getBuilderStepsForCard(card);
      const updatedSteps = builderSteps.filter(step => step.id !== stepId);
      return {
        ...card,
        builderSteps: updatedSteps.length > 0 ? updatedSteps : [createBuilderStep()],
        prompt: buildPromptFromBuilderSteps(updatedSteps.length > 0 ? updatedSteps : [createBuilderStep()])
      };
    }));
  };

  // Card Management Actions
  const handleAddCard = (presetPrompt = '') => {
    const newId = `test-${Date.now()}`;
    const defaultSteps = [createBuilderStep()];
    const newCard = {
      id: newId,
      title: '',
      type: 'all',
      prompt: presetPrompt || t('defaultCardPrompt'),
      status: 'idle',
      steps: [],
      logHistory: [],
      recordVideo: false,
      builderSteps: presetPrompt ? presetPrompt.split(/\r?\n/).filter(Boolean).map(parsePromptLineToBuilderStep) : defaultSteps
    };
    setTestCards([...testCards, newCard]);
    addLog(`✨ تم إنشاء كارت اختبار جديد: "${newCard.title}"`, 'system');
  };

  const handleDuplicateCard = (card) => {
    const newCard = {
      ...card,
      id: `test-${Date.now()}`,
      title: `${card.title} (${t('duplicateSuffix')})`,
      status: 'idle',
      steps: [],
      logHistory: [],
      videoUrl: '',
      builderSteps: Array.isArray(card.builderSteps)
        ? card.builderSteps.map((step) => ({ ...step, id: `builder-step-${Date.now()}-${Math.random().toString(16).slice(2)}` }))
        : card.prompt.split(/\r?\n/).filter(Boolean).map(parsePromptLineToBuilderStep)
    };
    setTestCards([...testCards, newCard]);
    addLog(`📋 تم تكرار الكارت: "${card.title}"`, 'system');
  };

  const handleDeleteCard = (id, title) => {
    setTestCards(testCards.filter(c => c.id !== id));
    addLog(`🗑️ تم حذف الكارت: "${title}"`, 'system');
  };

  const handleUpdateCardPrompt = (id, prompt) => {
    setTestCards(testCards.map(c => c.id === id ? { ...c, prompt } : c));
  };

  const handleUpdateCardTitle = (id, title) => {
    setTestCards(testCards.map(c => c.id === id ? { ...c, title } : c));
  };

  const handleToggleRecordVideo = (id, enabled) => {
    setTestCards(testCards.map(c => c.id === id ? { ...c, recordVideo: enabled, videoUrl: enabled ? c.videoUrl : '' } : c));
  };

  const handleToggleRetry = (id, enabled) => {
    setTestCards(testCards.map(c => {
      if (c.id !== id) return c;
      const next = {
        ...c,
        retryEnabled: Boolean(enabled)
      };
      // عند التفعيل نخلي retryCount default = 1 إذا كانت فاضية
      if (enabled) {
        next.retryCount = Math.max(1, parseInt(next.retryCount, 10) || 1);
      } else {
        next.retryCount = 1;
      }
      return next;
    }));
  };

  const handleChangeRetryCount = (id, value) => {
    setTestCards(testCards.map(c => {
      if (c.id !== id) return c;
      const n = Math.max(1, parseInt(value, 10) || 1);
      return { ...c, retryCount: n, retryEnabled: Boolean(c.retryEnabled ?? n > 1) };
    }));
  };

  const buildReportHtml = () => {
    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const rows = testCards.map((card, cardIndex) => {
      const stepRows = (card.steps || []).map((step, stepIndex) => `
            <tr>
              <td>${cardIndex + 1}.${stepIndex + 1}</td>
              <td>${escapeHtml(step.title || step.text || '')}</td>
              <td>${escapeHtml(step.status || '')}</td>
              <td>${escapeHtml(step.duration ? `${step.duration}s` : '')}</td>
            </tr>
          `).join('');

      return `
          <section class="report-card">
            <h3>${escapeHtml(card.title || `Card ${cardIndex + 1}`)} <span class="badge ${card.status}">${escapeHtml(card.status || '')}</span></h3>
            <p><strong>Record video:</strong> ${card.recordVideo ? 'Yes' : 'No'}</p>
            ${card.videoUrl ? `<p><a href="${escapeHtml(card.videoUrl)}" target="_blank">Open video</a></p>` : ''}
            <table>
              <thead>
                <tr><th>Step</th><th>Description</th><th>Status</th><th>Duration</th></tr>
              </thead>
              <tbody>
                ${stepRows || '<tr><td colspan="4">No steps recorded</td></tr>'}
              </tbody>
            </table>
          </section>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="${language === 'ar' ? 'ar' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AetherTest Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 1rem; background: #f4f5f7; color: #111; }
    .report-container { max-width: 1000px; margin: auto; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 18px 60px rgba(15,23,42,0.08); }
    h1, h2, h3 { margin: 0 0 0.5rem 0; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 1rem; margin-bottom: 1rem; }
    .meta-item { background: #f7fafc; padding: 1rem; border-radius: 10px; }
    .statistics { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .stat-card { flex: 1 1 160px; background: #eef2ff; padding: 1rem; border-radius: 10px; text-align: center; }
    .stat-card.success { background: #ecfdf5; }
    .stat-card.danger { background: #fef2f2; }
    .report-card { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.85rem; }
    .badge.passed { background: #dcfce7; color: #166534; }
    .badge.failed { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="report-container">
    <h1>AetherTest Report</h1>
    <div class="meta-grid">
      <div class="meta-item"><strong>Project</strong><div>${escapeHtml(projectName)}</div></div>
      <div class="meta-item"><strong>Target URL</strong><div>${escapeHtml(credentials.url)}</div></div>
      <div class="meta-item"><strong>Username</strong><div>${escapeHtml(credentials.username)}</div></div>
      <div class="meta-item"><strong>Auto-login</strong><div>${credentials.autoLogin ? 'Yes' : 'No'}</div></div>
    </div>
    <div class="statistics">
      <div class="stat-card"><strong>Total cards</strong><div>${totalTests}</div></div>
      <div class="stat-card success"><strong>Passed</strong><div>${passedTests}</div></div>
      <div class="stat-card danger"><strong>Failed</strong><div>${failedTests}</div></div>
      <div class="stat-card"><strong>Pass rate</strong><div>${passRate}%</div></div>
    </div>
    ${rows}
  </div>
</body>
</html>`;
  };

  const downloadReportHtml = () => {
    const html = buildReportHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectName || 'aethertest'}-report.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  // محرك التحليل الذكي: يقرأ البرومبت ويحوّله إلى builderSteps مهيكلة
  const handleSmartParse = (cardId) => {
    setTestCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;
      const prompt = card.prompt || '';
      if (!prompt.trim()) return card;
      const parsed = parseFullPromptToBuilderSteps(prompt);
      if (parsed.length === 0) return card;
      addLog(`🧠 تم تحليل برومبت الكارد "${card.title}" إلى ${parsed.length} خطوات مهيكلة بنجاح`, 'success');
      return {
        ...card,
        builderSteps: parsed,
        prompt: buildPromptFromBuilderSteps(parsed)
      };
    }));
  };

  const normalizeVariableName = (name) => {
    return String(name || '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^([0-9])/, '_$1')
      .toUpperCase() || 'VAR';
  };

  const escapeStringForCode = (value) => {
    const raw = String(value ?? '');
    return `'${raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')}'`;
  };

  const resolvePlaywrightValue = (raw) => {
    const text = String(raw || '').trim();
    const variableMatch = text.match(/^\{([^}]+)\}$/);
    if (variableMatch) {
      return normalizeVariableName(variableMatch[1]);
    }
    return escapeStringForCode(text);
  };

  const buildLocatorForStep = (selectorType, target) => {
    const raw = String(target || '').trim();
    if (!raw) return null;
    const normalized = raw.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    switch (selectorType) {
      case 'id': return `'#${normalized}'`;
      case 'class': return `'.${normalized.split(/\s+/).join('.')}'`;
      case 'aria': return `"[aria-label='${normalized}']"`;
      case 'css': return `\`${normalized}\``;
      case 'xpath': return `\`xpath=${normalized}\``;
      case 'text': return `\`text=${normalized}\``;
      case 'name': return `"[name='${normalized}']"`;
      case 'data-test': return `"[data-test='${normalized}']"`;
      case 'data-testid': return `"[data-testid='${normalized}']"`;
      case 'goal':
      default:
        return `\`text=${normalized}\``;
    }
  };

  const buildStepCode = (step) => {
    const selector = buildLocatorForStep(step.selector, step.target);
    const action = String(step.action || '').toLowerCase();
    const valueExpression = resolvePlaywrightValue(step.value || step.extraValue || step.target || '');

    switch (action) {
      case 'navigate':
        return '  await page.goto(TARGET_URL);\n';
      case 'click':
        return selector ? `  await page.click(${selector});\n` : `  // TODO: click ${escapeStringForCode(step.target)}\n`;
      case 'type':
        return selector ? `  await page.fill(${selector}, ${valueExpression});\n` : `  // TODO: type ${valueExpression} into unknown locator\n`;
      case 'scroll':
        if (!selector) return '  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));\n';
        if (step.target?.toLowerCase?.() === 'top') return '  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));\n';
        return `  await page.locator(${selector}).scrollIntoViewIfNeeded();\n`;
      case 'assertion':
        if (!selector) return `  // TODO: assert ${escapeStringForCode(step.value || step.target)}\n`;
        if (step.assertionType === 'element_disabled') return `  await expect(page.locator(${selector})).toBeDisabled();\n`;
        if (step.assertionType === 'enabled') return `  await expect(page.locator(${selector})).toBeEnabled();\n`;
        if (step.assertionType === 'element_visibility' || step.assertionType === 'visible') return `  await expect(page.locator(${selector})).toBeVisible();\n`;
        return `  await expect(page.locator(${selector})).toHaveText(${valueExpression});\n`;
      case 'wait':
        if (step.waitType === 'element' && selector) return `  await page.locator(${selector}).waitFor({ state: 'visible', timeout: 8000 });\n`;
        return `  await page.waitForTimeout(${parseInt(step.value, 10) || 3000});\n`;
      default:
        return `  // TODO: action ${action} on ${escapeStringForCode(step.target || step.value)}\n`;
    }
  };

  const buildCardPlaywrightCode = (card, index, useGlobalBeforeEach = false) => {
    const steps = getBuilderStepsForCard(card);
    const title = String(card.title || `Card ${index + 1}`).replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
    const lines = [];
    const hasNavigate = steps.some(step => String(step.action || '').toLowerCase() === 'navigate');
    if (card.type) {
      lines.push(`  // Test type: ${card.type}`);
    }

    if (!useGlobalBeforeEach && !hasNavigate && credentials.url) {
      lines.push('  await page.goto(TARGET_URL);');
    }

    steps.forEach((step) => {
      lines.push(buildStepCode(step).trimEnd());
    });

    if (lines.length === 0) {
      lines.push('  // This test has no structured steps yet.');
    }

    return `test('${title}', async ({ page }) => {\n${lines.map(line => line.startsWith('  ') ? line : `  ${line}`).join('\n')}\n});\n`;
  };

  const buildAllCardsPlaywrightCode = () => {
    const variableLines = Object.entries(systemVariables || {}).map(([key, value]) => {
      const constName = normalizeVariableName(key);
      const varValue = (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'value')) ? value.value : value;
      return `const ${constName} = ${escapeStringForCode(varValue)};`;
    });

    const headerLines = [
      "import { test, expect } from '@playwright/test';",
      '',
      `const TARGET_URL = ${escapeStringForCode(credentials.url)};`,
      `const USERNAME = ${escapeStringForCode(credentials.username)};`,
      `const PASSWORD = ${escapeStringForCode(credentials.password)};`,
      ...variableLines,
      '',
      `test.describe('AetherTest suite', () => {`
    ];

    const shouldGenerateBeforeEach = Boolean(credentials.url);
    const beforeEachLines = [];
    if (shouldGenerateBeforeEach) {
      beforeEachLines.push('  test.beforeEach(async ({ page }) => {');
      beforeEachLines.push('    await page.goto(TARGET_URL);');
      if (credentials.username || credentials.password) {
        beforeEachLines.push('    await page.getByLabel(/username|email/i).fill(USERNAME);');
        beforeEachLines.push('    await page.getByLabel(/password/i).fill(PASSWORD);');
        beforeEachLines.push('    await page.getByRole(\'button\', { name: /login|sign in|تسجيل دخول|دخول/i }).click();');
      }
      beforeEachLines.push('  });');
    }

    const bodyLines = [
      ...beforeEachLines,
      ...testCards.map((card, index) => buildCardPlaywrightCode(card, index, shouldGenerateBeforeEach))
    ];

    return `${headerLines.join('\n')}\n${bodyLines.join('\n')}\n});\n`;
  };

  const showCodeModal = (title, code) => {
    setCodeModalTitle(title);
    setCodeModalContent(code);
    setCodeModalOpen(true);
  };

  const copyCode = (code) => {
    if (!navigator.clipboard) {
      addLog('⚠️ المتصفح لا يدعم نسخ الكود تلقائياً.', 'error');
      return;
    }
    navigator.clipboard.writeText(code)
      .then(() => addLog('✅ تم نسخ الكود إلى الحافظة.', 'success'))
      .catch(() => addLog('🚨 فشل نسخ الكود إلى الحافظة.', 'error'));
  };

  const buildCodeHeaderComments = () => {
    const lines = [
      '// ## البيانات والمحددات العامة للموقع المستهدف',
      `// TARGET_URL = ${credentials.url}`,
      `// USERNAME = ${credentials.username}`,
      `// PASSWORD = ${credentials.password}`,
      ''
    ];
    return lines.join('\n');
  };

  const getCardCode = (card, index) => {
    const header = buildCodeHeaderComments();
    return `${header}${buildCardPlaywrightCode(card, index)}`;
  };

  const getAllCode = () => {
    const header = buildCodeHeaderComments();
    return `${header}${buildAllCardsPlaywrightCode()}`;
  };

  const resetAllStatuses = () => {
    setIsRunning(false);
    setCurrentCardId(null);
    setLiveFrame(null);
    setTestCards(testCards.map(c => ({ ...c, status: 'idle', steps: [], logHistory: [], videoUrl: '' })));
    addLog('🔄 تم تصفير نتائج الاختبارات السابقة وإعادة الجاهزية.', 'system');
  };

  const getSelectedScheduledCards = () => {
    return scheduledOrder
      .map(id => testCards.find(card => card.id === id))
      .filter(Boolean);
  };

  const computeUtcTimestampForZone = (year, month, day, hour, minute, zone) => {
    const formatForZone = (ts) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).formatToParts(new Date(ts));
      const yearPart = parts.find(p => p.type === 'year')?.value;
      const monthPart = parts.find(p => p.type === 'month')?.value;
      const dayPart = parts.find(p => p.type === 'day')?.value;
      const hourPart = parts.find(p => p.type === 'hour')?.value;
      const minutePart = parts.find(p => p.type === 'minute')?.value;
      const secondPart = parts.find(p => p.type === 'second')?.value;
      return `${yearPart}-${monthPart}-${dayPart} ${hourPart}:${minutePart}:${secondPart}`;
    };

    const desired = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    let low = Date.UTC(year, month - 1, day, hour, minute) - 36e5 * 36;
    let high = Date.UTC(year, month - 1, day, hour, minute) + 36e5 * 36;
    let best = null;

    while (high - low > 500) {
      const mid = Math.floor((low + high) / 2);
      const formatted = formatForZone(mid);
      if (formatted < desired) {
        low = mid;
      } else {
        high = mid;
      }
      best = mid;
    }

    return best || high;
  };

  const getNowZoneParts = (zone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(new Date());
    return {
      year: parseInt(parts.find(p => p.type === 'year')?.value, 10),
      month: parseInt(parts.find(p => p.type === 'month')?.value, 10),
      day: parseInt(parts.find(p => p.type === 'day')?.value, 10),
      hour: parseInt(parts.find(p => p.type === 'hour')?.value, 10),
      minute: parseInt(parts.find(p => p.type === 'minute')?.value, 10)
    };
  };

  const getDayOfWeekForZone = (ts, timeZone) => {
    const dayStr = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(ts));
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[dayStr] ?? 0;
  };

  const getScheduledTimestamp = () => {
    if (scheduleType === 'once') {
      if (!scheduleDateTime) return null;
      const [date, time] = scheduleDateTime.split('T');
      if (!date || !time) return null;
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);
      if (!year || !month || !day || hour === undefined || minute === undefined) return null;
      return computeUtcTimestampForZone(year, month, day, hour, minute, scheduleTimeZone);
    }

    if (scheduleType === 'daily') {
      if (!scheduleTime) return null;
      const [hour, minute] = scheduleTime.split(':').map(Number);
      if (hour === undefined || minute === undefined) return null;

      const nowParts = getNowZoneParts(scheduleTimeZone);
      let targetTs = computeUtcTimestampForZone(nowParts.year, nowParts.month, nowParts.day, hour, minute, scheduleTimeZone);
      if (targetTs <= Date.now() + 1000) {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const tomParts = new Intl.DateTimeFormat('en-US', {
          timeZone: scheduleTimeZone,
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(tomorrow);
        const year = parseInt(tomParts.find(p => p.type === 'year')?.value, 10);
        const month = parseInt(tomParts.find(p => p.type === 'month')?.value, 10);
        const day = parseInt(tomParts.find(p => p.type === 'day')?.value, 10);
        targetTs = computeUtcTimestampForZone(year, month, day, hour, minute, scheduleTimeZone);
        if (targetTs <= Date.now() + 1000) {
          targetTs += 24 * 60 * 60 * 1000;
        }
      }
      return targetTs;
    }

    if (scheduleType === 'weekly') {
      if (!scheduleTime) return null;
      const [hour, minute] = scheduleTime.split(':').map(Number);
      const targetDay = parseInt(scheduleDayOfWeek, 10);
      if (hour === undefined || minute === undefined || isNaN(targetDay)) return null;

      for (let offset = 0; offset < 14; offset++) {
        const checkDate = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: scheduleTimeZone,
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(checkDate);
        const year = parseInt(parts.find(p => p.type === 'year')?.value, 10);
        const month = parseInt(parts.find(p => p.type === 'month')?.value, 10);
        const day = parseInt(parts.find(p => p.type === 'day')?.value, 10);

        const ts = computeUtcTimestampForZone(year, month, day, hour, minute, scheduleTimeZone);
        const dayOfWeek = getDayOfWeekForZone(ts, scheduleTimeZone);
        if (dayOfWeek === targetDay && ts > Date.now() + 1000) {
          return ts;
        }
      }
    }

    return null;
  };

  const rawTimezones = useMemo(() => {
    return typeof Intl === 'object' && typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['UTC', 'Europe/London', 'America/New_York', 'Asia/Amman', 'Asia/Riyadh', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo'];
  }, []);

  const FEATURED_TIMEZONES = useMemo(() => [
    'Asia/Amman',        // 🇯🇴 الأردن - عمان / Jordan - Amman
    'Asia/Riyadh',       // 🇸🇦 السعودية - الرياض / Saudi Arabia - Riyadh
    'Africa/Cairo',      // 🇪🇬 مصر - القاهرة / Egypt - Cairo
    'Asia/Dubai',        // 🇦🇪 الإمارات - دبي / UAE - Dubai
    'Asia/Doha',         // 🇶🇦 قطر - الدوحة / Qatar - Doha
    'Asia/Kuwait',       // 🇰🇼 الكويت / Kuwait
    'Asia/Bahrain',      // 🇧🇭 البحرين - المنامة / Bahrain - Manama
    'Asia/Muscat',       // 🇴🇲 عُمان - مسقط / Oman - Muscat
    'Asia/Baghdad',      // 🇮🇶 العراق - بغداد / Iraq - Baghdad
    'Asia/Beirut',       // 🇱🇧 لبنان - بيروت / Lebanon - Beirut
    'Asia/Gaza',         // 🇵🇸 فلسطين - غزة / Palestine - Gaza
    'Asia/Jerusalem',    // 🇵🇸 فلسطين - القدس / Palestine - Jerusalem
    'Asia/Damascus',     // 🇸🇾 سوريا - دمشق / Syria - Damascus
    'Asia/Aden',         // 🇾🇪 اليمن - عدن / Yemen - Aden
    'Africa/Khartoum',   // 🇸🇩 السودان - الخرطوم / Sudan - Khartoum
    'Africa/Tunis',      // 🇹🇳 تونس / Tunisia - Tunis
    'Africa/Casablanca', // 🇲🇦 المغرب - الدار البيضاء / Morocco - Casablanca
    'Africa/Algiers',    // 🇩🇿 الجزائر / Algeria - Algiers
    'Africa/Tripoli',    // 🇱🇾 ليبيا - طرابلس / Libya - Tripoli
    'Europe/Istanbul',   // 🇹🇷 تركيا - إسطنبول / Turkey - Istanbul
    'Europe/London',     // 🇬🇧 بريطانيا - لندن / UK - London
    'America/New_York'   // 🇺🇸 أمريكا - نيويورك / USA - New York
  ], []);

  const CITY_COUNTRY_NAMES = {
    Amman: { flag: '🇯🇴', countryAr: 'الأردن', countryEn: 'Jordan', city: 'عمان / Amman' },
    Riyadh: { flag: '🇸🇦', countryAr: 'السعودية', countryEn: 'Saudi Arabia', city: 'الرياض / Riyadh' },
    Cairo: { flag: '🇪🇬', countryAr: 'مصر', countryEn: 'Egypt', city: 'القاهرة / Cairo' },
    Dubai: { flag: '🇦🇪', countryAr: 'الإمارات', countryEn: 'UAE', city: 'دبي / Dubai' },
    Doha: { flag: '🇶🇦', countryAr: 'قطر', countryEn: 'Qatar', city: 'الدوحة / Doha' },
    Kuwait: { flag: '🇰🇼', countryAr: 'الكويت', countryEn: 'Kuwait', city: 'الكويت / Kuwait' },
    Bahrain: { flag: '🇧🇭', countryAr: 'البحرين', countryEn: 'Bahrain', city: 'المنامة / Manama' },
    Manama: { flag: '🇧🇭', countryAr: 'البحرين', countryEn: 'Bahrain', city: 'المنامة / Manama' },
    Muscat: { flag: '🇴🇲', countryAr: 'عُمان', countryEn: 'Oman', city: 'مسقط / Muscat' },
    Baghdad: { flag: '🇮🇶', countryAr: 'العراق', countryEn: 'Iraq', city: 'بغداد / Baghdad' },
    Beirut: { flag: '🇱🇧', countryAr: 'لبنان', countryEn: 'Lebanon', city: 'بيروت / Beirut' },
    Gaza: { flag: '🇵🇸', countryAr: 'فلسطين', countryEn: 'Palestine', city: 'غزة / Gaza' },
    Hebron: { flag: '🇵🇸', countryAr: 'فلسطين', countryEn: 'Palestine', city: 'الخليل / Hebron' },
    Jerusalem: { flag: '🇵🇸', countryAr: 'فلسطين', countryEn: 'Palestine', city: 'القدس / Jerusalem' },
    Damascus: { flag: '🇸🇾', countryAr: 'سوريا', countryEn: 'Syria', city: 'دمشق / Damascus' },
    Aden: { flag: '🇾🇪', countryAr: 'اليمن', countryEn: 'Yemen', city: 'عدن / Aden' },
    Sanaa: { flag: '🇾🇪', countryAr: 'اليمن', countryEn: 'Yemen', city: 'صنعاء / Sanaa' },
    Khartoum: { flag: '🇸🇩', countryAr: 'السودان', countryEn: 'Sudan', city: 'الخرطوم / Khartoum' },
    Tunis: { flag: '🇹🇳', countryAr: 'تونس', countryEn: 'Tunisia', city: 'تونس / Tunis' },
    Casablanca: { flag: '🇲🇦', countryAr: 'المغرب', countryEn: 'Morocco', city: 'الدار البيضاء / Casablanca' },
    Rabat: { flag: '🇲🇦', countryAr: 'المغرب', countryEn: 'Morocco', city: 'الرباط / Rabat' },
    Algiers: { flag: '🇩🇿', countryAr: 'الجزائر', countryEn: 'Algeria', city: 'الجزائر / Algiers' },
    Tripoli: { flag: '🇱🇾', countryAr: 'ليبيا', countryEn: 'Libya', city: 'طرابلس / Tripoli' },
    Mogadishu: { flag: '🇸🇴', countryAr: 'الصومال', countryEn: 'Somalia', city: 'مقديشو / Mogadishu' },
    Istanbul: { flag: '🇹🇷', countryAr: 'تركيا', countryEn: 'Turkey', city: 'إسطنبول / Istanbul' },
    Tehran: { flag: '🇮🇷', countryAr: 'إيران', countryEn: 'Iran', city: 'طهران / Tehran' },
    London: { flag: '🇬🇧', countryAr: 'بريطانيا', countryEn: 'UK', city: 'لندن / London' },
    Paris: { flag: '🇫🇷', countryAr: 'فرنسا', countryEn: 'France', city: 'باريس / Paris' },
    Berlin: { flag: '🇩🇪', countryAr: 'ألمانيا', countryEn: 'Germany', city: 'برلين / Berlin' },
    Rome: { flag: '🇮🇹', countryAr: 'إيطاليا', countryEn: 'Italy', city: 'روما / Rome' },
    Madrid: { flag: '🇪🇸', countryAr: 'إسبانيا', countryEn: 'Spain', city: 'مدريد / Madrid' },
    Moscow: { flag: '🇷🇺', countryAr: 'روسيا', countryEn: 'Russia', city: 'موسكو / Moscow' },
    New_York: { flag: '🇺🇸', countryAr: 'أمريكا', countryEn: 'USA', city: 'نيويورك / New York' },
    Chicago: { flag: '🇺🇸', countryAr: 'أمريكا', countryEn: 'USA', city: 'شيكاغو / Chicago' },
    Los_Angeles: { flag: '🇺🇸', countryAr: 'أمريكا', countryEn: 'USA', city: 'لوس أنجلوس / Los Angeles' },
    Toronto: { flag: '🇨🇦', countryAr: 'كندا', countryEn: 'Canada', city: 'تورونتو / Toronto' },
    Tokyo: { flag: '🇯🇵', countryAr: 'اليابان', countryEn: 'Japan', city: 'طوكيو / Tokyo' },
    Seoul: { flag: '🇰🇷', countryAr: 'كوريا الجنوبية', countryEn: 'South Korea', city: 'سيول / Seoul' },
    Beijing: { flag: '🇨🇳', countryAr: 'الصين', countryEn: 'China', city: 'بكين / Beijing' },
    Shanghai: { flag: '🇨🇳', countryAr: 'الصين', countryEn: 'China', city: 'شانغهاي / Shanghai' },
    Kolkata: { flag: '🇮🇳', countryAr: 'الهند', countryEn: 'India', city: 'كولكاتا / Kolkata' },
    Delhi: { flag: '🇮🇳', countryAr: 'الهند', countryEn: 'India', city: 'دلهي / Delhi' },
    Sydney: { flag: '🇦🇺', countryAr: 'أستراليا', countryEn: 'Australia', city: 'سيدني / Sydney' }
  };

  const getCountryFlagEmoji = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const CITY_COUNTRY_MAP = {
    Amman: 'JO', Riyadh: 'SA', Cairo: 'EG', Dubai: 'AE', Doha: 'QA',
    Kuwait: 'KW', Bahrain: 'BH', Manama: 'BH', Muscat: 'OM', Baghdad: 'IQ',
    Beirut: 'LB', Gaza: 'PS', Hebron: 'PS', Jerusalem: 'PS', Damascus: 'SY',
    Sanaa: 'YE', Khartoum: 'SD', Tunis: 'TN', Casablanca: 'MA', Rabat: 'MA',
    Algiers: 'DZ', Tripoli: 'LY', Mogadishu: 'SO', Istanbul: 'TR', Tehran: 'IR',
    London: 'GB', Paris: 'FR', Berlin: 'DE', Rome: 'IT', Madrid: 'ES',
    Amsterdam: 'NL', Brussels: 'BE', Vienna: 'AT', Zurich: 'CH', Geneva: 'CH',
    Athens: 'GR', Dublin: 'IE', Stockholm: 'SE', Oslo: 'NO', Copenhagen: 'DK',
    Helsinki: 'FI', Warsaw: 'PL', Prague: 'CZ', Budapest: 'HU', Bucharest: 'RO',
    Belgrade: 'RS', Sofia: 'BG', Kiev: 'UA', Kyiv: 'UA', Moscow: 'RU',
    New_York: 'US', Chicago: 'US', Denver: 'US', Los_Angeles: 'US', Phoenix: 'US',
    Detroit: 'US', Indianapolis: 'US', Anchorage: 'US', Honolulu: 'US',
    Toronto: 'CA', Vancouver: 'CA', Montreal: 'CA', Edmonton: 'CA', Winnipeg: 'CA',
    Mexico_City: 'MX', Cancun: 'MX', Monterrey: 'MX', Tijuana: 'MX',
    Sao_Paulo: 'BR', Rio_Branco: 'BR', Manaus: 'BR', Recife: 'BR',
    Buenos_Aires: 'AR', Cordoba: 'AR', Santiago: 'CL', Bogota: 'CO',
    Lima: 'PE', Caracas: 'VE', Montevideo: 'UY', Asuncion: 'PY',
    La_Paz: 'BO', Quito: 'EC', Tokyo: 'JP', Seoul: 'KR',
    Shanghai: 'CN', Urumqi: 'CN', Hong_Kong: 'HK', Taipei: 'TW',
    Singapore: 'SG', Bangkok: 'TH', Jakarta: 'ID', Kuala_Lumpur: 'MY',
    Manila: 'PH', Saigon: 'VN', Ho_Chi_Minh: 'VN', Hanoi: 'VN',
    Kolkata: 'IN', Mumbai: 'IN', Delhi: 'IN', Dhaka: 'BD', Karachi: 'PK',
    Islamabad: 'PK', Tashkent: 'UZ', Almaty: 'KZ', Sydney: 'AU',
    Melbourne: 'AU', Brisbane: 'AU', Perth: 'AU', Adelaide: 'AU',
    Auckland: 'NZ', Fiji: 'FJ', Johannesburg: 'ZA', Lagos: 'NG',
    Nairobi: 'KE', Addis_Ababa: 'ET', Accra: 'GH'
  };

  const formatTimezoneLabel = (zone) => {
    if (!zone) return '';
    if (zone === 'UTC' || zone === 'Etc/UTC') return '🌐 UTC (GMT+0)';
    const parts = zone.split('/');
    const cityKey = parts[parts.length - 1] || zone;
    const cleanName = cityKey.replace(/_/g, ' ');

    let offsetStr = '';
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        timeZoneName: 'shortOffset'
      });
      const partsArr = formatter.formatToParts(new Date());
      const offset = partsArr.find(p => p.type === 'timeZoneName')?.value;
      if (offset) {
        offsetStr = ` (${offset})`;
      }
    } catch { }

    const meta = CITY_COUNTRY_NAMES[cityKey];
    if (meta) {
      const countryStr = language === 'ar' ? `${meta.countryAr} (${meta.countryEn})` : `${meta.countryEn} (${meta.countryAr})`;
      return `${meta.flag} ${countryStr} - ${meta.city}${offsetStr}`;
    }

    const countryCode = CITY_COUNTRY_MAP[cityKey];
    const flag = countryCode ? getCountryFlagEmoji(countryCode) : '🌐';
    return `${flag} ${cleanName}${offsetStr}`.trim();
  };

  const TIMEZONE_OPTIONS = useMemo(() => {
    const featured = FEATURED_TIMEZONES.filter(z => rawTimezones.includes(z));
    const others = rawTimezones.filter(z => !featured.includes(z)).sort((a, b) => {
      const nameA = (a.split('/').pop() || a).replace(/_/g, '');
      const nameB = (b.split('/').pop() || b).replace(/_/g, '');
      return nameA.localeCompare(nameB);
    });
    return [...featured, ...others];
  }, [rawTimezones, FEATURED_TIMEZONES]);

  const clearScheduleTimer = () => {
    if (scheduleTimerRef.current) {
      window.clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (scheduleStatus !== 'scheduled') return;
    const runAt = getScheduledTimestamp();
    if (!runAt) return;

    const delay = runAt - Date.now();
    if (delay <= 0) {
      addLog('⚠️ وقت الجدولة يجب أن يكون في المستقبل.', 'error');
      setScheduleStatus('idle');
      return;
    }

    clearScheduleTimer();
    scheduleTimerRef.current = window.setTimeout(() => {
      const cardsToRun = getSelectedScheduledCards();
      if (!cardsToRun.length) {
        addLog('⚠️ لا يوجد اختبارات مختارة للتشغيل عند الموعد المحدد.', 'error');
        setScheduleStatus('idle');
        return;
      }
      addLog(`⏰ الموعد المحدد وصل. تشغيل ${cardsToRun.length} اختبار الآن.`, 'system');
      setScheduleStatus('running');
      runCards(cardsToRun, language === 'ar' ? 'تشغيل مجدول' : 'scheduled run');

      if (scheduleType === 'once') {
        setScheduleStatus('idle');
      } else {
        setScheduleStatus('scheduled');
        addLog(`🔄 تم إعادة الجدولة التلقائية (${scheduleType === 'daily' ? 'يومي' : 'أسبوعي'}) للتنفيذ القادم.`, 'system');
      }
      scheduleTimerRef.current = null;
    }, delay);

    return () => clearScheduleTimer();
  }, [scheduleStatus, scheduleType, scheduleDateTime, scheduleTime, scheduleDayOfWeek, scheduleTimeZone, scheduledOrder, language]);

  const handleToggleScheduleSelection = (cardId) => {
    setScheduledOrder(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  const handleReorderScheduledCard = (cardId, direction) => {
    setScheduledOrder(prev => {
      const currentIndex = prev.indexOf(cardId);
      if (currentIndex === -1) return prev;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(currentIndex, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const handleScheduleRun = () => {
    const selected = getSelectedScheduledCards();
    if (!selected.length) {
      addLog('⚠️ اختر على الأقل اختباراً واحداً للجدولة.', 'error');
      return;
    }
    const runAt = getScheduledTimestamp();
    if (!runAt || runAt <= Date.now()) {
      addLog('⚠️ حدد تاريخاً ووقتاً صالحاً في المستقبل.', 'error');
      return;
    }
    setScheduleStatus('scheduled');
    addLog(`🗓️ تم جدولة ${selected.length} اختبار ليعمل عند ${new Date(runAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { timeZone: scheduleTimeZone, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (${scheduleTimeZone}).`, 'system');
  };

  const handleRunScheduledNow = () => {
    const selected = getSelectedScheduledCards();
    if (!selected.length) {
      addLog('⚠️ اختر على الأقل اختباراً واحداً للتشغيل الآن.', 'error');
      return;
    }
    clearScheduleTimer();
    setScheduleStatus('running');
    runCards(selected, language === 'ar' ? 'تشغيل مجدول' : 'scheduled run');
    setScheduleStatus('idle');
  };

  const handleCancelSchedule = () => {
    clearScheduleTimer();
    setScheduleStatus('idle');
    addLog('🛑 تم إلغاء الجدولة الحالية.', 'system');
  };

  const getBackendBaseUrl = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return import.meta.env.VITE_BACKEND_URL || (isLocalhost ? 'http://localhost:5000' : 'https://ai-agent-server-03cl.onrender.com');
  };

  const handleGenerateShareableReportLink = async () => {
    setIsGeneratingLink(true);
    setCopiedLink(false);
    try {
      const reportHtml = buildReportHtml();
      const backendUrl = getBackendBaseUrl() || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/generate-report-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportHtml })
      });
      const result = await response.json();
      if (response.ok && result.reportUrl) {
        setGeneratedReportUrl(result.reportUrl);
        addLog('✅ تم توليد رابط التقرير التفاعلي المباشر للمشاركة بنجاح.', 'success');
      } else {
        addLog('🚨 فشل توليد رابط التقرير.', 'error');
      }
    } catch (err) {
      addLog(`🚨 خطأ في توليد رابط التقرير: ${err.message}`, 'error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSendReportEmail = async () => {
    setEmailFeedback(null);
    setEmailPreviewUrl('');

    if (!reportEmail.senderEmail.trim() || !reportEmail.recipientEmail.trim() || !reportEmail.subject.trim()) {
      setEmailFeedback({ type: 'error', message: t('emailValidationError') });
      return;
    }

    const hasUserOrPass = Boolean(String(reportEmail.smtpUser || '').trim() || String(reportEmail.smtpPass || '').trim());
    if (hasUserOrPass && !String(reportEmail.smtpHost || '').trim()) {
      setEmailFeedback({ type: 'error', message: t('emailIncompleteSmtpError') });
      return;
    }

    let cleanHost = reportEmail.smtpHost.trim().replace(/@/g, '.');
    if (cleanHost.toLowerCase() === 'smtp.google.com' || cleanHost.toLowerCase() === 'gmail.com' || cleanHost.toLowerCase().includes('gmail')) {
      cleanHost = 'smtp.gmail.com';
    } else if (cleanHost.toLowerCase() === 'outlook.com' || cleanHost.toLowerCase() === 'hotmail.com' || cleanHost.toLowerCase().includes('outlook')) {
      cleanHost = 'smtp-mail.outlook.com';
    }

    const portNum = parseInt(reportEmail.smtpPort, 10) || 587;
    const secureFlag = portNum === 465 ? true : (portNum === 587 ? false : Boolean(reportEmail.smtpSecure));

    const reportHtml = buildReportHtml();
    const payload = {
      senderEmail: reportEmail.senderEmail.trim(),
      recipientEmail: reportEmail.recipientEmail.trim(),
      subject: reportEmail.subject.trim(),
      text: reportEmail.body,
      reportHtml,
      apiKey: (reportEmail.apiKey || '').trim(),
      smtp: {
        host: cleanHost,
        port: portNum,
        secure: secureFlag,
        user: reportEmail.smtpUser.trim(),
        pass: reportEmail.smtpPass
      }
    };

    setEmailSending(true);
    try {
      const backendUrl = getBackendBaseUrl() || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to send email');
      }

      if (result.previewUrl) {
        setEmailFeedback({ type: 'success', message: t('emailSentSuccessEthereal') });
        setEmailPreviewUrl(result.previewUrl);
      } else {
        setEmailFeedback({ type: 'success', message: t('emailSentSuccess') });
      }
    } catch (error) {
      setEmailFeedback({ type: 'error', message: `${t('emailSentError')} ${error.message}` });
    } finally {
      setEmailSending(false);
    }
  };

  const handleSaveEmailSettings = () => {
    try {
      localStorage.setItem('aethertest_report_email', JSON.stringify(reportEmail));
      setEmailFeedback({ type: 'success', message: t('emailSettingsSaved') });
    } catch {
      setEmailFeedback({ type: 'error', message: 'Failed to save settings.' });
    }
  };

  useEffect(() => {
    if (shouldAutoSendEmail && !isRunning) {
      if (reportEmail.senderEmail.trim() && reportEmail.recipientEmail.trim()) {
        handleSendReportEmail();
      }
      setShouldAutoSendEmail(false);
    }
  }, [shouldAutoSendEmail, isRunning]);

  const runCards = (cardsToRun, contextLabel = '') => {
    if (!cardsToRun || cardsToRun.length === 0) {
      addLog('⚠️ لا يوجد كروت محددة للتشغيل.', 'error');
      return;
    }

    setIsRunning(true);
    clearLogs();
    addLog(`🚀 جاري تشغيل ${cardsToRun.length} اختبار${cardsToRun.length > 1 ? 'ات' : ''}${contextLabel ? ` (${contextLabel})` : ''}...`, 'system');

    const cardsToRunForBackend = cardsToRun.map(c => ({
      ...c,
      recordVideo: Boolean(c.recordVideo),
      steps: Array.isArray(c.builderSteps) && c.builderSteps.length ? c.builderSteps : (Array.isArray(c.steps) && c.steps.length ? c.steps : []),
      prompt: c.prompt || ''
    }));

    const resolveSystemVariables = (value) => {
      return String(value ?? '').replace(/\{([A-Z0-9_]+)\}/g, (m, varName) => {
        if (Object.prototype.hasOwnProperty.call(systemVariables, varName)) {
          const v = systemVariables[varName];
          if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) return String(v.value);
          return String(v);
        }
        return m;
      });
    };

    const resolvedCredentials = {
      ...credentials,
      url: resolveSystemVariables(credentials.url),
      username: resolveSystemVariables(credentials.username),
      password: resolveSystemVariables(credentials.password)
    };

    setTestCards(cardsToRun.map(c => ({ ...c, status: 'idle', steps: [], logHistory: [], videoUrl: '', recordVideo: Boolean(c.recordVideo) })));

    if (!socketRef.current?.connected) {
      setIsRunning(false);
      if (socketRef.current) socketRef.current.connect();
      addLog('⏳ جاري الاتصال بالسيرفر... (سيرفر Render المجاني يستغرق 15-30 ثانية للاستيقاظ لأول مرة). يرجى الانتظار بضع ثوانٍ ثم الضغط مجدداً.', 'error');
      return;
    }

    socketRef.current.emit('run-suite', {
      testCards: cardsToRunForBackend,
      credentials: resolvedCredentials,
      systemVariables
    });
  };



  const runSuite = () => {
    if (testCards.length === 0 && !credentials.url) {
      addLog('⚠️ لا يوجد أي كارت اختبار أو رابط موقع لتشغيله! يرجى إدخال الرابط أو إضافة كارت أولاً.', 'error');
      return;
    }

    runCards(testCards, language === 'ar' ? 'التسلسل القياسي' : 'standard run');
  };

  // Run a single test card individually
  const runSingleTest = (card) => {
    setIsRunning(true);
    clearLogs();
    addLog(`🚀 جاري بدء تشغيل اختبار منفرد: "${card.title}"...`, 'system');

    const resolveSystemVariables = (value) => {
      return String(value ?? '').replace(/\{([A-Z0-9_]+)\}/g, (m, varName) => {
        if (Object.prototype.hasOwnProperty.call(systemVariables, varName)) {
          const v = systemVariables[varName];
          if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) return String(v.value);
          return String(v);
        }
        return m;
      });
    };


    const resolvedCredentials = {
      ...credentials,
      url: resolveSystemVariables(credentials.url),
      username: resolveSystemVariables(credentials.username),
      password: resolveSystemVariables(credentials.password)
    };

    // Reset status for this card, leave others
    setTestCards(prev => prev.map(c =>
      c.id === card.id ? { ...c, status: 'idle', steps: [], logHistory: [], videoUrl: '' } : c
    ));

    // Emit WebSockets trigger for just this card
    if (!socketRef.current?.connected) {
      setIsRunning(false);
      if (socketRef.current) socketRef.current.connect();
      addLog('⏳ جاري الاتصال بالسيرفر... (سيرفر Render المجاني يستغرق 15-30 ثانية للاستيقاظ لأول مرة). يرجى الانتظار بضع ثوانٍ ثم الضغط مجدداً.', 'error');
      return;
    }

    socketRef.current.emit('run-suite', {
      testCards: [{
        ...card,
        recordVideo: Boolean(card.recordVideo),
        steps: Array.isArray(card.builderSteps) && card.builderSteps.length ? card.builderSteps : (Array.isArray(card.steps) && card.steps.length ? card.steps : []),
        prompt: card.prompt || ''
      }],
      credentials: resolvedCredentials,
      systemVariables
    });
  };

  const runBugFinder = () => {
    if (!bugScan.url.trim()) {
      addLog('⚠️ أدخل رابط الموقع قبل تشغيل Bug Finder.', 'error');
      return;
    }

    setActiveTab('bugs');
    setIsBugScanRunning(true);
    setBugReport(null);
    clearLogs();
    addLog('🔎 جاري تشغيل Bug Finder عبر السيرفر...', 'system');
    socketRef.current.emit('run-bug-scan', bugScan);
  };

  const severityLabel = (severity) => {
    const labels = {
      critical: language === 'ar' ? 'حرج' : 'Critical',
      high: language === 'ar' ? 'عالي' : 'High',
      medium: language === 'ar' ? 'متوسط' : 'Medium',
      low: language === 'ar' ? 'منخفض' : 'Low',
      info: language === 'ar' ? 'معلومة' : 'Info'
    };
    return labels[severity] || severity;
  };

  const stopSuite = () => {
    setIsRunning(false);
    setCurrentCardId(null);
    setLiveFrame(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
    addLog('🛑 تم إيقاف الجلسة فوراً وتصفير حالة التشغيل.', 'error');
  };

  // Print/Save PDF handler
  const handlePrint = () => {
    window.print();
  };

  // Compute stats
  const totalTests = testCards.length;
  const passedTests = testCards.filter(c => c.status === 'passed').length;
  const failedTests = testCards.filter(c => c.status === 'failed').length;
  const passRate = totalTests > 0 ? Math.round((passTestsCount() / totalTests) * 100) : 0;

  function passTestsCount() {
    return passedTests;
  }

  return (
    <div className="app-container">

      {/* Header section */}
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-icon">🛡️</span>
          <h1>
            AetherTest AI
            <span className="logo-badge">{t('smartVersion')}</span>
          </h1>
        </div>
        <div className="header-actions">
          <button
            className="language-toggle"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            title={t('languageTitle')}
            aria-label={t('languageTitle')}
          >
            <Languages size={16} />
            {t('languageLabel')}
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? (language === 'ar' ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (language === 'ar' ? 'تفعيل الوضع الداكن' : 'Switch to dark mode')}
            aria-label={theme === 'dark' ? (language === 'ar' ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (language === 'ar' ? 'تفعيل الوضع الداكن' : 'Switch to dark mode')}
          >
            <span className="theme-toggle-thumb">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <span className="theme-toggle-text">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsGuideOpen(true)}
            title={language === 'ar' ? 'دليل الاستخدام والتعليمات' : 'User Guide'}
            style={{ gap: '0.4rem', fontWeight: 700, background: 'rgba(99, 85, 255, 0.12)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}
          >
            <HelpCircle size={18} />
            {language === 'ar' ? 'كيفية استخدام الموقع' : 'User Guide'}
          </button>
          <button
            className="btn btn-success"
            onClick={() => setIsReportOpen(true)}
            title={t('reportButtonTitle')}
          >
            <FileCheck size={18} />
            {t('reportButton')}
          </button>
        </div>
      </header>

      <div className="workspace-tabs" role="tablist" aria-label="AetherTest workspaces">
        <button
          className={`workspace-tab ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('tests')}
          role="tab"
          aria-selected={activeTab === 'tests'}
        >
          <FileCheck size={18} />
          {language === 'ar' ? ' حالات الاختبار' : 'Test Cases'}
        </button>
        <button
          className={`workspace-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
          role="tab"
          aria-selected={activeTab === 'schedule'}
        >
          <Clock size={18} />
          {language === 'ar' ? 'الجدولة' : 'Schedule'}
        </button>
        <button
          className={`workspace-tab ${activeTab === 'bugs' ? 'active' : ''}`}
          onClick={() => setActiveTab('bugs')}
          role="tab"
          aria-selected={activeTab === 'bugs'}
        >
          <Bug size={18} />
          {language === 'ar' ? 'Bug Finder MCP' : 'Bug Finder MCP'}
        </button>
      </div>

      {activeTab === 'tests' ? (
        <>
          <div className="bug-finder-layout">
            <main className="bug-finder-main">
              {/* Systems & Projects Manager Panel */}
              <section className="credentials-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} className="text-primary" />
                  {t('projectsPanel')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '1rem', alignItems: 'end' }}>
                  <div className="input-wrapper">
                    <label htmlFor="project-name-input">{t('currentProject')}</label>
                    <input
                      id="project-name-input"
                      type="text"
                      className="input-field"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder={t('projectPlaceholder')}
                    />
                  </div>

                  <div className="input-wrapper">
                    <label htmlFor="saved-projects-select">{t('savedProjects')}</label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select
                        id="saved-projects-select"
                        className="input-field"
                        style={{ width: '100%', cursor: 'pointer' }}
                        value={savedProjects.includes(projectName) ? projectName : ''}
                        onChange={(e) => loadProject(e.target.value)}
                      >
                        <option value="">{t('chooseProject')}</option>
                        {savedProjects.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                      </select>
                      {projectName && savedProjects.includes(projectName) && (
                        <button
                          className="btn btn-danger-outline btn-icon-only"
                          onClick={() => deleteProjectFromLocal(projectName)}
                          title={t('deleteSavedProject')}
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn" onClick={saveProjectToLocal} title={t('saveLocal')}>
                      💾 {t('saveLocal')}
                    </button>
                    <button className="btn" onClick={exportProject} title={t('exportJson')}>
                      📤 {t('exportJson')}
                    </button>
                    <label className="btn" style={{ cursor: 'pointer' }} title={t('importFile')}>
                      📥 {t('importFile')}
                      <input
                        type="file"
                        accept=".json,.js,.ts,.jsx"
                        style={{ display: 'none' }}
                        onChange={handleImportFile}
                      />
                    </label>
                    <button className="btn" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }} onClick={handleNewProject} title={t('newProject')}>
                      ➕ {t('newProject')}
                    </button>
                  </div>
                </div>
              </section>

              {/* Global Credentials Panel */}
              <section className="credentials-card">
                <h2 className="panel-title">
                  <Sparkles size={18} className="text-secondary" />
                  {t('credentialsPanel')}
                </h2>
                <div className="credentials-grid">
                  <div className="input-wrapper">
                    <label htmlFor="target-url">{t('targetUrl')}</label>
                    <input
                      id="target-url"
                      type="text"
                      className="input-field"
                      placeholder="https://example.com/login"
                      value={credentials.url}
                      onChange={(e) => setCredentials({ ...credentials, url: e.target.value })}
                    />
                  </div>
                  <div className="input-wrapper">
                    <label htmlFor="username">{t('username')}</label>
                    <input
                      id="username"
                      type="text"
                      className="input-field"
                      placeholder="username or email"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    />
                  </div>
                  <div className="input-wrapper">
                    <label htmlFor="password">{t('password')}</label>
                    <div className="password-input-container">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="input-field"
                        placeholder="••••••••••••"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Resend API Key Input Field on Main Screen */}
                  <div className="input-wrapper" style={{ gridColumn: '1 / -1', marginTop: '0.5rem', padding: '0.85rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.08)', border: '1.5px solid #22c55e' }}>
                    <label htmlFor="resend-api-key-main" style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      🚀 {language === 'ar' ? 'مفتاح Resend API لإرسال الإيميلات الفوري (مستوصى به للسيرفرات أونلاين)' : 'Resend Email API Key (Recommended for Cloud)'}
                    </label>
                    <input
                      id="resend-api-key-main"
                      type="password"
                      className="input-field"
                      placeholder="ضع الكود هنا (يبدأ بـ re_...)"
                      value={reportEmail.apiKey || ''}
                      onChange={(e) => setReportEmail(prev => ({ ...prev, apiKey: e.target.value }))}
                      style={{ marginTop: '0.35rem' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                      {language === 'ar' ? '💡 احصل على مفتاح مجاني في 10 ثوانٍ من resend.com لإرسال التقارير مباشرة لإيميلك بدون حظر منافذ.' : '💡 Get a free key at resend.com to deliver emails directly without port blocks.'}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1rem' }}>{t('sendReportByEmail')} (اختياري / للإرسال التلقائي)</h3>
                  <div className="credentials-grid">
                    <div className="input-wrapper">
                      <label htmlFor="inline-sender-email">{t('senderEmail')}</label>
                      <input
                        id="inline-sender-email"
                        type="email"
                        className="input-field"
                        value={reportEmail.senderEmail}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, senderEmail: e.target.value }))}
                        placeholder="sender@example.com"
                      />
                    </div>
                    <div className="input-wrapper">
                      <label htmlFor="inline-recipient-email">{t('recipientEmail')}</label>
                      <input
                        id="inline-recipient-email"
                        type="email"
                        className="input-field"
                        value={reportEmail.recipientEmail}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, recipientEmail: e.target.value }))}
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div className="input-wrapper">
                      <label htmlFor="inline-email-subject">{t('emailSubject')}</label>
                      <input
                        id="inline-email-subject"
                        type="text"
                        className="input-field"
                        value={reportEmail.subject}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="inline-email-body">{t('emailBody')}</label>
                      <textarea
                        id="inline-email-body"
                        className="input-field"
                        rows={2}
                        value={reportEmail.body}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, body: e.target.value }))}
                      />
                    </div>
                  </div>
                  <details style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      ⚙️ {t('smtpSettingsSection')} ({t('smtpHost')}, {t('smtpPort')}, {t('smtpUser')})
                    </summary>
                    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <div className="input-wrapper">
                        <label htmlFor="inline-smtp-host">{t('smtpHost')}</label>
                        <input
                          id="inline-smtp-host"
                          type="text"
                          className="input-field"
                          value={reportEmail.smtpHost}
                          onChange={(e) => setReportEmail(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="input-wrapper">
                        <label htmlFor="inline-smtp-port">{t('smtpPort')}</label>
                        <input
                          id="inline-smtp-port"
                          type="text"
                          className="input-field"
                          value={reportEmail.smtpPort}
                          onChange={(e) => setReportEmail(prev => ({ ...prev, smtpPort: e.target.value }))}
                          placeholder="587 / 465"
                        />
                      </div>
                      <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                        <input
                          id="inline-smtp-secure"
                          type="checkbox"
                          checked={reportEmail.smtpSecure}
                          onChange={(e) => setReportEmail(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                        />
                        <label htmlFor="inline-smtp-secure" style={{ fontSize: '0.85rem' }}>{t('smtpSecure')}</label>
                      </div>
                      <div className="input-wrapper">
                        <label htmlFor="inline-smtp-user">{t('smtpUser')}</label>
                        <input
                          id="inline-smtp-user"
                          type="text"
                          className="input-field"
                          value={reportEmail.smtpUser}
                          onChange={(e) => setReportEmail(prev => ({ ...prev, smtpUser: e.target.value }))}
                          placeholder="username@example.com"
                        />
                      </div>
                      <div className="input-wrapper">
                        <label htmlFor="inline-smtp-pass">{t('smtpPass')}</label>
                        <input
                          id="inline-smtp-pass"
                          type="password"
                          className="input-field"
                          value={reportEmail.smtpPass}
                          onChange={(e) => setReportEmail(prev => ({ ...prev, smtpPass: e.target.value }))}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('smtpHint')}</p>
                  </details>

                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={reportEmail.autoSend || false}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, autoSend: e.target.checked }))}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      {t('autoSendReport')}
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                      <button className="btn btn-secondary" onClick={handleSaveEmailSettings} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        {t('saveEmailSettings')}
                      </button>
                      <button className="btn btn-success" onClick={handleSendReportEmail} disabled={emailSending} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        {emailSending ? t('sendingEmail') : t('sendEmailButton')}
                      </button>
                      {emailFeedback && (
                        <div style={{ color: emailFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {emailFeedback.message}
                        </div>
                      )}
                      {emailPreviewUrl && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                          <div style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
                            <a href={emailPreviewUrl} target="_blank" rel="noreferrer">{emailPreviewUrl}</a>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', padding: '0.4rem 0.6rem', borderRadius: '6px', marginTop: '0.25rem' }}>
                            {t('etherealNotice')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-login Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '0.5rem' }}>
                  <input
                    id="auto-login-checkbox"
                    type="checkbox"
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    checked={credentials.autoLogin}
                    onChange={(e) => setCredentials({ ...credentials, autoLogin: e.target.checked })}
                  />
                  <label htmlFor="auto-login-checkbox" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)', fontWeight: '600' }}>
                    {t('autoLogin')}
                  </label>
                </div>


                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={resetAllStatuses} disabled={isRunning}>
                    {t('resetStatus')}
                  </button>
                  {!isRunning ? (
                    <button className="btn btn-primary" onClick={runSuite}>
                      <Play size={16} />
                      {t('runAll')}
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ background: '#f43f5e', boxShadow: 'none' }} onClick={stopSuite}>
                      <Square size={16} />
                      {t('stopNow')}
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => showCodeModal(language === 'ar' ? 'كود جميع الكاردات' : 'All cards code', getAllCode())}
                    disabled={testCards.length === 0}
                    title={language === 'ar' ? 'عرض كود Playwright لجميع الكاردات' : 'Show Playwright code for all cards'}
                  >
                    <FileText size={16} />
                    {language === 'ar' ? 'عرض كود الكل' : 'Show all code'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyCode(getAllCode())}
                    disabled={testCards.length === 0}
                    title={language === 'ar' ? 'نسخ كود Playwright لجميع الكاردات' : 'Copy Playwright code for all cards'}
                  >
                    <Copy size={16} />
                    {language === 'ar' ? 'نسخ الكل' : 'Copy all'}
                  </button>
                </div>

                {/* System Variables */}
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} />
                    {language === 'ar' ? 'System Variables' : 'System Variables'}
                  </h3>


                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {language === 'ar' ? 'اسم المتغير' : 'Variable name'}
                      </span>
                      <input
                        className="input-field"
                        value={pendingSystemVarName}
                        onChange={(e) => setPendingSystemVarName(e.target.value)}
                        placeholder="Enter variable name"
                        disabled={isRunning}
                      />
                    </label>

                    <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {language === 'ar' ? 'نوع المتغير' : 'Variable type'}
                      </span>
                      <select
                        className="input-field"
                        value={pendingSystemVarType}
                        onChange={(e) => setPendingSystemVarType(e.target.value)}
                        disabled={isRunning}
                        style={{ cursor: isRunning ? 'not-allowed' : 'pointer' }}
                      >
                        <option value="string">{language === 'ar' ? 'string (نص)' : 'string (text)'}</option>
                        <option value="characters">{language === 'ar' ? 'characters' : 'characters'}</option>
                        <option value="integer">{language === 'ar' ? 'integer (عدد صحيح)' : 'integer (int)'}</option>
                        <option value="double">{language === 'ar' ? 'double (عدد عشري)' : 'double (float)'}</option>
                        <option value="boolean">{language === 'ar' ? 'boolean (true/false)' : 'boolean (true/false)'}</option>
                      </select>
                    </label>

                    <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {language === 'ar' ? 'قيمة المتغير' : 'Variable value'}
                      </span>
                      <input
                        className="input-field"
                        value={pendingSystemVarValue}
                        onChange={(e) => setPendingSystemVarValue(e.target.value)}
                        placeholder="Enter variable value"
                        disabled={isRunning}
                      />
                    </label>


                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => {
                        if (editingSystemVarKey) handleUpdateSystemVariable();
                        else handleAddSystemVariable();
                      }}
                      disabled={isRunning || !String(pendingSystemVarName || '').trim()}
                      style={{ background: 'rgba(124,58,237,0.18)', color: 'var(--primary)', border: '1px solid rgba(124,58,237,0.35)' }}
                    >
                      {editingSystemVarKey
                        ? (language === 'ar' ? 'حفظ التعديل' : 'Update')
                        : (language === 'ar' ? 'إضافة متغير' : 'Add variable')}
                    </button>

                    {editingSystemVarKey && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingSystemVarKey(null);
                          setPendingSystemVarName('');
                          setPendingSystemVarType('string');
                          setPendingSystemVarValue('');
                        }}
                        disabled={isRunning}
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    )}


                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    {Object.keys(systemVariables || {}).length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {language === 'ar' ? 'لا يوجد متغيرات.' : 'No variables yet.'}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Object.entries(systemVariables || {}).map(([k, v]) => {
                          const varType = v?.type || typeof v;
                          const varValue = (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, 'value')) ? v.value : v;
                          const typeLabel = String(varType || 'string');

                          return (
                            <div
                              key={k}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                padding: '0.55rem 0.7rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(124,58,237,0.25)',
                                background: 'linear-gradient(180deg, rgba(124,58,237,0.10) 0%, rgba(255,255,255,0.02) 100%)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                  className="btn btn-icon-only"
                                  style={{
                                    padding: 0,
                                    width: 'auto',
                                    height: 'auto',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: isRunning ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    textAlign: 'left'
                                  }}
                                  onClick={() => {
                                    setEditingSystemVarKey(k);
                                    setPendingSystemVarName(k);
                                    setPendingSystemVarType(String(varType || 'string'));
                                    setPendingSystemVarValue(String(varValue ?? ''));
                                  }}
                                  disabled={isRunning}
                                  title={language === 'ar' ? 'تعديل المتغير' : 'Edit variable'}
                                >
                                  <code style={{ fontSize: '0.9rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{`{${k}}`}</code>
                                </button>

                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'var(--font-mono)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '999px',
                                    border: '1px solid rgba(124,58,237,0.28)',
                                    background: 'rgba(124,58,237,0.10)'
                                  }}
                                  title={typeLabel}
                                >
                                  {typeLabel}
                                </span>

                                <button
                                  className="btn btn-icon-only btn-danger-outline"
                                  style={{ padding: '0.25rem', height: '30px', width: '30px', marginLeft: 'auto' }}
                                  onClick={() => handleDeleteSystemVariable(k)}
                                  disabled={isRunning}
                                  title={language === 'ar' ? 'حذف المتغير' : 'Delete variable'}
                                >
                                  <Trash size={14} />
                                </button>
                              </div>

                              <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '320px'
                              }}
                                title={String(varValue)}
                              >
                                {String(varValue)}
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    )}
                  </div>
                </div>

              </section>

              {/* Quick presets bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('quickPresets')}</span>
                {PRESET_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    className="btn"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                    onClick={() => handleAddCard(PRESET_TRANSLATIONS[idx]?.prompt[language] || tmpl.prompt)}
                  >
                    <Plus size={12} />
                    {PRESET_TRANSLATIONS[idx]?.title[language] || tmpl.title}
                  </button>
                ))}
              </div>

              <div className="cards-grid">
                {testCards.map((card) => (
                  <div
                    key={card.id}
                    className={`test-card ${card.status} ${currentCardId === card.id ? 'running' : ''}`}
                  >
                    <div className="card-input-container" style={{ marginBottom: '15px', width: '100%' }}>
                      <label
                        className="card-title-label"
                        htmlFor={`card-title-${card.id}`}
                        style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
                      >
                        {t('testTitle')}
                      </label>
                      <input
                        type="text"
                        className="card-title-input"
                        placeholder={language === 'ar' ? 'ادخل عنوان الاختبار' : 'Enter test title'}
                        value={card.title || ''}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '5px',
                          border: '1px solid #ccc',
                          boxSizing: 'border-box'
                        }}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setTestCards(prevCards =>
                            prevCards.map(c => c.id === card.id ? { ...c, title: newTitle } : c)
                          );
                        }}
                      />
                    </div>
                    <div className="card-input-container" style={{ marginBottom: '15px', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label htmlFor={`card-type-${card.id}`} style={{ fontWeight: 'bold', display: 'block' }}>
                        {t('testTypeLabel')}
                      </label>
                      <select
                        id={`card-type-${card.id}`}
                        value={card.type || 'all'}
                        onChange={(e) => {
                          const nextType = e.target.value;
                          setTestCards(prevCards => prevCards.map(c => c.id === card.id ? { ...c, type: nextType } : c));
                        }}
                        disabled={isRunning}
                        className="card-type-select"
                      >
                        {TEST_CARD_TYPES.map(typeOption => (
                          <option key={typeOption.key} value={typeOption.key}>
                            {typeOption.label[language] || typeOption.label.en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', marginTop: '0.55rem' }}>
                      <input
                        id={`record-video-${card.id}`}
                        type="checkbox"
                        checked={Boolean(card.recordVideo)}
                        onChange={(e) => handleToggleRecordVideo(card.id, e.target.checked)}
                        disabled={isRunning}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                      />
                      <label
                        htmlFor={`record-video-${card.id}`}
                        style={{
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          color: 'var(--text-main)',
                          userSelect: 'none' // تمنع تحديد النص بالخطأ عند كثرة النقر
                        }}
                      >
                        {t('recordVideoLabel')}
                      </label>
                    </div>

                    {/** Retry Controls */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', marginTop: '0.55rem' }}>
                      <input
                        id={`retry-${card.id}`}
                        type="checkbox"
                        checked={Boolean(card.retryEnabled)}
                        onChange={(e) => handleToggleRetry(card.id, e.target.checked)}
                        disabled={isRunning}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: isRunning ? 'not-allowed' : 'pointer'
                        }}
                      />
                      <label
                        htmlFor={`retry-${card.id}`}
                        style={{
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          color: 'var(--text-main)',
                          userSelect: 'none'
                        }}
                      >
                        {language === 'ar' ? 'تكرار التست عند الفشل' : 'Retry on failure'}
                      </label>

                      {Boolean(card.retryEnabled) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {language === 'ar' ? 'عدد المحاولات (إجمالي)' : 'Retry count (total)'}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={card.retryCount ?? 1}
                            onChange={(e) => handleChangeRetryCount(card.id, e.target.value)}
                            disabled={isRunning}
                            style={{
                              width: '92px',
                              height: '40px',
                              borderRadius: '10px',
                              border: '1px solid var(--control-border)',
                              background: 'var(--control-bg)',
                              color: 'var(--text-main)',
                              padding: '0 0.75rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="card-action-bar">
                      <div className="card-actions card-action-bar-actions">
                        <span className={`card-status-badge badge-${card.status}`}>
                          {card.status === 'idle' && t('cardReady')}
                          {card.status === 'running' && t('cardRunning')}
                          {card.status === 'passed' && t('cardPassed')}
                          {card.status === 'failed' && t('cardFailed')}
                        </span>
                        <button
                          className="btn btn-icon-only btn-primary"
                          onClick={() => runSingleTest(card)}
                          title={t('runThisTest')}
                          disabled={isRunning}
                          style={{ background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)', border: 'none', color: 'white' }}
                        >
                          <Play size={12} />
                        </button>
                        {card.recordVideo && (
                          <span className="recording-badge" title={language === 'ar' ? 'سيتم تسجيل الفيديو لهذا الكارت' : 'Video recording enabled for this card'}>
                            🎥
                          </span>
                        )}
                        <button
                          className="btn btn-icon-only"
                          onClick={() => showCodeModal(card.title || (language === 'ar' ? 'كود الكارت' : 'Card code'), getCardCode(card, testCards.findIndex(c => c.id === card.id)))}
                          title={language === 'ar' ? 'عرض كود Playwright لهذا الكارت' : 'View Playwright code for this card'}
                          disabled={isRunning}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="btn btn-icon-only"
                          onClick={() => copyCode(getCardCode(card, testCards.findIndex(c => c.id === card.id)))}
                          title={language === 'ar' ? 'نسخ كود هذا الكارت' : 'Copy this card code'}
                          disabled={isRunning}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="btn btn-icon-only"
                          onClick={() => handleDuplicateCard(card)}
                          title={t('duplicateTest')}
                          disabled={isRunning}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="btn btn-icon-only btn-danger-outline"
                          onClick={() => handleDeleteCard(card.id, card.title)}
                          title={t('deleteTest')}
                          disabled={isRunning}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="step-builder">
                      <div className="step-builder-header">
                        <div>
                          <h3>{language === 'ar' ? 'باني الخطوات' : 'Step Builder'}</h3>
                          <p className="step-builder-subtitle">{language === 'ar' ? 'ابنِ كل خطوة باختيار النوع والمعرف والنية البشرية' : 'Create each step with action, selector, and human intent'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            className="btn"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                              color: 'white',
                              border: 'none',
                              fontWeight: '600',
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 2px 8px rgba(124,58,237,0.35)'
                            }}
                            onClick={() => handleSmartParse(card.id)}
                            disabled={isRunning || !card.prompt}
                            title={language === 'ar' ? 'تحليل البرومبت تلقائياً إلى خطوات مهيكلة' : 'Automatically parse prompt into structured steps'}
                          >
                            <Sparkles size={14} />
                            {language === 'ar' ? ' 🧠 تحليل بالذكاء' : '🧠 Smart Parse'}
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleAddStep(card.id)} disabled={isRunning}>
                            <Plus size={14} />
                            {language === 'ar' ? 'إضافة خطوة جديدة' : 'Add New Step'}
                          </button>
                        </div>
                      </div>
                      <div className="step-builder-grid">
                        {getBuilderStepsForCard(card).map((step, index, steps) => (
                          <div key={step.id} className="step-row">
                            <div className="step-handle" aria-hidden="true">☰</div>
                            <div className="step-row-content">
                              <div className="step-title-field">
                                <label>
                                  <span className="step-label">{language === 'ar' ? 'عنوان الخطوة' : 'Step title'}</span>
                                  <input
                                    type="text"
                                    value={step.title || ''}
                                    onChange={(e) => handleUpdateStep(card.id, step.id, 'title', e.target.value)}
                                    disabled={isRunning}
                                    placeholder={language === 'ar' ? 'اكتب عنوان المرحلة هنا' : 'Write step title here'}
                                  />
                                </label>
                              </div>
                              <div className="step-line-1">
                                <div className="step-fields">
                                  <label>
                                    <span className="step-label">{language === 'ar' ? 'نوع الإجراء' : 'Action'}</span>
                                    <select
                                      value={step.action}
                                      onChange={(e) => handleUpdateStep(card.id, step.id, 'action', e.target.value)}
                                      disabled={isRunning}
                                    >
                                      {ACTION_TYPES.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label[language]}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  {step.action !== 'wait' && (
                                    <label>
                                      <span className="step-label">{language === 'ar' ? 'نوع المحدد' : 'Selector'}</span>
                                      <select
                                        value={step.selector}
                                        onChange={(e) => handleUpdateStep(card.id, step.id, 'selector', e.target.value)}
                                        disabled={isRunning}
                                      >
                                        {SELECTOR_TYPES.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label[language]}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  )}
                                </div>

                                {step.action !== 'wait' && (
                                  <div className="step-target-row">
                                    <label>
                                      <span className="step-label">{language === 'ar' ? 'الموضع / الهدف / معرّف العنصر (ID/Class)' : 'Target / Field / Identifier'}</span>
                                      {step.selector === 'variable' ? (
                                        <select
                                          value={step.target || ''}
                                          onChange={(e) => handleUpdateStep(card.id, step.id, 'target', e.target.value)}
                                          disabled={isRunning}
                                          className="input-field"
                                          style={{ width: '100%', minHeight: '42px', padding: '0.6rem 0.75rem' }}
                                        >
                                          <option value="">{language === 'ar' ? '-- اختر متغيراً --' : '-- Select a variable --'}</option>
                                          {Object.keys(systemVariables || {}).map(varName => (
                                            <option key={varName} value={`{${varName}}`}>
                                              {varName} (القيمة الحالية: {systemVariables[varName]?.value || 'فارغة'})
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          value={step.target || ''}
                                          onChange={(e) => handleUpdateStep(card.id, step.id, 'target', e.target.value)}
                                          disabled={isRunning}
                                          style={{
                                            width: '100%',
                                            maxWidth: '320px',        // يمنع الخانة من التمدد بشكل طويل جداً
                                            height: '36px',            // تصغير الارتفاع الرأسي
                                            padding: '0.4rem 0.6rem',  // تقليص الحشو الداخلي لتبدو أنحف وأصغر
                                            fontSize: '0.85rem'        // تصغير حجم الخط ليتناسق مع الطول الجديد
                                          }}
                                          placeholder={step.action === 'scroll'
                                            ? language === 'ar'
                                              ? 'اتركه فارغًا للتمرير لأسفل الصفحة. اكتب معرف/كلاس للتمرير إلى العنصر.'
                                              : 'Leave empty to scroll to bottom. Enter id/class to scroll into view.'
                                            : language === 'ar'
                                              ? 'مثال: submit-button أو #submit'
                                              : 'Example: submit-button or #submit'}
                                        />
                                      )}
                                      {step.action === 'scroll' && (
                                        <span className="step-helper-text">
                                          {language === 'ar'
                                            ? 'فارغ = Scroll to bottom، غير فارغ = Scroll into view'
                                            : 'Empty = scroll to bottom, non-empty = scroll into view'}
                                        </span>
                                      )}
                                    </label>
                                  </div>
                                )}
                              </div>

                              {(step.action === 'type' || step.action === 'assertion' || step.action === 'wait') && (
                                <div className="step-line-2">
                                  {step.action === 'type' && (
                                    <div className="step-value-row">
                                      <label className="step-value-field">
                                        <span className="step-label">{language === 'ar' ? 'النص المراد كتابته' : 'Text to type'}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <input
                                            type="text"
                                            value={step.value || ''}
                                            onChange={(e) => handleUpdateStep(card.id, step.id, 'value', e.target.value)}
                                            disabled={isRunning}
                                            placeholder={language === 'ar' ? 'مثال: محمد أو {BASE_URL}' : 'Example: Mohammed or {BASE_URL}'}
                                            style={{ flex: 1 }}
                                          />
                                          <button
                                            type="button"
                                            className="btn"
                                            style={{ padding: '0.35rem 0.6rem' }}
                                            onClick={() => {
                                              const keys = Object.keys(systemVariables || {});
                                              if (!keys.length) return;
                                              const pick = window.prompt(
                                                language === 'ar'
                                                  ? `اختر متغير (اكتب اسمه بدون { }):\n${keys.map(k => `- ${k} (${(systemVariables[k]?.type) || 'string'})`).join('\n')}`
                                                  : `Pick variable name (without { }):\n${keys.map(k => `- ${k} (${(systemVariables[k]?.type) || 'string'})`).join('\n')}`
                                              );
                                              if (!pick) return;
                                              const name = String(pick).trim();
                                              if (!Object.prototype.hasOwnProperty.call(systemVariables || {}, name)) return;
                                              handleUpdateStep(card.id, step.id, 'value', `{${name}}`);
                                            }}
                                            disabled={isRunning || Object.keys(systemVariables || {}).length === 0}
                                            title={language === 'ar' ? 'إدراج متغير' : 'Insert variable'}
                                          >
                                            {language === 'ar' ? 'Variables' : 'Variables'}
                                          </button>
                                        </div>
                                      </label>
                                    </div>
                                  )}

                                  {step.action === 'assertion' && (
                                    <div className="step-extra-fields">
                                      <label>
                                        <span className="step-label">{language === 'ar' ? 'نوع التحقق' : 'Assertion Type'}</span>
                                        <select
                                          value={step.assertionType || 'visible'}
                                          onChange={(e) => {
                                            handleUpdateStep(card.id, step.id, 'assertionType', e.target.value);
                                            if (e.target.value !== 'text_match') {
                                              handleUpdateStep(card.id, step.id, 'value', '');
                                            }
                                          }}
                                          disabled={isRunning}
                                        >
                                          {ASSERTION_TYPES.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label[language]}
                                            </option>
                                          ))}
                                        </select>
                                      </label>

                                      {step.assertionType === 'text_match' && (
                                        <label className="step-value-field" style={{ width: '100%' }}>
                                          <span className="step-label">
                                            {language === 'ar' ? 'القيمة المتوقعة (للمطابقة)' : 'Expected Value (for Match)'}
                                          </span>

                                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                                            {step.assertionType === 'text_match' && step.selector === 'text' ? (
                                              <select
                                                value={step.value || ''}
                                                onChange={(e) => handleUpdateStep(card.id, step.id, 'value', e.target.value)}
                                                disabled={isRunning || Object.keys(systemVariables || {}).length === 0}
                                                className="input-field"
                                                style={{
                                                  width: '100%',
                                                  minHeight: '42px',
                                                  padding: '0.6rem 0.75rem',
                                                  background: 'var(--control-bg)',
                                                  color: 'var(--text-main)',
                                                  borderRadius: '10px',
                                                  border: '1px solid var(--control-border)',
                                                  outline: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <option value="">
                                                  {language === 'ar' ? '-- اختر متغير للمقارنة --' : '-- Select variable to compare --'}
                                                </option>
                                                {Object.keys(systemVariables || {}).map(varName => (
                                                  <option key={varName} value={`{${varName}}`}>
                                                    {`{${varName}}`} ({language === 'ar' ? 'القيمة:' : 'Val:'} {String(systemVariables[varName]?.value || '')})
                                                  </option>
                                                ))}
                                              </select>
                                            ) : (
                                              <>
                                                <input
                                                  type="text"
                                                  value={step.value || ''}
                                                  onChange={(e) => handleUpdateStep(card.id, step.id, 'value', e.target.value)}
                                                  disabled={isRunning}
                                                  placeholder={language === 'ar' ? 'مثال: تفعيل أو {VAR_NAME}' : 'Example: active or {VAR_NAME}'}
                                                  style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--control-border)',
                                                    background: 'var(--control-bg)',
                                                    color: 'var(--text-main)'
                                                  }}
                                                />
                                                <button
                                                  type="button"
                                                  className="btn"
                                                  style={{ padding: '0.35rem 0.6rem', height: '40px' }}
                                                  onClick={() => {
                                                    const keys = Object.keys(systemVariables || {});
                                                    if (!keys.length) return;
                                                    const pick = window.prompt(
                                                      language === 'ar'
                                                        ? `اختر متغير (اكتب اسمه بدون { }):\n${keys.map(k => `- ${k} (${(systemVariables[k]?.type) || 'string'})`).join('\n')}`
                                                        : `Pick variable name (without { }):\n${keys.map(k => `- ${k} (${(systemVariables[k]?.type) || 'string'})`).join('\n')}`
                                                    );
                                                    if (!pick) return;
                                                    const name = String(pick).trim();
                                                    if (!Object.prototype.hasOwnProperty.call(systemVariables || {}, name)) return;
                                                    handleUpdateStep(card.id, step.id, 'value', `{${name}}`);
                                                  }}
                                                  disabled={isRunning || Object.keys(systemVariables || {}).length === 0}
                                                  title={language === 'ar' ? 'إدراج متغير' : 'Insert variable'}
                                                >
                                                  {language === 'ar' ? 'Variables' : 'Variables'}
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </label>
                                      )}


                                      {step.assertionType === 'visible' && (
                                        <div className="assertion-mini-card" style={{
                                          background: 'rgba(34,197,94,0.08)',
                                          borderColor: 'rgba(34,197,94,0.35)',
                                          color: 'var(--success, #22c55e)'
                                        }}>
                                          <CheckCircle2 size={16} />
                                          <span>
                                            {language === 'ar' ? 'يتحقق من ظهور العنصر' : 'Checks element visibility'}
                                          </span>
                                          <span style={{ color: 'var(--text-muted)', marginInlineStart: 'auto', fontSize: '0.78rem' }}>
                                            {language === 'ar' ? 'بدون قيمة إضافية' : 'No extra value'}
                                          </span>
                                        </div>
                                      )}

                                      {step.assertionType === 'enabled' && (
                                        <div className="assertion-mini-card" style={{
                                          background: 'rgba(6,182,212,0.08)',
                                          borderColor: 'rgba(6,182,212,0.35)',
                                          color: 'var(--secondary, #06b6d4)'
                                        }}>
                                          <Maximize2 size={16} />
                                          <span>
                                            {language === 'ar' ? 'يتحقق أن العنصر مفعّل' : 'Checks element is enabled'}
                                          </span>
                                          <span style={{ color: 'var(--text-muted)', marginInlineStart: 'auto', fontSize: '0.78rem' }}>
                                            {language === 'ar' ? 'غير معطل' : 'Not disabled'}
                                          </span>
                                        </div>
                                      )}

                                      {step.assertionType === 'disabled' && (
                                        <div className="assertion-mini-card" style={{
                                          background: 'rgba(239,68,68,0.08)',
                                          borderColor: 'rgba(239,68,68,0.35)',
                                          color: 'var(--danger, #ef4444)'
                                        }}>
                                          <XCircle size={16} />
                                          <span>
                                            {language === 'ar' ? 'يتحقق أن العنصر معطل' : 'Checks element is disabled'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {step.action === 'wait' && (
                                    <div className="step-extra-fields">
                                      <label>
                                        <span className="step-label">{language === 'ar' ? 'نوع الانتظار' : 'Wait Type'}</span>
                                        <select
                                          value={step.waitType || 'time'}
                                          onChange={(e) => {
                                            const nextType = e.target.value;
                                            handleUpdateStep(card.id, step.id, 'waitType', nextType);
                                            if (nextType !== 'element') {
                                              handleUpdateStep(card.id, step.id, 'waitCondition', 'visible');
                                              handleUpdateStep(card.id, step.id, 'failOnTimeout', true);
                                            }
                                          }}
                                          disabled={isRunning}
                                        >
                                          <option value="time">{language === 'ar' ? 'انتظار زمني ثابت' : 'Static time wait'}</option>
                                          <option value="element">{language === 'ar' ? 'انتظار مرتبط بعنصر' : 'Element wait'}</option>
                                        </select>
                                      </label>

                                      {(!step.waitType || step.waitType === 'time') ? (
                                        <label className="step-value-field">
                                          <span className="step-label">{language === 'ar' ? 'الانتظار (مللي ثانية - ms)' : 'Wait time (milliseconds - ms)'}</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={step.value || '3000'}
                                            onChange={(e) => handleUpdateStep(card.id, step.id, 'value', e.target.value)}
                                            disabled={isRunning}
                                            placeholder={language === 'ar' ? '3000' : '3000'}
                                          />
                                        </label>
                                      ) : (
                                        <>
                                          {/* ترتيب الحقول: نوع الانتظار ثم Selector type ثم target ثم Optional */}
                                          <label>
                                            <span className="step-label">{language === 'ar' ? 'نوع معرّف العنصر (Selector type)' : 'Selector type'}</span>
                                            <select
                                              value={step.attributeType || step.selector || 'id'}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                handleUpdateStep(card.id, step.id, 'attributeType', v);
                                              }}
                                              disabled={isRunning}
                                            >
                                              <option value="id">{language === 'ar' ? 'الايدي (id)' : 'ID (id)'}</option>
                                              <option value="class">{language === 'ar' ? 'الكلاس (class)' : 'Class (class)'}</option>
                                              <option value="aria">{language === 'ar' ? 'aria-label' : 'aria-label'}</option>
                                              <option value="selector">{language === 'ar' ? 'Selector' : 'Selector'}</option>
                                            </select>
                                          </label>

                                          <label>
                                            <span className="step-label">{language === 'ar' ? 'قيمة معرّف العنصر' : 'Element identifier value'}</span>
                                            <input
                                              type="text"
                                              value={step.target || ''}
                                              onChange={(e) => handleUpdateStep(card.id, step.id, 'target', e.target.value)}
                                              disabled={isRunning}
                                              placeholder={language === 'ar' ? 'مثال: optional-banner أو #optional-banner' : 'Example: optional-banner or #optional-banner'}
                                            />
                                          </label>

                                          <label>
                                            <span className="step-label">{language === 'ar' ? 'عدم إفشال الاختبار عند عدم الظهور (Optional Wait)' : 'Optional wait (do not fail on timeout)'}</span>
                                            <input
                                              type="checkbox"
                                              checked={step.failOnTimeout === false}
                                              onChange={(e) => handleUpdateStep(card.id, step.id, 'failOnTimeout', e.target.checked ? false : true)}
                                              disabled={isRunning}
                                              style={{ width: '18px', height: '18px' }}
                                            />
                                          </label>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="step-row-controls">
                                <button
                                  type="button"
                                  className="btn btn-icon-only"
                                  onClick={() => handleMoveStep(card.id, step.id, -1)}
                                  disabled={isRunning || index === 0}
                                  title={language === 'ar' ? 'نقل للأعلى' : 'Move up'}
                                >
                                  <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-icon-only"
                                  onClick={() => handleMoveStep(card.id, step.id, 1)}
                                  disabled={isRunning || index === steps.length - 1}
                                  title={language === 'ar' ? 'نقل للأسفل' : 'Move down'}
                                >
                                  <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-icon-only btn-danger-outline"
                                  onClick={() => handleRemoveStep(card.id, step.id)}
                                  disabled={isRunning}
                                  title={language === 'ar' ? 'حذف الخطوة' : 'Remove step'}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="card-footer-info">
                        <span>{t('writtenSteps')}: {getBuilderStepsForCard(card).length}</span>
                        {card.steps.length > 0 && (
                          <span>{t('completedSteps')}: {card.steps.filter(s => s.status === 'passed').length}/{card.steps.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button className="add-card-btn" onClick={() => handleAddCard()}>
                  <Plus size={18} />
                  {t('addCustomCard')}
                </button>
              </div>
            </main>

            {/* Right Side: Live Chrome Stream & Console Logs */}
            <aside className="console-panel">
              {/* Live Embedded Chrome Browser Stream Box */}
              <div style={{ marginBottom: '1.25rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg-card)' }}>
                <div className="console-header" style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem' }}>
                  <span className="console-title" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Eye size={16} />
                    {language === 'ar' ? 'البث الحي لمتصفح الاختبار (Live Stream)' : 'Live Chrome Browser Stream'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {liveFrame && (
                      <span className="badge passed" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#22c55e', color: '#fff', fontWeight: 'bold' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span> LIVE
                      </span>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '6px' }}
                      onClick={() => setIsStreamFullscreen(true)}
                      title={language === 'ar' ? 'عرض ملء الشاشة' : 'Fullscreen'}
                    >
                      <Maximize2 size={13} />
                      {language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090d16',
                    height: '280px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: liveFrame ? 'pointer' : 'default'
                  }}
                  onClick={() => { if (liveFrame) setIsStreamFullscreen(true); }}
                  title={liveFrame ? (language === 'ar' ? 'اضغط للتكبير لملء الشاشة' : 'Click to expand to fullscreen') : ''}
                >
                  {liveFrame ? (
                    <img
                      src={liveFrame}
                      alt="Live Chrome Stream"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 1rem' }}>
                      <Eye size={32} style={{ marginBottom: '0.5rem', opacity: 0.35, color: 'var(--primary)' }} />
                      <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5', maxWidth: '280px' }}>
                        {language === 'ar'
                          ? 'شاشة البث الحي متوقفة حالياً. اضغط "تشغيل الاختبارات" لمشاهدة تحركات المتصفح مباشرة داخل هذا المربع.'
                          : 'Live stream is currently idle. Click "Run Tests" to watch live browser execution inside this box.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fullscreen Overlay Stream Modal */}
              {isStreamFullscreen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 99999,
                    background: 'rgba(9, 13, 22, 0.96)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                  }}
                  onClick={() => setIsStreamFullscreen(false)}
                >
                  <div
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 100000 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="badge passed" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#22c55e', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></span> LIVE STREAM
                    </span>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      onClick={() => setIsStreamFullscreen(false)}
                    >
                      <X size={18} />
                      {language === 'ar' ? 'إغلاق ملء الشاشة' : 'Close Fullscreen'}
                    </button>
                  </div>

                  <div style={{ maxWidth: '96vw', maxHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {liveFrame ? (
                      <img
                        src={liveFrame}
                        alt="Fullscreen Live Chrome Stream"
                        style={{ maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 25px 70px rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
                      />
                    ) : (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>
                        <Eye size={48} style={{ marginBottom: '1rem', opacity: 0.4, color: 'var(--primary)' }} />
                        <p style={{ fontSize: '1.1rem', margin: 0 }}>
                          {language === 'ar' ? 'شاشة البث الحي متوقفة حالياً. قم بتشغيل اختبار لبدء البث.' : 'Live stream is currently idle.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="console-header">
                <span className="console-title">
                  <Terminal size={16} />
                  {t('consoleTitle')}
                </span>
                <div className="console-actions">
                  <button className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={clearLogs}>
                    {t('clearConsole')}
                  </button>
                </div>
              </div>
              <div className="console-body">
                {logs.length === 0 ? (
                  <div className="console-empty">
                    <Terminal className="console-empty-icon" />
                    <p>{t('consoleEmpty')}</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={`console-line line-${log.type}`}>
                      <span className="line-time">[{log.time}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </aside>
          </div>
        </>
      ) : activeTab === 'schedule' ? (
        <div className="bug-finder-layout">
          <main className="bug-finder-main">
            <section className="credentials-card" style={{ minHeight: 'auto' }}>
              <h2 className="panel-title">
                <Clock size={18} className="text-primary" />
                {language === 'ar' ? 'جدولة الاختبارات' : 'Schedule Tests'}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {language === 'ar'
                  ? 'اختر الاختبارات المراد جدولتها، رتبها، ثم حدد الوقت والمنطقة الزمنية.'
                  : 'Select the tests to schedule, order them, then choose the time and timezone.'}
              </p>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <label style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {language === 'ar' ? 'قائمة الاختبارات' : 'Test list'}
                  </label>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {testCards.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)' }}>
                        {language === 'ar' ? 'أضف أولاً اختبارات لتستطيع جدولتها.' : 'Add tests first to schedule them.'}
                      </div>
                    ) : (
                      testCards.map((card, idx) => {
                        const selected = scheduledOrder.includes(card.id);
                        return (
                          <div key={card.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.8rem 0.9rem', borderRadius: '14px', background: selected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.08)'}` }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => handleToggleScheduleSelection(card.id)}
                                disabled={isRunning}
                                style={{ width: '18px', height: '18px' }}
                              />
                              <span style={{ fontWeight: 600 }}>{card.title || `${language === 'ar' ? 'اختبار' : 'Test'} ${idx + 1}`}</span>
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              <span>{card.type === 'all' ? (language === 'ar' ? 'عام' : 'General') : card.type}</span>
                              <span>·</span>
                              <span>{card.status === 'idle' ? (language === 'ar' ? 'جاهز' : 'Idle') : card.status}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-icon-only"
                                onClick={() => handleReorderScheduledCard(card.id, -1)}
                                disabled={!selected || scheduledOrder.indexOf(card.id) <= 0}
                                title={language === 'ar' ? 'نقل للأعلى' : 'Move up'}
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                className="btn btn-icon-only"
                                onClick={() => handleReorderScheduledCard(card.id, 1)}
                                disabled={!selected || scheduledOrder.indexOf(card.id) === -1 || scheduledOrder.indexOf(card.id) >= scheduledOrder.length - 1}
                                title={language === 'ar' ? 'نقل للأسفل' : 'Move down'}
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <span>{t('scheduleTypeLabel')}</span>
                    <select
                      className="input-field"
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value)}
                      disabled={isRunning}
                    >
                      <option value="once">{t('scheduleOnce')}</option>
                      <option value="daily">{t('scheduleDaily')}</option>
                      <option value="weekly">{t('scheduleWeekly')}</option>
                    </select>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                    {scheduleType === 'once' && (
                      <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span>{t('executionDateTime')}</span>
                        <input
                          type="datetime-local"
                          className="input-field"
                          value={scheduleDateTime}
                          onChange={(e) => setScheduleDateTime(e.target.value)}
                          disabled={isRunning}
                        />
                      </label>
                    )}

                    {scheduleType === 'weekly' && (
                      <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span>{t('scheduleDayOfWeekLabel')}</span>
                        <select
                          className="input-field"
                          value={scheduleDayOfWeek}
                          onChange={(e) => setScheduleDayOfWeek(e.target.value)}
                          disabled={isRunning}
                        >
                          <option value="0">{t('sunday')}</option>
                          <option value="1">{t('monday')}</option>
                          <option value="2">{t('tuesday')}</option>
                          <option value="3">{t('wednesday')}</option>
                          <option value="4">{t('thursday')}</option>
                          <option value="5">{t('friday')}</option>
                          <option value="6">{t('saturday')}</option>
                        </select>
                      </label>
                    )}

                    {(scheduleType === 'daily' || scheduleType === 'weekly') && (
                      <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span>{t('scheduleTimeLabel')}</span>
                        <input
                          type="time"
                          className="input-field"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          disabled={isRunning}
                        />
                      </label>
                    )}

                    <label className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span>{t('timezone')}</span>
                      <select
                        className="input-field"
                        value={scheduleTimeZone}
                        onChange={(e) => setScheduleTimeZone(e.target.value)}
                        disabled={isRunning}
                      >
                        {TIMEZONE_OPTIONS.map((zone) => (
                          <option key={zone} value={zone}>{formatTimezoneLabel(zone)}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={handleScheduleRun} disabled={isRunning || scheduledOrder.length === 0}>
                      {language === 'ar' ? 'جدولة التشغيل' : 'Schedule run'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleRunScheduledNow} disabled={isRunning || scheduledOrder.length === 0}>
                      {language === 'ar' ? 'تشغيل الآن' : 'Run now'}
                    </button>
                    <button className="btn btn-danger-outline" onClick={handleCancelSchedule} disabled={scheduleStatus !== 'scheduled'}>
                      {language === 'ar' ? 'إلغاء الجدولة' : 'Cancel schedule'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 700 }}>{language === 'ar' ? 'حالة الجدولة' : 'Schedule status'}</span>
                    <div style={{ color: 'var(--text-main)' }}>
                      {scheduleStatus === 'idle' && (language === 'ar' ? 'غير مجدولة' : 'Idle')}
                      {scheduleStatus === 'scheduled' && (language === 'ar' ? 'مجدولة للتنفيذ' : 'Scheduled to run')}
                      {scheduleStatus === 'running' && (language === 'ar' ? 'تشغيل الآن' : 'Running now')}
                    </div>
                    {getScheduledTimestamp() && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {language === 'ar' ? 'الموعد القادم للتنفيذ' : 'Next scheduled run'}: {new Date(getScheduledTimestamp()).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { timeZone: scheduleTimeZone, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <aside className="console-panel">
              <div className="console-header">
                <span className="console-title">
                  <Terminal size={16} />
                  {language === 'ar' ? 'سجل الجدولة' : 'Schedule log'}
                </span>
                <div className="console-actions">
                  <button className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={clearLogs}>
                    {t('clearConsole')}
                  </button>
                </div>
              </div>
              <div className="console-body">
                {logs.length === 0 ? (
                  <div className="console-empty">
                    <Terminal className="console-empty-icon" />
                    <p>{t('consoleEmpty')}</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={`console-line line-${log.type}`}>
                      <span className="line-time">[{log.time}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </aside>
          </main>
        </div>
      ) : (
        <div className="bug-finder-layout">
          <main className="bug-finder-main">
            <section className="credentials-card bug-finder-panel">
              <h2 className="panel-title">
                <ShieldAlert size={18} className="text-warning" />
                {language === 'ar' ? 'إعدادات اكتشاف البجز عبر MCP' : 'MCP Bug Finder Settings'}
              </h2>
              <div className="bug-form-grid">
                <div className="input-wrapper bug-url-field">
                  <label htmlFor="bug-url">{language === 'ar' ? 'رابط الموقع' : 'Website URL'}</label>
                  <input
                    id="bug-url"
                    className="input-field"
                    value={bugScan.url}
                    onChange={(e) => setBugScan({ ...bugScan, url: e.target.value })}
                    placeholder="https://example.com/login"
                    disabled={isBugScanRunning}
                  />
                </div>
                <div className="input-wrapper">
                  <label htmlFor="bug-username">{language === 'ar' ? 'الإيميل أو اسم المستخدم' : 'Email or username'}</label>
                  <input
                    id="bug-username"
                    className="input-field"
                    value={bugScan.username}
                    onChange={(e) => setBugScan({ ...bugScan, username: e.target.value })}
                    placeholder="user@example.com"
                    disabled={isBugScanRunning}
                  />
                </div>
                <div className="input-wrapper">
                  <label htmlFor="bug-password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                  <input
                    id="bug-password"
                    className="input-field"
                    type="password"
                    value={bugScan.password}
                    onChange={(e) => setBugScan({ ...bugScan, password: e.target.value })}
                    placeholder="password"
                    disabled={isBugScanRunning}
                  />
                </div>
              </div>
              <div className="input-wrapper">
                <label htmlFor="bug-prompt">{language === 'ar' ? 'برومبت الفحص: احكيله من وين أو شو بدك يطلع البجز' : 'Scan prompt: tell it where to find bugs'}</label>
                <textarea
                  id="bug-prompt"
                  className="prompt-textarea bug-prompt"
                  value={bugScan.prompt}
                  onChange={(e) => setBugScan({ ...bugScan, prompt: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: افحص صفحة تسجيل الدخول والسلة والدفع والروابط المكسورة' : 'Example: scan login, cart, checkout, and broken links'}
                  disabled={isBugScanRunning}
                />
              </div>
              <div className="bug-actions">
                <button className="btn btn-primary" onClick={runBugFinder} disabled={isBugScanRunning}>
                  {isBugScanRunning ? <RefreshCw size={16} /> : <Search size={16} />}
                  {isBugScanRunning ? (language === 'ar' ? 'جاري الفحص...' : 'Scanning...') : (language === 'ar' ? 'تشغيل Bug Finder' : 'Run Bug Finder')}
                </button>
                {bugScanProgress && <span className="bug-progress">{bugScanProgress}</span>}
              </div>
            </section>

            <section className="bug-report-panel">
              <div className="bug-report-header">
                <div>
                  <span className="bug-report-kicker">AetherTest MCP Bug Finder</span>
                  <h2>{language === 'ar' ? 'تقرير البجز' : 'Bug Report'}</h2>
                </div>
                <button className="btn btn-success" onClick={handlePrint} disabled={!bugReport}>
                  <FileText size={16} />
                  {language === 'ar' ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}
                </button>
              </div>

              {!bugReport ? (
                <div className="bug-empty-report">
                  <Bug size={34} />
                  <p>{language === 'ar' ? 'شغّل الفحص ليظهر هنا تقرير واضح ومفصل بكل البجز المكتشفة.' : 'Run a scan to generate a clear, detailed bug report here.'}</p>
                </div>
              ) : (
                <>
                  <div className="report-summary-cards">
                    <div className="stat-card stat-info">
                      <span className="stat-label">{language === 'ar' ? 'صفحات مفحوصة' : 'Scanned pages'}</span>
                      <span className="stat-value">{bugReport.summary?.scannedPages || 0}</span>
                    </div>
                    <div className="stat-card stat-danger">
                      <span className="stat-label">{language === 'ar' ? 'إجمالي البجز' : 'Total bugs'}</span>
                      <span className="stat-value">{bugReport.summary?.totalBugs || 0}</span>
                    </div>
                    <div className="stat-card stat-danger">
                      <span className="stat-label">{language === 'ar' ? 'حرج / عالي' : 'Critical / High'}</span>
                      <span className="stat-value">{(bugReport.summary?.critical || 0) + (bugReport.summary?.high || 0)}</span>
                    </div>
                    <div className="stat-card stat-success">
                      <span className="stat-label">{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                      <span className="stat-value">{bugReport.summary?.loggedIn ? (language === 'ar' ? 'تم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</span>
                    </div>
                  </div>

                  <div className="bug-report-meta">
                    <div>
                      <span>{language === 'ar' ? 'الموقع' : 'Target'}</span>
                      <strong>{bugReport.targetUrl}</strong>
                    </div>
                    <div>
                      <span>{language === 'ar' ? 'البرومبت' : 'Prompt'}</span>
                      <strong>{bugReport.prompt || (language === 'ar' ? 'بدون برومبت' : 'No prompt')}</strong>
                    </div>
                  </div>

                  <div className="bug-list">
                    {bugReport.bugs.length === 0 ? (
                      <div className="bug-empty-report">
                        <CheckCircle2 size={34} className="text-success" />
                        <p>{language === 'ar' ? 'لم يتم العثور على بجز واضحة في هذا الفحص.' : 'No clear bugs were found in this scan.'}</p>
                      </div>
                    ) : (
                      bugReport.bugs.map((bug, index) => (
                        <article key={bug.id} className={`bug-report-item severity-${bug.severity}`}>
                          <div className="bug-item-top">
                            <div>
                              <span className={`severity-pill severity-${bug.severity}`}>{severityLabel(bug.severity)}</span>
                              <span className="bug-category">{bug.category}</span>
                            </div>
                            <span className="bug-index">#{index + 1}</span>
                          </div>
                          <h3>{bug.title}</h3>
                          <p>{bug.description}</p>
                          <div className="bug-detail-grid">
                            <div>
                              <span>{language === 'ar' ? 'الدليل' : 'Evidence'}</span>
                              <code>{bug.evidence}</code>
                            </div>
                            <div>
                              <span>{language === 'ar' ? 'التوصية' : 'Recommendation'}</span>
                              <p>{bug.recommendation}</p>
                            </div>
                          </div>
                          <a className="bug-url" href={bug.url} target="_blank" rel="noopener noreferrer">{bug.url}</a>
                          {bug.screenshotUrl && (
                            <img
                              src={bug.screenshotUrl}
                              alt={language === 'ar' ? 'صورة توضح البج' : 'Bug screenshot'}
                              className="screenshot-thumbnail"
                              onClick={() => setLightboxImg(bug.screenshotUrl)}
                            />
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>
          </main>

          <aside className="console-panel bug-console">
            <div className="console-header">
              <span className="console-title">
                <Terminal size={16} />
                {language === 'ar' ? 'سجل Bug Finder المباشر' : 'Live Bug Finder Logs'}
              </span>
              <button className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={clearLogs}>
                {t('clearConsole')}
              </button>
            </div>
            <div className="console-body">
              {logs.length === 0 ? (
                <div className="console-empty">
                  <Terminal className="console-empty-icon" />
                  <p>{language === 'ar' ? 'سجل الفحص فارغ حاليا.' : 'The scan log is empty.'}</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`console-line line-${log.type}`}>
                    <span className="line-time">[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </aside>
        </div>
      )}

      {/* Beautiful PDF/HTML Report Modal */}
      {isReportOpen && (
        <div className="modal-overlay" onClick={() => setIsReportOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileCheck size={24} className="text-success" />
                <h2>{t('reportTitle')}</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-success" onClick={handlePrint}>
                  <FileText size={16} />
                  {t('printReport')}
                </button>
                <button className="btn btn-secondary" onClick={downloadReportHtml}>
                  📄 {t('downloadHtmlReport')}
                </button>
                <button className="btn btn-icon-only" onClick={() => setIsReportOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* Shareable Live Report Link Generator Panel */}
              <div style={{ background: 'linear-gradient(135deg, rgba(99, 85, 255, 0.12), rgba(16, 185, 129, 0.12))', border: '2px solid var(--primary)', padding: '1.25rem', borderRadius: '14px', marginBottom: '1.25rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: '800', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔗 {language === 'ar' ? 'توليد رابط التقرير التفاعلي المباشر (للمشاركة بالإيميل)' : 'Generate Shareable Live Web Report Link'}
                  </h3>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleGenerateShareableReportLink}
                    disabled={isGeneratingLink}
                    style={{ padding: '0.5rem 1.25rem', fontWeight: 'bold', fontSize: '0.9rem', borderRadius: '8px', background: 'var(--primary)', boxShadow: '0 4px 15px var(--primary-glow)' }}
                  >
                    {isGeneratingLink ? (language === 'ar' ? '⏳ جاري التوليد...' : '⏳ Generating...') : (language === 'ar' ? '✨ توليد رابط التقرير الآن' : '✨ Generate Report Link')}
                  </button>
                </div>

                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {language === 'ar' 
                    ? 'اضغط الزر أعلاه لتوليد رابط تفاعلي مباشر لتقريرك. يمكنك نسخ الرابط ولصقه في أي إيميل ليرى مستلم الإيميل التقرير كاملاً مع الفيديو والإحصائيات!' 
                    : 'Click the button above to generate a shareable live report URL. Copy and paste it into any email for anyone to view!'}
                </p>

                {generatedReportUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--control-bg)', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #22c55e', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedReportUrl} 
                      style={{ flex: 1, minWidth: '220px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--control-border)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }} 
                    />
                    <button 
                      className="btn btn-success" 
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px', fontWeight: 'bold' }}
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(generatedReportUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }
                      }}
                    >
                      {copiedLink ? '✅ تم النسخ!' : '📋 نسخ الرابط'}
                    </button>
                    <a 
                      href={generatedReportUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px', textDecoration: 'none' }}
                    >
                      🔗 {language === 'ar' ? 'فتح التقرير' : 'Open Link'}
                    </a>
                  </div>
                )}
              </div>

              {/* Target Website & Credentials Details Panel */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', fontWeight: '700' }}>
                  🌐 {t('runDetails')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('targetWebsite')} </span>
                    <a href={credentials.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>{credentials.url}</a>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('reportUsername')} </span>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>{credentials.username || t('notEntered')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('autoLoginStatus')} </span>
                    <strong style={{ color: credentials.autoLogin ? 'var(--success)' : 'var(--text-dark)', fontSize: '0.9rem', display: 'block', marginTop: '0.2rem' }}>{credentials.autoLogin ? t('enabled') : t('disabled')}</strong>
                  </div>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="report-summary-cards">
                <div className="stat-card stat-info">
                  <span className="stat-label">{t('totalCards')}</span>
                  <span className="stat-value">{totalTests}</span>
                </div>
                <div className="stat-card stat-success">
                  <span className="stat-label">{t('passedTests')}</span>
                  <span className="stat-value">{passedTests}</span>
                </div>
                <div className="stat-card stat-danger">
                  <span className="stat-label">{t('failedTests')}</span>
                  <span className="stat-value">{failedTests}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">{t('passRate')}</span>
                  <span className="stat-value">{passRate}%</span>
                </div>
              </div>

              <section className="email-report-panel" style={{ margin: '1.5rem 0', padding: '1.25rem', border: '2px solid var(--primary)', borderRadius: '14px', background: 'var(--soft-panel-bg)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: '800' }}>{t('sendReportByEmail')}</h3>

                {/* Highly Visible Resend API Key Field at top of email section */}
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22c55e', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                  <label htmlFor="resend-api-key" style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    🚀 {language === 'ar' ? 'مفتاح Resend API للإرسال الفوري للبريد (مستوصى به لـ Render/Vercel)' : 'Resend API Key (Recommended for Cloud Servers)'}
                  </label>
                  <input
                    id="resend-api-key"
                    type="password"
                    className="input-field"
                    value={reportEmail.apiKey || ''}
                    onChange={(e) => setReportEmail(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="ضع الكود هنا (يبدأ بـ re_...)"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #22c55e', background: 'var(--control-bg)', color: 'var(--text-main)', fontWeight: 'bold' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem', lineHeight: '1.4' }}>
                    {language === 'ar' 
                      ? '💡 نصيحة: احصل على مفتاح مجاني في 10 ثوانٍ من موقع resend.com وضعه هنا لضمان الإرسال المباشر للإيميل الحقيقي دون حظر المنافذ.' 
                      : '💡 Tip: Get a free key from resend.com in 10 seconds for direct email inbox delivery.'}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <div className="input-wrapper">
                    <label htmlFor="sender-email-input">{t('senderEmail')}</label>
                    <input
                      id="sender-email-input"
                      type="email"
                      className="input-field"
                      value={reportEmail.senderEmail}
                      onChange={(e) => setReportEmail(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="sender@example.com"
                    />
                  </div>
                  <div className="input-wrapper">
                    <label htmlFor="recipient-email-input">{t('recipientEmail')}</label>
                    <input
                      id="recipient-email-input"
                      type="email"
                      className="input-field"
                      value={reportEmail.recipientEmail}
                      onChange={(e) => setReportEmail(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div className="input-wrapper">
                    <label htmlFor="email-subject-input">{t('emailSubject')}</label>
                    <input
                      id="email-subject-input"
                      type="text"
                      className="input-field"
                      value={reportEmail.subject}
                      onChange={(e) => setReportEmail(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="email-body-input">{t('emailBody')}</label>
                    <textarea
                      id="email-body-input"
                      className="input-field"
                      rows={4}
                      value={reportEmail.body}
                      onChange={(e) => setReportEmail(prev => ({ ...prev, body: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
                  <h4 style={{ marginBottom: '0.75rem' }}>{t('smtpSettingsSection')}</h4>
                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <div className="input-wrapper">
                      <label htmlFor="smtp-host-input">{t('smtpHost')}</label>
                      <input
                        id="smtp-host-input"
                        type="text"
                        className="input-field"
                        value={reportEmail.smtpHost}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="input-wrapper">
                      <label htmlFor="smtp-port-input">{t('smtpPort')}</label>
                      <input
                        id="smtp-port-input"
                        type="text"
                        className="input-field"
                        value={reportEmail.smtpPort}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, smtpPort: e.target.value }))}
                      />
                    </div>
                    <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <input
                        id="smtp-secure-input"
                        type="checkbox"
                        checked={reportEmail.smtpSecure}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                      />
                      <label htmlFor="smtp-secure-input">{t('smtpSecure')} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({t('smtpSecureHelp')})</span></label>
                    </div>
                    <div className="input-wrapper">
                      <label htmlFor="smtp-user-input">{t('smtpUser')}</label>
                      <input
                        id="smtp-user-input"
                        type="text"
                        className="input-field"
                        value={reportEmail.smtpUser}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, smtpUser: e.target.value }))}
                      />
                    </div>
                    <div className="input-wrapper">
                      <label htmlFor="smtp-pass-input">{t('smtpPass')}</label>
                      <input
                        id="smtp-pass-input"
                        type="password"
                        className="input-field"
                        value={reportEmail.smtpPass}
                        onChange={(e) => setReportEmail(prev => ({ ...prev, smtpPass: e.target.value }))}
                      />
                    </div>
                  </div>
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('smtpHint')}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={reportEmail.autoSend || false}
                      onChange={(e) => setReportEmail(prev => ({ ...prev, autoSend: e.target.checked }))}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    {t('autoSendReport')}
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={handleSaveEmailSettings}>
                      {t('saveEmailSettings')}
                    </button>
                    <button className="btn btn-success" onClick={handleSendReportEmail} disabled={emailSending}>
                      {emailSending ? t('sendingEmail') : t('sendEmailButton')}
                    </button>
                  </div>
                  {emailFeedback && (
                    <div style={{ color: emailFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {emailFeedback.message}
                    </div>
                  )}
                  {emailPreviewUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                      <div style={{ color: 'var(--success)' }}>
                        <a href={emailPreviewUrl} target="_blank" rel="noreferrer">{emailPreviewUrl}</a>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px', marginTop: '0.25rem' }}>
                        {t('etherealNotice')}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Detailed Test Results */}
              <div className="report-details-section">
                <h3>{t('detailedResults')}</h3>

                {testCards.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>{t('noReportData')}</p>
                ) : (
                  testCards.map((card) => (
                    <div key={card.id} className="report-card-row">
                      <div className="report-card-header">
                        <span className="report-card-title">
                          {card.status === 'passed' ? (
                            <CheckCircle2 size={18} className="text-success" />
                          ) : card.status === 'failed' ? (
                            <XCircle size={18} className="text-danger" />
                          ) : (
                            <HelpCircle size={18} className="text-muted" />
                          )}
                          {card.title}
                        </span>
                        <span className={`card-status-badge badge-${card.status}`}>
                          {card.status === 'idle' && t('notRun')}
                          {card.status === 'running' && t('running')}
                          {card.status === 'passed' && t('passed')}
                          {card.status === 'failed' && t('failed')}
                        </span>
                      </div>

                      <div className="report-steps-list">
                        {card.steps.length === 0 ? (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                            {t('noTrackedSteps')}
                          </p>
                        ) : (
                          card.steps.map((step, idx) => (
                            <div
                              key={idx}
                              className={`report-step-item ${step.status === 'passed' ? 'success' : 'failed'}`}
                            >
                              <div className="step-row-top">
                                <div className="step-info-block">
                                  <span className="step-title">{step.title || step.text}</span>
                                  <span className="step-number">{idx + 1}</span>
                                  {step.title && <span className="step-desc">{step.text}</span>}
                                </div>
                                <div className="step-meta">
                                  {step.duration && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                      <Clock size={12} />
                                      {step.duration}{t('secondsSuffix')}
                                    </span>
                                  )}
                                  <span>{step.status === 'passed' ? t('passed') : t('failed')}</span>
                                </div>
                              </div>

                              {step.status === 'failed' && (
                                <>
                                  <div className="step-error-msg">
                                    <strong>{t('failureReason')}</strong> {step.error}
                                  </div>

                                  {step.screenshotUrl && (
                                    <div className="screenshot-thumbnail-container">
                                      <span>📸 {t('screenshotLabel')}</span>
                                      <img
                                        src={step.screenshotUrl}
                                        alt={t('screenshotAlt')}
                                        className="screenshot-thumbnail"
                                        onClick={() => setLightboxImg(step.screenshotUrl)}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {card.videoUrl && (
                        <div className="report-video-section">
                          <span className="report-video-label">🎥 {language === 'ar' ? 'فيديو التشغيل' : 'Run video'}</span>
                          <video className="report-video-player" controls>
                            <source src={card.videoUrl} type="video/webm" />
                            {language === 'ar' ? 'المتصفح لا يدعم عنصر الفيديو.' : 'Your browser does not support the video element.'}
                          </video>
                          <a href={card.videoUrl} target="_blank" rel="noreferrer" className="report-video-link">
                            {language === 'ar' ? 'افتح الفيديو في صفحة جديدة' : 'Open video in new tab'}
                          </a>
                        </div>
                      )}

                      {Array.isArray(card.logHistory) && card.logHistory.length > 0 && (
                        <div className="report-log-history">
                          <div className="report-log-header">{language === 'ar' ? 'سجل التشغيل' : 'Execution Log'}</div>
                          <ul>
                            {card.logHistory.map((entry, idx) => (
                              <li key={idx}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for failure screenshots */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} className="lightbox-img" alt={t('lightboxAlt')} />
        </div>
      )}

      {codeModalOpen && (
        <div className="modal-overlay" onClick={() => setCodeModalOpen(false)}>
          <div className="modal-content code-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={24} className="text-primary" />
                <h2>{codeModalTitle}</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-success" onClick={() => copyCode(codeModalContent)}>
                  <Copy size={16} />
                  {language === 'ar' ? 'نسخ الكود' : 'Copy code'}
                </button>
                <button className="btn btn-icon-only" onClick={() => setCodeModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modal-body code-modal-body">
              <pre className="code-block"><code>{codeModalContent}</code></pre>
            </div>
          </div>
        </div>
      )}

      {/* User Guide Modal */}
      {isGuideOpen && (
        <div 
          className="modal-backdrop" 
          onClick={() => setIsGuideOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            background: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              border: '1px solid var(--border-glow)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              padding: '1.75rem',
              background: 'var(--bg-surface-solid)',
              color: 'var(--text-main)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'var(--primary-glow)', padding: '0.5rem', borderRadius: '10px', color: 'var(--primary)', display: 'flex' }}>
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                    {language === 'ar' ? '📖 دليل الاستخدام الشامل لنظام AetherTest AI' : '📖 AetherTest AI Complete User Guide'}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {language === 'ar' ? 'تعلم كيفية إنشاء واختبار سيناريوهات جودة المواقع بدون كود في دقائق' : 'Learn how to create and run automated no-code web tests in minutes'}
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-icon-only btn-danger-outline" 
                onClick={() => setIsGuideOpen(false)}
                style={{ padding: '0.4rem', borderRadius: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Guide Body Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Step 1 */}
              <div style={{ background: 'var(--soft-panel-bg)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'var(--primary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
                  {language === 'ar' ? 'إدخال بيانات ورابط الموقع المستهدف' : 'Target Website Credentials'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {language === 'ar' 
                    ? 'في لوحة "البيانات والمحددات العامة": أدخل رابط الموقع (URL) المراد اختباره (مثل https://example.com/login). إذا كان الموقع يتطلب تسجيل دخول، أدخل اسم المستخدم وكلمة المرور وفعّل ميزة الدخول التلقائي (Auto-Login).'
                    : 'In the Target Credentials panel: Enter the website URL (e.g. https://example.com/login). If the site requires login, enter username/password and enable Auto-Login.'}
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ background: 'var(--soft-panel-bg)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--secondary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'var(--secondary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>2</span>
                  {language === 'ar' ? 'إنشاء كروت الاختبار وتحديد الخطوات' : 'Creating Test Cards & Steps'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {language === 'ar' 
                    ? 'اضغط على "إضافة كارت اختبار جديد" أو اختر أحد القوالب الجاهزة. يمكنك كتابة الخطوات باللغة الطبيعية (عربي/إنجليزي) مثل:\n• انقر على زر الدخول\n• اكتب "محمد" في حقل اسم المستخدم\n• تأكد من وجود "مرحباً بك"'
                    : 'Click "Add Custom Test Card" or pick a Quick Preset. Write test steps in plain text or structured steps:\n• click login button\n• type "John" into username field\n• verify text "Welcome"'}
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ background: 'var(--soft-panel-bg)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'var(--success)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>3</span>
                  {language === 'ar' ? 'التشغيل والبث الحي للمتصفح' : 'Execution & Live Streaming'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {language === 'ar' 
                    ? 'اضغط على "تشغيل جميع الاختبارات" أو زر التشغيل المنفرد للكارت. يمكنك متابعة تحركات المتصفح حية عبر مربع "البث الحي (Live Stream)" وضغط زر "ملء الشاشة" لتكبير العرض ملء الشاشة!'
                    : 'Click "Run All Tests" or individual card run button. Watch browser actions live inside the "Live Stream" box and click "Fullscreen" to expand to full screen!'}
                </p>
              </div>

              {/* Step 4 */}
              <div style={{ background: 'var(--soft-panel-bg)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#8b5cf6', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: '#8b5cf6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>4</span>
                  {language === 'ar' ? 'التقارير الفنية وإرسال البريد' : 'Smart Reports & Email Delivery'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {language === 'ar' 
                    ? 'عند اكتمال الاختبارات، يظهر لك التقرير الفني الشامل مع إحصائيات ولقطات شاشة. يمكنك تصدير التقرير PDF/HTML أو إرساله تلقائياً للبريد الإلكتروني.'
                    : 'Upon completion, a comprehensive smart report is generated with stats & screenshots. You can export PDF/HTML or auto-send via email.'}
                </p>
              </div>

              {/* Step 5 */}
              <div style={{ background: 'var(--soft-panel-bg)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: '#f59e0b', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>5</span>
                  {language === 'ar' ? 'فحص الثغرات والأخطاء (Bug Finder MCP)' : 'Automated Bug Scan'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {language === 'ar' 
                    ? 'انتقل لتبويب "Bug Finder MCP" لفحص موقعك تلقائياً واكتشاف أخطاء JavaScript والروابط المعطلة والاستجابات البطيئة مع شروحات وتوصيات الحل لكل مشكلة.'
                    : 'Switch to "Bug Finder MCP" tab to scan your site for JS console errors, broken links, and HTTP failures with automatic fix recommendations.'}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsGuideOpen(false)}
                style={{ padding: '0.5rem 1.5rem', fontWeight: 'bold', borderRadius: '8px' }}
              >
                {language === 'ar' ? 'فهمت ذلك، ابدأ الآن 🚀' : 'Got it, let\'s start 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
