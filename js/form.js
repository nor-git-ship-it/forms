'use strict';

const SCRIPT_VERSION = '1.0';
const VERSION_LOG_STYLE = 'background:#16a34a;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;';
console.log(`%c[Form JS IP] Loaded version ${SCRIPT_VERSION}`, VERSION_LOG_STYLE);

/* =========================
  Logging configuration
  ========================= */
const LOG_STYLES = {
  info: 'background:#16a34a;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
  success: 'background:#16a34a;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
  warn: 'background:#dc2626;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
  error: 'background:#dc2626;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
  debug: 'background:#dc2626;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;'
};

const ENABLE_DEBUG_LOGS = true;
const DEBUG_ENABLED = ENABLE_DEBUG_LOGS && (typeof window === 'undefined' || window.__IP_DEBUG__ !== true);

const APP_CONFIG = {
  api: {
    microlinkBase: 'https://api.microlink.io',
    ipifyV4: 'https://api4.ipify.org?format=json',
    ipifyV6: 'https://api6.ipify.org?format=json',
    freeIpApiBase: 'https://free.freeipapi.com/api/json/'
  },
  timing: {
    websiteFetchDebounceMs: 650,
    timeoutIpLookupMs: 5000,
    timeoutIpMetadataMs: 7000,
    timeoutWebsiteMetadataMs: 8000
  },
  storage: {
    uiLanguageOverrideKey: 'ipScript.uiLanguageOverride'
  },
  selectors: {
    emailFieldByName: 'input[type="email"][name="emailaddress1"], input[name="emailaddress1"]',
    emailFieldByTitle: 'input[type="email"][title="Email"], input[title="Email"]',
    websiteFieldByName: 'input[type="url"][name="websiteurl"], input[name="websiteurl"]',
    websiteFieldByTitle: 'input[type="url"][title="Website"], input[title="Website"]',
    websiteFieldById: 'websiteurl-1771565727350',
    websiteInfoFieldByTitle: 'textarea[title="Website Info"], input[title="Website Info"]',
    websiteInfoFieldByName: 'textarea[name="Website Info"], input[name="Website Info"]',
    websiteInfoFieldById: 'longtext4893-1771565754879',
    insightsFieldByTitle: 'textarea[title="Insights"], input[title="Insights"]',
    insightsFieldByName: 'textarea[name="Insights"], input[name="Insights"]',
    languageFieldByName: 'select[name="mspp_userpreferredlcid"]',
    languageFieldById: 'mspp_userpreferredlcid-1771569555060',
    fieldSchema: {
      firstName: {
        names: ['firstname'],
        ids: [],
        titles: ['First Name', 'First name']
      },
      lastName: {
        names: ['lastname'],
        ids: [],
        titles: ['Last Name', 'Last name']
      },
      email: {
        names: ['emailaddress1'],
        ids: [],
        titles: ['Email', 'Email address']
      },
      website: {
        names: ['websiteurl'],
        ids: ['websiteurl-1772578629727'],
        titles: ['Website']
      },
      websiteInfo: {
        names: ['Website Info'],
        ids: ['longtext663-1772578715324'],
        titles: ['Website Info']
      },
      insights: {
        names: ['Insights'],
        ids: [],
        titles: ['Insights']
      },
      phone: {
        names: ['mobilephone', 'address1_telephone1'],
        ids: [],
        titles: ['Phone', 'Phone number']
      },
      inquiry: {
        names: ['longtext8582', 'description'],
        ids: [],
        titles: ['Inquiry', 'Description', 'Message']
      },
      companyName: {
        names: ['companyname'],
        ids: [],
        titles: ['Company name', 'Company Name']
      },
      industry: {
        names: ['industry', 'industrycode'],
        ids: [],
        titles: ['Industry']
      },
      jobTitle: {
        names: ['jobtitle'],
        ids: [],
        titles: ['Job title', 'Job Title']
      },
      country: {
        names: ['countryName'],
        ids: [],
        titles: ['Country']
      },
      campaign: {
        names: ['campaignid'],
        ids: [],
        titles: ['Source Campaign']
      },
      language: {
        names: ['mspp_userpreferredlcid', 'Language'],
        ids: ['fc83727d-ad24-4e7b-a71e-eb1ea6e11185'],
        titles: ['Language', 'Field label']
      },
      utm: {
        names: ['utm', 'crm_utm'],
        ids: [],
        titles: ['UTM', 'UTM Params', 'UTM Parameters']
      }
    }
  }
};

/* =========================
  Website autofill configuration
  ========================= */
// Top 10 common free providers (website should NOT be auto-derived from these domains).
const COMMON_FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
   'outlook.co.uk',
  'hotmail.com',
    'hotmail.co.uk',
  'yahoo.com',
  'icloud.com',
  'aol.com',
  'live.com',
  'msn.com',
  'proton.me',
  'protonmail.com'
];

// Add custom free domains here as needed.
const ADDITIONAL_FREE_EMAIL_DOMAINS = [
  
];

/* =========================
  Logging helpers
  ========================= */
function getTimestamp() {
  return new Date().toISOString();
}

function logInfo(...args) {
  console.log('%c[Form JS IP]', LOG_STYLES.info, ...args);
}

function logSuccess(...args) {
  console.log('%c[Form JS IP]', LOG_STYLES.success, ...args);
}

function logWarn(...args) {
  console.warn('%c[Form JS IP]', LOG_STYLES.warn, ...args);
}

function logError(...args) {
  console.error('%c[Form JS IP]', LOG_STYLES.error, ...args);
}

function logDebug(...args) {
  if (!DEBUG_ENABLED) {
    return;
  }

  console.debug('%c[Form JS IP]', LOG_STYLES.debug, ...args);
}

function updateDebugState(patch) {
  try {
    const current = window.__IP_DEBUG_STATE__ || {};
    window.__IP_DEBUG_STATE__ = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    logDebug('Unable to update window.__IP_DEBUG_STATE__.', error?.message || error);
  }
}

function persistCapturedMetaValue(key, value, source) {
  const normalizedKey = String(key || '').trim();
  const normalizedValue = String(value || '').trim();
  if (!normalizedKey || !normalizedValue) {
    return false;
  }

  try {
    localStorage.setItem(normalizedKey, normalizedValue);
    logInfo('Persisted captured value to localStorage.', {
      key: normalizedKey,
      value: normalizedValue,
      source: source || 'unknown'
    });
    return true;
  } catch (error) {
    logWarn('Unable to persist captured value to localStorage.', {
      key: normalizedKey,
      source: source || 'unknown',
      message: error?.message || error
    });
    return false;
  }
}

/* =========================
   General utility helpers
   ========================= */
// logic function
function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

// logic function - Returns a normalized, deduplicated set of domains to ignore for website autofill.
function getFreeEmailDomainSet() {
  return new Set(
    [...COMMON_FREE_EMAIL_DOMAINS, ...ADDITIONAL_FREE_EMAIL_DOMAINS]
      .map((item) => normalizeText(item))
      .filter(Boolean)
  );
}

function queryFirst(selectors) {
  for (const selector of selectors || []) {
    const found = document.querySelector(selector);
    if (found) {
      return found;
    }
  }

  return null;
}

function getFieldFromSchema(schemaKey) {
  const schema = APP_CONFIG.selectors.fieldSchema[schemaKey];
  if (!schema) {
    logWarn('Schema key not found in fieldSchema.', { schemaKey });
    return null;
  }

  const byNames = (schema.names || []).flatMap((name) => [
    `input[name="${name}"]`,
    `textarea[name="${name}"]`,
    `select[name="${name}"]`
  ]);

  const byTitles = (schema.titles || []).flatMap((title) => [
    `input[title="${title}"]`,
    `textarea[title="${title}"]`,
    `select[title="${title}"]`
  ]);

  const byIds = (schema.ids || []).map((id) => `#${id}`);

  const resolved = queryFirst([...byNames, ...byIds, ...byTitles]);
  updateDebugState({
    schemaResolution: {
      ...(window.__IP_DEBUG_STATE__?.schemaResolution || {}),
      [schemaKey]: {
        hasField: !!resolved,
        fieldName: resolved?.getAttribute?.('name') || null,
        fieldId: resolved?.id || null,
        tagName: resolved?.tagName || null
      }
    }
  });

  logDebug('Schema field resolution result.', {
    schemaKey,
    hasField: !!resolved,
    fieldName: resolved?.getAttribute?.('name') || null,
    fieldId: resolved?.id || null,
    tagName: resolved?.tagName || null
  });

  return resolved;
}

const PANEL_STATUS_EVENT_NAME = 'ip:panel-status-change';
const STATUS_KEYS = {
  ip: 'ip',
  mtm: 'mtm',
  language: 'language',
  country: 'country'
};

const STATUS_DEFAULTS = {
  [STATUS_KEYS.ip]: 'Active',
  [STATUS_KEYS.mtm]: 'Active',
  [STATUS_KEYS.language]: 'Active',
  [STATUS_KEYS.country]: 'Active'
};

function ensureStatusStore() {
  if (!window.__IP_PANEL_STATUS__) {
    window.__IP_PANEL_STATUS__ = {
      [STATUS_KEYS.ip]: { status: STATUS_DEFAULTS[STATUS_KEYS.ip] },
      [STATUS_KEYS.mtm]: { status: STATUS_DEFAULTS[STATUS_KEYS.mtm] },
      [STATUS_KEYS.language]: { status: STATUS_DEFAULTS[STATUS_KEYS.language] },
      [STATUS_KEYS.country]: { status: STATUS_DEFAULTS[STATUS_KEYS.country] }
    };
  }

  return window.__IP_PANEL_STATUS__;
}

function setScriptStatus(key, status, details = {}) {
  const normalized = status === 'Error' ? 'Error' : 'Active';

  try {
    const store = ensureStatusStore();
    if (!store[key]) {
      store[key] = { status: normalized };
    }

    store[key] = {
      ...store[key],
      status: normalized,
      ...details,
      updatedAt: new Date().toISOString()
    };

    window.dispatchEvent(new CustomEvent(PANEL_STATUS_EVENT_NAME, {
      detail: { key, value: store[key] }
    }));
  } catch (error) {
    logDebug('Unable to set script status.', { key, message: error?.message || error });
  }
}

function getScriptStatus(key) {
  const store = ensureStatusStore();
  return store[key]?.status === 'Error' ? 'Error' : 'Active';
}

function setMtmStatus(status, details = {}) {
  setScriptStatus(STATUS_KEYS.mtm, status, details);
}

function updateStatusChip(key) {
  const panel = document.getElementById('ip-language-panel');
  if (!panel) {
    return;
  }

  const chip = panel.querySelector(`#ip-status-${key}`);
  if (!chip) {
    return;
  }

  const status = getScriptStatus(key);
  chip.textContent = status;
  chip.style.background = status === 'Error' ? '#991b1b' : '#14532d';
  chip.style.borderColor = status === 'Error' ? '#ef4444' : '#22c55e';
  chip.style.color = '#ffffff';
}

function updateAllStatusChips() {
  updateStatusChip(STATUS_KEYS.ip);
  updateStatusChip(STATUS_KEYS.mtm);
  updateStatusChip(STATUS_KEYS.language);
  updateStatusChip(STATUS_KEYS.country);
}



