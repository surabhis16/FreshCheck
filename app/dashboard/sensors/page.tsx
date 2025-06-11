"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Shield,
} from "lucide-react"

// Interface for the data coming from your FastAPI /sensors endpoint
interface ArduinoSensorData {
  timestamp: number; // Milliseconds from Arduino
  sensor_id: string;
  dht22: {
    temperature_c: number;
    temperature_f: number;
    humidity: number;
    heat_index_c: number;
    heat_index_f: number;
    status: string; // "ok" or "error"
  };
  mq2: {
    raw_analog: number;
    digital_alarm: number; // 0 or 1
    voltage: number;
    gas_ppm: {
      lpg: number;
      co: number;
      smoke: number;
    };
    gas_levels: {
      lpg_level: string; // "Safe", "Moderate", etc.
      co_level: string;
      smoke_level: string;
    };
  };
  air_quality: string; // "Good", "Moderate", "Poor"
  error?: string; // Optional error message from backend
}

// Interface for the data structure your UI components currently expect
interface DisplayData {
  temperature: number;
  humidity: number;
  co_ppm: number;
  lpg_ppm: number;
  smoke_ppm: number;
  airQualityStatus: string;
  lastUpdate: Date;
  dhtStatus: string;
  mq2DigitalAlarm: number;
  rawAnalog: number;
  voltage: number;
  gasLevels: {
    lpg_level: string;
    co_level: string;
    smoke_level: string;
  };
}

// Initial state for display data
const initialDisplayData: DisplayData = {
  temperature: 0,
  humidity: 0,
  co_ppm: 0,
  lpg_ppm: 0,
  smoke_ppm: 0,
  airQualityStatus: "Unknown",
  lastUpdate: new Date(),
  dhtStatus: "loading",
  mq2DigitalAlarm: 0,
  rawAnalog: 0,
  voltage: 0,
  gasLevels: {
    lpg_level: "Unknown",
    co_level: "Unknown",
    smoke_level: "Unknown",
  },
};

