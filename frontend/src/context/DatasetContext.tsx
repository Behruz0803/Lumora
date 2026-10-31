import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import type { DatasetStatus } from '../types'

/**
 * Where the numbers on screen come from.
 *
 * `status` is fetched once per session and refreshed after an import, so every
 * price surface can label itself honestly: fully demo, partially real, or real.
 * While the status is unknown the app assumes demo data (the safe default), so a
 * failed request can never make fictional prices look real.
 */
interface DatasetContextValue {
  status: DatasetStatus | null
  loading: boolean
  refresh: () => Promise<void>
}

const DatasetContext = createContext<DatasetContextValue>({
  status: null,
  loading: false,
  refresh: async () => {},
})

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DatasetStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setStatus(await api.datasetStatus())
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ status, loading, refresh }), [status, loading, refresh])
  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export function useDataset() {
  return useContext(DatasetContext)
}

/** `demo` (or unknown) unless real prices have actually been imported. */
export function useDataSource(): 'demo' | 'mixed' | 'real' {
  const { status } = useDataset()
  return status?.data_source ?? 'demo'
}
