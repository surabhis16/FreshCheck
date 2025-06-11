"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Apple,
  Camera,
  History,
  ChefHat,
  Bell,
  TrendingUp,
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  Play,
  Pause,
  RotateCcw,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [sensorData, setSensorData] = useState({
    temperature: 22.5,
    humidity: 65,
    gasLevel: 0.3,
    lastUpdate: new Date(),
  })

  // Simulate real-time sensor data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => ({
        temperature: 20 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        gasLevel: Math.random() * 1,
        lastUpdate: new Date(),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const recentDetections = [
    {
      fruit: "Apple",
      freshness: 85,
      status: "Fresh",
      date: "2 hours ago",
      confidence: 94,
      fuzzyFreshness: { label: "Very Fresh", percentage: 85, category: "Fresh" },
    },
    {
      fruit: "Banana",
      freshness: 45,
      status: "Ripening",
      date: "5 hours ago",
      confidence: 89,
      fuzzyFreshness: { label: "Ripening", percentage: 64, category: "Ripening" },
    },
    {
      fruit: "Orange",
      freshness: 92,
      status: "Very Fresh",
      date: "1 day ago",
      confidence: 96,
      fuzzyFreshness: { label: "Peak Fresh", percentage: 92, category: "Fresh" },
    },
  ]

  const upcomingExpiries = [
    { fruit: "Banana", daysLeft: 2, status: "warning" },
    { fruit: "Apple", daysLeft: 1, status: "urgent" },
    { fruit: "Orange", daysLeft: 4, status: "good" },
  ]

  const toggleDetection = async () => {
    if (isDetecting) {
      await fetch("http://localhost:8000/stop-webcam")
    }
    setIsDetecting(!isDetecting)
  }


  const getSensorColor = (value: number, type: string) => {
    if (type === "temperature") {
      if (value < 18) return "text-blue-600"
      if (value > 25) return "text-red-600"
      return "text-green-600"
    }
    if (type === "humidity") {
      if (value < 40 || value > 80) return "text-orange-600"
      return "text-green-600"
    }
    if (type === "gas") {
      if (value > 0.7) return "text-red-600"
      if (value > 0.4) return "text-yellow-600"
      return "text-green-600"
    }
    return "text-gray-600"
  }

  const getFuzzyFreshnessColor = (category: string) => {
    switch (category) {
      case "Fresh":
        return "text-green-600 dark:text-green-400"
      case "Ripening":
        return "text-yellow-600 dark:text-yellow-400"
      case "Spoiled":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Smart Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Monitor your fruit freshness with AI-powered insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Scans</CardTitle>
            <Camera className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">127</div>
            <p className="text-xs opacity-80">+12 from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Fresh Fruits</CardTitle>
            <Apple className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">23</div>
            <p className="text-xs opacity-80">Currently in storage</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Expiring Soon</CardTitle>
            <AlertTriangle className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs opacity-80">Within 2 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-400 to-pink-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Avg. Freshness</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">78%</div>
            <p className="text-xs opacity-80">+5% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Webcam Feed + Controls */}
        <Card className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl">
                <Camera className="h-6 w-6 text-white" />
              </div>
              Live Detection Feed
              <Badge className={`${isDetecting ? "bg-green-500" : "bg-gray-400"} text-white`}>
                {isDetecting ? "LIVE" : "OFFLINE"}
              </Badge>
            </CardTitle>
            <CardDescription>Real-time YOLOv8 fruit detection system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative">
              {isDetecting ? (
                <div className="w-full h-full relative">
                  <img
                    src="http://localhost:8000/webcam"
                    className="w-full h-full object-cover border-0"
                    alt="Live Webcam Feed"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.error('Webcam feed error:', e);
                      // Optionally show error state
                    }}
                    onLoad={() => {
                      console.log('Webcam feed loaded successfully');
                    }}
                  />
                  {/* Optional: Loading overlay */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">LIVE</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium text-gray-500">Camera Feed Offline</p>
                  <p className="text-sm text-gray-400">Click Start Detection to begin</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={toggleDetection}
                className={`flex-1 h-12 rounded-xl font-medium transition-all duration-200 ${isDetecting
                  ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  } text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
              >
                {isDetecting ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Stop Detection
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Detection
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  // Add refresh functionality
                  if (isDetecting) {
                    // Restart the feed
                    toggleDetection();
                    setTimeout(() => toggleDetection(), 500);
                  }
                }}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sensor Data Panel */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                <Thermometer className="h-6 w-6 text-white" />
              </div>
              Sensor Data
            </CardTitle>
            <CardDescription>Live Raspberry Pi readings</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className={`h-5 w-5 ${getSensorColor(sensorData.temperature, "temperature")}`} />
                  <span className="font-medium">Temperature</span>
                </div>
                <span className={`text-lg font-bold ${getSensorColor(sensorData.temperature, "temperature")}`}>
                  {sensorData.temperature.toFixed(1)}°C
                </span>
              </div>
              <Progress value={(sensorData.temperature / 40) * 100} className="h-3 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Humidity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className={`h-5 w-5 ${getSensorColor(sensorData.humidity, "humidity")}`} />
                  <span className="font-medium">Humidity</span>
                </div>
                <span className={`text-lg font-bold ${getSensorColor(sensorData.humidity, "humidity")}`}>
                  {sensorData.humidity.toFixed(0)}%
                </span>
              </div>
              <Progress value={sensorData.humidity} className="h-3 bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Gas Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className={`h-5 w-5 ${getSensorColor(sensorData.gasLevel, "gas")}`} />
                  <span className="font-medium">Gas Level</span>
                </div>
                <span className={`text-lg font-bold ${getSensorColor(sensorData.gasLevel, "gas")}`}>
                  {sensorData.gasLevel.toFixed(2)}
                </span>
              </div>
              <Progress value={sensorData.gasLevel * 100} className="h-3 bg-gray-200 dark:bg-gray-700" />
            </div>

            { /* Last Update */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Zap className="h-4 w-4" />
                Last update: {sensorData.lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>


      {/* Fuzzy Logic Explanation Card */}
      < Card className="lg:col-span-3 bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-0 shadow-xl" >
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-xl">
              <span className="text-2xl">🧠</span>
            </div>
            Fuzzy Freshness Intelligence
            <Badge className="bg-white/20 text-white border-white/30">AI-Powered</Badge>
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Advanced fuzzy logic system for more accurate freshness assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-3xl mb-2">🟢</div>
              <h4 className="font-semibold mb-1">Fresh Zone</h4>
              <p className="text-sm opacity-90">80-100% freshness</p>
              <p className="text-xs opacity-75">Peak quality, consume fresh</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-3xl mb-2">🟡</div>
              <h4 className="font-semibold mb-1">Ripening Zone</h4>
              <p className="text-sm opacity-90">40-79% freshness</p>
              <p className="text-xs opacity-75">Perfect for cooking & baking</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="text-3xl mb-2">🔴</div>
              <h4 className="font-semibold mb-1">Spoiled Zone</h4>
              <p className="text-sm opacity-90">0-39% freshness</p>
              <p className="text-xs opacity-75">Discard immediately</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90">
              Our fuzzy logic AI considers color, texture, shape, and environmental factors for precise freshness
              scoring
            </p>
          </div>
        </CardContent>
      </Card >

      {/* Bottom Section */}
      < div className="grid grid-cols-1 lg:grid-cols-2 gap-8" >
        {/* Recent Detections */}
        < Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl" >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                <History className="h-6 w-6 text-white" />
              </div>
              Recent Detections
            </CardTitle>
            <CardDescription>Your latest fruit freshness scans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDetections.map((detection, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{detection.fruit}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{detection.date}</p>
                  <div className="text-xs">
                    <span className="text-gray-400">🧠 Fuzzy: </span>
                    <span className={`font-medium ${getFuzzyFreshnessColor(detection.fuzzyFreshness.category)}`}>
                      {detection.fuzzyFreshness.label} ({detection.fuzzyFreshness.percentage}%)
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Confidence: {detection.confidence}%</p>
                </div>
                <div className="text-right space-y-2">
                  <Badge
                    className={
                      detection.status === "Fresh"
                        ? "bg-green-500 text-white"
                        : detection.status === "Very Fresh"
                          ? "bg-emerald-500 text-white"
                          : "bg-yellow-500 text-white"
                    }
                  >
                    {detection.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Progress value={detection.freshness} className="w-20 h-2" />
                    <span className="text-sm font-bold">{detection.freshness}%</span>
                  </div>
                </div>
              </div>
            ))}
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Link href="/dashboard/history">View All History</Link>
            </Button>
          </CardContent>
        </Card >

        {/* Expiry Reminders */}
        < Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl" >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl">
                <Bell className="h-6 w-6 text-white" />
              </div>
              Expiry Alerts
            </CardTitle>
            <CardDescription>Fruits that need attention soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingExpiries.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {item.fruit === "Banana" ? "🍌" : item.fruit === "Apple" ? "🍎" : "🍊"}
                  </div>
                  <div>
                    <p className="font-semibold">{item.fruit}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.daysLeft} day{item.daysLeft !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    item.status === "urgent"
                      ? "bg-red-500 text-white animate-pulse"
                      : item.status === "warning"
                        ? "bg-orange-500 text-white"
                        : "bg-green-500 text-white"
                  }
                >
                  {item.status === "urgent" ? "Urgent" : item.status === "warning" ? "Soon" : "Good"}
                </Badge>
              </div>
            ))}
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Link href="/dashboard/reminders">Manage Reminders</Link>
            </Button>
          </CardContent>
        </Card >
      </div >

      {/* Quick Actions */}
      < Card className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-xl" >
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-green-100">Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              asChild
              className="h-20 bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl flex-col gap-2 backdrop-blur-sm"
            >
              <Link href="/dashboard/detect">
                <Camera className="h-8 w-8" />
                Start Detection
              </Link>
            </Button>
            <Button
              asChild
              className="h-20 bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl flex-col gap-2 backdrop-blur-sm"
            >
              <Link href="/dashboard/recipes">
                <ChefHat className="h-8 w-8" />
                Recipe AI
              </Link>
            </Button>
            <Button
              asChild
              className="h-20 bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl flex-col gap-2 backdrop-blur-sm"
            >
              <Link href="/dashboard/history">
                <History className="h-8 w-8" />
                View History
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card >
    </div >
  )
}
