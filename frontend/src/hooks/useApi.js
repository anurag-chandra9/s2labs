import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { setAuthToken } from '../lib/api'

// Sets the Bearer token on every render when token changes
export function useApiAuth() {
  const { getToken } = useAuth()

  useEffect(() => {
    let cancelled = false
    getToken().then((token) => {
      if (!cancelled) setAuthToken(token)
    })
    return () => { cancelled = true }
  }, [getToken])
}
