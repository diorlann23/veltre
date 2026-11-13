export type InstallOS = 'ios' | 'android' | 'desktop'
export type InstallBrowser = 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsung' | 'opera' | 'inapp' | 'other'

export interface InstallEnv {
  os: InstallOS
  browser: InstallBrowser
}

const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|BytedanceWebview|musical_ly|Snapchat|LinkedInApp|; wv\)/i

export function detectInstallEnv(ua: string, maxTouchPoints = 0): InstallEnv {
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
  const os: InstallOS = ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop'

  if (os !== 'desktop' && IN_APP.test(ua)) return { os, browser: 'inapp' }

  if (os === 'ios') {
    if (/CriOS/.test(ua)) return { os, browser: 'chrome' }
    if (/FxiOS/.test(ua)) return { os, browser: 'firefox' }
    if (/EdgiOS/.test(ua)) return { os, browser: 'edge' }
    return { os, browser: 'safari' }
  }

  if (/SamsungBrowser/.test(ua)) return { os, browser: 'samsung' }
  if (/Edg(e|A)?\//.test(ua)) return { os, browser: 'edge' }
  if (/OPR\/|Opera/.test(ua)) return { os, browser: 'opera' }
  if (/Firefox\//.test(ua)) return { os, browser: 'firefox' }
  if (/Chrome\/|Chromium\//.test(ua)) return { os, browser: 'chrome' }
  if (os === 'desktop' && /Safari\//.test(ua)) return { os, browser: 'safari' }
  return { os, browser: 'other' }
}

/** The browser to write steps for when the visitor picks a device tab other than their own. */
export const defaultBrowser: Record<InstallOS, InstallBrowser> = { ios: 'safari', android: 'chrome', desktop: 'chrome' }