/* =========================
MTM Field Population
 ========================= */



(function () {
  // ========== Badge & Text Styles ==========
  const LOG_PREFIX  = " Form JS MTM ";
  const BADGE_GREEN = "background:#28A745; color:#ffffff; padding:2px 6px; border-radius:999px; font-weight:bold;";
  const BADGE_RED   = "background:#DC3545; color:#ffffff; padding:2px 6px; border-radius:999px; font-weight:bold;";
  const BADGE_AMBER = "background:#DC3545; color:#ffffff; padding:2px 6px; border-radius:999px; font-weight:bold;";
  const TXT_DEFAULT = "color:#ffffff;";
  const TXT_SUCCESS = "color:#ffffff; font-weight:500;";
  const TXT_ERROR   = "color:#ffffff; font-weight:600;";
  const TXT_WARN    = "color:#ffffff; font-weight:600;";
  const mtmLogInfo    = (...m) => console.log   ("%c" + LOG_PREFIX, BADGE_GREEN, "%c" + m.join(" "), TXT_DEFAULT);
  const mtmLogSuccess = (...m) => console.log   ("%c" + LOG_PREFIX, BADGE_GREEN, "%c" + m.join(" "), TXT_SUCCESS);
  const mtmLogWarn    = (...m) => console.warn  ("%c" + LOG_PREFIX, BADGE_RED,   "%c" + m.join(" "), TXT_WARN);
  const mtmLogError   = (...m) => console.error ("%c" + LOG_PREFIX, BADGE_RED,   "%c" + m.join(" "), TXT_ERROR);
  const groupStart = (label, collapsed = false) => {
    const header = "%c" + LOG_PREFIX + "%c " + String(label);
    const fn = collapsed ? console.groupCollapsed : console.group;
    fn(header, BADGE_GREEN, TXT_DEFAULT);
  };
  const groupEnd = () => { try { console.groupEnd(); } catch (_) {} };

  setMtmStatus('Active', { source: 'mtm-script-init' });
  // ---- Config: field titles and corresponding parameter keys ----
  const FIELD_MAP = [
    { title: "MTM Source",   key: "mtm_source"   },
    { title: "MTM Medium",   key: "mtm_medium"   },
    { title: "MTM Campaign", key: "mtm_campaign" },
    { title: "MTM Content",  key: "mtm_content"  },
    { title: "MTM Term",     key: "mtm_term"     }
  ];
  const REFERRER_URL_FIELD_TITLE = "Referrer URL";
  const ENTRY_URL_FIELD_TITLE = "Entry URL";
  const SUBMISSION_URL_FIELD_TITLES = ["Submission URL", "Form Submission URL", "Submit URL"];

  // ---------- Utilities ----------
  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findFieldByTitle(rootDoc, labelText) {
    const target = norm(labelText);
    // 1) aria-label exact
    let el = rootDoc.querySelector(`input[aria-label="${labelText}"], textarea[aria-label="${labelText}"], select[aria-label="${labelText}"]`);
    if (el) return el;
    // 2) label text exact → via for/id or nearby container
    const labels = Array.from(rootDoc.querySelectorAll("label"));
    for (const lab of labels) {
      if (norm(lab.textContent) === target) {
        const forId = lab.getAttribute("for");
        if (forId) {
          const byFor = rootDoc.getElementById(forId);
          if (byFor) return byFor;
        }
        const nearby = lab.closest("[data-editor-container], .field, .control, div")?.querySelector("input, textarea, select");
        if (nearby) return nearby;
      }
    }
    // 3) title/placeholder exact
    el = rootDoc.querySelector(
      `input[title="${labelText}"], textarea[title="${labelText}"], select[title="${labelText}"],` +
      `input[placeholder="${labelText}"], textarea[placeholder="${labelText}"]`
    );
    if (el) return el;
    // 4) contains fallback
    el = rootDoc.querySelector(
      `input[aria-label*="${labelText}"], textarea[aria-label*="${labelText}"], select[aria-label*="${labelText}"],` +
      `input[title*="${labelText}"], textarea[title*="${labelText}"],` +
      `input[placeholder*="${labelText}"], textarea[placeholder*="${labelText}"]`
    );
    return el || null;
  }

  function sanitizeUrl(rawUrl) {
    const externalSanitizer = window.SiteAttribution && typeof window.SiteAttribution.sanitizeUrl === 'function'
      ? window.SiteAttribution.sanitizeUrl
      : null;

    if (externalSanitizer) {
      return externalSanitizer(rawUrl);
    }

    try {
      const parsed = new URL(rawUrl, window.location.origin);
      return `${parsed.origin}${parsed.pathname}`;
    } catch (_) {
      return '';
    }
  }

  function setFieldValue(field, value) {
    field.value = value;
    field.dispatchEvent(new Event('input',  { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setSubmitButtonTextFromMtmTerm(rootDoc, mtmData) {
    const buttonTextRaw = String(mtmData?.mtm_term || '').trim();
    const buttonText = buttonTextRaw
      .replace(/\s+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2');

    if (!buttonText) {
      mtmLogInfo('No mtm_term value found. Submit button text unchanged.');
      return false;
    }

    const submitButton = rootDoc.querySelector(
      'button.submitButton[type="submit"], button.primaryButton[type="submit"], button[type="submit"]'
    );

    if (!submitButton) {
      mtmLogWarn('Submit button not found. Unable to apply mtm_term as button text.');
      return false;
    }

    const textContainer = submitButton.querySelector('span') || submitButton;
    textContainer.textContent = buttonText;
    mtmLogSuccess(`Set submit button text to '${buttonText}' from mtm_term.`);
    return true;
  }

  function getFallbackAttribution() {
    const params = new URLSearchParams(window.location.search || '');
    const mtm = {};

    params.forEach((value, key) => {
      const normalized = key.toLowerCase();
      if (normalized.startsWith('mtm_') && value !== '') {
        mtm[normalized] = value;
      }
    });

    return {
      mtm,
      entryUrl: sanitizeUrl(window.location.href),
      referrerUrl: sanitizeUrl(document.referrer || ''),
      browserLanguage: navigator.language || ''
    };
  }

  function getAttributionPayload() {
    if (window.SiteAttribution && typeof window.SiteAttribution.get === 'function') {
      const stored = window.SiteAttribution.get();
      if (stored) {
        return stored;
      }
    }

    return getFallbackAttribution();
  }

  function populateMTMFields(rootDoc) {
    groupStart("Populate MTM Fields");
    setMtmStatus('Active', { source: 'mtm-populate-start' });

    try {
      const payload = getAttributionPayload();
      const mtmData = payload?.mtm || {};
      const referrerUrl = sanitizeUrl(payload?.referrerUrl || '');
      const entryUrl = sanitizeUrl(payload?.entryUrl || window.location.href);

      mtmLogInfo('Resolved attribution payload.', {
        hasMtmData: Object.keys(mtmData).length > 0,
        referrerUrl,
        entryUrl
      });

      let attempt = 0;
      const maxAttempts = 5;
      const delayMs = 250;

      const tryFill = () => {
        attempt++;
        let filledCount = 0;
        let targetCount = FIELD_MAP.length + 2;

        groupStart(`Attempt ${attempt}/${maxAttempts}`, true);

        // Fill MTM fields with value only (no key prefix)
        for (const { title, key } of FIELD_MAP) {
          const rawValue = mtmData[key] || '';
          const value = rawValue;
          const field = findFieldByTitle(rootDoc, title);
          if (!field) {
            mtmLogWarn(`Field '${title}' not found on attempt ${attempt}.`);
            continue;
          }

          setFieldValue(field, value);
          mtmLogSuccess(`Set '${title}' to '${value}'.`);
          filledCount++;
        }

        // Fill sanitized Referrer URL
        const refField = findFieldByTitle(rootDoc, REFERRER_URL_FIELD_TITLE);
        if (refField) {
          setFieldValue(refField, referrerUrl);
          mtmLogSuccess(`Set '${REFERRER_URL_FIELD_TITLE}' to sanitized URL.`);
          filledCount++;
        } else {
          mtmLogWarn(`Field '${REFERRER_URL_FIELD_TITLE}' not found on attempt ${attempt}.`);
          targetCount--;
        }

        // Fill sanitized Entry URL when field exists
        const entryField = findFieldByTitle(rootDoc, ENTRY_URL_FIELD_TITLE);
        if (entryField) {
          setFieldValue(entryField, entryUrl);
          mtmLogSuccess(`Set '${ENTRY_URL_FIELD_TITLE}' to sanitized URL.`);
          filledCount++;
        } else {
          mtmLogWarn(`Field '${ENTRY_URL_FIELD_TITLE}' not found on attempt ${attempt}.`);
          targetCount--;
        }

        setSubmitButtonTextFromMtmTerm(rootDoc, mtmData);

        groupEnd(); // end Attempt

        if (filledCount === targetCount) {
          mtmLogSuccess('All attribution fields populated successfully.');
          setMtmStatus('Active', {
            source: 'mtm-populate-success',
            filledCount,
            totalTargets: targetCount,
            attempt
          });
          groupEnd(); // end Populate MTM Fields
        } else if (attempt < maxAttempts) {
          mtmLogWarn(`Populated ${filledCount}/${targetCount} field(s). Retrying...`);
          setTimeout(tryFill, delayMs);
        } else {
          mtmLogError(`Completed ${filledCount}/${targetCount} after ${maxAttempts} attempts. Some fields not found.`);
          setMtmStatus('Error', {
            source: 'mtm-populate-incomplete',
            filledCount,
            totalTargets: targetCount,
            attempt
          });
          groupEnd(); // end Populate MTM Fields
        }
      };
      tryFill();
    } catch (e) {
      mtmLogError("Unhandled error while populating MTM fields:", e.message || e);
      setMtmStatus('Error', {
        source: 'mtm-populate-exception',
        message: e?.message || String(e)
      });
      groupEnd();
    }
  }

  function bindSubmissionUrlCapture(rootDoc) {
    const form = rootDoc.querySelector('form');
    if (!form) {
      mtmLogWarn('No form found to bind submission URL capture.');
      return;
    }

    if (form.dataset.submissionUrlCaptureBound === 'true') {
      return;
    }

    const writeSubmissionUrl = () => {
      const submitUrlValue = sanitizeUrl(window.location.href);
      let didWrite = false;

      for (const title of SUBMISSION_URL_FIELD_TITLES) {
        const field = findFieldByTitle(rootDoc, title);
        if (!field) {
          continue;
        }

        setFieldValue(field, submitUrlValue);
        didWrite = true;
        mtmLogSuccess(`Set '${title}' to sanitized submit URL.`);
      }

      if (!didWrite) {
        mtmLogWarn('Submission URL field not found. Add a field titled Submission URL, Form Submission URL, or Submit URL.');
      }

      return didWrite;
    };

    const handler = () => {
      writeSubmissionUrl();
    };

    // Populate as soon as the form is available so the field is filled on entry.
    writeSubmissionUrl();

    // Retry briefly for late-rendered form fields.
    let retryCount = 0;
    const maxRetries = 4;
    const retryTimer = window.setInterval(() => {
      retryCount += 1;
      const didWrite = writeSubmissionUrl();
      if (didWrite || retryCount >= maxRetries) {
        window.clearInterval(retryTimer);
      }
    }, 250);

    form.addEventListener('submit', handler, true);
    form.dataset.submissionUrlCaptureBound = 'true';
    mtmLogInfo('Bound submit URL capture listener.');
  }

  // ---- Event hookup ----
  let mtmPopulateTriggered = false;
  function runPopulateOnce(source) {
    if (mtmPopulateTriggered) {
      mtmLogInfo(`Skipping duplicate MTM population trigger from '${source}'.`);
      return;
    }

    mtmPopulateTriggered = true;
    mtmLogInfo(`Running MTM population from trigger '${source}'.`);
    populateMTMFields(document);
    bindSubmissionUrlCapture(document);
  }

  document.addEventListener("d365mkt-afterformload", function () {
    runPopulateOnce('d365mkt-afterformload');
    // If your Marketing form is embedded in an iframe, enable this block:
    /*
    const frm = document.querySelector('iframe[src*="mktform"], iframe[src*="forms.dynamics.com"], iframe[data-test-id="marketing-form"]');
    if (frm && frm.contentDocument) {
      populateMTMFields(frm.contentDocument);
    } else {
      mtmLogWarn("Marketing form iframe not detected; proceeding with main document only.");
    }
    */
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      runPopulateOnce('DOMContentLoaded fallback');
    });
  } else {
    runPopulateOnce('immediate fallback');
  }
})();

/* =========================
MTM Field Population
 ========================= */





/* =========================
  Language detection + mapping
  ========================= */
// Reads browser-preferred language(s), normalized to BCP-47-like tags (e.g. en-us).
function getPreferredBrowserLanguage() {
  const list = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || navigator.userLanguage || 'en-US'];

  const normalized = list
    .map((item) => normalizeText(item).replace('_', '-'))
    .filter(Boolean);

  const chosen = normalized[0] || 'en-us';
  logInfo('Detected browser languages:', normalized);
  return chosen;
}

// logic function - Maps language tags to Dataverse/Dynamics LCID values used by the Language lookup/select.
function getLcidForLanguageTag(tag) {
  const localeToLcid = {
    'ar': '1025',
    'ar-sa': '1025',
    'eu': '1069',
    'bg': '1026',
    'ca': '1027',
    'zh-cn': '2052',
    'zh-hk': '3076',
    'zh-tw': '1028',
    'hr': '1050',
    'cs': '1029',
    'da': '1030',
    'nl': '1043',
    'nl-nl': '1043',
    'en': '1033',
    'en-us': '1033',
    'en-gb': '1033',
    'et': '1061',
    'fi': '1035',
    'fr': '1036',
    'fr-fr': '1036',
    'gl': '1110',
    'de': '1031',
    'de-de': '1031',
    'el': '1032',
    'he': '1037',
    'hi': '1081',
    'hu': '1038',
    'id': '1057',
    'it': '1040',
    'it-it': '1040',
    'ja': '1041',
    'ja-jp': '1041',
    'kk': '1087',
    'ko': '1042',
    'ko-kr': '1042',
    'lv': '1062',
    'lt': '1063',
    'ms': '1086',
    'nb': '1044',
    'no': '1044',
    'pl': '1045',
    'pt-br': '1046',
    'pt-pt': '2070',
    'pt': '1046',
    'ro': '1048',
    'ru': '1049',
    'ru-ru': '1049',
    'sr-cyrl': '3098',
    'sr-latn': '2074',
    'sk': '1051',
    'sl': '1060',
    'es': '3082',
    'es-es': '3082',
    'sv': '1053',
    'th': '1054',
    'tr': '1055',
    'uk': '1058',
    'vi': '1066'
  };

  const normalizedTag = normalizeText(tag).replace('_', '-');
  if (localeToLcid[normalizedTag]) {
    return localeToLcid[normalizedTag];
  }

  const base = normalizedTag.split('-')[0];
  return localeToLcid[base] || null;
}

/* =========================
  UI translation (labels/titles only)
  ========================= */
const UI_TRANSLATION_RESOURCES = {
  en: {
    translation: {
      fields: {
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email address',
        phone: 'Phone number',
        website: 'Website',
        companyName: 'Company name',
        jobTitle: 'Job title',
        language: 'Language',
        country: 'Country',
        industry: 'Industry',
        inquiry: 'Inquiry',
      },
      placeholders: {
        firstName: 'John',
        lastName: 'Doe',
        jobTitle: 'Sales Manager',
        email: 'john@smithcompany.com',
        phone: 'Include dialing code',
        inquiry: 'Enter as much information as possible in order for us to route your inquiry promptly.'
      },
      titles: {
        firstName: 'Enter your First name',
        lastName: 'Enter your Last name',
        jobTitle: 'Enter your job title',
        email: 'Enter your work email address',
        phone: 'Enter your Phone number',
        companyName: 'Enter your Company name',
        website: 'Enter your company Website',
        country: 'Choose your Country',
        industry: 'Select your Industry',
        inquiry: 'Describe your Inquiry',
     
    
      },
      hints: {
        email: '',
        phone: '',
        inquiry: ''
      },
      sections: {
        personalInformation: 'Personal information',
        yourInquiry: 'Your inquiry',
        content: 'Content'
      },
      copy: {
        newsletterHeading: 'Subscribe to our newsletter',
        newsQuarterly: 'We will send you news, webinars, and other content once per quarter.',
        unsubscribe: 'You can unsubscribe at anytime using the link in every email we send.',
        consentNews: 'News, events and other content',
        privacyNotice: 'You agree and understand that by completing this form, your personal data will be processed for the purpose of receiving emails under Article 6(1)(a) of the GDPR, as outlined in the Privacy Policy,'
      },

      buttons: {
        sendMessage: 'Send Message'
    
      },
      options: {
        selectDefault: '- Select'
      },
      common: {
        requiredSuffix: '*',
      }
    }
  },
  de: {
    translation: {
      fields: {
        firstName: 'Vorname',
        lastName: 'Nachname',
        email: 'E-Mail-Adresse',
        phone: 'Telefonnummer',
        website: 'Website',
        companyName: 'Firmenname',
        jobTitle: 'Berufsbezeichnung',
        country: 'Land',
        industry: 'Branche',
        inquiry: 'Anfrage',
      },
      placeholders: {
        firstName: 'Max',
        lastName: 'Mustermann',
        jobTitle: 'Vertriebsleiter',
        email: 'max@beispielfirma.de',
        phone: 'Mit Landesvorwahl',
        inquiry: 'Geben Sie so viele Informationen wie möglich an, damit wir Ihre Anfrage schnell weiterleiten können.'
      },
      titles: {
        firstName: 'Geben Sie Ihren Vornamen ein',
        lastName: 'Geben Sie Ihren Nachnamen ein',
        jobTitle: 'Geben Sie Ihre Berufsbezeichnung ein',
        email: 'Geben Sie Ihre geschäftliche E-Mail-Adresse ein',
        phone: 'Geben Sie Ihre Telefonnummer ein',
        companyName: 'Geben Sie Ihren Firmennamen ein',
        website: 'Geben Sie Ihre Firmenwebsite ein',
        country: 'Wählen Sie Ihr Land',
        industry: 'Wählen Sie Ihre Branche',
        inquiry: 'Beschreiben Sie Ihre Anfrage',
      
      },
      hints: {
        email: '',
        phone: '',
        inquiry: ''
      },
      sections: {
        personalInformation: 'Persönliche Daten',
        yourInquiry: 'Ihre Anfrage',
        content: 'Inhalt'
      },
      copy: {
        newsletterHeading: 'Newsletter abonnieren',
        newsQuarterly: 'Wir senden Ihnen einmal pro Quartal Neuigkeiten, Webinare und weitere Inhalte.',
        unsubscribe: 'Sie können sich jederzeit über den Link in jeder E-Mail abmelden.',
        consentNews: 'News, Veranstaltungen und weitere Inhalte',
        privacyNotice: 'Sie erklären sich damit einverstanden und verstehen, dass durch das Ausfüllen dieses Formulars Ihre personenbezogenen Daten zum Zweck des Erhalts von E-Mails gemäß Artikel 6 Absatz 1 Buchstabe a DSGVO verarbeitet werden, wie in der Datenschutzrichtlinie beschrieben,'
      },
      buttons: {
        sendMessage: 'Nachricht senden'
      },
      options: {
        selectDefault: '- Auswaehlen'
      },
     
      common: {
        requiredSuffix: '*',
      }
    }
  }
};

let activeUiLanguage = 'en';
let uiTranslationInitPromise = null;
const UI_LANGUAGE_STORAGE_KEY = APP_CONFIG.storage.uiLanguageOverrideKey;

function getStoredUiLanguageOverride() {
  try {
    return localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  } catch (error) {
    logDebug('Unable to read UI language override from localStorage.', error?.message || error);
    return null;
  }
}

function setStoredUiLanguageOverride(language) {
  try {
    localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    logDebug('Unable to persist UI language override to localStorage.', error?.message || error);
  }
}

function logLanguageDiagnostics(details) {
  const payload = {
    browserLanguage: navigator.language || null,
    browserLanguages: Array.isArray(navigator.languages) ? navigator.languages : [],
    ...details
  };

  logInfo('UI language diagnostics:', payload);
}

function getNestedValue(root, path) {
  return path.split('.').reduce((acc, segment) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, segment)) {
      return acc[segment];
    }
    return undefined;
  }, root);
}

