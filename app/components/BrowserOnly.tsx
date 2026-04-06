'use client'

import { useEffect, useState } from 'react'

interface BrowserOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function BrowserOnly({ children, fallback = null }: BrowserOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
