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
  const [showDropdown, setShowDropdown] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.trim().length < 3) {
      setResults([])
      setShowDropdown(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      const q = query.trim()
      const all: SearchResult[] = []
      try {
        const [mgRes, ltRes, dcliRes] = await Promise.all([
          supabase.from('mg_tms')
            .select('ld_num, customer_name, status')
            .or(`chassis_number.ilike.%${q}%,ld_num.ilike.%${q}%,customer_name.ilike.%${q}%`)
            .limit(5),
          supabase.from('long_term_lease_owned')
            .select('id, chassis_number, lessor, status')
            .ilike('chassis_number', `%${q}%`)
            .limit(3),
          supabase.from('dcli_activity')
            .select('id, chassis, date_out, days_out')
            .ilike('chassis', `%${q}%`)
            .limit(3),
        ])
        for (const r of (mgRes.data || [])) {
          all.push({ type: 'load', label: r.ld_num, sublabel: `${r.customer_name || ''} — ${r.status || ''}`, path: '/tms/mercury-gate' })
        }
        for (const r of (ltRes.data || [])) {
          all.push({ type: 'chassis', label: r.chassis_number?.trim(), sublabel: `${r.lessor || ''} — ${r.status || ''}`, path: `/chassis/${r.id}` })
        }
        for (const r of (dcliRes.data || [])) {
          all.push({ type: 'dcli', label: (r.chassis || '').trim(), sublabel: `Date Out: ${r.date_out || 'N/A'} — ${r.days_out ?? '?'}d`, path: '/vendors/dcli' })
        }
      } catch (err) {
        console.error('[Search] failed:', err)
      }
      setResults(all)
      setShowDropdown(true)
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  function handleSelect(result: SearchResult) {
    setQuery('')
    setShowDropdown(false)
    navigate(result.path)
  }

  return (
    <header className="h-14 border-b bg-background flex items-center gap-4 px-4">
      <SidebarTrigger />
      <h2 className="font-semibold text-lg">{pageTitle}</h2>
      <div className="flex-1" />

      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chassis, loads, vendors..."
          className="pl-8 w-72"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setQuery(''); setShowDropdown(false) }
          }}
          onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {showDropdown && (
          <div className="absolute top-10 left-0 w-full bg-background border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">No results for '{query}'</p>
            ) : (
              <>
                {['load', 'chassis', 'dcli'].map(type => {
                  const group = results.filter(r => r.type === type)
                  if (group.length === 0) return null
                  const title = type === 'load' ? 'Loads' : type === 'chassis' ? 'Long Term' : 'DCLI'
                  return (
                    <div key={type}>
                      <p className="text-xs font-semibold text-muted-foreground px-3 pt-2">{title}</p>
                      {group.map((r, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                          onMouseDown={() => handleSelect(r)}
                        >
                          <span className="font-mono">{r.label}</span>
                          <span className="text-muted-foreground text-xs truncate ml-2">{r.sublabel}</span>
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

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      {/* TODO: implement notification panel */}
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
            {user?.email || 'User'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
