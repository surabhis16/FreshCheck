"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChefHat, Clock, Users, Search, Heart, ExternalLink, Sparkles, Zap, Star, X } from "lucide-react"

interface Recipe {
  id: string
  title: string
  description: string
  fruits: string[]
  freshnessLevel: "Fresh" | "Ripening" | "Overripe"
  cookTime: number
  servings: number
  difficulty: "Easy" | "Medium" | "Hard"
  category: string
  image: string
  ingredients: string[]
  instructions: string[]
  isFavorite: boolean
  aiGenerated: boolean
  rating: number
}

interface DetailedRecipe extends Recipe {
  detailedIngredients?: string[]
  detailedInstructions?: string[]
  tips?: string[]
  nutritionInfo?: string
}

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFreshness, setFilterFreshness] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<DetailedRecipe | null>(null)
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null)
  const [recipeError, setRecipeError] = useState("")


  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

  const recipes: Recipe[] = [
    {
      id: "1",
      title: "Fresh Banana Smoothie Bowl",
      description: "Creamy and refreshing smoothie bowl perfect for fresh bananas",
      fruits: ["Banana"],
      freshnessLevel: "Fresh",
      cookTime: 10,
      servings: 2,
      difficulty: "Easy",
      category: "Beverage",
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["2 fresh bananas", "1 cup yogurt", "1 tbsp honey", "Granola", "Berries"],
      instructions: [
        "Slice bananas",
        "Blend with yogurt and honey",
        "Pour into bowl",
        "Add toppings",
      ],
      isFavorite: false,
      aiGenerated: false,
      rating: 4.7,
    },
    {
      id: "2",
      title: "Classic Banana Bread",
      description: "Perfect way to use ripe bananas - moist and flavorful",
      fruits: ["Banana"],
      freshnessLevel: "Ripening",
      cookTime: 60,
      servings: 8,
      difficulty: "Easy",
      category: "Baking",
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["3 ripe bananas", "2 cups flour", "1 cup sugar", "1/2 cup butter", "2 eggs"],
      instructions: [
        "Mash bananas",
        "Mix wet ingredients",
        "Combine with dry ingredients",
        "Bake at 350°F for 60 minutes",
      ],
      isFavorite: false,
      aiGenerated: false,
      rating: 4.9,
    },
    {
      id: "3",
      title: "Fresh Apple Crisp",
      description: "Classic dessert with crisp fresh apples and golden oat topping",
      fruits: ["Apple"],
      freshnessLevel: "Fresh",
      cookTime: 45,
      servings: 6,
      difficulty: "Easy",
      category: "Dessert",
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["6 fresh apples", "1 cup oats", "1/2 cup flour", "1/2 cup brown sugar", "1/4 cup butter"],
      instructions: [
        "Preheat oven to 350°F",
        "Slice apples",
        "Mix dry ingredients",
        "Bake for 45 minutes",
      ],
      isFavorite: false,
      aiGenerated: false,
      rating: 4.8,
    },
    {
      id: "4",
      title: "Fresh Orange Juice Blend",
      description: "Refreshing citrus blend perfect for fresh oranges",
      fruits: ["Orange"],
      freshnessLevel: "Fresh",
      cookTime: 5,
      servings: 2,
      difficulty: "Easy",
      category: "Beverage",
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["4 fresh oranges", "1 cup water", "1 tbsp honey", "Ice cubes", "Mint leaves"],
      instructions: [
        "Juice the oranges",
        "Mix with water and honey",
        "Add ice",
        "Garnish with mint",
      ],
      isFavorite: false,
      aiGenerated: false,
      rating: 4.6,
    },
    {
      id: "5",
      title: "Caramelized Apple Tart",
      description: "Elegant tart using ripe apples with caramelized flavors",
      fruits: ["Apple"],
      freshnessLevel: "Ripening",
      cookTime: 50,
      servings: 8,
      difficulty: "Medium",
      category: "Dessert",
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["4 ripe apples", "1 pie crust", "1/2 cup sugar", "3 tbsp butter", "1 tsp cinnamon"],
      instructions: [
        "Prepare pie crust",
        "Slice apples thinly",
        "Caramelize with sugar",
        "Bake for 50 minutes",
      ],
      isFavorite: false,
      aiGenerated: false,
      rating: 4.5,
    },
    {
      id: "6",
      title: "Orange Marmalade Glazed Cake",
      description: "Rich and moist cake perfect for ripe, sweet oranges",
      fruits: ["Orange"],
      freshnessLevel: "Ripening",
      cookTime: 55,
      servings: 10,
      difficulty: "Medium",
      category: "Baking",
      image: "/placeholder.svg?height=200&width=300",
      ingredients: ["3 ripe oranges", "2 cups flour", "1 cup sugar", "1/2 cup oil", "3 eggs", "1 tsp baking powder"],
      instructions: [
        "Zest and juice oranges",
        "Mix wet ingredients",
        "Combine with dry ingredients",
        "Bake at 350°F for 55 minutes", 0
      ],
      isFavorite: false,
      aiGenerated: false,
      rating: 4.7,
    },
  ]

  const fetchDetailedRecipe = async (recipe: Recipe) => {
    setLoadingRecipeId(recipe.id) // Set the specific recipe ID that's loading
    setRecipeError("")

    try {
      const prompt = `Create a detailed recipe for "${recipe.title}" using ${recipe.fruits.join(", ")} (${recipe.freshnessLevel} freshness level). 
      
      Please provide:
      1. Detailed ingredients list with exact measurements (8-12 ingredients)
      2. Step-by-step cooking instructions (6-10 detailed steps)
      3. 3-4 helpful cooking tips
      4. Brief nutrition information
      
      Format the response as JSON:
      {
        "detailedIngredients": ["ingredient with measurement", ...],
        "detailedInstructions": ["detailed step", ...],
        "tips": ["tip 1", "tip 2", "tip 3"],
        "nutritionInfo": "Brief nutrition summary"
      }
      
      Make it practical and easy to follow for home cooking.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to fetch recipe details')
      }

      const data = await response.json()
      const aiResponse = data.candidates[0].content.parts[0].text

      let detailedInfo
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          detailedInfo = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("No valid JSON found in response")
        }
      } catch (parseError) {
        // Fallback detailed info
        detailedInfo = {
          detailedIngredients: [
            ...recipe.ingredients,
            "Salt to taste",
            "Vanilla extract",
            "Additional spices as needed"
          ],
          detailedInstructions: [
            ...recipe.instructions,
            "Let cool for 10 minutes before serving",
            "Serve at room temperature or warm"
          ],
          tips: [
            "Use fresh, quality ingredients for best results",
            "Don't overmix the batter",
            "Taste and adjust seasonings as needed"
          ],
          nutritionInfo: "Rich in vitamins and minerals from fresh fruit"
        }
      }

      const detailedRecipe: DetailedRecipe = {
        ...recipe,
        detailedIngredients: detailedInfo.detailedIngredients,
        detailedInstructions: detailedInfo.detailedInstructions,
        tips: detailedInfo.tips,
        nutritionInfo: detailedInfo.nutritionInfo
      }

      setSelectedRecipe(detailedRecipe)

    } catch (error) {
      console.error('Error fetching recipe details:', error)
      setRecipeError(`Error: ${error.message}`)
    } finally {
      setLoadingRecipeId(null) // Clear the loading state
    }
  }

  const toggleFavorite = (recipeId: string) => {
    setFavorites((prev) => (prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]))
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.fruits.some((fruit) => fruit.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFreshness =
      filterFreshness === "all" || recipe.freshnessLevel.toLowerCase() === filterFreshness.toLowerCase()
    const matchesCategory = filterCategory === "all" || recipe.category.toLowerCase() === filterCategory.toLowerCase()

    return matchesSearch && matchesFreshness && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case "Fresh":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "Ripening":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "Overripe":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getFruitEmoji = (fruit: string) => {
    switch (fruit) {
      case "Apple": return "🍎"
      case "Banana": return "🍌"
      case "Orange": return "🍊"
      case "Strawberry": return "🍓"
      case "Mango": return "🥭"
      case "Blueberry": return "🫐"
      case "Pear": return "🍐"
      case "Peach": return "🍑"
      default: return "🍇"
    }
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Fruit Recipes
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Discover delicious recipes based on your fruit freshness
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recipes.length}</div>
            <p className="text-xs opacity-80">Curated collection</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Fresh Fruit Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {recipes.filter((r) => r.freshnessLevel === "Fresh").length}
            </div>
            <p className="text-xs opacity-80">Ready to cook</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Ripening Fruit Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {recipes.filter((r) => r.freshnessLevel === "Ripening").length}
            </div>
            <p className="text-xs opacity-80">Perfect timing</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-400 to-pink-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{favorites.length}</div>
            <p className="text-xs opacity-80">Saved recipes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl">
              <Search className="h-6 w-6 text-white" />
            </div>
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search recipes or fruits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
            </div>
            <Select value={filterFreshness} onValueChange={setFilterFreshness}>
              <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-2 border-gray-200 focus:border-yellow-400">
                <SelectValue placeholder="Filter by freshness" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Freshness</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="ripening">Ripening</SelectItem>
                <SelectItem value="overripe">Overripe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-2 border-gray-200 focus:border-yellow-400">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
                <SelectItem value="baking">Baking</SelectItem>
                <SelectItem value="beverage">Beverage</SelectItem>
                <SelectItem value="sauce">Sauce</SelectItem>
                <SelectItem value="salad">Salad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl"
          >
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 relative">
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {getFruitEmoji(recipe.fruits[0])}
              </div>

              {/* Rating */}
              <div className="absolute top-3 right-12">
                <Badge className="bg-black/70 text-white">
                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {recipe.rating}
                </Badge>
              </div>

              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full"
                onClick={() => toggleFavorite(recipe.id)}
              >
                <Heart
                  className={`h-4 w-4 ${favorites.includes(recipe.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                />
              </Button>
            </div>

            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">{recipe.title}</CardTitle>
                <Badge className={getFreshnessColor(recipe.freshnessLevel)}>{recipe.freshnessLevel}</Badge>
              </div>
              <CardDescription className="text-sm">{recipe.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {recipe.fruits.map((fruit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {fruit}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {recipe.cookTime} min
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recipe.servings} servings
                </div>
                <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-xl"
                  size="sm"
                  onClick={() => fetchDetailedRecipe(recipe)}
                  disabled={loadingRecipeId === recipe.id} // Only disable if THIS recipe is loading
                >
                  {loadingRecipeId === recipe.id ? ( // Only show loading for THIS recipe
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChefHat className="h-4 w-4 mr-2" />
                      View Recipe
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-2">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedRecipe.title}</CardTitle>
                <CardDescription className="text-lg mt-2">{selectedRecipe.description}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRecipe(null)}
                className="rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {recipeError && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-700 dark:text-red-300">{recipeError}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {(selectedRecipe.detailedIngredients || selectedRecipe.ingredients).map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Instructions</h3>
                  <ol className="space-y-3">
                    {(selectedRecipe.detailedInstructions || selectedRecipe.instructions).map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {selectedRecipe.tips && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Tips</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
                    <ul className="space-y-2">
                      {selectedRecipe.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedRecipe.nutritionInfo && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Nutrition Info</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <p className="text-sm">{selectedRecipe.nutritionInfo}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {filteredRecipes.length === 0 && (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <ChefHat className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">No recipes found</p>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}