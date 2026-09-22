import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react'
import { apiFetch, setApiTokenProvider } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user: clerkUser } = useUser()
  const { signOut, openSignIn, openSignUp } = useClerk()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setApiTokenProvider(getToken)
  }, [getToken])

  useEffect(() => {
    let cancelled = false
    if (!isLoaded || !isSignedIn) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    apiFetch('/me')
      .then((row) => { if (!cancelled) setProfile(row) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setProfileLoading(false) })
    return () => { cancelled = true }
  }, [isLoaded, isSignedIn, clerkUser?.id])

  const user = useMemo(() => {
    if (!clerkUser) return null
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      name: clerkUser.fullName || clerkUser.firstName || profile?.name,
      avatar_url: clerkUser.imageUrl,
      role: profile?.role || 'user',
      ...profile,
    }
  }, [clerkUser, profile])

  const login = useCallback(async () => { openSignIn({}) }, [openSignIn])
  const register = useCallback(async () => { openSignUp({}) }, [openSignUp])
  const logout = useCallback(async () => signOut({ redirectUrl: '/' }), [signOut])
  const clearError = useCallback(() => setError(null), [])
  const resetLoadingState = useCallback(() => setError(null), [])
  const isAdmin = useCallback(() => ['admin', 'ceo'].includes(user?.role), [user?.role])
  const isCEO = useCallback(() => user?.role === 'ceo', [user?.role])

  const value = {
    user,
    session: isSignedIn ? { user } : null,
    isLoading: !isLoaded || profileLoading || Boolean(isSignedIn && !profile && !error),
    error,
    login,
    register,
    adminLogin: login,
    demoAdminLogin: login,
    logout,
    updateProfile: async (data) => clerkUser?.update(data),
    resetPassword: login,
    updatePassword: login,
    clearError,
    resetLoadingState,
    isAdmin,
    isCEO,
    isAuthenticated: Boolean(isSignedIn),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
