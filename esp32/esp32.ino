#include <ArduinoJson.h>
// #include <ArduinoJson.hpp>

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>

#define greenPin 2
#define redPin 4
#define bluePin 5
#define BUTTON_PIN 18 // GPIO18 pin connected to button

const char* ssid = "uba-arduino-2.4G"; //uba-arduino-2.4G / Atan
const char* password = "izhanhebat123"; //izhanhebat123 / atan1234

AsyncWebServer server(80);
char data[50];

float timeBlue;
float timeRed;
float timeGreen;

void setup() {
  Serial.begin(115200);
  pinMode(greenPin, OUTPUT);
  pinMode(redPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Connect to WiFi
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  delay(5000); // Add delay after WiFi connection
  Serial.println("Connected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/plain", data);
  });
  server.begin();
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);
  Serial.println(buttonState);
  if (WiFi.status() == WL_CONNECTED) {
    // Send GET request
    HTTPClient httpGet;
    httpGet.begin("https://base-hackathon-api.vercel.app/getTimes");
    int httpCodeGet = httpGet.GET();

    if (httpCodeGet > 0) {
      String payloadGet = httpGet.getString();
      Serial.print("Payload get: ");
      Serial.println(payloadGet);

      DynamicJsonDocument doc(1024);
      deserializeJson(doc, payloadGet);

      // Extract time values from JSON
      timeBlue = doc["timeBlue"];
      timeRed = doc["timeRed"];
      timeGreen = doc["timeGreen"];

      // Control LEDs based on time values
      controlLEDs();
    } else {
      Serial.print("GET request failed with status code ");
      Serial.println(httpCodeGet);
    }
    httpGet.end();
    
    delay(1000); // Delay before next API request
  }
}

void controlLEDs() {
  // Turn on all LEDs
  digitalWrite(bluePin, HIGH);
  digitalWrite(redPin, HIGH);
  digitalWrite(greenPin, HIGH);

  // Calculate the maximum time
  float maxTime = max(timeBlue, max(timeRed, timeGreen));

  // Start time
  unsigned long startTime = millis();

  // Keep the LEDs on for their respective durations
  while (millis() - startTime < maxTime * 1000) {
    if (millis() - startTime >= timeBlue * 1000) {
      digitalWrite(bluePin, LOW);
    }
    if (millis() - startTime >= timeRed * 1000) {
      digitalWrite(redPin, LOW);
    }
    if (millis() - startTime >= timeGreen * 1000) {
      digitalWrite(greenPin, LOW);
    }
    delay(10); // Small delay to prevent excessive looping
  }

  // Ensure all LEDs are turned off
  digitalWrite(bluePin, LOW);
  digitalWrite(redPin, LOW);
  digitalWrite(greenPin, LOW);
}