function normalizeUiPhrase(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// logic function
function getSupportedUiLanguage(tag) {
  const normalized = normalizeText(tag).replace('_', '-');
  if (normalized === 'de' || normalized.startsWith('de-')) {
    return 'de';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return 'en';
}

function getInitialUiLanguage() {
  const stored = getStoredUiLanguageOverride();
  const supportedStored = getSupportedUiLanguage(stored || '');
  if (stored && supportedStored) {
    logLanguageDiagnostics({ source: 'stored override', stored, resolved: supportedStored });
    return supportedStored;
  }

  const browserTag = getPreferredBrowserLanguage();
  const resolved = getSupportedUiLanguage(browserTag);
  logLanguageDiagnostics({ source: 'browser', browserTag, resolved });
  return resolved;
}

function tUi(key) {
  if (window.i18next && window.i18next.isInitialized) {
    return window.i18next.t(key);
  }

  return getNestedValue(UI_TRANSLATION_RESOURCES[activeUiLanguage]?.translation, key)
    || getNestedValue(UI_TRANSLATION_RESOURCES.en.translation, key)
    || key;
}

function setLabelVisibleText(label, translatedText) {
  if (!label) {
    return;
  }

  const requiredSuffix = label.querySelector('.requiredSuffix');
  if (requiredSuffix) {
    requiredSuffix.textContent = tUi('common.requiredSuffix');

    const container = requiredSuffix.parentElement && requiredSuffix.parentElement !== label
      ? requiredSuffix.parentElement
      : label;

    const previousElement = requiredSuffix.previousElementSibling;
    if (previousElement) {
      previousElement.textContent = translatedText;
      return;
    }

    const suffixIndex = Array.from(container.childNodes).indexOf(requiredSuffix);
    const textNode = Array.from(container.childNodes).find((node, index) =>
      index < suffixIndex
      && node.nodeType === Node.TEXT_NODE
      && String(node.nodeValue || '').replace(/\u00a0/g, '').trim() !== ''
    );

    if (textNode) {
      textNode.nodeValue = `${translatedText} `;
    } else {
      container.insertBefore(document.createTextNode(`${translatedText} `), requiredSuffix);
    }
    return;
  }

  label.textContent = translatedText;
}

function findOrTrackElementByText(key, englishText, selector) {
  const tracked = document.querySelector(`[data-ip-i18n-key="${key}"]`);
  if (tracked) {
    return tracked;
  }

  const expected = normalizeUiPhrase(englishText);
  const pool = Array.from(document.querySelectorAll(selector || 'h1, h2, h3, h4, h5, h6, p, span, label, button'));
  const match = pool.find((item) => normalizeUiPhrase(item.textContent) === expected);
  if (match) {
    match.setAttribute('data-ip-i18n-key', key);
  }

  return match || null;
}

function setTrackedText(key, englishText, translatedText, selector) {
  const element = findOrTrackElementByText(key, englishText, selector);
  if (element) {
    element.textContent = translatedText;
  }
}

function applyPlaceholderBySchema(schemaKey, key) {
  const field = getFieldFromSchema(schemaKey);
  if (!field || !field.matches('input, textarea')) {
    return;
  }

  field.setAttribute('placeholder', tUi(key));
}

function applyTitleBySchema(schemaKey, key) {
  const field = getFieldFromSchema(schemaKey);
  if (!field) {
    return;
  }

  field.setAttribute('title', tUi(key));
}

function applyHintById(elementId, key) {
  const element = document.getElementById(elementId);
  if (!element) {
    return;
  }

  element.textContent = tUi(key);
}

function setFieldLabelByTitle(labelTitle, translationKey) {
  const label = document.querySelector(`label[title="${labelTitle}"]`);
  if (!label) {
    return;
  }

  setLabelVisibleText(label, tUi(translationKey));
}

function applyInputTitleByLabelTitle(labelTitle, translationKey) {
  const label = document.querySelector(`label[title="${labelTitle}"]`);
  if (!label) {
    return;
  }

  const forId = label.getAttribute('for');
  if (!forId) {
    return;
  }

  const input = document.getElementById(forId);
  if (!input) {
    return;
  }

  input.setAttribute('title', tUi(translationKey));
}

function applyOptionText(selectName, optionValue, key) {
  const select = document.querySelector(`select[name="${selectName}"]`);
  if (!select) {
    return;
  }

  const option = Array.from(select.options || []).find((item) => item.value === optionValue);
  if (option) {
    option.textContent = tUi(key);
  }
}

function applySelectDefaultOptionTranslation() {
  const defaultText = tUi('options.selectDefault');
  const selects = Array.from(document.querySelectorAll('select'));

  selects.forEach((select) => {
    const option = Array.from(select.options || []).find((item) => {
      const text = normalizeUiPhrase(item.textContent || '');
      return text === '- select';
    });

    if (option) {
      option.textContent = defaultText;
    }
  });
}

function applyFieldTranslation(schemaKey, labelKey) {
  const field = getFieldFromSchema(schemaKey);

  if (!field) {
    logDebug('Translation target field not found.', { schemaKey });
    return;
  }

  const translatedLabel = tUi(labelKey);

  const labels = Array.from(document.querySelectorAll('label'));
  const label = field.id
    ? labels.find((item) => item.getAttribute('for') === field.id)
    : null;

  if (label) {
    setLabelVisibleText(label, translatedLabel);
  }
}

function applyUiFieldTranslations() {
  applyFieldTranslation('firstName', 'fields.firstName');
  applyFieldTranslation('lastName', 'fields.lastName');
  applyFieldTranslation('email', 'fields.email');
  applyFieldTranslation('phone', 'fields.phone');
  applyFieldTranslation('website', 'fields.website');
  applyFieldTranslation('companyName', 'fields.companyName');
  applyFieldTranslation('jobTitle', 'fields.jobTitle');
  applyFieldTranslation('language', 'fields.language');
  applyFieldTranslation('country', 'fields.country');
  applyFieldTranslation('industry', 'fields.industry');
  applyFieldTranslation('inquiry', 'fields.inquiry');

  setTrackedText(
    'sections.personalInformation',
    'Personal information',
    tUi('sections.personalInformation'),
    'h1, h2, h3, h4, h5, h6'
  );
  setTrackedText(
    'sections.yourInquiry',
    'Your inquiry',
    tUi('sections.yourInquiry'),
    'h1, h2, h3, h4, h5, h6'
  );
  setTrackedText(
    'sections.content',
    'Content',
    tUi('sections.content'),
    'h1, h2, h3, h4, h5, h6'
  );

  setTrackedText(
    'copy.newsletterHeading',
    'Subscribe to the Norican newsletter',
    tUi('copy.newsletterHeading'),
    'p, span'
  );
  setTrackedText(
    'copy.newsQuarterly',
    'We will send you news, webinars, and other content once per quarter.',
    tUi('copy.newsQuarterly'),
    'p, span'
  );
  setTrackedText(
    'copy.unsubscribe',
    'You can unsubscribe at anytime using the link in every email we send.',
    tUi('copy.unsubscribe'),
    'p, span'
  );
  setTrackedText(
    'copy.consentNews',
    'News, events and other content',
    tUi('copy.consentNews'),
    'p, span, label'
  );
  setTrackedText(
    'copy.privacyNotice',
    'You agree and understand that by completing this form, your personal data will be processed for the purpose of receiving emails under Article 6(1)(a) of the GDPR, as outlined in the Privacy Policy,',
    tUi('copy.privacyNotice'),
    'p, span'
  );

  setTrackedText('buttons.sendMessage', 'Send Message', tUi('buttons.sendMessage'), 'button');

  applyPlaceholderBySchema('firstName', 'placeholders.firstName');
  applyPlaceholderBySchema('lastName', 'placeholders.lastName');
  applyPlaceholderBySchema('jobTitle', 'placeholders.jobTitle');
  applyPlaceholderBySchema('email', 'placeholders.email');
  applyPlaceholderBySchema('phone', 'placeholders.phone');
  applyPlaceholderBySchema('inquiry', 'placeholders.inquiry');

  applyTitleBySchema('firstName', 'titles.firstName');
  applyTitleBySchema('lastName', 'titles.lastName');
  applyTitleBySchema('jobTitle', 'titles.jobTitle');
  applyTitleBySchema('email', 'titles.email');
  applyTitleBySchema('phone', 'titles.phone');
  applyTitleBySchema('companyName', 'titles.companyName');
  applyTitleBySchema('website', 'titles.website');
  applyTitleBySchema('country', 'titles.country');
  applyTitleBySchema('industry', 'titles.industry');
  applyTitleBySchema('inquiry', 'titles.inquiry');


  applyHintById('email-hint', 'hints.email');
  applyHintById('phone-hint', 'hints.phone');
  applyHintById('inquiry-hint', 'hints.inquiry');

  applySelectDefaultOptionTranslation();




 

}

async function setUiLanguage(language, source) {
  const nextLanguage = getSupportedUiLanguage(language);
  activeUiLanguage = nextLanguage;
  setStoredUiLanguageOverride(nextLanguage);

  if (window.i18next && window.i18next.isInitialized) {
    await window.i18next.changeLanguage(nextLanguage);
  }

  applyUiFieldTranslations();
  logLanguageDiagnostics({ source, selected: language, applied: nextLanguage });
}

function clearStoredUiLanguageOverride() {
  try {
    localStorage.removeItem(UI_LANGUAGE_STORAGE_KEY);
  } catch (error) {
    logDebug('Unable to clear UI language override from localStorage.', error?.message || error);
  }
}

async function resetUiLanguageToBrowser() {
  clearStoredUiLanguageOverride();
  const browserTag = getPreferredBrowserLanguage();
  const resolved = getSupportedUiLanguage(browserTag);
  await setUiLanguage(resolved, 'floating panel reset');
}

function getScriptSourceMode() {
  const mode = String(window.__IP_SCRIPT_MODE__ || '').trim().toLowerCase();
  if (mode === 'remote' || mode === 'local') {
    return mode;
  }

  return 'unknown';
}

function updateScriptSourceChip() {
  const panel = document.getElementById('ip-language-panel');
  if (!panel) {
    return;
  }

  const chip = panel.querySelector('#ip-script-source');
  if (!chip) {
    return;
  }

  const mode = getScriptSourceMode();
  chip.textContent = mode;
  chip.style.background = mode === 'remote' ? '#14532d' : mode === 'local' ? '#1f2937' : '#7f1d1d';
  chip.style.borderColor = mode === 'remote' ? '#22c55e' : mode === 'local' ? '#4b5563' : '#ef4444';
  chip.style.color = '#ffffff';
}

function isPanelEnabled() {
  const raw = window.__IP_PANEL_ENABLED__;
  if (raw === false || raw === 0) {
    return false;
  }

  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
      return false;
    }
  }

  return true;
}

