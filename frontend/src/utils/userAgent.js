export function parseUserAgent(userAgent) {
  if (typeof userAgent !== "string" || userAgent.trim() === "") {
    return { browser: null, os: null, device: null };
  }

  const ua = userAgent.toLowerCase();

  let browser = null;
  if (/edg\//.test(ua)) browser = "Edge";
  else if (/opr\/|opera/.test(ua)) browser = "Opera";
  else if (/samsungbrowser/.test(ua)) browser = "Samsung Internet";
  else if (/chrome\/|crios\/|chromium/.test(ua)) browser = "Chrome";
  else if (/firefox\/|fxios\//.test(ua)) browser = "Firefox";
  else if (/safari\//.test(ua)) browser = "Safari";

  let os = null;
  if (/windows nt/.test(ua)) os = "Windows";
  else if (/android/.test(ua)) os = "Android";
  else if (/iphone|ipod/.test(ua)) os = "iOS";
  else if (/ipad/.test(ua)) os = "iPadOS";
  else if (/mac os x/.test(ua)) os = "macOS";
  else if (/linux/.test(ua)) os = "Linux";

  let device;
  if (/ipad|tablet|silktablet|surface/.test(ua)) device = "Tablet";
  else if (/mobi|iphone|ipod|android/.test(ua)) device = "Mobile";
  else device = "Desktop";

  return { browser, os, device };
}