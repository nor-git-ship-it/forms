'use strict';

(function () {
  const SITE_LOG_STYLES = {
    info: 'background:#16a34a;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
    success: 'background:#16a34a;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
    warn: 'background:#dc2626;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;',
    error: 'background:#dc2626;color:#fff;padding:3px 6px;border-radius:3px;font-weight:700;'
  };

  function siteLogInfo(scope, ...args) {
    console.log(`%c[Site JS ${scope}]`, SITE_LOG_STYLES.info, ...args);
  }

  function siteLogWarn(scope, ...args) {
    console.warn(`%c[Site JS ${scope}]`, SITE_LOG_STYLES.warn, ...args);
  }

  const TTL_MS = 365 * 24 * 60 * 60 * 1000;
  const RESET_FLAG_PARAM = 'mtm_reset';
  const CRM_MTM_KEY_PREFIX = 'crm_mtm_';
  const META_KEYS = {
    version: 'crm_version',
    createdAt: 'crm_created',
    expiresAt: 'crm_expires',
    browserLanguage: 'crm_language',
    entryUrl: 'crm_entry',
    referrerUrl: 'crm_referrer',
    country: 'crm_country',
    campaign: 'crm_campaign',
    siteUtm: 'crm_utm'
  };

  const RESERVED_KEYS = new Set(Object.values(META_KEYS));
  const ALWAYS_OVERWRITE_MTM_KEYS = new Set(['mtm_term']);

  // logic function
  function sanitizeUrl(rawUrl) {
    if (!rawUrl) {
      return '';
    }

    try {
      const parsed = new URL(rawUrl, window.location.origin);
      return `${parsed.origin}${parsed.pathname}`;
    } catch (_) {
      return '';
    }
  }

  function clearStoredRecord() {
    const keysToDelete = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) {
        continue;
      }

      if (
        RESERVED_KEYS.has(key)
        || key.startsWith(CRM_MTM_KEY_PREFIX)
        || key.startsWith('site_mtm_')
        || key.startsWith('mtm_')
        || key.startsWith('utm_')
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => localStorage.removeItem(key));
  }

  function readStoredRecord() {
    const createdAt = localStorage.getItem(META_KEYS.createdAt);
    const expiresAt = localStorage.getItem(META_KEYS.expiresAt);

    if (!createdAt || !expiresAt) {
      return null;
    }

    const expiresAtMs = Date.parse(expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      clearStoredRecord();
      return null;
    }

    if (Date.now() > expiresAtMs) {
      clearStoredRecord();
      return null;
    }

    const record = {
      version: Number(localStorage.getItem(META_KEYS.version) || '1'),
      createdAt,
      expiresAt,
      browserLanguage: localStorage.getItem(META_KEYS.browserLanguage) || '',
      entryUrl: localStorage.getItem(META_KEYS.entryUrl) || '',
      referrerUrl: localStorage.getItem(META_KEYS.referrerUrl) || '',
      country: localStorage.getItem(META_KEYS.country) || '',
      campaign: localStorage.getItem(META_KEYS.campaign) || '',
      siteUtm: localStorage.getItem(META_KEYS.siteUtm) || '',
      mtm: {}
    };

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) {
        continue;
      }

      if (key.startsWith(CRM_MTM_KEY_PREFIX)) {
        const mtmKey = `mtm_${key.slice(CRM_MTM_KEY_PREFIX.length)}`;
        record.mtm[mtmKey] = localStorage.getItem(key) || '';
      } else if (key.startsWith('site_mtm_')) {
        const mtmKey = `mtm_${key.slice('site_mtm_'.length)}`;
        record.mtm[mtmKey] = localStorage.getItem(key) || '';
      } else if (key.startsWith('mtm_')) {
        // Backward compatibility for previously stored keys.
        record.mtm[key] = localStorage.getItem(key) || '';
      }
    }

    return record;
  }

  // logic function
  function normalizeParamMap(searchParams, prefix, options = {}) {
    const normalizeKeys = options.normalizeKeys !== false;
    const values = {};
    searchParams.forEach((value, key) => {
      if (!key.toLowerCase().startsWith(prefix) || value === '') {
        return;
      }

      values[normalizeKeys ? key.toLowerCase() : key] = value;
    });
    return values;
  }

  // logic function
  function serializeParamMap(values) {
    return Object.entries(values || {})
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
  }

  // logic function
  function getFirstParamValue(searchParams, keys) {
    for (const key of keys) {
      const value = (searchParams.get(key) || '').trim();
      if (value) {
        return value;
      }
    }

    return '';
  }

  // logic function
  function hasAnyAttribution(data) {
    return Object.keys(data?.mtm || {}).length > 0;
  }

  // logic function
  function shouldReset(searchParams) {
    const resetValue = (searchParams.get(RESET_FLAG_PARAM) || '').toLowerCase();
    return resetValue === '1' || resetValue === 'true' || resetValue === 'yes';
  }

  function buildRecord() {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MS);
    const searchParams = new URLSearchParams(window.location.search || '');

    return {
      version: 1,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      browserLanguage: navigator.language || '',
      entryUrl: sanitizeUrl(window.location.href),
      referrerUrl: sanitizeUrl(document.referrer || ''),
      country: getFirstParamValue(searchParams, ['country', 'countryName']),
      campaign: getFirstParamValue(searchParams, ['crm_campaign']),
      siteUtm: serializeParamMap(normalizeParamMap(searchParams, 'utm_', { normalizeKeys: false })),
      mtm: normalizeParamMap(searchParams, 'mtm_')
    };
  }

  function writeRecord(record) {
    clearStoredRecord();

    localStorage.setItem(META_KEYS.version, String(record.version || 1));
    localStorage.setItem(META_KEYS.createdAt, record.createdAt || '');
    localStorage.setItem(META_KEYS.expiresAt, record.expiresAt || '');
    localStorage.setItem(META_KEYS.browserLanguage, record.browserLanguage || '');
    localStorage.setItem(META_KEYS.entryUrl, record.entryUrl || '');
    localStorage.setItem(META_KEYS.referrerUrl, record.referrerUrl || '');
    localStorage.setItem(META_KEYS.country, record.country || '');
    localStorage.setItem(META_KEYS.campaign, record.campaign || '');
    localStorage.setItem(META_KEYS.siteUtm, record.siteUtm || '');

    Object.entries(record.mtm || {}).forEach(([key, value]) => {
      const nextKey = key.startsWith('mtm_')
        ? `${CRM_MTM_KEY_PREFIX}${key.slice(4)}`
        : `${CRM_MTM_KEY_PREFIX}${key}`;
      localStorage.setItem(nextKey, value);
    });
  }

  function mergeMissingMtmFields(current, incoming) {
    const merged = {
      ...current,
      mtm: {
        ...(current.mtm || {})
      }
    };

    let changed = false;

    Object.entries(incoming.mtm || {}).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      if (ALWAYS_OVERWRITE_MTM_KEYS.has(key) && merged.mtm[key] !== value) {
        merged.mtm[key] = value;
        changed = true;
        return;
      }

      if (!merged.mtm[key]) {
        merged.mtm[key] = value;
        changed = true;
      }
    });

    return { record: merged, changed };
  }

  function mergeMissingMetaFields(current, incoming) {
    const merged = { ...current };
    let changed = false;

    ['country', 'campaign'].forEach((key) => {
      if (!merged[key] && incoming[key]) {
        merged[key] = incoming[key];
        changed = true;
      }
    });

    if (!merged.siteUtm && incoming.siteUtm) {
      merged.siteUtm = incoming.siteUtm;
      changed = true;
    }

    return { record: merged, changed };
  }

  function capture() {
    let current = readStoredRecord();
    const searchParams = new URLSearchParams(window.location.search || '');
    const reset = shouldReset(searchParams);

    if (current && !reset) {
      const incoming = buildRecord();
      const mergedResult = mergeMissingMtmFields(current, incoming);
      const mergedMetaResult = mergeMissingMetaFields(mergedResult.record, incoming);

      if (mergedResult.changed || mergedMetaResult.changed) {
        writeRecord(mergedMetaResult.record);
        current = mergedMetaResult.record;
        siteLogInfo('MTM', 'Merged missing attribution fields into existing record.', {
          hasMtm: Object.keys(current?.mtm || {}).length > 0,
          hasSiteUtm: !!current?.siteUtm
        });
      }

      return current;
    }

    const next = buildRecord();

    if (!reset && !hasAnyAttribution(next) && current) {
      return current;
    }

    writeRecord(next);
    current = next;
    siteLogInfo('IP', 'Captured attribution record.', {
      hasMtm: Object.keys(current?.mtm || {}).length > 0,
      hasSiteUtm: !!current?.siteUtm
    });
    return current;
  }

  function get() {
    return readStoredRecord();
  }

  window.SiteAttribution = {
    capture,
    get,
    sanitizeUrl,
    normalizeParamMap,
    serializeParamMap,
    getFirstParamValue,
    hasAnyAttribution,
    shouldReset,
    keys: {
      ...META_KEYS
    }
  };

  // Export for test environments (CommonJS/Node.js)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      // logic function
      sanitizeUrl,
      normalizeParamMap,
      serializeParamMap,
      getFirstParamValue,
      hasAnyAttribution,
      shouldReset
    };
  }

  const payload = capture();
  if (!payload) {
    siteLogWarn('IP', 'Attribution payload is empty after capture.');
  }
  window.dispatchEvent(new CustomEvent('site:attribution-ready', { detail: payload }));
})();