function ensureLanguagePanel() {
  if (!isPanelEnabled()) {
    const existingPanel = document.getElementById('ip-language-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    return;
  }

  const existing = document.getElementById('ip-language-panel');
  if (existing) {
    const select = existing.querySelector('select');
    if (select) {
      select.value = activeUiLanguage;
    }

    updateScriptSourceChip();
    updateAllStatusChips();
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'ip-language-panel';
  panel.style.position = 'fixed';
  panel.style.right = '14px';
  panel.style.bottom = '14px';
  panel.style.zIndex = '99999';
  panel.style.background = '#111827';
  panel.style.color = '#ffffff';
  panel.style.padding = '10px 12px';
  panel.style.borderRadius = '10px';
  panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
  panel.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
  panel.style.fontSize = '12px';
  panel.style.lineHeight = '1.4';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.gap = '8px';

  const headerTitle = document.createElement('div');
  headerTitle.textContent = 'Panel';
  headerTitle.style.fontWeight = '700';
  headerTitle.style.fontSize = '12px';

  const minimizeButton = document.createElement('button');
  minimizeButton.id = 'ip-language-minimize';
  minimizeButton.type = 'button';
  minimizeButton.textContent = '-';
  minimizeButton.style.width = '24px';
  minimizeButton.style.height = '24px';
  minimizeButton.style.borderRadius = '6px';
  minimizeButton.style.border = '1px solid #4b5563';
  minimizeButton.style.background = '#1f2937';
  minimizeButton.style.color = '#ffffff';
  minimizeButton.style.cursor = 'pointer';
  minimizeButton.style.fontSize = '14px';
  minimizeButton.style.lineHeight = '1';
  minimizeButton.style.padding = '0';

  header.appendChild(headerTitle);
  header.appendChild(minimizeButton);

  const panelBody = document.createElement('div');
  panelBody.id = 'ip-language-panel-body';
  panelBody.style.marginTop = '8px';

  const label = document.createElement('label');
  label.id = 'ip-language-label';
  label.setAttribute('for', 'ip-language-select');
  label.textContent = 'Language';
  label.style.display = 'block';
  label.style.marginBottom = '6px';
  label.style.fontWeight = '600';

  const select = document.createElement('select');
  select.id = 'ip-language-select';
  select.style.width = '100%';
  select.style.padding = '6px 8px';
  select.style.borderRadius = '6px';
  select.style.border = '1px solid #374151';
  select.style.background = '#ffffff';
  select.style.color = '#111827';
  select.innerHTML = [
    '<option value="en">English</option>',
    '<option value="de">Deutsch</option>'
  ].join('');
  select.value = activeUiLanguage;

  select.addEventListener('change', async () => {
    try {
      await setUiLanguage(select.value, 'floating panel');
    } catch (error) {
      logWarn('Unable to switch UI language from floating panel.', error?.message || error);
    }
  });

  const resetButton = document.createElement('button');
  resetButton.id = 'ip-language-reset';
  resetButton.type = 'button';
  resetButton.textContent = 'Use browser default';
  resetButton.style.marginTop = '8px';
  resetButton.style.width = '100%';
  resetButton.style.padding = '6px 8px';
  resetButton.style.borderRadius = '6px';
  resetButton.style.border = '1px solid #4b5563';
  resetButton.style.background = '#1f2937';
  resetButton.style.color = '#ffffff';
  resetButton.style.cursor = 'pointer';
  resetButton.style.fontSize = '12px';

  resetButton.addEventListener('click', async () => {
    try {
      await resetUiLanguageToBrowser();
      select.value = activeUiLanguage;
    } catch (error) {
      logWarn('Unable to reset UI language to browser default.', error?.message || error);
    }
  });

  const clearLocalStorageButton = document.createElement('button');
  clearLocalStorageButton.id = 'ip-local-storage-clear';
  clearLocalStorageButton.type = 'button';
  clearLocalStorageButton.textContent = 'Clear Local Storage';
  clearLocalStorageButton.style.marginTop = '6px';
  clearLocalStorageButton.style.width = '100%';
  clearLocalStorageButton.style.padding = '6px 8px';
  clearLocalStorageButton.style.borderRadius = '6px';
  clearLocalStorageButton.style.border = '1px solid #7f1d1d';
  clearLocalStorageButton.style.background = '#991b1b';
  clearLocalStorageButton.style.color = '#ffffff';
  clearLocalStorageButton.style.cursor = 'pointer';
  clearLocalStorageButton.style.fontSize = '12px';

  clearLocalStorageButton.addEventListener('click', () => {
    try {
      localStorage.clear();
      logSuccess('Local storage cleared from floating panel.');
      setMtmStatus('Active', { source: 'manual-session-clear' });
      updateAllStatusChips();
    } catch (error) {
      logWarn('Unable to clear local storage from floating panel.', error?.message || error);
      setMtmStatus('Error', {
        source: 'manual-session-clear-error',
        message: error?.message || String(error)
      });
      updateAllStatusChips();
    }
  });

  const sourceSection = document.createElement('div');
  sourceSection.style.marginTop = '10px';
  sourceSection.style.paddingTop = '8px';
  sourceSection.style.borderTop = '1px solid #374151';

  const sourceRow = document.createElement('div');
  sourceRow.style.display = 'flex';
  sourceRow.style.alignItems = 'center';
  sourceRow.style.justifyContent = 'space-between';
  sourceRow.style.gap = '10px';

  const sourceLabel = document.createElement('span');
  sourceLabel.textContent = 'JS source';
  sourceLabel.style.fontSize = '12px';

  const sourceChip = document.createElement('span');
  sourceChip.id = 'ip-script-source';
  sourceChip.style.display = 'inline-flex';
  sourceChip.style.alignItems = 'center';
  sourceChip.style.justifyContent = 'center';
  sourceChip.style.minWidth = '58px';
  sourceChip.style.padding = '3px 8px';
  sourceChip.style.borderRadius = '999px';
  sourceChip.style.border = '1px solid #4b5563';
  sourceChip.style.fontSize = '11px';
  sourceChip.style.fontWeight = '700';
  sourceChip.style.letterSpacing = '0.2px';

  sourceRow.appendChild(sourceLabel);
  sourceRow.appendChild(sourceChip);
  sourceSection.appendChild(sourceRow);

  const statusSection = document.createElement('div');
  statusSection.style.marginTop = '10px';
  statusSection.style.paddingTop = '8px';
  statusSection.style.borderTop = '1px solid #374151';

  const statusHeading = document.createElement('div');
  statusHeading.textContent = 'Script status';
  statusHeading.style.fontWeight = '700';
  statusHeading.style.marginBottom = '6px';
  statusSection.appendChild(statusHeading);

  const rows = [
    { key: STATUS_KEYS.ip, label: 'IP lookup' },
    { key: STATUS_KEYS.mtm, label: 'MTM population' },
    { key: STATUS_KEYS.language, label: 'Language' },
    { key: STATUS_KEYS.country, label: 'Country' }
  ];

  rows.forEach(({ key, label: rowLabel }) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '10px';
    row.style.marginBottom = '6px';

    const labelEl = document.createElement('span');
    labelEl.textContent = rowLabel;
    labelEl.style.fontSize = '12px';

    const chip = document.createElement('span');
    chip.id = `ip-status-${key}`;
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.justifyContent = 'center';
    chip.style.minWidth = '58px';
    chip.style.padding = '3px 8px';
    chip.style.borderRadius = '999px';
    chip.style.border = '1px solid #22c55e';
    chip.style.fontSize = '11px';
    chip.style.fontWeight = '700';
    chip.style.letterSpacing = '0.2px';

    row.appendChild(labelEl);
    row.appendChild(chip);
    statusSection.appendChild(row);
  });

  panelBody.appendChild(label);
  panelBody.appendChild(select);
  panelBody.appendChild(resetButton);
  panelBody.appendChild(clearLocalStorageButton);
  panelBody.appendChild(sourceSection);
  panelBody.appendChild(statusSection);

  function setPanelMinimized(isMinimized) {
    panel.dataset.minimized = isMinimized ? 'true' : 'false';
    panelBody.style.display = isMinimized ? 'none' : 'block';
    minimizeButton.textContent = isMinimized ? '+' : '-';
    minimizeButton.setAttribute('aria-label', isMinimized ? 'Expand panel' : 'Minimize panel');
    headerTitle.textContent = 'Panel';
  }

  minimizeButton.addEventListener('click', () => {
    const isMinimized = panel.dataset.minimized === 'true';
    setPanelMinimized(!isMinimized);
  });

  setPanelMinimized(false);

  panel.appendChild(header);
  panel.appendChild(panelBody);
  document.body.appendChild(panel);

  if (!window.__IP_PANEL_STATUS_LISTENER_BOUND__) {
    window.addEventListener(PANEL_STATUS_EVENT_NAME, updateAllStatusChips);
    window.__IP_PANEL_STATUS_LISTENER_BOUND__ = true;
  }

  updateScriptSourceChip();
  updateAllStatusChips();
  logInfo('Floating language panel mounted.');
}

async function initializeUiTranslations() {
  activeUiLanguage = getInitialUiLanguage();

  if (!window.i18next || typeof window.i18next.init !== 'function') {
    logWarn('i18next is not available; continuing with fallback label translations.', { activeUiLanguage });
    applyUiFieldTranslations();
    ensureLanguagePanel();
    return;
  }

  if (!window.i18next.isInitialized) {
    await window.i18next.init({
      resources: UI_TRANSLATION_RESOURCES,
      lng: activeUiLanguage,
      fallbackLng: 'en',
      interpolation: { escapeValue: false }
    });
  } else {
    await window.i18next.changeLanguage(activeUiLanguage);
  }

  applyUiFieldTranslations();
  ensureLanguagePanel();
  logSuccess('Applied UI label/title translations.', { activeUiLanguage });
}

function ensureUiTranslationsInitialized() {
  if (!uiTranslationInitPromise) {
    uiTranslationInitPromise = initializeUiTranslations();
  }

  return uiTranslationInitPromise;
}

/* =========================
  Form field discovery helpers
  ========================= */
// Looks for element id in main document and same-origin iframes.
function getByIdAcrossDocuments(id) {
  if (!id) {
    return null;
  }

  const direct = document.getElementById(id);
  if (direct) {
    return direct;
  }

  for (const frame of Array.from(document.querySelectorAll('iframe'))) {
    try {
      const frameDoc = frame.contentDocument;
      if (!frameDoc) {
        continue;
      }

      const inFrame = frameDoc.getElementById(id);
      if (inFrame) {
        return inFrame;
      }
    } catch (error) {
      logDebug('Skipping iframe lookup due to access restriction.', error?.message || error);
    }
  }

  return null;
}

// Finds a field by label text, prioritizing label[for] and then nearby input/select fallback.
function getFieldByLabelText(labelText) {
  const expected = normalizeText(labelText);
  const labels = Array.from(document.querySelectorAll('label'));
  const label = labels.find((item) => normalizeText(item.textContent) === expected);

  if (!label) {
    return null;
  }

  const forId = label.getAttribute('for');
  if (forId) {
    const byFor = getByIdAcrossDocuments(forId);
    if (byFor) {
      return byFor;
    }
  }

  return label.closest('div')?.querySelector('input, textarea, select')
    || label.parentElement?.querySelector('input, textarea, select')
    || null;
}

// Email field used for deriving website domain.
function getEmailField() {
  const bySchema = getFieldFromSchema('email');
  const byName = document.querySelector(APP_CONFIG.selectors.emailFieldByName);
  const byTitle = document.querySelector(APP_CONFIG.selectors.emailFieldByTitle);
  const byLabel = getFieldByLabelText('Email');
  return bySchema || byName || byTitle || byLabel || null;
}

// Website field to receive derived URL from email domain.
function getWebsiteFieldInput() {
  const bySchema = getFieldFromSchema('website');
  const byName = document.querySelector(APP_CONFIG.selectors.websiteFieldByName);
  const byTitle = document.querySelector(APP_CONFIG.selectors.websiteFieldByTitle);
  const byId = document.getElementById(APP_CONFIG.selectors.websiteFieldById);
  const byLabel = getFieldByLabelText('Website');
  return bySchema || byName || byTitle || byId || byLabel || null;
}

function getWebsiteInfoField() {
  const bySchema = getFieldFromSchema('websiteInfo');
  const byTitle = document.querySelector(APP_CONFIG.selectors.websiteInfoFieldByTitle);
  const byName = document.querySelector(APP_CONFIG.selectors.websiteInfoFieldByName);
  const byId = document.getElementById(APP_CONFIG.selectors.websiteInfoFieldById);
  const byLabel = getFieldByLabelText('Website Info');
  return bySchema || byTitle || byName || byId || byLabel || null;
}

function getInsightsField() {
  const bySchema = getFieldFromSchema('insights');
  const byTitle = document.querySelector(APP_CONFIG.selectors.insightsFieldByTitle);
  const byName = document.querySelector(APP_CONFIG.selectors.insightsFieldByName);
  const byLabel = getFieldByLabelText('Insights');
  return bySchema || byTitle || byName || byLabel || null;
}

function getUtmField() {
  const bySchema = getFieldFromSchema('utm');
  const byLabelUtm = getFieldByLabelText('UTM');
  const byLabelUtmParams = getFieldByLabelText('UTM Params');
  const byLabelUtmParameters = getFieldByLabelText('UTM Parameters');

  return bySchema || byLabelUtm || byLabelUtmParams || byLabelUtmParameters || null;
}

function getIndustryField() {
  const bySchema = getFieldFromSchema('industry');
  const byLabel = getFieldByLabelText('Industry');
  return bySchema || byLabel || null;
}

function getCompanyField() {
  const bySchema = getFieldFromSchema('companyName');
  const byLabel = getFieldByLabelText('Company name');
  return bySchema || byLabel || null;
}

function getCampaignField() {
  const bySchema = getFieldFromSchema('campaign');
  const byLabel = getFieldByLabelText('Source Campaign');
  return bySchema || byLabel || null;
}

function getStoredUtmValue() {
  try {
    return String(localStorage.getItem('crm_utm') || '').trim();
  } catch (error) {
    logWarn('Unable to read crm_utm from localStorage.', error?.message || error);
    return '';
  }
}

function populateUtmField() {
  const utmValue = getStoredUtmValue();
  if (!utmValue) {
    logInfo('No crm_utm value found in localStorage; skipping UTM field population.');
    return true;
  }

  const utmField = getUtmField();
  if (!utmField) {
    logWarn('UTM field not found yet; retrying later.', {
      storageKey: 'crm_utm'
    });
    return false;
  }

  if (utmField.value !== utmValue) {
    utmField.value = utmValue;
    dispatchChangeEvents(utmField);
    logSuccess('Populated UTM field from localStorage crm_utm.', {
      valueLength: utmValue.length
    });
    return true;
  }

  logInfo('UTM field already matches localStorage value; no update needed.');
  return true;
}

function getStoredCampaignValue() {
  try {
    return String(localStorage.getItem('crm_campaign') || '').trim();
  } catch (error) {
    logWarn('Unable to read crm_campaign from localStorage.', error?.message || error);
    return '';
  }
}

async function populateCampaignLookupField() {
  const campaignValue = getStoredCampaignValue();
  if (!campaignValue) {
    logInfo('No crm_campaign value found in localStorage; skipping campaign lookup population.');
    return true;
  }

  const campaignField = getCampaignField();
  if (!campaignField) {
    logWarn('Campaign lookup field not found yet; retrying later.', {
      storageKey: 'crm_campaign'
    });
    return false;
  }

  const form = campaignField.closest('form') || document.querySelector('form');
  const logicalName = campaignField.getAttribute('name')
    || campaignField.getAttribute('data-targetproperty')
    || campaignField.id
    || 'campaignid';
  const fieldWindow = campaignField.ownerDocument?.defaultView || window;
  const d365 = fieldWindow?.d365mktforms || window.d365mktforms;

  if (form && logicalName && d365 && typeof d365.fillLookupFromSearch === 'function') {
    try {
      await d365.fillLookupFromSearch(form, logicalName, campaignValue);
      persistCapturedMetaValue('crm_campaign', campaignValue, 'campaign-d365-fillLookupFromSearch');
      logSuccess('Campaign lookup field populated via d365mktforms.fillLookupFromSearch.', {
        logicalName,
        campaignValue
      });
      return true;
    } catch (error) {
      logWarn('Campaign lookup API population failed; attempting direct input fallback.', {
        logicalName,
        campaignValue,
        message: error?.message || error
      });
    }
  }

  if (campaignField.value !== campaignValue) {
    campaignField.value = campaignValue;
    dispatchChangeEvents(campaignField);
    persistCapturedMetaValue('crm_campaign', campaignValue, 'campaign-direct-input');
    logSuccess('Campaign lookup field populated from localStorage crm_campaign.', {
      campaignValue
    });
    return true;
  }

  logInfo('Campaign lookup field already matches localStorage value; no update needed.');
  return true;
}

async function populateUtmFieldWithRetry(options = {}) {
  const retryMs = options.retryMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const success = populateUtmField();
    if (success) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logWarn('Unable to populate UTM field after retries.', { maxAttempts, retryMs });
  return false;
}

async function populateCampaignLookupFieldWithRetry(options = {}) {
  const retryMs = options.retryMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const success = await populateCampaignLookupField();
    if (success) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logWarn('Unable to populate campaign lookup field after retries.', { maxAttempts, retryMs });
  return false;
}

/* =========================
  Email -> Website autofill
  ========================= */
// logic function - Extracts the domain part from an email address. Returns null when invalid/incomplete.
function extractDomainFromEmail(emailValue) {
  const email = String(emailValue || '').trim().toLowerCase();
  const atIndex = email.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === email.length - 1) {
    return null;
  }

  const domain = email.slice(atIndex + 1).trim();
  if (!domain || !domain.includes('.')) {
    return null;
  }

  return domain;
}

