#include <avr/sleep.h>
#include <avr/power.h>
#include <avr/wdt.h>
#include <EEPROM.h>
//
//  define area.
//
#define M0                            4
#define M1                            5
#define AUX                           2
#define ENABLE_PIN                    6
#define SENSOR_SIG_PIN                A0

#define BUFFER_LENGTH                 58
#define BAUD_RATE                     9600
#define DATA_SENT(idNode, glb_Data)   "[DATA;" + idNode + ";" + glb_Data + "]"

#define ACKString                     String("ACK")
#define CHANGEIDString                String("CHANGEID")
#define CHANGEINTERVALString          String("CHANGEINTERVAL")
#define DATAString                    String("DATA")
#define IGNORINGString                String("IGNORING")

// Use this UART for debug only, please connect with computer UART
// In application please remove this Serial.
#define DebugSerial                   //Serial<n>

// UART connect to Lora module, please modify for Arduino Mega.
#define LoRaSerial                    Serial

//
// Type definition area.
//
typedef enum {
  NORMAL,
  WAKEUP,
  POWER_SAVING,
  SLEEP
} loraMode;

typedef enum {
  ACK,
  CHANGEID,
  CHANGEINTERVAL,
  DATA,
  IGNORING
} receiveType;


typedef struct {
  String type;
  String nodeId;
  String data;
} message;

//
// Global variables area.
//
unsigned long     glb_CurrentMillis = 0;
unsigned long     glb_PreviousMillis = 0;
unsigned long     glb_Interval;

float             glb_SensorValue;
String            glb_NodeId;
String            glb_Data;
message           glb_Message;
char              glb_BufferLora[BUFFER_LENGTH];

byte              glb_OldADCSRA;
unsigned long     glb_WatchDogCount = 0;
bool              glb_SensorReading = false;
int               glb_WatchDogCountForSenSor = 0;
int               glb_ChangeTaskConfirm = 0;
bool              glb_AUXInterruptFlag = false;

bool              GetDataFromSesor();
void              SendDataToGateWay();
bool              CheckTimeSend();


//
// Function declaration.
//
void CheckAUX() {
  for (int i = 0; i < 10000; i ++) {
    while (digitalRead(AUX) == LOW) {
    }
  }
}

void ClearMessage() {
  glb_Message.type = "";
  glb_Message.nodeId = "";
  glb_Message.data = "";
};

void SetLoraMode(loraMode mode) {
  //M1 Pin has been toggle because of the transitor
  switch (mode) {
    case NORMAL:
      digitalWrite(M1, LOW);
      digitalWrite(M0, LOW);
      break;
    case WAKEUP:
      digitalWrite(M1, LOW);
      digitalWrite(M0, HIGH);
      break;
    case POWER_SAVING:
      digitalWrite(M1, HIGH);
      digitalWrite(M0, LOW);
      break;
    default: break;
  }
  CheckAUX();
}

void InitPIN() {
  for (byte i = 2; i <= 13; i++)
  {
    pinMode (i, OUTPUT);    // changed as per below
    digitalWrite (i, LOW);  //     ditto
  }
  for (byte i = A1; i <= A5; i++)
  {
    pinMode (i, OUTPUT);    // changed as per below
    digitalWrite (i, LOW);  //     ditto
  }
  pinMode(M1, OUTPUT);
  pinMode(M0, OUTPUT);
  pinMode(ENABLE_PIN, OUTPUT);
  pinMode(AUX, INPUT);
}

bool DataPresense() {
  if (LoRaSerial.available() > 0) {
    return true;
  }
  return false;
}

void SendDataTask() {
  SetLoraMode(NORMAL);
  GetDataFromSesor();
  CheckAUX();
  String dataSend = String(DATA_SENT(glb_NodeId, glb_Data));
  LoRaSerial.print(dataSend);
  CheckAUX();
  SetLoraMode(POWER_SAVING);
}

