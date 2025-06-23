import { useEffect, useCallback, useState } from 'react'

// Custom hook to handle Supabase queries with proper dependency management
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options: {
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { enabled = true, onSuccess, onError } = options

  const execute = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const result = await queryFn()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      console.error('Query error:', err)
      setError(err)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [enabled, onSuccess, onError, ...deps])

  useEffect(() => {
    execute()
  }, [execute])

  const refetch = useCallback(() => {
    execute()
  }, [execute])

  return {
    data,
    error,
    loading,
    refetch
  }
}

// Hook for mutations (create, update, delete)
export function useSupabaseMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  options: {
    onSuccess?: (data: T, params: P) => void
    onError?: (error: any, params: P) => void
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const { onSuccess, onError } = options

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await mutationFn(params)
      onSuccess?.(result, params)
      return result
    } catch (err) {
      console.error('Mutation error:', err)
      setError(err)
      onError?.(err, params)
      return null
    } finally {
      setLoading(false)
    }
  }, [mutationFn, onSuccess, onError])

  return {
    mutate,
    loading,
    error
  }
}