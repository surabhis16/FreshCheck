"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Search, Filter, Download, Calendar, Loader2 } from "lucide-react"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Firestore data structure
interface FirestoreDetection {
  analyzedAt: string
  totalDetections: number
  sessionId: string
  imageUrl: string
  detections: Array<{
    fruitName: string
    fuzzyResult: {
      dominantState: string
      fuzzyConfidence: number
      linguisticDescription: string
    }
    membershipScores: {
      fresh: number
      overripe: number
      ripening: number
      spoiled: number
    }
    originalResult: {
      bbox: number[]
      confidence: number
      detected_object: string
      label: string
    }
    recommendations: string[]
  }>
}

// Transformed data structure for the component
interface HistoryItem {
  id: string
  fruit: string
  freshness: number
  status: "Fresh" | "Ripening" | "Overripe" | "Spoiled"
  date: string
  confidence: number
  image: string
  fuzzyFreshness: {
    label: string
    percentage: number
    category: "Fresh" | "Ripening" | "Spoiled"
  }
  recommendations: string[]
  sessionId: string
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transform Firestore data to component format
  const transformFirestoreData = (firestoreData: FirestoreDetection[]): HistoryItem[] => {
    const transformedData: HistoryItem[] = []

    firestoreData.forEach((doc) => {
      // Check if detections array exists and has items
      if (!doc.detections || !Array.isArray(doc.detections)) {
        console.warn('No detections found in document:', doc.sessionId)
        return
      }

      doc.detections.forEach((detection, index) => {
        // Safely access nested properties
        if (!detection || !detection.fuzzyResult || !detection.originalResult) {
          console.warn('Invalid detection data:', detection)
          return
        }

        // Determine status based on dominant state
        const statusMap: Record<string, "Fresh" | "Ripening" | "Overripe" | "Spoiled"> = {
          fresh: "Fresh",
          ripening: "Ripening",
          overripe: "Overripe",
          spoiled: "Spoiled"
        }

        const dominantState = detection.fuzzyResult.dominantState?.toLowerCase() || 'fresh'
        const status = statusMap[dominantState] || "Fresh"

        // Calculate traditional freshness score with safe access
        const membershipScores = detection.membershipScores || {}
        const freshScore = membershipScores.fresh || 0
        const freshness = Math.round(freshScore * 100)

        // Get fuzzy freshness category
        const getFuzzyCategory = (dominantState: string): "Fresh" | "Ripening" | "Spoiled" => {
          const state = dominantState.toLowerCase()
          if (state === "fresh") return "Fresh"
          if (state === "ripening") return "Ripening"
          return "Spoiled"
        }

        // Safe access to all properties
        const fruitName = detection.fruitName || 'Unknown'
        const confidence = detection.originalResult?.confidence || 0
        const fuzzyConfidence = detection.fuzzyResult?.fuzzyConfidence || 0
        const linguisticDescription = detection.fuzzyResult?.linguisticDescription || 'Unknown'
        const recommendations = detection.recommendations || []

        transformedData.push({
          id: `${doc.sessionId}_${index}`,
          fruit: fruitName.charAt(0).toUpperCase() + fruitName.slice(1),
          freshness,
          status,
          date: doc.analyzedAt || new Date().toISOString(),
          confidence: Math.round(confidence * 100),
          image: doc.imageUrl || '',
          fuzzyFreshness: {
            label: linguisticDescription,
            percentage: Math.round(fuzzyConfidence * 100),
            category: getFuzzyCategory(dominantState)
          },
          recommendations,
          sessionId: doc.sessionId || 'unknown'
        })
      })
    })

    return transformedData
  }

  // Fetch data from Firestore
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Adjust collection name as needed
        const q = query(
          collection(db, "fruit_detections"),
          orderBy("analyzedAt", "desc")
        )

        const querySnapshot = await getDocs(q)
        const firestoreData: FirestoreDetection[] = []

        querySnapshot.forEach((doc) => {
          firestoreData.push({ ...doc.data() } as FirestoreDetection)
        })