void SendAckTask(unsigned long interval = 0) {
  SetLoraMode(NORMAL);
  CheckAUX();
  String dataSend;
  if (interval > 0) dataSend = String("[ACK;" + glb_NodeId + ";" + String(interval) + "]");
  else dataSend = String("[ACK;" + glb_NodeId + ";true]");
  LoRaSerial.print(dataSend);
  CheckAUX();
  SetLoraMode(POWER_SAVING);
}

receiveType ReceiveTask() {
  ClearMessage();
  memset(glb_BufferLora, 0, sizeof(glb_BufferLora));
  int buffer_length = LoRaSerial.readBytesUntil('\n', glb_BufferLora, BUFFER_LENGTH);
  if (buffer_length > 0) {
    String dataReceive = String(glb_BufferLora);
    //DebugSerial.println("-------------------------");
    //DebugSerial.print("RECEIVED FROM GATEWAY: ");
    //DebugSerial.println(glb_BufferLora);

    glb_Message.type = dataReceive.substring(dataReceive.indexOf('[') + 1, dataReceive.indexOf(';'));
    glb_Message.nodeId = String (dataReceive.substring(dataReceive.indexOf(';') + 1, dataReceive.lastIndexOf(';')));
    glb_Message.data = String (dataReceive.substring(dataReceive.lastIndexOf(';') + 1, dataReceive.indexOf(']')));
    //DebugSerial.println("CURRENT NODE_ID: " + glb_NodeId);


    if (glb_Message.type == ACKString) {
      if (glb_Message.nodeId.equals(glb_NodeId) && glb_Message.data.equals("true")) {
        return ACK;
      }
      else return IGNORING;
    }
    if (glb_Message.type == CHANGEIDString) {
      if ((glb_Message.nodeId.equals(glb_NodeId) && glb_Message.data.toInt() > 0) 
      || (glb_Message.data.equals(glb_NodeId) && glb_ChangeTaskConfirm > 0)) {
        glb_ChangeTaskConfirm = 3;
        int nodeId = glb_Message.data.toInt();
        EEPROM.put(0, nodeId);
        glb_NodeId = String(nodeId);
        SendAckTask();
        return CHANGEID;
      }
      else return IGNORING;
    }
    if (glb_Message.type == CHANGEINTERVALString) {
      if (glb_Message.nodeId.equals(glb_NodeId) && glb_Message.data.toInt() > 0) {
        unsigned long interval = 0;
        for (int i = 0; i < glb_Message.data.length(); i++) {
          char c = glb_Message.data.charAt(i);
          if (c < '0' || c > '9') break;
          interval *= 10;
          interval += (c - '0');
        }
        if (glb_Interval != interval) {
          EEPROM.put(0 + sizeof(unsigned long), interval);
          glb_Interval = interval;
        }
        SendAckTask(interval);
        return CHANGEINTERVAL;
      }
      else return IGNORING;
    }
    if (glb_Message.type == DATAString) {
      if (glb_Message.nodeId.equals(glb_NodeId) && glb_Message.data.equals("true")) {
        SendDataTask();
        return DATA;
      }
      else return IGNORING;
    }
    else return IGNORING;
  }
  return IGNORING;
}

bool GetDataFromSesor() {
  digitalWrite(ENABLE_PIN, HIGH);
  glb_SensorReading = true;
  glb_WatchDogCountForSenSor = 0;
  ResetWatchdog4s();
  while (glb_WatchDogCountForSenSor < 3) {
    GoToSleep();
    Precaution();
  }
  glb_SensorReading = false;
  glb_WatchDogCount += 1;
  ResetWatchdog8s();
  int analogValue = 0;
  for (int i = 0; i < 3; i++) {
    analogValue += analogRead(SENSOR_SIG_PIN);
  }
  glb_SensorValue = float(analogValue) / float(3) * float(5) / float(1024) * float(16.3);
  glb_Data = String(glb_SensorValue);
  digitalWrite(ENABLE_PIN, LOW);
  return true;
}

