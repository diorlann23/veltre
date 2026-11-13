export const mainNav = [
  { label: 'Shop', href: '/shop' },
  { label: 'Collections', href: '/collections' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

export const isActivePath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)
