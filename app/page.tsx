"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Apple, Eye, EyeOff, Leaf, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Clear any console errors related to extensions
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === "string" && args[0].includes("MetaMask")) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const email = (document.getElementById("email") as HTMLInputElement).value
    const password = (document.getElementById("password") as HTMLInputElement).value

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      let message = "Something went wrong. Please try again."

      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        message = "Incorrect email or password. Please try again."
      } else if (err.code === "auth/user-not-found") {
        message = "No account found with this email."
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many attempts. Try again later."
      }

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const email = (document.getElementById("signup-email") as HTMLInputElement).value
    const password = (document.getElementById("signup-password") as HTMLInputElement).value


    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push("/dashboard") // redirect after success
    } catch (err: any) {
      console.error("Signup error:", err)
      let message = "Something went wrong. Please try again."

      if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered."
      } else if (err.code === "auth/weak-password") {
        message = "Password should be at least 6 characters long."
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email address format."
      }

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }



  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center gradient-main animate-gradient p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-emerald-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200/30 to-yellow-300/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/20"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-0 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg">
                <Apple className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 p-1 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                <Leaf className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              FreshCheck
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
              AI-powered fruit freshness detection
            </CardDescription>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Smart • Fresh • Sustainable</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      required
                      className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