// logic function
function getWebsiteFromDomain(domain) {
  return `https://${domain}`;
}

// Computes and writes website URL from email domain unless email uses a free provider.
function syncWebsiteFromEmail() {
  const emailField = getEmailField();
  const websiteField = getWebsiteFieldInput();

  if (!emailField || !websiteField) {
    logWarn('Email/Website sync skipped: missing email or website field.', {
      hasEmailField: !!emailField,
      hasWebsiteField: !!websiteField
    });
    return false;
  }

  const domain = extractDomainFromEmail(emailField.value);
  if (!domain) {
    logInfo('Email/Website sync skipped: email value has no valid domain yet.');
    return false;
  }

  const freeDomains = getFreeEmailDomainSet();
  if (freeDomains.has(domain)) {
    logInfo('Email/Website sync skipped: free email provider domain.', { domain });
    return false;
  }

  const nextWebsite = getWebsiteFromDomain(domain);
  if (websiteField.value !== nextWebsite) {
    websiteField.value = nextWebsite;
    dispatchChangeEvents(websiteField);
    persistCapturedMetaValue('crm_website', nextWebsite, 'email-domain-sync');
    logSuccess('Website auto-populated from email domain.', { domain, website: nextWebsite });
    return true;
  }

  persistCapturedMetaValue('crm_website', nextWebsite, 'email-domain-sync-noop');
  logInfo('Website already matches email domain; no update needed.', { domain });
  return true;
}

