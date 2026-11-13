import { describe, expect, it } from 'vitest'
import { detectInstallEnv } from '@/lib/install-platform'

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.119 Mobile/15E148 Safari/604.1',
  iphoneInstagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.28.85',
  ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
  androidSamsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  androidWebView: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0.0 Mobile Safari/537.36',
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  winEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  linuxFirefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0',
}

describe('detectInstallEnv', () => {
  it('recognises iPhone browsers, including in-app ones', () => {
    expect(detectInstallEnv(UA.iphoneSafari)).toEqual({ os: 'ios', browser: 'safari' })
    expect(detectInstallEnv(UA.iphoneChrome)).toEqual({ os: 'ios', browser: 'chrome' })
    expect(detectInstallEnv(UA.iphoneInstagram)).toEqual({ os: 'ios', browser: 'inapp' })
  })

  it('treats an iPad requesting the desktop site as iOS', () => {
    expect(detectInstallEnv(UA.ipadDesktopMode, 5)).toEqual({ os: 'ios', browser: 'safari' })
    expect(detectInstallEnv(UA.macSafari, 0)).toEqual({ os: 'desktop', browser: 'safari' })
  })

  it('recognises Android browsers and webviews', () => {
    expect(detectInstallEnv(UA.androidChrome)).toEqual({ os: 'android', browser: 'chrome' })
    expect(detectInstallEnv(UA.androidSamsung)).toEqual({ os: 'android', browser: 'samsung' })
    expect(detectInstallEnv(UA.androidWebView)).toEqual({ os: 'android', browser: 'inapp' })
  })

  it('recognises desktop browsers', () => {
    expect(detectInstallEnv(UA.winChrome)).toEqual({ os: 'desktop', browser: 'chrome' })
    expect(detectInstallEnv(UA.winEdge)).toEqual({ os: 'desktop', browser: 'edge' })
    expect(detectInstallEnv(UA.linuxFirefox)).toEqual({ os: 'desktop', browser: 'firefox' })
  })
})
