// Arduino code for DHT22 and MQ-2 sensors
// Outputs JSON data via USB serial for FastAPI backend

#include <DHT.h>
#include <ArduinoJson.h>

// DHT11 sensor configuration
#define DHT_PIN 2          // Digital pin connected to DHT22
#define DHT_TYPE DHT11     // DHT 11 
DHT dht(DHT_PIN, DHT_TYPE);

// MQ-2 sensor configuration
#define MQ2_PIN A0         // Analog pin connected to MQ-2
#define MQ2_DIGITAL_PIN 3  // Digital pin for MQ-2 (optional, for threshold detection)

// Calibration constants for MQ-2
#define RL_VALUE 5         // Load resistance on the board (in kilo ohms)
#define RO_CLEAN_AIR_FACTOR 9.83  // RO_CLEAR_AIR_FACTOR=(Sensor resistance in clean air)/RL

// Gas concentration calculation constants
#define CALIBARAION_SAMPLE_TIMES 50    // Number of samples for calibration
#define CALIBRATION_SAMPLE_INTERVAL 500 // Time interval between samples (ms)
#define READ_SAMPLE_INTERVAL 50         // Time interval between samples in normal operation
#define READ_SAMPLE_TIMES 5             // Number of samples for each reading

// Gas types for MQ-2
#define GAS_LPG 0
#define GAS_CO 1  
#define GAS_SMOKE 2

// Curve data for different gases (you may need to calibrate these)
float LPGCurve[3] = {2.3, 0.21, -0.47};    // (x, y, slope)
float COCurve[3] = {2.3, 0.72, -0.34};     // (x, y, slope)
float SmokeCurve[3] = {2.3, 0.53, -0.44};  // (x, y, slope)

float Ro = 10; // Resistance of sensor in clean air (will be calibrated)

void setup() {
  Serial.begin(9600);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize MQ-2 pins
  pinMode(MQ2_DIGITAL_PIN, INPUT);
  
  // Calibrate MQ-2 sensor
  Serial.println("Calibrating MQ-2 sensor...");
  Ro = MQCalibration(MQ2_PIN);
  Serial.print("Calibration done. Ro = ");
  Serial.print(Ro);
  Serial.println(" kohm");
  
  delay(2000); // Wait for sensors to stabilize
  Serial.println("Starting sensor readings...");
}

void loop() {
  // Read DHT22 sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius
  float temperatureF = dht.readTemperature(true); // Fahrenheit
  
  // Check if DHT readings are valid
  bool dht_error = false;
  if (isnan(humidity) || isnan(temperature)) {
    dht_error = true;
  }
  
  // Read MQ-2 sensor
  int mq2_raw = analogRead(MQ2_PIN);
  int mq2_digital = digitalRead(MQ2_DIGITAL_PIN);
  
  // Calculate gas concentrations
  float lpg_ppm = MQGetGasPercentage(MQRead(MQ2_PIN)/Ro, GAS_LPG);
  float co_ppm = MQGetGasPercentage(MQRead(MQ2_PIN)/Ro, GAS_CO);
  float smoke_ppm = MQGetGasPercentage(MQRead(MQ2_PIN)/Ro, GAS_SMOKE);
  
  // Create JSON object
  StaticJsonDocument<300> doc;
  
  // Timestamp
  doc["timestamp"] = millis();
  doc["sensor_id"] = "arduino_001";
  
  // DHT22 data
  JsonObject dht_data = doc.createNestedObject("dht22");
  if (!dht_error) {
    dht_data["temperature_c"] = round(temperature * 10) / 10.0; // Round to 1 decimal
    dht_data["temperature_f"] = round(temperatureF * 10) / 10.0;
    dht_data["humidity"] = round(humidity * 10) / 10.0;
    dht_data["heat_index_c"] = round(dht.computeHeatIndex(temperature, humidity, false) * 10) / 10.0;
    dht_data["heat_index_f"] = round(dht.computeHeatIndex(temperatureF, humidity) * 10) / 10.0;
    dht_data["status"] = "ok";
  } else {
    dht_data["temperature_c"] = 0;
    dht_data["temperature_f"] = 0;
    dht_data["humidity"] = 0;
    dht_data["heat_index_c"] = 0;
    dht_data["heat_index_f"] = 0;
    dht_data["status"] = "error";
  }
  
  // MQ-2 data
  JsonObject mq2_data = doc.createNestedObject("mq2");
  mq2_data["raw_analog"] = mq2_raw;
  mq2_data["digital_alarm"] = mq2_digital;
  mq2_data["voltage"] = (mq2_raw * 5.0) / 1024.0;
  
  // Gas concentrations (in PPM)
  JsonObject gas_ppm = mq2_data.createNestedObject("gas_ppm");
  gas_ppm["lpg"] = round(lpg_ppm * 10) / 10.0;
  gas_ppm["co"] = round(co_ppm * 10) / 10.0;
  gas_ppm["smoke"] = round(smoke_ppm * 10) / 10.0;
  
  // Gas level indicators
  JsonObject gas_levels = mq2_data.createNestedObject("gas_levels");
  gas_levels["lpg_level"] = getGasLevel(lpg_ppm, "LPG");
  gas_levels["co_level"] = getGasLevel(co_ppm, "CO");
  gas_levels["smoke_level"] = getGasLevel(smoke_ppm, "SMOKE");
  
  // Overall air quality indicator
  String air_quality = "Good";
  if (co_ppm > 50 || smoke_ppm > 100 || lpg_ppm > 1000) {
    air_quality = "Poor";
  } else if (co_ppm > 25 || smoke_ppm > 50 || lpg_ppm > 500) {
    air_quality = "Moderate";
  }
  doc["air_quality"] = air_quality;
  
  // Send JSON data over serial
  serializeJson(doc, Serial);
  Serial.println(); // Add newline for easier parsing
  
  delay(2000); // Send data every 2 seconds
}