function persistFormFieldValue(field, storageKey, source) {
  const value = String(field?.value || '').trim();
  if (!value) {
    return false;
  }

  return persistCapturedMetaValue(storageKey, value, source);
}

function bindFormFieldPersistence(field, storageKey, source) {
  if (!field) {
    return false;
  }

  const bindKey = `${storageKey}Bound`;
  if (field.dataset[bindKey] === 'true') {
    return true;
  }

  const handler = () => {
    persistFormFieldValue(field, storageKey, source);
  };

  field.addEventListener('input', handler);
  field.addEventListener('change', handler);
  field.dataset[bindKey] = 'true';
  handler();
  return true;
}

function bindFormProfilePersistence() {
  const websiteField = getWebsiteFieldInput();
  const industryField = getIndustryField();
  const companyField = getCompanyField();

  const websiteBound = bindFormFieldPersistence(websiteField, 'crm_website', 'form-field-listener');
  const industryBound = bindFormFieldPersistence(industryField, 'crm_industry', 'form-field-listener');
  const companyBound = bindFormFieldPersistence(companyField, 'crm_company', 'form-field-listener');

  return websiteBound || industryBound || companyBound;
}

async function bindFormProfilePersistenceWithRetry(options = {}) {
  const retryMs = options.retryMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const bound = bindFormProfilePersistence();
    if (bound) {
      logSuccess('Form profile storage sync ready.', { attempt, maxAttempts });
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logWarn('Unable to bind form profile storage listeners after retries.', { maxAttempts, retryMs });
  return false;
}

// Binds listeners so website updates whenever email changes.
function bindEmailToWebsiteSync() {
  const emailField = getEmailField();
  if (!emailField) {
    return false;
  }

  if (emailField.dataset.websiteSyncBound === 'true') {
    logDebug('Email/Website sync listeners already attached.');
    return true;
  }

  const handler = () => {
    syncWebsiteFromEmail();
  };

  emailField.addEventListener('input', handler);
  emailField.addEventListener('change', handler);
  emailField.dataset.websiteSyncBound = 'true';

  logSuccess('Attached email→website sync listeners.');
  syncWebsiteFromEmail();
  return true;
}

// Retries listener binding in case fields render asynchronously.
async function bindEmailToWebsiteSyncWithRetry(options = {}) {
  const retryMs = options.retryMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const bound = bindEmailToWebsiteSync();
    if (bound) {
      logSuccess('Email→website sync ready.', { attempt, maxAttempts });
      return true;
    }

    logWarn('Email/Website fields not ready; retrying sync bind…', { attempt, maxAttempts, retryMs });
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logError('Unable to attach email→website sync after retries.', { maxAttempts, retryMs });
  return false;
}

/* =========================
  Website metadata autofill
  ========================= */
// logic function
function hasValidDomainHostname(hostname) {
  const value = String(hostname || '').trim().toLowerCase();
  if (!value || value.includes(' ') || !value.includes('.')) {
    return false;
  }

  const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i;
  return domainPattern.test(value);
}

// logic function
function normalizeWebsiteUrl(urlValue) {
  const raw = String(urlValue || '').trim();
  if (!raw) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!/^https?:$/i.test(parsed.protocol)) {
      logDebug('Website URL rejected: protocol must be http/https.', { raw, protocol: parsed.protocol });
      return null;
    }

    if (!hasValidDomainHostname(parsed.hostname)) {
      logDebug('Website URL rejected: hostname is not a properly formatted domain.', {
        raw,
        hostname: parsed.hostname
      });
      return null;
    }

    return parsed.toString();
  } catch (error) {
    logDebug('Website URL is not valid yet; skipping metadata fetch.', { raw });
    return null;
  }
}

// logic function
function formatWebsiteInfo(metadata, websiteUrl) {
  const data = metadata?.data || {};

  const groups = [
    ['Title', data.title],
    ['Description', data.description],
    ['Author', data.author],
    ['Company', data.publisher],
    ['Logo', data.logo?.url],
  ];

  const present = groups.filter(([, value]) => value != null && String(value).trim() !== '');
  return present
    .map(([key, value]) => `${key}:\n${value}\n---`)
    .join('\n')
    .replace(/---\s*$/, '');
}

