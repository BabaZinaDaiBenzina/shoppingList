'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface ClientOnlyProps {
  children: ReactNode
}

export function ClientOnly({ children }: ClientOnlyProps) {
  const pathname = usePathname()

  // Не рендерим на сервере вообще
  if (typeof window === 'undefined') {
    return null
  }

  return <>{children}</>
}
