"use client"

import { Apple, Camera, History, ChefHat, Bell, Home, User, Settings, Sun, Moon, Thermometer } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Live Detection",
    url: "/dashboard/detect",
    icon: Camera,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Sensor Data",
    url: "/dashboard/sensors",
    icon: Thermometer,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "History",
    url: "/dashboard/history",
    icon: History,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    title: "Recipe AI",
    url: "/dashboard/recipes",
    icon: ChefHat,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    title: "Reminders",
    url: "/dashboard/reminders",
    icon: Bell,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <Sidebar className="border-r-0 bg-gradient-to-b from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg">
              <Apple className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              FreshCheck
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Detection System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] group
                        ${
                          isActive
                            ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg"
                            : "hover:bg-white/60 dark:hover:bg-gray-700/60"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-4 px-4">
                        <div
                          className={`
                          p-2 rounded-lg transition-all duration-200
                          ${isActive ? "bg-white/20" : `${item.bgColor} group-hover:scale-110`}
                        `}
                        >
                          <item.icon className={`h-5 w-5 ${isActive ? "text-white" : item.color}`} />
                        </div>
                        <span className={`font-medium ${isActive ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-600"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-blue-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-600"
            asChild
          >
            <Link href="/profile">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-600"
            asChild
          >
            <Link href="/settings">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">v2.1.0 • Fresh & Smart</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