        const transformedData = transformFirestoreData(firestoreData)
        setHistoryData(transformedData)
      } catch (err) {
        console.error("Error fetching history data:", err)
        setError("Failed to load history data")
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fresh":
        return "bg-green-100 text-green-800"
      case "Ripening":
        return "bg-yellow-100 text-yellow-800"
      case "Overripe":
        return "bg-orange-100 text-orange-800"
      case "Spoiled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  const formatDate = (dateInput: string | Date | any) => {
    // Handle different date formats from Firestore
    let date: Date

    // Check if dateInput is already a Date object
    if (dateInput instanceof Date) {
      date = dateInput
    }
    // Check if it's a string
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    }
    // Handle Firestore Timestamp objects
    else if (dateInput && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate()
    }
    // Handle objects with seconds property (Firestore Timestamp)
    else if (dateInput && typeof dateInput.seconds === 'number') {
      date = new Date(dateInput.seconds * 1000)
    }
    // Fallback to current date
    else {
      console.warn('Unknown date format:', dateInput)
      date = new Date()
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }

    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getFruitEmoji = (fruitName: string) => {
    const fruitEmojis: Record<string, string> = {
      Apple: "🍎",
      Banana: "🍌",
      Orange: "🍊",
      Strawberry: "🍓",
      Grape: "🍇",
      Cherry: "🍒",
      Mango: "🥭",
      Pineapple: "🍍",
      Watermelon: "🍉",
      Peach: "🍑"
    }
    return fruitEmojis[fruitName] || "🍎"
  }

  const filteredData = historyData
    .filter(
      (item) =>
        item.fruit.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterStatus === "all" || item.status.toLowerCase() === filterStatus.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortBy === "freshness") {
        return b.freshness - a.freshness
      } else if (sortBy === "fruit") {
        return a.fruit.localeCompare(b.fruit)
      }
      return 0
    })

  const exportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Fruit,Freshness,Status,Date,Confidence,Fuzzy Description,Recommendations\n" +
      historyData
        .map((item) =>
          `${item.fruit},${item.freshness}%,${item.status},${formatDate(item.date)},${item.confidence}%,"${item.fuzzyFreshness.label}","${item.recommendations.join('; ')}"`
        )
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "freshness_history.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading detection history...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Detection History</h1>
          <p className="text-muted-foreground">View and manage your fruit freshness detection history</p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historyData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fresh Fruits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {historyData.filter((item) => item.status === "Fresh").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ripening</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {historyData.filter((item) => item.status === "Ripening").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fresh Items Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historyData.length > 0
                ? Math.round((historyData.filter(item => item.freshness >= 70).length / historyData.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fruits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="ripening">Ripening</SelectItem>
                <SelectItem value="overripe">Overripe</SelectItem>
                <SelectItem value="spoiled">Spoiled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="freshness">Freshness</SelectItem>
                <SelectItem value="fruit">Fruit Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Detection History
          </CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {historyData.length} results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-6 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 shadow-sm"
              >
                {/* Fruit Image/Emoji */}
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0">
                  {item.image && item.image.startsWith('data:image') ? (
                    <img
                      src={item.image}
                      alt={item.fruit}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-3xl">
                      {getFruitEmoji(item.fruit)}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xl">{item.fruit}</h3>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  </div>

                  {/* Fuzzy Freshness Display */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">
                      🧠 Fuzzy Freshness:
                      <span className={`ml-2 font-bold ${getFuzzyFreshnessColor(item.fuzzyFreshness.category)}`}>
                        {item.fuzzyFreshness.label} ({item.fuzzyFreshness.percentage}%)
                      </span>
                    </p>
                    <Progress value={item.fuzzyFreshness.percentage} className="w-full h-2" />
                  </div>

                  {/* Recommendations */}
                  {item.recommendations && item.recommendations.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">💡 Recommendations:</p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300">
                        {item.recommendations.map((rec, index) => (
                          <li key={index} className="list-disc list-inside">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Traditional Score:</span>
                      <Progress value={item.freshness} className="w-24 h-2" />
                      <span className="font-medium">{item.freshness}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                      <span className="font-medium">{item.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {formatDate(item.date)}
                    <span className="text-xs">• Session: {item.sessionId.split('_')[1]}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No detection history found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}