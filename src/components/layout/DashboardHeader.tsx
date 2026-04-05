import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Moon, Sun, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from 'next-themes'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SearchResult {
  type: 'load' | 'chassis' | 'dcli'
  id: string
  label: string
  sublabel: string
  path: string
}

interface DashboardHeaderProps {
  pageTitle: string
}

export default function DashboardHeader({ pageTitle }: DashboardHeaderProps) {
  const { signOut, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      setShowResults(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const q = query.trim()
      const searchResults: SearchResult[] = []
      try {
        const [tmsRes, ltRes, dcliRes] = await Promise.all([
          supabase.from('mg_data').select('id, ld_num, acct_mgr_name, status').or(`chassis_number.ilike.%${q}%,ld_num.ilike.%${q}%,acct_mgr_name.ilike.%${q}%`).limit(5),
          supabase.from('long_term_lease_owned').select('id, forrest_chz, lessor, chassis_status').ilike('forrest_chz', `%${q}%`).limit(3),
          supabase.from('dcli_activity').select('id, chassis, date_out, days_out').ilike('chassis', `%${q}%`).limit(3),
        ])
        for (const r of (tmsRes.data || [])) {
          searchResults.push({ type: 'load', id: r.id, label: `${r.ld_num || 'N/A'} — ${r.acct_mgr_name || 'N/A'}`, sublabel: r.status || '', path: '/tms/mercury-gate' })
        }
        for (const r of (ltRes.data || [])) {
          searchResults.push({ type: 'chassis', id: r.id, label: r.forrest_chz?.trim() || 'N/A', sublabel: `${r.lessor || ''} — ${r.chassis_status || ''}`, path: '/chassis' })
        }
        for (const r of (dcliRes.data || [])) {
          searchResults.push({ type: 'dcli', id: r.id, label: r.chassis?.trim() || 'N/A', sublabel: `Date Out: ${r.date_out || 'N/A'} — ${r.days_out || 0} days`, path: '/vendors/dcli' })
        }
      } catch { /* search silently fails */ }
      setResults(searchResults)
      setShowResults(true)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 border-b bg-background flex items-center gap-4 px-4">
      <SidebarTrigger />
      <h2 className="font-semibold text-lg">{pageTitle}</h2>
      <div className="flex-1" />
      <div className="relative hidden md:block" ref={containerRef}>
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search chassis, loads, vendors..." className="pl-8 w-64" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); setShowResults(false) } }} onFocus={() => { if (results.length > 0) setShowResults(true) }} />
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            {results.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No results for &apos;{query}&apos;</p> : (
              <>
                {['load', 'chassis', 'dcli'].map(type => {
                  const group = results.filter(r => r.type === type)
                  if (group.length === 0) return null
                  const groupLabel = type === 'load' ? 'Loads' : type === 'chassis' ? 'Long Term' : 'DCLI'
                  return (
                    <div key={type}>
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50">{groupLabel}</p>
                      {group.map(r => (
                        <button key={r.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between items-center" onClick={() => { navigate(r.path); setQuery(''); setShowResults(false) }}>
                          <span className="font-medium">{r.label}</span>
                          <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
      {/* TODO: implement notification panel */}
      <div className="relative"><Bell className="h-4 w-4 text-muted-foreground" /></div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">{user?.email?.charAt(0).toUpperCase() || 'U'}</div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-muted-foreground text-xs" disabled>{user?.email || 'User'}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
