import type React from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <div className="border-b p-4">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