// logic function
function cleanInsightsDescription(descriptionValue) {
  return String(descriptionValue || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// DOM update
function setWebsiteInfoField(value) {
  const infoField = getWebsiteInfoField();
  if (!infoField) {
    logWarn('Website Info field not found.');
    return false;
  }

  const nextValue = value ?? '';
  if (infoField.value !== nextValue) {
    infoField.value = nextValue;
    dispatchChangeEvents(infoField);
    logSuccess('Website Info field updated.', { length: nextValue.length });
    return true;
  }

  logInfo('Website Info field already has latest value; no update needed.');
  return true;
}

// DOM update
function setInsightsField(value) {
  const insightsField = getInsightsField();
  if (!insightsField) {
    logWarn('Insights field not found.');
    return false;
  }

  const nextValue = cleanInsightsDescription(value);
  if (!nextValue) {
    logInfo('Insights description is empty; skipping Insights field update.');
    return true;
  }

  if (insightsField.value !== nextValue) {
    insightsField.value = nextValue;
    dispatchChangeEvents(insightsField);
    logSuccess('Insights field updated from website description.', { length: nextValue.length });
    return true;
  }

  logInfo('Insights field already has latest value; no update needed.');
  return true;
}

let websiteFetchDebounceId = null;
let lastResolvedWebsiteUrl = null;

async function fetchAndPopulateWebsiteInfo() {
  const websiteField = getWebsiteFieldInput();
  if (!websiteField) {
    logWarn('Website field not found.');
    return false;
  }

  const websiteUrl = normalizeWebsiteUrl(websiteField.value);
  if (!websiteUrl) {
    return false;
  }

  if (lastResolvedWebsiteUrl === websiteUrl) {
    logDebug('Skipping duplicate metadata fetch for unchanged website.', { websiteUrl });
    return true;
  }

  const endpoint = `${APP_CONFIG.api.microlinkBase}?${new URLSearchParams({ url: websiteUrl }).toString()}`;
  const payload = await fetchSafe(endpoint, 'Website metadata', abortIn(APP_CONFIG.timing.timeoutWebsiteMetadataMs));

  if (!payload || payload.status !== 'success') {
    logWarn('Microlink returned non-success response.', payload);
    return false;
  }

  const formatted = formatWebsiteInfo(payload, websiteUrl);
  const didSetWebsiteInfo = setWebsiteInfoField(formatted);
  const didSetInsights = setInsightsField(payload?.data?.description || '');
  if (didSetWebsiteInfo || didSetInsights) {
    lastResolvedWebsiteUrl = websiteUrl;
  }

  return didSetWebsiteInfo || didSetInsights;
}

function queueWebsiteMetadataFetch() {
  if (websiteFetchDebounceId) {
    clearTimeout(websiteFetchDebounceId);
  }

  websiteFetchDebounceId = setTimeout(() => {
    fetchAndPopulateWebsiteInfo().catch((error) => {
      logError('Unhandled website metadata fetch error.', error?.message || error);
    });
  }, APP_CONFIG.timing.websiteFetchDebounceMs);
}

function bindWebsiteMetadataListeners() {
  const websiteField = getWebsiteFieldInput();
  if (!websiteField) {
    return false;
  }

  if (websiteField.dataset.websiteInfoBound === 'true') {
    logDebug('Website metadata listeners already attached.');
    return true;
  }

  websiteField.addEventListener('input', queueWebsiteMetadataFetch);
  websiteField.addEventListener('change', queueWebsiteMetadataFetch);
  websiteField.dataset.websiteInfoBound = 'true';

  logSuccess('Attached Website metadata listeners.');
  queueWebsiteMetadataFetch();
  return true;
}

async function bindWebsiteMetadataListenersWithRetry(options = {}) {
  const retryMs = options.retryMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const bound = bindWebsiteMetadataListeners();
    if (bound) {
      logSuccess('Website metadata automation ready.', { attempt, maxAttempts });
      return true;
    }

    logWarn('Website field not ready yet; retrying listener bind…', { attempt, maxAttempts, retryMs });
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logError('Unable to bind website metadata listeners after retries.', { maxAttempts, retryMs });
  return false;
}

/* =========================
  IP field discovery + writing
  ========================= */
// Attempts multiple selectors to find the target IP output field.
function getIpField() {
  const byData = document.querySelector('[data-ipfield="true"]');
  const byTitleIp = document.querySelector('textarea[title="IP"], input[title="IP"]');
  const byName = Array.from(document.querySelectorAll('textarea[name], input[name]')).find((item) =>
    normalizeText(item.getAttribute('name')) === 'ip'
  );
  const labels = Array.from(document.querySelectorAll('label'));
  const label = labels.find((item) => {
    const text = normalizeText(item.textContent);
    const title = normalizeText(item.getAttribute('title'));
    return text === 'ip' || title === 'ip' || text === 'ip address' || title === 'ip address';
  });

  const labelForId = label ? label.getAttribute('for') : null;
  const byLabelFor = labelForId ? getByIdAcrossDocuments(labelForId) : null;

  const byWrappedLabel = label
    ? label.querySelector('input, textarea, select')
    : null;

  const byLabelContainer = label && label.parentElement
    ? label.parentElement.querySelector('input, textarea, select')
    : null;

  const byLabelNextSibling = label
    ? (() => {
      let node = label.nextElementSibling;
      while (node) {
        const field = node.matches('input, textarea, select')
          ? node
          : node.querySelector('input, textarea, select');
        if (field) {
          return field;
        }
        node = node.nextElementSibling;
      }
      return null;
    })()
    : null;

  const byAriaLabel = Array.from(document.querySelectorAll('textarea[aria-label], input[aria-label], select[aria-label]')).find((item) =>
    normalizeText(item.getAttribute('aria-label')) === 'ip'
  );

  const byPlaceholder = Array.from(document.querySelectorAll('textarea[placeholder], input[placeholder]')).find((item) =>
    normalizeText(item.getAttribute('placeholder')) === 'ip'
  );

  logInfo('Field discovery results:', {
    byData: !!byData,
    byTitleIp: !!byTitleIp,
    byName: !!byName,
    labelForId: labelForId || null,
    byLabelFor: !!byLabelFor,
    byWrappedLabel: !!byWrappedLabel,
    byLabelContainer: !!byLabelContainer,
    byLabelNextSibling: !!byLabelNextSibling,
    byAriaLabel: !!byAriaLabel,
    byPlaceholder: !!byPlaceholder
  });

  logDebug('Available labels snapshot:', labels.map((item) => ({
    text: normalizeText(item.textContent),
    title: normalizeText(item.getAttribute('title')),
    forAttr: item.getAttribute('for') || null
  })));

  return byData
    || byTitleIp
    || byName
    || byLabelFor
    || byWrappedLabel
    || byLabelContainer
    || byLabelNextSibling
    || byAriaLabel
    || byPlaceholder;
}

// DOM update - Fires form events so host frameworks register value updates.
function dispatchChangeEvents(element) {
  const eventWindow = element.ownerDocument?.defaultView || window;
  element.dispatchEvent(new eventWindow.Event('input', { bubbles: true }));
  element.dispatchEvent(new eventWindow.Event('change', { bubbles: true }));
  logInfo('Dispatched input/change events for IP field.');
}

/* =========================
  Country lookup autofill
  ========================= */
// Uses d365mktforms.fillLookupFromSearch to set Country from detected geolocation country.
async function fillCountryLookup(countryName) {
  updateDebugState({ countryLookup: { stage: 'start', countryName: countryName || null } });
  setScriptStatus(STATUS_KEYS.country, 'Active', {
    source: 'country-start',
    countryName: countryName || null
  });

  if (!countryName) {
    logWarn('Country lookup skipped: no country name available from IP metadata.');
    updateDebugState({ countryLookup: { stage: 'skipped-no-country-name', countryName: null } });
    setScriptStatus(STATUS_KEYS.country, 'Error', {
      source: 'country-no-name'
    });
    return false;
  }

  const field = getFieldFromSchema('country') || getFieldByLabelText('Country');
  if (!field) {
    logWarn('Country lookup skipped: Country field not found by label.');
    logDebug('Country lookup diagnostics: available select names',
      Array.from(document.querySelectorAll('select[name]')).map((item) => item.getAttribute('name'))
    );
    updateDebugState({
      countryLookup: {
        stage: 'skipped-no-country-field',
        countryName,
        availableSelectNames: Array.from(document.querySelectorAll('select[name]')).map((item) => item.getAttribute('name'))
      }
    });
    setScriptStatus(STATUS_KEYS.country, 'Error', {
      source: 'country-field-not-found',
      countryName
    });
    return false;
  }

  const logicalName = field.getAttribute('name')
    || field.getAttribute('data-logical-name')
    || field.id
    || null;

  const form = field.closest('form') || document.querySelector('form');
  const fieldWindow = field.ownerDocument?.defaultView || window;
  const d365 = fieldWindow?.d365mktforms || window.d365mktforms;

  logInfo('Country lookup pre-check:', {
    countryName,
    logicalName,
    fieldTagName: field.tagName || null,
    fieldCurrentValue: field.value || null,
    hasForm: !!form,
    hasD365Api: !!d365
  });

  if (field.tagName === 'SELECT') {
    const optionTexts = Array.from(field.options || []).map((option) => option.textContent?.trim() || '').filter(Boolean);
    const exactMatch = optionTexts.find((item) => normalizeText(item) === normalizeText(countryName));
    logDebug('Country select option diagnostics:', {
      optionCount: optionTexts.length,
      sampleOptions: optionTexts.slice(0, 10),
      exactMatch: exactMatch || null
    });

    updateDebugState({
      countryLookup: {
        stage: 'select-diagnostics',
        countryName,
        optionCount: optionTexts.length,
        exactMatch: exactMatch || null,
        sampleOptions: optionTexts.slice(0, 10)
      }
    });

    const matchedOption = Array.from(field.options || []).find((option) =>
      normalizeText(option.textContent) === normalizeText(countryName)
    );

    if (matchedOption) {
      field.value = matchedOption.value;
      dispatchChangeEvents(field);
      persistCapturedMetaValue('crm_country', countryName, 'country-direct-select');
      logSuccess('Country autofill succeeded using direct select match.', {
        countryName,
        selectedValue: matchedOption.value,
        selectedText: matchedOption.textContent || null
      });
      setScriptStatus(STATUS_KEYS.country, 'Active', {
        source: 'country-direct-select',
        countryName,
        selectedValue: matchedOption.value
      });
      updateDebugState({
        countryLookup: {
          stage: 'success-direct-select',
          countryName,
          selectedValue: matchedOption.value,
          selectedText: matchedOption.textContent || null
        }
      });
      return true;
    }
  }

  if (!form || !logicalName || !d365 || typeof d365.fillLookupFromSearch !== 'function') {
    logWarn('Country lookup skipped: missing form, logical field name, or d365mktforms.fillLookupFromSearch API.');
    updateDebugState({
      countryLookup: {
        stage: 'skipped-missing-prereq',
        countryName,
        logicalName: logicalName || null,
        hasForm: !!form,
        hasD365Api: !!d365,
        hasFillLookupFromSearch: !!(d365 && typeof d365.fillLookupFromSearch === 'function')
      }
    });
    setScriptStatus(STATUS_KEYS.country, 'Error', {
      source: 'country-missing-prereq',
      countryName,
      logicalName: logicalName || null
    });
    return false;
  }

  try {
    const result = await d365.fillLookupFromSearch(form, logicalName, countryName);
    persistCapturedMetaValue('crm_country', countryName, 'country-d365-fillLookupFromSearch');
    logSuccess('Country lookup filled successfully.', {
      logicalName,
      countryName,
      result,
      fieldValueAfterLookup: field.value || null
    });
    updateDebugState({
      countryLookup: {
        stage: 'success',
        countryName,
        logicalName,
        result: result ?? null,
        fieldValueAfterLookup: field.value || null
      }
    });
    setScriptStatus(STATUS_KEYS.country, 'Active', {
      source: 'country-d365-success',
      countryName,
      logicalName
    });
    return true;
  } catch (error) {
    logError('Country lookup fill failed.', {
      logicalName,
      countryName,
      message: error?.message || error
    });
    updateDebugState({
      countryLookup: {
        stage: 'error',
        countryName,
        logicalName,
        errorMessage: error?.message || String(error)
      }
    });
    setScriptStatus(STATUS_KEYS.country, 'Error', {
      source: 'country-d365-error',
      countryName,
      logicalName,
      message: error?.message || String(error)
    });
    return false;
  }
}

/* =========================
  Language autofill
  ========================= */
// Finds the Language select field in the form.
function getLanguageField() {
  const bySchema = getFieldFromSchema('language');
  const byName = document.querySelector(APP_CONFIG.selectors.languageFieldByName);
  const byId = document.getElementById(APP_CONFIG.selectors.languageFieldById);
  const byLabel = getFieldByLabelText('Language');

  const field = bySchema || byName || byId || byLabel || null;
  if (field && field.tagName !== 'SELECT') {
    return null;
  }

  return field;
}

// DOM update - Writes LCID to the Language select when option exists.
function setLanguageFieldValue(lcidValue) {
  const field = getLanguageField();
  if (!field) {
    logWarn('Language field not found.');
    return false;
  }

  const optionExists = Array.from(field.options || []).some((option) => option.value === lcidValue);
  if (!optionExists) {
    logWarn('Language LCID option not found in field options.', { lcidValue });
    return false;
  }

  field.value = lcidValue;
  dispatchChangeEvents(field);
  logSuccess('Language field updated.', {
    lcidValue,
    selectedText: field.options[field.selectedIndex]?.text || null
  });
  return true;
}

// Detects browser language and sets corresponding Language select value.
async function fillLanguageFromBrowser(options = {}) {
  const retryMs = options.retryMs ?? 500;
  const maxAttempts = options.maxAttempts ?? 10;

  const browserTag = getPreferredBrowserLanguage();
  const lcidValue = getLcidForLanguageTag(browserTag) || '1033';
  setScriptStatus(STATUS_KEYS.language, 'Active', {
    source: 'language-start',
    browserTag,
    lcidValue
  });

  logInfo('Language mapping result:', { browserTag, lcidValue });

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const success = setLanguageFieldValue(lcidValue);
    if (success) {
      logSuccess('Language autofill succeeded.', { attempt, maxAttempts });
      setScriptStatus(STATUS_KEYS.language, 'Active', {
        source: 'language-success',
        browserTag,
        lcidValue,
        attempt
      });
      return true;
    }

    logWarn('Language field not ready; retrying…', { attempt, maxAttempts, retryMs });
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logError('Language autofill failed after retries.', { maxAttempts, retryMs, lcidValue });
  setScriptStatus(STATUS_KEYS.language, 'Error', {
    source: 'language-failed',
    browserTag,
    lcidValue,
    maxAttempts
  });
  return false;
}

// DOM update - Writes formatted IP metadata into the resolved IP field.
function setIpField(value) {
  const element = getIpField();
  if (!element) {
    logWarn('Target field not found for IP info.');
    return false;
  }

  logSuccess('Target field resolved:', {
    id: element.id || null,
    name: element.name || null,
    title: element.title || null,
    tagName: element.tagName || null
  });

  const nextValue = value ?? '';
  if (element.value !== nextValue) {
    element.value = nextValue;
    dispatchChangeEvents(element);
    logSuccess('Updated IP field value length:', nextValue.length);
    return true;
  }

  logInfo('IP field already has same value; skipping write.');
  return true;
}

// Retries IP field write while waiting for late-rendered form controls.
async function setIpFieldWithRetry(value, options = {}) {
  const retryMs = options.retryMs ?? 400;
  const maxAttempts = options.maxAttempts ?? 20;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const success = setIpField(value);
    if (success) {
      logSuccess('IP field write succeeded.', { attempt, maxAttempts });
      return true;
    }

    logWarn('IP field not available yet; retrying…', { attempt, maxAttempts, retryMs });
    await new Promise((resolve) => setTimeout(resolve, retryMs));
  }

  logError('Unable to locate IP field after retries.', { maxAttempts, retryMs });
  return false;
}

/* =========================
  Networking helpers
  ========================= */
function abortIn(milliseconds) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), milliseconds);
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  return controller.signal;
}

