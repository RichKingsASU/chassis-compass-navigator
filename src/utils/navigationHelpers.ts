interface NavItem {
  title: string
  path: string
  subItems?: { title: string; path: string }[]
}

export function getPageTitle(
  pathname: string,
  navItems: NavItem[],
  state?: { title?: string } | null
): string {
  if (state?.title) return state.title

  for (const item of navItems) {
    if (item.path === pathname) return item.title
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.path === pathname) return sub.title
      }
    }
  }

  // Handle dynamic routes
  if (pathname.includes('/invoices/new')) return 'New Invoice'
  if (pathname.includes('/review')) return 'Invoice Review'
  if (pathname.includes('/dispute')) return 'Invoice Dispute'
  if (pathname.includes('/invoice-line/')) return 'Invoice Line Details'
  if (pathname.includes('/validate')) return 'Invoice Validation'

  return 'Chassis Compass'
}
