'use client'

import { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface SearchResult {
  id: string
  url: string
  excerpt: string
  meta: {
    title: string
  }
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      // @ts-ignore - Pagefind is injected at runtime
      if (typeof window !== 'undefined' && window.pagefind) {
        // @ts-ignore
        const search = await window.pagefind.search(searchQuery)
        const resultData = await Promise.all(
          search.results.slice(0, 10).map((r: any) => r.data())
        )
        setResults(resultData)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load Pagefind
    const loadPagefind = async () => {
      if (typeof window !== 'undefined') {
        try {
          // @ts-ignore
          await import('/pagefind/pagefind.js')
        } catch (error) {
          console.warn('Pagefind not loaded:', error)
        }
      }
    }

    if (open) {
      loadPagefind()
    }
  }, [open])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search posts, labs, and docs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {loading && (
            <div className="text-sm text-muted-foreground">Searching...</div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="text-sm text-muted-foreground">No results found.</div>
          )}

          <div className="space-y-2">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                onClick={() => onOpenChange(false)}
              >
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{result.meta.title}</h3>
                    <p
                      className="text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

