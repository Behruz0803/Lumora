import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../services/api'
import { tr } from '../i18n'

interface State<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * Minimal data-fetching hook with abort handling and a manual refetch.
 * Keeps loading/error/empty states consistent across every page.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true })
  const [reloadKey, setReloadKey] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const requestId = useRef(0)

  useEffect(() => {
    const current = ++requestId.current
    let active = true
    setState((prev) => ({ data: prev.data, error: null, loading: true }))
    fetcherRef
      .current()
      .then((data) => {
        if (active && current === requestId.current) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (!active || current !== requestId.current) return
        const message =
          error instanceof ApiError ? error.message : tr('Something went wrong while loading data.')
        setState({ data: null, error: message, loading: false })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const refetch = useCallback(() => setReloadKey((key) => key + 1), [])
  return { ...state, refetch, setData: (data: T) => setState({ data, error: null, loading: false }) }
}
