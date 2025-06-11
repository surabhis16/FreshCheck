"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, RotateCcw, CheckCircle, AlertCircle, Clock, Brain, Save, Database } from "lucide-react"
import Image from "next/image"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../../lib/firebase"

interface DetectionResult {
  bbox: number[]
  label: string
  confidence: number
  detected_object: string
}

interface ApiResponse {
  predictions: DetectionResult[]
  total_detections: number
}

interface FuzzyResult {
  membershipScores: {
    fresh: number
    ripening: number
    overripe: number
    spoiled: number
  }
  dominantState: string
  fuzzyConfidence: number
  linguisticDescription: string
}

// Interface for the data structure we'll save to Firestore
interface DetectionRecord {
  imageUrl: string
  detections: {
    originalResult: DetectionResult
    fuzzyResult: FuzzyResult
    fruitName: string
    recommendations: string[]
  }[]
  totalDetections: number
  analyzedAt: any // Firestore timestamp
  sessionId?: string
}

export default function FuzzyFruitDetector() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [results, setResults] = useState<ApiResponse | null>(null)
  const [fuzzyResults, setFuzzyResults] = useState<FuzzyResult[]>([])
  const [savedToDb, setSavedToDb] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fuzzy Logic Implementation
  const calculateFuzzyMembership = (confidence: number, label: string, fruitType: string): FuzzyResult => {
    let fresh = 0, ripening = 0, overripe = 0, spoiled = 0

    if (label.includes('fresh')) {
      fresh = confidence
      ripening = Math.max(0, 1 - confidence) * 0.7
      overripe = Math.max(0, 1 - confidence) * 0.2
      spoiled = Math.max(0, 1 - confidence) * 0.1
    } else if (label.includes('rotten') || label.includes('spoiled')) {
      spoiled = confidence
      overripe = Math.max(0, 1 - confidence) * 0.6
      ripening = Math.max(0, 1 - confidence) * 0.3
      fresh = Math.max(0, 1 - confidence) * 0.1
    } else {
      fresh = 0.3
      ripening = 0.4
      overripe = 0.2
      spoiled = 0.1
    }

    const fruitAdjustments = getFruitSpecificAdjustments(fruitType, { fresh, ripening, overripe, spoiled })
    fresh = fruitAdjustments.fresh
    ripening = fruitAdjustments.ripening
    overripe = fruitAdjustments.overripe
    spoiled = fruitAdjustments.spoiled

    const total = fresh + ripening + overripe + spoiled
    fresh /= total
    ripening /= total
    overripe /= total
    spoiled /= total

    const scores = { fresh, ripening, overripe, spoiled }
    const dominantState = Object.entries(scores).reduce((a, b) =>
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0]

    const maxScore = Math.max(fresh, ripening, overripe, spoiled)
    const secondMaxScore = Object.values(scores).sort((a, b) => b - a)[1]
    const fuzzyConfidence = (maxScore - secondMaxScore) / maxScore

    const linguisticDescription = generateLinguisticDescription(scores, dominantState)

    return {
      membershipScores: { fresh, ripening, overripe, spoiled },
      dominantState,
      fuzzyConfidence,
      linguisticDescription
    }
  }

  const getFruitSpecificAdjustments = (fruitType: string, scores: any) => {
    const fruit = fruitType.toLowerCase()

    if (fruit.includes('banana')) {
      scores.ripening *= 1.2
      scores.overripe *= 1.1
    }
    else if (fruit.includes('apple')) {
      scores.fresh *= 1.1
      scores.spoiled *= 0.9
    }
    else if (fruit.includes('orange') || fruit.includes('citrus')) {
      scores.overripe *= 1.1
    }

    return scores
  }

  const generateLinguisticDescription = (scores: any, dominantState: string): string => {
    const maxScore = Math.max(...Object.values(scores))

    if (maxScore > 0.8) {
      return `Definitely ${dominantState}`
    } else if (maxScore > 0.6) {
      return `Mostly ${dominantState}`
    } else if (maxScore > 0.4) {
      return `Somewhat ${dominantState}`
    } else {
      const sortedStates = Object.entries(scores).sort((a, b) => b[1] - a[1])
      return `Between ${sortedStates[0][0]} and ${sortedStates[1][0]}`
    }
  }

  // Save detection results to Firestore
  const saveToFirestore = async () => {
    if (!results || !fuzzyResults.length || !selectedImage) {
      console.error("No results to save")
      return
    }

    setIsSaving(true)

    try {
      // Prepare the data structure for Firestore
      const detectionRecord: DetectionRecord = {
        imageUrl: selectedImage, // In production, you might want to upload image to Firebase Storage
        detections: results.predictions.map((result, index) => ({
          originalResult: result,
          fuzzyResult: fuzzyResults[index],
          fruitName: result.detected_object.charAt(0).toUpperCase() + result.detected_object.slice(1),
          recommendations: getRecommendations(fuzzyResults[index], result.detected_object)
        })),
        totalDetections: results.total_detections,
        analyzedAt: serverTimestamp(),
        sessionId: generateSessionId() // Optional: for grouping related detections
      }

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "fruit_detections"), detectionRecord)

      console.log("Detection saved with ID: ", docRef.id)
      setSavedToDb(true)

      // Show success feedback
      setTimeout(() => setSavedToDb(false), 3000)

    } catch (error) {
      console.error("Error saving to Firestore:", error)
      // You might want to show an error toast/notification here
    } finally {
      setIsSaving(false)
    }
  }

  // Generate a simple session ID (you might want to use a more sophisticated approach)
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string)
          setResults(null)
          setFuzzyResults([])
          setSavedToDb(false) // Reset save status
        }
        reader.onerror = () => {
          console.error("Error reading file")
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setSavedToDb(false) // Reset save status

    try {
      const base64Data = selectedImage.split(',')[1]
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())

      const formData = new FormData()
      formData.append('image', blob, 'upload.jpg')

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      const fuzzyAnalysis = data.predictions.map(prediction =>
        calculateFuzzyMembership(prediction.confidence, prediction.label, prediction.detected_object)
      )

      setResults(data)
      setFuzzyResults(fuzzyAnalysis)
    } catch (error) {
      console.error("Error analyzing image:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetDetection = () => {
    setSelectedImage(null)
    setResults(null)
    setFuzzyResults([])
    setSavedToDb(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "fresh":
        return "bg-green-500"
      case "ripening":
        return "bg-yellow-500"
      case "overripe":
        return "bg-orange-500"
      case "spoiled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStateTextColor = (state: string) => {
    switch (state) {
      case "fresh":
        return "text-white"
      case "ripening":
        return "text-yellow-600"
      case "overripe":
        return "text-orange-600"
      case "spoiled":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getRecommendations = (fuzzyResult: FuzzyResult, fruitType: string) => {
    const { dominantState, membershipScores } = fuzzyResult
    const recommendations = []

    if (dominantState === 'fresh') {
      recommendations.push("Perfect for eating fresh")
      recommendations.push("Store in cool, dry place")
      if (membershipScores.ripening > 0.2) {
        recommendations.push("Monitor for ripening in coming days")
      }
    } else if (dominantState === 'ripening') {
      recommendations.push("Will be perfect in 1-2 days")
      recommendations.push("Keep at room temperature to continue ripening")
      if (fruitType.includes('banana')) {
        recommendations.push("Great for smoothies or baking")
      }
    } else if (dominantState === 'overripe') {
      recommendations.push("Use soon for cooking or smoothies")
      recommendations.push("Not ideal for fresh consumption")
      recommendations.push("Check for any soft spots")
    } else {
      recommendations.push("Consider discarding")
      recommendations.push("Not recommended for consumption")
    }

    return recommendations
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Fuzzy Logic Fruit Freshness Detection
        </h1>
        <p className="text-muted-foreground">Advanced AI with fuzzy logic for nuanced freshness assessment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Image Input
            </CardTitle>
            <CardDescription>Upload an image of your fruit for fuzzy analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedImage ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Upload Fruit Image</p>
                <p className="text-sm text-muted-foreground mb-4">Our fuzzy logic will analyze multiple freshness states</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>Choose Image</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image src={selectedImage} alt="Selected fruit" fill className="object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={analyzeImage} disabled={isAnalyzing} className="flex-1">
                    {isAnalyzing ? "Analyzing..." : "Analyze with Fuzzy Logic"}
                  </Button>
                  <Button variant="outline" onClick={resetDetection}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Fuzzy Logic Analysis
            </CardTitle>
            <CardDescription>Multi-state freshness assessment with uncertainty handling</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>Applying fuzzy logic analysis...</span>
                </div>
                <Progress value={66} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Computing membership functions and linguistic variables...
                </p>
              </div>
            ) : results && fuzzyResults.length > 0 ? (
              <div className="space-y-6">
                {/* Save to Database Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={saveToFirestore}
                    disabled={isSaving || savedToDb}
                    className={`${savedToDb
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-blue-500 hover:bg-blue-600"
                      } text-white`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : savedToDb ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Saved to Database
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Save to Database
                      </>
                    )}
                  </Button>
                </div>

                {results.predictions.map((result, index) => {
                  const fuzzyResult = fuzzyResults[index]
                  const fruitName = result.detected_object.charAt(0).toUpperCase() + result.detected_object.slice(1)

                  return (
                    <div key={index} className="space-y-6 border-b pb-6 last:border-b-0 last:pb-0">
                      {/* Fruit Header */}
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">{fruitName}</h3>
                        <Badge className={`${getStateTextColor(fuzzyResult.dominantState)} bg-opacity-20 text-lg px-4 py-2`}>
                          {fuzzyResult.linguisticDescription}
                        </Badge>
                      </div>

                      {/* Fuzzy Membership Visualization */}
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          Fuzzy Membership Degrees
                        </h4>
                        <div className="space-y-4">
                          {Object.entries(fuzzyResult.membershipScores).map(([state, score]) => (
                            <div key={state} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="capitalize font-medium">{state}</span>
                                <span className="text-sm font-bold">{(score * 100).toFixed(1)}%</span>
                              </div>
                              <div className="relative">
                                <Progress value={score * 100} className="h-3" />
                                <div
                                  className={`absolute top-0 left-0 h-3 rounded-full ${getStateColor(state)} opacity-80`}
                                  style={{ width: `${score * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold">Fuzzy Confidence:</span> {(fuzzyResult.fuzzyConfidence * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher confidence indicates clearer distinction between states
                          </p>
                        </div>
                      </div>

                      {/* Original Model Output */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Original Model Output</h5>
                        <p className="text-sm">
                          <span className="font-medium">Classification:</span> {result.label} <br />
                          <span className="font-medium">Confidence:</span> {(result.confidence * 100).toFixed(1)}%
                        </p>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          Fuzzy-Based Recommendations
                        </h4>
                        <div className="grid gap-2">
                          {getRecommendations(fuzzyResult, result.detected_object).map((rec, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}

                <Button
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl"
                  onClick={resetDetection}
                >
                  Analyze Another Fruit
                </Button>
              </div>
            ) : results ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <p className="text-lg">No fruits detected</p>
                <p className="text-sm mt-2">Try uploading a clearer image</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-16 w-16 mx-auto mb-4 opacity-50 text-purple-400" />
                <p className="text-lg">Upload an image for fuzzy analysis</p>
                <p className="text-sm mt-2">Get multi-state freshness assessment with uncertainty quantification</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}