export default function SensorsPage() {
  const [currentData, setCurrentData] = useState<DisplayData>(initialDisplayData);
  const [history, setHistory] = useState<DisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  const fetchData = useCallback(async () => {
    try {
      // Replace with your actual backend URL
      const response = await fetch("http://localhost:8000/sensors");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData: ArduinoSensorData = await response.json();

      if (rawData.error) {
        setError(rawData.error);
        setConnectionStatus('error');
        return;
      }

      setError(null);
      setConnectionStatus('connected');

      // Transform ArduinoData to DisplayData
      const newDisplayData: DisplayData = {
        temperature: rawData.dht22?.temperature_c ?? 0,
        humidity: rawData.dht22?.humidity ?? 0,
        co_ppm: rawData.mq2?.gas_ppm?.co ?? 0,
        lpg_ppm: rawData.mq2?.gas_ppm?.lpg ?? 0,
        smoke_ppm: rawData.mq2?.gas_ppm?.smoke ?? 0,
        airQualityStatus: rawData.air_quality ?? "Unknown",
        lastUpdate: new Date(rawData.timestamp),
        dhtStatus: rawData.dht22?.status ?? "error",
        mq2DigitalAlarm: rawData.mq2?.digital_alarm ?? 0,
        rawAnalog: rawData.mq2?.raw_analog ?? 0,
        voltage: rawData.mq2?.voltage ?? 0,
        gasLevels: {
          lpg_level: rawData.mq2?.gas_levels?.lpg_level ?? "Unknown",
          co_level: rawData.mq2?.gas_levels?.co_level ?? "Unknown",
          smoke_level: rawData.mq2?.gas_levels?.smoke_level ?? "Unknown",
        },
      };

      setCurrentData(newDisplayData);
      setHistory((prev) => [newDisplayData, ...prev.slice(0, 19)]);
      setIsLoading(false);

    } catch (e: any) {
      console.error("Failed to fetch sensor data:", e);
      setError(e.message || "Failed to load data");
      setConnectionStatus('error');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Fetch every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const getSensorStatus = (value: number, type: string, fullData?: DisplayData) => {
    if (!fullData) return { status: "unknown", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-900/30" };

    if (fullData.dhtStatus === 'error' && (type === "temperature" || type === "humidity")) {
      return { status: "error", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" };
    }

    if (type === "temperature") {
      if (value < 18 || value > 26)
        return { status: "warning", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" };
      if (value < 15 || value > 30)
        return { status: "danger", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      return { status: "good", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    }

    if (type === "humidity") {
      if (value < 40 || value > 70)
        return { status: "warning", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" };
      if (value < 30 || value > 80)
        return { status: "danger", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      return { status: "good", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    }

    if (type === "co_ppm") {
      if (value > 50) return { status: "danger", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      if (value > 25) return { status: "warning", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" };
      return { status: "good", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    }

    if (type === "lpg_ppm") {
      if (value > 1000) return { status: "danger", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      if (value > 500) return { status: "warning", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" };
      return { status: "good", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    }

    if (type === "smoke_ppm") {
      if (value > 200) return { status: "danger", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      if (value > 100) return { status: "warning", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" };
      return { status: "good", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    }

    if (type === "airQualityOverall") {
      const aqStatus = fullData.airQualityStatus.toLowerCase();
      if (aqStatus === "poor") return { status: "danger", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" };
      if (aqStatus === "moderate") return { status: "warning", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" };
      if (aqStatus === "good") return { status: "good", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" };
    }

    return { status: "unknown", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-900/30" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "danger":
        return <AlertTriangle className="h-5 w-5" />
      case "error":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Minus className="h-5 w-5" />
    }
  };

  const getTrend = (current: number, previous: number) => {
    const diff = current - previous
    if (Math.abs(diff) < 0.1) return <Minus className="h-4 w-4 text-gray-400" />
    return diff > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading && history.length === 0) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p className="text-xl">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  if (error && history.length === 0) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-xl text-red-500">Error loading sensor data: {error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Environmental Sensor Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Real-time monitoring from Arduino sensors via FastAPI
        </p>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
          <span className={`text-sm ${getConnectionStatusColor()}`}>
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
          </span>
        </div>
        {error && <p className="text-red-500 text-sm">Last error: {error}</p>}
      </div>

      {/* Current Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Temperature */}
        <Card className="bg-gradient-to-br from-red-400 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Thermometer className="h-8 w-8 opacity-80" />
              {currentData.dhtStatus === 'ok' ?
                getStatusIcon(getSensorStatus(currentData.temperature, "temperature", currentData).status) :
                <AlertTriangle className="h-5 w-5 text-yellow-300" title="DHT Error" />}
            </div>
            <CardTitle className="text-sm font-medium opacity-90">Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentData.dhtStatus === 'ok' ? `${currentData.temperature.toFixed(1)}°C` : 'N/A'}
            </div>
            {currentData.dhtStatus === 'ok' && (
              <div className="flex items-center gap-2 mt-2">
                {history.length > 0 &&
                  getTrend(currentData.temperature, history[0]?.temperature || currentData.temperature)}
                <span className="text-xs opacity-80">Optimal: 18-26°C</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Droplets className="h-8 w-8 opacity-80" />
              {currentData.dhtStatus === 'ok' ?
                getStatusIcon(getSensorStatus(currentData.humidity, "humidity", currentData).status) :
                <AlertTriangle className="h-5 w-5 text-yellow-300" title="DHT Error" />}
            </div>
            <CardTitle className="text-sm font-medium opacity-90">Humidity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentData.dhtStatus === 'ok' ? `${currentData.humidity.toFixed(1)}%` : 'N/A'}
            </div>
            {currentData.dhtStatus === 'ok' && (
              <div className="flex items-center gap-2 mt-2">
                {history.length > 0 && getTrend(currentData.humidity, history[0]?.humidity || currentData.humidity)}
                <span className="text-xs opacity-80">Optimal: 40-70%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LPG Gas Level */}
        <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Flame className="h-8 w-8 opacity-80" />
              {getStatusIcon(getSensorStatus(currentData.lpg_ppm, "lpg_ppm", currentData).status)}
            </div>
            <CardTitle className="text-sm font-medium opacity-90">LPG Gas (MQ-2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentData.lpg_ppm.toFixed(0)} PPM</div>
            <div className="flex items-center gap-2 mt-2">
              {history.length > 0 && getTrend(currentData.lpg_ppm, history[0]?.lpg_ppm || currentData.lpg_ppm)}
              <span className="text-xs opacity-80">{currentData.gasLevels.lpg_level}</span>
            </div>
          </CardContent>
        </Card>

        {/* Overall Air Quality */}
        <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Shield className="h-8 w-8 opacity-80" />
              {getStatusIcon(getSensorStatus(0, "airQualityOverall", currentData).status)}
            </div>
            <CardTitle className="text-sm font-medium opacity-90">Air Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentData.airQualityStatus}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs opacity-80">From MQ-2 Analysis</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Readings */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              Live Monitoring
            </CardTitle>
            <CardDescription>Real-time sensor readings with status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Detail */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getSensorStatus(currentData.temperature, "temperature", currentData).bg}`}>
                    <Thermometer
                      className={`h-5 w-5 ${getSensorStatus(currentData.temperature, "temperature", currentData).color}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium">Temperature</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentData.dhtStatus === 'ok' ? 'Environment monitoring' : `DHT Status: ${currentData.dhtStatus}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {currentData.dhtStatus === 'ok' ? `${currentData.temperature.toFixed(1)}°C` : 'N/A'}
                  </p>
                  {currentData.dhtStatus === 'ok' && <Badge className={`${getSensorStatus(currentData.temperature, "temperature", currentData).bg} text-black dark:text-white`}>
                    {getSensorStatus(currentData.temperature, "temperature", currentData).status.toUpperCase()}
                  </Badge>}
                </div>
              </div>
              {currentData.dhtStatus === 'ok' && <Progress value={(currentData.temperature / 40) * 100} className="h-3" />}
            </div>

            {/* Humidity Detail */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getSensorStatus(currentData.humidity, "humidity", currentData).bg}`}>
                    <Droplets className={`h-5 w-5 ${getSensorStatus(currentData.humidity, "humidity", currentData).color}`} />
                  </div>
                  <div>
                    <p className="font-medium">Humidity</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentData.dhtStatus === 'ok' ? 'Moisture level' : `DHT Status: ${currentData.dhtStatus}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {currentData.dhtStatus === 'ok' ? `${currentData.humidity.toFixed(1)}%` : 'N/A'}
                  </p>
                  {currentData.dhtStatus === 'ok' && <Badge className={`${getSensorStatus(currentData.humidity, "humidity", currentData).bg} text-black dark:text-white`}>
                    {getSensorStatus(currentData.humidity, "humidity", currentData).status.toUpperCase()}
                  </Badge>}
                </div>
              </div>
              {currentData.dhtStatus === 'ok' && <Progress value={currentData.humidity} className="h-3" />}
            </div>

            {/* CO Gas Level Detail */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getSensorStatus(currentData.co_ppm, "co_ppm", currentData).bg}`}>
                    <Wind className={`h-5 w-5 ${getSensorStatus(currentData.co_ppm, "co_ppm", currentData).color}`} />
                  </div>
                  <div>
                    <p className="font-medium">CO Gas Level</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Carbon Monoxide - {currentData.gasLevels.co_level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{currentData.co_ppm.toFixed(1)} PPM</p>
                  <Badge className={`${getSensorStatus(currentData.co_ppm, "co_ppm", currentData).bg} text-black dark:text-white`}>
                    {getSensorStatus(currentData.co_ppm, "co_ppm", currentData).status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Progress value={(currentData.co_ppm / 100) * 100} className="h-3" />
            </div>

            {/* Smoke Level Detail */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getSensorStatus(currentData.smoke_ppm, "smoke_ppm", currentData).bg}`}>
                    <Activity className={`h-5 w-5 ${getSensorStatus(currentData.smoke_ppm, "smoke_ppm", currentData).color}`} />
                  </div>
                  <div>
                    <p className="font-medium">Smoke Level</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Smoke Detection - {currentData.gasLevels.smoke_level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{currentData.smoke_ppm.toFixed(1)} PPM</p>
                  <Badge className={`${getSensorStatus(currentData.smoke_ppm, "smoke_ppm", currentData).bg} text-black dark:text-white`}>
                    {getSensorStatus(currentData.smoke_ppm, "smoke_ppm", currentData).status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Progress value={(currentData.smoke_ppm / 300) * 100} className="h-3" />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Last update: {currentData.lastUpdate.toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  MQ-2 Digital Alarm: {currentData.mq2DigitalAlarm === 1 ?
                    <span className="text-red-500 font-bold">ACTIVE</span> :
                    <span className="text-green-500">Inactive</span>
                  }
                </div>
                <div className="text-xs">
                  Raw Analog: {currentData.rawAnalog} | Voltage: {currentData.voltage.toFixed(2)}V
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              Recent Readings
            </CardTitle>
            <CardDescription>Historical sensor data from the last few minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.map((reading, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl"
                >
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {reading.lastUpdate.toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1" title={reading.dhtStatus === 'ok' ? '' : `DHT: ${reading.dhtStatus}`}>
                      <Thermometer className={`h-4 w-4 ${reading.dhtStatus === 'ok' ? 'text-red-500' : 'text-gray-400'}`} />
                      <span>{reading.dhtStatus === 'ok' ? `${reading.temperature.toFixed(1)}°C` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1" title={reading.dhtStatus === 'ok' ? '' : `DHT: ${reading.dhtStatus}`}>
                      <Droplets className={`h-4 w-4 ${reading.dhtStatus === 'ok' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span>{reading.dhtStatus === 'ok' ? `${reading.humidity.toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="h-4 w-4 text-yellow-500" />
                      <span>CO: {reading.co_ppm.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>LPG: {reading.lpg_ppm.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Collecting sensor data...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            System Status
          </CardTitle>
          <CardDescription>Current system health and sensor status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DHT22 Sensor Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentData.dhtStatus === 'ok' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <Thermometer className={`h-5 w-5 ${currentData.dhtStatus === 'ok' ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className="font-medium">DHT22 Sensor</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Temperature & Humidity</p>
                </div>
              </div>
              <Badge variant={currentData.dhtStatus === 'ok' ? 'default' : 'destructive'}>
                {currentData.dhtStatus === 'ok' ? 'OPERATIONAL' : 'ERROR'}
              </Badge>
            </div>

            {/* MQ2 Sensor Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Flame className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">MQ2 Sensor</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gas & Smoke Detection</p>
                </div>
              </div>
              <Badge variant="default">OPERATIONAL</Badge>
            </div>

            {/* Alarm Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentData.mq2DigitalAlarm === 1 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                  <AlertTriangle className={`h-5 w-5 ${currentData.mq2DigitalAlarm === 1 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
                <div>
                  <p className="font-medium">Alarm Status</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gas detection threshold</p>
                </div>
              </div>
              <Badge variant={currentData.mq2DigitalAlarm === 1 ? 'destructive' : 'default'}>
                {currentData.mq2DigitalAlarm === 1 ? 'TRIGGERED' : 'NORMAL'}
              </Badge>
            </div>

            {/* Air Quality Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getSensorStatus(0, "airQualityOverall", currentData).bg}`}>
                  <Shield className={`h-5 w-5 ${getSensorStatus(0, "airQualityOverall", currentData).color}`} />
                </div>
                <div>
                  <p className="font-medium">Air Quality</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Overall assessment</p>
                </div>
              </div>
              <Badge className={`${getSensorStatus(0, "airQualityOverall", currentData).bg} text-black dark:text-white`}>
                {currentData.airQualityStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}