// API call - Safe fetch wrapper with timeout, diagnostics, and JSON parsing.
async function fetchSafe(url, label, signal) {
  const start = performance.now?.() ?? Date.now();
  logInfo(`Fetching: ${label}`, url);
  logDebug(`Signal status for ${label}:`, { aborted: !!signal?.aborted });

  try {
    const response = await fetch(url, { method: 'GET', signal, cache: 'no-store' });
    const duration = (performance.now?.() ?? Date.now()) - start;

    logInfo(`Response headers for ${label}:`, {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const bodyText = await response.text();
    logSuccess(`OK: ${label} (${duration.toFixed(0)}ms) bodyBytes=${bodyText.length}`);
    return JSON.parse(bodyText);
  } catch (error) {
    const duration = (performance.now?.() ?? Date.now()) - start;
    const aborted = error?.name === 'AbortError' || error?.message === 'timeout';

    logError(`FAILED: ${label} after ${duration.toFixed(0)}ms`, {
      message: error?.message || error,
      name: error?.name,
      aborted
    });

    throw error;
  }
}

/* =========================
  IP + metadata retrieval
  ========================= */
// API call - Tries IPv4 first, then IPv6 fallback.
async function getClientIP() {
  logInfo('Attempting IPv4 lookup via ipify…');

  try {
    const ip4Payload = await fetchSafe(
      APP_CONFIG.api.ipifyV4,
      'IPv4',
      abortIn(APP_CONFIG.timing.timeoutIpLookupMs)
    );

    const ip4 = ip4Payload?.ip || null;
    logSuccess('IPv4 result:', ip4);
    if (ip4) {
      return ip4;
    }
  } catch (error) {
    logWarn('IPv4 failed; will try IPv6.', error?.message || error);
  }

  logInfo('Attempting IPv6 lookup via ipify…');

  try {
    const ip6Payload = await fetchSafe(
      APP_CONFIG.api.ipifyV6,
      'IPv6 fallback',
      abortIn(APP_CONFIG.timing.timeoutIpLookupMs)
    );

    const ip6 = ip6Payload?.ip || null;
    logSuccess('IPv6 result:', ip6);
    return ip6;
  } catch (error) {
    logWarn('IPv6 fallback failed.', error?.message || error);
    return null;
  }
}

// logic function - Converts IP metadata payload into the human-readable multiline format stored in form.
function formatIpData(data) {
  if (!data) {
    return 'No IP data received.';
  }

  const groups = [
    ['IP Address', data.ipAddress],
        ['City', data.cityName],
    ['Country', data.countryName],
  ];

  const present = groups.filter(([, value]) => value != null && String(value).trim() !== '');
  logInfo('Formatting IP data: fields present', present.map(([key]) => key));
  logDebug('Formatting stats:', {
    totalCandidateFields: groups.length,
    presentFields: present.length
  });

  return present
    .map(([key, value]) => `${key}:\n${value}\n---`)
    .join('\n')
    .replace(/---\s*$/, '');
}

/* =========================
  Main orchestration flow
  ========================= */
// Main run: fetch IP + metadata, fill IP field, country, language, and bind website sync.
async function startIpScript() {
  logInfo('Entered d365mkt-afterformload handler. Beginning main execution…');
  setScriptStatus(STATUS_KEYS.ip, 'Active', { source: 'ip-start' });

  const ip = await getClientIP();
  updateDebugState({ ipLookup: { ip: ip || null } });
  if (!ip) {
    logWarn('Could not determine client IP. Using default API resolution (geo by request).');
  }

  const endpoint = ip
    ? `${APP_CONFIG.api.freeIpApiBase}${encodeURIComponent(ip)}`
    : APP_CONFIG.api.freeIpApiBase;

  logInfo('Fetching metadata endpoint:', endpoint);

  const data = await fetchSafe(endpoint, 'IP metadata', abortIn(APP_CONFIG.timing.timeoutIpMetadataMs));
  logInfo('Metadata payload sample keys', data ? Object.keys(data) : 'null');
  logInfo('Country metadata extracted:', {
    countryName: data?.countryName || null,
    countryCode: data?.countryCode || null,
    cityName: data?.cityName || null
  });
  updateDebugState({
    ipMetadata: {
      countryName: data?.countryName || null,
      countryCode: data?.countryCode || null,
      cityName: data?.cityName || null
    }
  });
  logDebug('Metadata payload preview', data);

  const formatted = formatIpData(data);
  window.__IP_CAPTURED__ = formatted;
  logSuccess('Stored formatted payload on window.__IP_CAPTURED__.');
  await setIpFieldWithRetry(formatted, { retryMs: 500, maxAttempts: 2 });
  await fillCountryLookup(data?.countryName);
  await fillLanguageFromBrowser({ retryMs: 500, maxAttempts: 2 });
  await populateUtmFieldWithRetry({ retryMs: 500, maxAttempts: 2 });
  await populateCampaignLookupFieldWithRetry({ retryMs: 500, maxAttempts: 2 });
  await bindFormProfilePersistenceWithRetry({ retryMs: 500, maxAttempts: 2 });
  await bindEmailToWebsiteSyncWithRetry({ retryMs: 500, maxAttempts: 2 });
  await bindWebsiteMetadataListenersWithRetry({ retryMs: 500, maxAttempts: 2 });

  console.log('[Form JS IP] Stored formatted IP data for Marketing Form injection.');
  logSuccess('Done: IP data successfully captured.');
  setScriptStatus(STATUS_KEYS.ip, 'Active', { source: 'ip-success' });
}

async function runSafely() {
  try {
    await ensureUiTranslationsInitialized();
  } catch (error) {
    logWarn('UI translation initialization failed; continuing without blocking main flow.', error?.message || error);
  }

  startIpScript().catch((error) => {
    logError('Unhandled exception in IP script', error);
    setScriptStatus(STATUS_KEYS.ip, 'Error', {
      source: 'ip-unhandled-error',
      message: error?.message || String(error)
    });
  });
}

let hasRun = false;

// Ensures the script executes only once even if multiple lifecycle events fire.
function runOnce(source) {
  if (hasRun) {
    logInfo('Skipping duplicate trigger from:', source);
    return;
  }

  hasRun = true;
  logInfo('Starting IP script from trigger:', source);
  runSafely();
}

/* =========================
  Startup triggers
  ========================= */
document.addEventListener('d365mkt-afterformload', () => runOnce('d365mkt-afterformload'));
logInfo('Attached d365mkt-afterformload listener for post-form-load execution.');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => runOnce('DOMContentLoaded fallback'));
  logInfo('Attached DOMContentLoaded fallback trigger.');
} else {
  runOnce('immediate fallback');
}

// Export for test environments (CommonJS/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // logic function
    normalizeText,
    getFreeEmailDomainSet,
    getLcidForLanguageTag,
    getSupportedUiLanguage,
    extractDomainFromEmail,
    getWebsiteFromDomain,
    hasValidDomainHostname,
    normalizeWebsiteUrl,
    formatWebsiteInfo,
    cleanInsightsDescription,
    formatIpData,
    // API call
    fetchSafe,
    getClientIP,
    // DOM update
    dispatchChangeEvents,
    setWebsiteInfoField,
    setInsightsField,
    setLanguageFieldValue,
    setIpField
  };
}
