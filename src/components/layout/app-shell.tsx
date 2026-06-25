import type { ReactNode } from 'react'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  )
}
