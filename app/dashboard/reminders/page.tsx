"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Bell, Plus, Trash2, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Reminder {
  id: string
  fruit: string
  expiryDate: string
  daysLeft: number
  priority: "low" | "medium" | "high"
  isActive: boolean
  notificationSent: boolean
  addedDate: string
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: "1",
      fruit: "Banana",
      expiryDate: "2025-01-17",
      daysLeft: 2,
      priority: "high",
      isActive: true,
      notificationSent: false,
      addedDate: "2025-01-15",
    },
    {
      id: "2",
      fruit: "Apple",
      expiryDate: "2025-01-16",
      daysLeft: 1,
      priority: "high",
      isActive: true,
      notificationSent: true,
      addedDate: "2025-01-14",
    },
    {
      id: "3",
      fruit: "Orange",
      expiryDate: "2025-01-19",
      daysLeft: 4,
      priority: "medium",
      isActive: true,
      notificationSent: false,
      addedDate: "2025-01-15",
    },
    {
      id: "4",
      fruit: "Apple",
      expiryDate: "2025-01-22",
      daysLeft: 7,
      priority: "low",
      isActive: true,
      notificationSent: false,
      addedDate: "2025-01-15",
    },
    {
      id: "5",
      fruit: "Orange",
      expiryDate: "2025-01-20",
      daysLeft: 5,
      priority: "medium",
      isActive: false,
      notificationSent: false,
      addedDate: "2025-01-14",
    },
    {
      id: "6",
      fruit: "Banana",
      expiryDate: "2025-01-18",
      daysLeft: 3,
      priority: "medium",
      isActive: true,
      notificationSent: false,
      addedDate: "2025-01-13",
    },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newReminder, setNewReminder] = useState({
    fruit: "",
    expiryDate: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const addReminder = () => {
    if (newReminder.fruit && newReminder.expiryDate) {
      const expiryDate = new Date(newReminder.expiryDate)
      const today = new Date()
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      const reminder: Reminder = {
        id: Date.now().toString(),
        fruit: newReminder.fruit,
        expiryDate: newReminder.expiryDate,
        daysLeft: daysLeft,
        priority: newReminder.priority,
        isActive: true,
        notificationSent: false,
        addedDate: today.toISOString().split("T")[0],
      }

      setReminders((prev) => [...prev, reminder])
      setNewReminder({ fruit: "", expiryDate: "", priority: "medium" })
      setIsAddDialogOpen(false)
    }
  }

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id))
  }

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder)),
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (daysLeft: number, isActive: boolean) => {
    if (!isActive) return <Clock className="h-5 w-5 text-gray-400" />
    if (daysLeft <= 1) return <AlertTriangle className="h-5 w-5 text-red-500" />
    if (daysLeft <= 3) return <Bell className="h-5 w-5 text-yellow-500" />
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const activeReminders = reminders.filter((r) => r.isActive)
  const urgentReminders = activeReminders.filter((r) => r.daysLeft <= 2)
  const upcomingReminders = activeReminders.filter((r) => r.daysLeft > 2 && r.daysLeft <= 7)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Expiry Reminders</h1>
          <p className="text-muted-foreground">Manage notifications for your fruit expiry dates</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Reminder</DialogTitle>
              <DialogDescription>Set up a reminder for when your fruit will expire</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fruit">Fruit Name</Label>
                <Input
                  id="fruit"
                  placeholder="e.g., Apple, Banana, Orange"
                  value={newReminder.fruit}
                  onChange={(e) => setNewReminder((prev) => ({ ...prev, fruit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={newReminder.expiryDate}
                  onChange={(e) => setNewReminder((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newReminder.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setNewReminder((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addReminder}>Add Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeReminders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentReminders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{upcomingReminders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Reminders */}
      {urgentReminders.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Urgent Reminders
            </CardTitle>
            <CardDescription className="text-red-600">These fruits expire within 2 days!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(reminder.daysLeft, reminder.isActive)}
                    <div>
                      <p className="font-medium">{reminder.fruit}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires in {reminder.daysLeft} day{reminder.daysLeft !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(reminder.priority)}>{reminder.priority}</Badge>
                    <Switch checked={reminder.isActive} onCheckedChange={() => toggleReminder(reminder.id)} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Reminders
          </CardTitle>
          <CardDescription>Manage all your fruit expiry reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${!reminder.isActive ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {reminder.fruit === "Apple"
                        ? "🍎"
                        : reminder.fruit === "Banana"
                          ? "🍌"
                          : reminder.fruit === "Orange"
                            ? "🍊"
                            : reminder.fruit === "Strawberries"
                              ? "🍓"
                              : reminder.fruit === "Grapes"
                                ? "🍇"
                                : "🍑"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{reminder.fruit}</h3>
                      {getStatusIcon(reminder.daysLeft, reminder.isActive)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires: {new Date(reminder.expiryDate).toLocaleDateString()}
                      </div>
                      <span>
                        {reminder.daysLeft > 0
                          ? `${reminder.daysLeft} days left`
                          : reminder.daysLeft === 0
                            ? "Expires today"
                            : `Expired ${Math.abs(reminder.daysLeft)} days ago`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getPriorityColor(reminder.priority)}>{reminder.priority}</Badge>
                  {reminder.notificationSent && (
                    <Badge variant="outline" className="text-xs">
                      Notified
                    </Badge>
                  )}
                  <Switch checked={reminder.isActive} onCheckedChange={() => toggleReminder(reminder.id)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {reminders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reminders set up yet</p>
                <p className="text-sm">Add your first reminder to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
