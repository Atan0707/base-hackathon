#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>

#define greenPin 2

const char* ssid = "uba-arduino-2.4G"; //uba-arduino-2.4G / Atan
const char* password = "izhanhebat123"; //izhanhebat123 / atan1234

AsyncWebServer server(80);
char data[50];

bool state;

void setup() {
  Serial.begin(115200);
  pinMode(greenPin, OUTPUT);

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
  
  if (WiFi.status() == WL_CONNECTED) {
      // Send GET request
      HTTPClient httpGet;
      httpGet.begin("http://192.168.1.2:3000/state"); //172.20.10.12 / 192.168.1.2
      int httpCodeGet = httpGet.GET();

      if (httpCodeGet > 0) {
      String payloadGet = httpGet.getString();
      Serial.print("Payload get: ");
      Serial.println(payloadGet);

      DynamicJsonDocument doc(1024);
      deserializeJson(doc, payloadGet);

      // Corrected: Removed 'int' to use the global 'value' variable
      state = doc["state"]; // Method to extract data from JSON
    } else {
      Serial.print("GET request failed with status code ");
      Serial.println(httpCodeGet);
    }
    httpGet.end();

    if (state) {
      digitalWrite(greenPin, HIGH);
    } else {
      digitalWrite(greenPin, LOW);
    }
    
    delay(1000);                  // Delay to avoid multiple counts for one pushup
  }
}