// MQ-2 sensor functions
float MQCalibration(int mq_pin) {
  int i;
  float val = 0;
  
  for (i = 0; i < CALIBARAION_SAMPLE_TIMES; i++) {
    val += MQResistanceCalculation(analogRead(mq_pin));
    delay(CALIBRATION_SAMPLE_INTERVAL);
  }
  val = val / CALIBARAION_SAMPLE_TIMES;
  val = val / RO_CLEAN_AIR_FACTOR;
  return val;
}

float MQResistanceCalculation(int raw_adc) {
  return (((float)RL_VALUE * (1024 - raw_adc) / raw_adc));
}

float MQRead(int mq_pin) {
  int i;
  float rs = 0;
  
  for (i = 0; i < READ_SAMPLE_TIMES; i++) {
    rs += MQResistanceCalculation(analogRead(mq_pin));
    delay(READ_SAMPLE_INTERVAL);
  }
  
  rs = rs / READ_SAMPLE_TIMES;
  return rs;
}

float MQGetGasPercentage(float rs_ro_ratio, int gas_id) {
  if (gas_id == GAS_LPG) {
    return MQGetPercentage(rs_ro_ratio, LPGCurve);
  } else if (gas_id == GAS_CO) {
    return MQGetPercentage(rs_ro_ratio, COCurve);
  } else if (gas_id == GAS_SMOKE) {
    return MQGetPercentage(rs_ro_ratio, SmokeCurve);
  }
  return 0;
}

float MQGetPercentage(float rs_ro_ratio, float *pcurve) {
  return (pow(10, (((log(rs_ro_ratio) - pcurve[1]) / pcurve[2]) + pcurve[0])));
}

String getGasLevel(float ppm, String gas_type) {
  if (gas_type == "CO") {
    if (ppm < 10) return "Safe";
    else if (ppm < 50) return "Moderate";
    else if (ppm < 100) return "High";
    else return "Dangerous";
  } else if (gas_type == "LPG") {
    if (ppm < 500) return "Safe";
    else if (ppm < 1000) return "Moderate";
    else if (ppm < 2000) return "High";
    else return "Dangerous";
  } else if (gas_type == "SMOKE") {
    if (ppm < 50) return "Safe";
    else if (ppm < 100) return "Moderate";
    else if (ppm < 200) return "High";
    else return "Dangerous";
  }
  return "Unknown";
}