bool CheckTimeSend() {
  glb_CurrentMillis = millis();
  unsigned long currentInterval = (glb_CurrentMillis -  glb_PreviousMillis) + (8000 * glb_WatchDogCount);
  if (currentInterval >= glb_Interval)
  {
    glb_PreviousMillis = glb_CurrentMillis;
    glb_WatchDogCount = 0;
    return true;
  }
  return false;
}

//
// Sleep and Wakeup Area.
//
void Precaution() {
  ADCSRA = glb_OldADCSRA;
  sleep_disable();
}

void AUXInterrupt() {
  detachInterrupt(digitalPinToInterrupt(AUX));
  glb_AUXInterruptFlag = true;
}

// watchdog interrupt
ISR (WDT_vect)
{
  if (glb_SensorReading) {
    glb_WatchDogCountForSenSor++;
  }
  else {
    glb_WatchDogCount++;
    if (glb_ChangeTaskConfirm > 0) glb_ChangeTaskConfirm--;
    //DebugSerial.println(glb_WatchDogCount);
    glb_PreviousMillis = millis();
    if (glb_WatchDogCount >= 80) {
      asm volatile ( "jmp 0");
    }
  }
}  // end of WDT_vect

void ResetWatchdog4s() {
  // clear various "reset" flags
  MCUSR = 0;
  // allow changes, disable reset, clear existing interrupt
  WDTCSR  = bit (WDCE) | bit (WDE) | bit (WDIF);
  // set interrupt mode and an interval (WDE must be changed from 1 to 0 here)
  WDTCSR  = bit (WDIE) | bit (WDP3);    // set WDIE, and 4 seconds delay
  // pat the dog
  wdt_reset();
}  // end of resetWatchdog

void ResetWatchdog8s() {
  // clear various "reset" flags
  MCUSR = 0;
  // allow changes, disable reset, clear existing interrupt
  WDTCSR  = bit (WDCE) | bit (WDE) | bit (WDIF);
  // set interrupt mode and an interval (WDE must be changed from 1 to 0 here)
  WDTCSR  = bit (WDIE) | bit (WDP3) | bit (WDP0);    // set WDIE, and 8 seconds delay
  // pat the dog
  wdt_reset();
}  // end of resetWatchdog

void GoToSleep() {
  ADCSRA = 0;
  set_sleep_mode(SLEEP_MODE_PWR_DOWN);
  sleep_enable();       // ready to sleep
  noInterrupts();
  attachInterrupt(digitalPinToInterrupt(AUX), AUXInterrupt, FALLING);
  EIFR = bit (INTF0);

  // turn off brown-out enable in software
  MCUCR = bit (BODS) | bit (BODSE);
  MCUCR = bit (BODS);
  interrupts();         // interrupts are required now

  power_spi_disable(); // SPI
  power_twi_disable(); // TWI (I2C)
  //Sleep
  //DebugSeriaL.println("GOTO SLEEP");
  delay(100);
  sleep_cpu();
}

//
// Main Area
//
void setup() {
  int nodeId;
  unsigned long interval;
  EEPROM.get(0, nodeId);
  EEPROM.get(0 + sizeof(unsigned long), interval);
  glb_NodeId = String(nodeId);
  glb_Interval = interval;
  InitPIN();
  SetLoraMode(POWER_SAVING);
  glb_OldADCSRA = ADCSRA;

  // start serial.
  LoRaSerial.begin(BAUD_RATE);
  // check when serial start.
  while (!LoRaSerial);
  // get current millis;
  glb_CurrentMillis = millis();
  LoRaSerial.println("START");
  digitalWrite(ENABLE_PIN, HIGH);
  delay(2000);
  digitalWrite(ENABLE_PIN, LOW);
  ResetWatchdog8s();
}

void loop() {

  if (glb_AUXInterruptFlag) {
    glb_AUXInterruptFlag = false;
    ReceiveTask();
    while (digitalRead(AUX) == LOW  || LoRaSerial.available() > 0) {
      CheckAUX();
      ReceiveTask();
    }
  }

  // Send glb_Data.
  if (CheckTimeSend())
  {
    SendDataTask();
  }

  GoToSleep();
  Precaution();
}




