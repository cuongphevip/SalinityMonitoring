#include <avr/wdt.h>

//
//  define area.
//
#define M0                            		  12
#define M1                            		  13
#define AUX                           		  20

#define BUFFER_LENGTH                 		  58
#define MAX_NODE					  	      				8
#define BAUD_RATE                     		  9600
#define INTERVAl_DEFAULT_TIMEOUT      		  1000
#define LORA_NUMBER_OF_TRIALS         		  5
#define HTTPREAD_TRIALS											15

#define ACKString                     		  String("ACK")
#define CHANGEIDString                		  String("CHANGEID")
#define DATAString                    		  String("DATA")
#define IGNORINGString                		  String("IGNORING")

// APN:  Viettel: v-internet ;Mobifone: m-wap ;Vinaphone: m3-world ;Vietnamobile: internet
#define APN                           		  String("internet")

// Modify your number phone, recive SMS warning
#define DEFAULT_NUM_PHONE			  	      		String("01673490258")

// Use this UART for debug only, please connect with computer UART
// In application please remove this Serial.
#define	DebugSerial_Enable									1
#define DebugSerial                   		  Serial   // select for debug

// UART connect to Lora & Sim module, please modify for Arduino Mega.
#define LoRaSerial                    		  Serial3 // select for loraModule
#define SimSerial					          				Serial2 // select for simModuule

#define PATTERN_SEND_SERVER(node,data)  	  String(\
    String("\"http://125.212.254.86/")\
    + String("data_utilization/import/")\
    + String(node)\
    + String("/")\
    + String(data)\
    + String("\""))
#define PATTERN_CHANGE_WARNING(option, data)   String(\
    String("\"http://125.212.254.86/")\
    + String("node_management/update_node_threshold/")\
    + String(option)\
    + String("/")\
    + String(data)\
    + String("\""))
#define PATTERN_REQUSET_CHANGE(old, new)   String(\
    String("\"http://125.212.254.86/")\
    + String("node_management/change_node_id/")\
    + String(old)\
    + String("/")\
    + String(new)\
    + String("\""))

//
// Type definition area.
//
typedef enum {
  NORMAL,
  WAKEUP,
  POWER_SAVING,
  SLEEP
}
loraMode;

typedef enum {
  ACK,
  CHANGEID,
  DATA,
  IGNORING
}
receiveType;
typedef struct {
  String type;
  String nodeId;
  String data;
}
message;

typedef struct {
  String node;
  String state;
}
statusNode;

typedef struct {
  String request; // SAL or CHD or VAL or CHI
  String numberPhone;
  String node1; // use for request = SAL, CHD or CHI
  String node2; // use for request = CHD
  String value; // use for request = VAL, CHI
  String option;// use for request = VAL
}
requestSms;
//
// Global variables area.
//

unsigned long glb_CurrentMillis = 0;

// Timeout declaration.
unsigned long glb_PreviousTimeout = 0;
unsigned long glb_IntervalTimeout = INTERVAl_DEFAULT_TIMEOUT;

String        glb_Data = "";
message       glb_LoRaMessage;
char          glb_BufferLora[BUFFER_LENGTH];

String 		    glb_SimBuffer;
statusNode    glb_StatusNode[MAX_NODE];
requestSms    glb_RequestSms;
bool		      glb_NewMessage = true;
bool          glb_AUXInterruptFlag = false;
int           glb_WatchDogCount = 0;

//
// Function declaration area.
//
void ProcessRequest();
void CheckSendSms();
bool UpdateStatusNode(String node, String state);
void InitStatusNode();
void SetTimeout(unsigned long timeout);
void SetTimeout();
bool CheckTimeout();
void CheckAUX();
void ClearMessage();
void SetLoraMode(loraMode mode);
void InitPIN();
bool LoRaDataPresense();
receiveType ReceiveAnalysis();
receiveType ReceiveProcessing(String _openBracket = "");
void SendRequestDataToClient(String nodeId);
void SendRequestDataTask(String nodeId);
void SendChangeIDToClient (String oldNodeId, String newNodeId);
bool SendChangeIdTask (String oldNodeId, String newNodeId);
bool AtCommand(String _atCommand, bool _wantGetBuffer = false);
void InitSim();
void SendSms(String _number, String _mess);
void CheckSimAvailable();
void SendBySimHttp(String _node, String _data);
bool ReadSmsRequest();
String GetPhoneNumber();
void ChangeValueWarning(String value, String option);
void DeleteSmsStore();
void PhoneCall(String number);
bool ServerAllowChange(String oldNodeId, String newNodeId);
void AUXInterrupt();
void ResetWatchdog8s();

// watchdog interrupt
ISR (WDT_vect)
{
  glb_WatchDogCount++;
  if (glb_WatchDogCount >= 15) {
    glb_WatchDogCount = 0;
    asm volatile ( "jmp 0");
  }
}  // end of WDT_vect

//***********************************************************//
//***********************************************************//
//
// Main Area
//
void setup() {
#if DebugSerial_Enable
  DebugSerial.begin(BAUD_RATE);
  while (!DebugSerial);
  DebugSerial.println("Start");
#endif

  InitPIN();
  // Start Sim serial
  SimSerial.begin(BAUD_RATE);
  while (!SimSerial);

  // init control lora
  SetLoraMode(WAKEUP);
  // Start lora serial.
  LoRaSerial.begin(BAUD_RATE);
  while (!LoRaSerial);

  CheckSimAvailable();
  InitSim();

  //Get current millis;
  glb_CurrentMillis = millis();

#if DebugSerial_Enable
  DebugSerial.println("End Setup");
#else
  PhoneCall(DEFAULT_NUM_PHONE);
#endif

  InitStatusNode();
  ResetWatchdog8s();
}

void loop() {
  // Reset WatchDog count;
  glb_WatchDogCount = 0;
  
  // when have request SMS
  if (glb_NewMessage == true || SimSerial.available() > 0) {
    glb_NewMessage = false;
    if (ReadSmsRequest() == true) ProcessRequest();
  }

  if (LoRaDataPresense()) {
    ReceiveAnalysis();
  }
  
  if (glb_Data.length() > 0) {
    ReceiveProcessing();
  }
}

//***********************************************************//
//***********************************************************//
//
//	define function.
//
void PhoneCall(String number) {
  AtCommand("AT");
  AtCommand("ATD" + number + ";");
  delay(15000);
  AtCommand("ATH");
}

void ProcessRequest() {
#if DebugSerial_Enable
  DebugSerial.print("NUMBER: ");
  DebugSerial.println(glb_RequestSms.numberPhone);
  DebugSerial.print("Request: ");
  DebugSerial.println(glb_RequestSms.request);
  DebugSerial.print("NODE1: ");
  DebugSerial.println(glb_RequestSms.node1);
  DebugSerial.print("NODE2: ");
  DebugSerial.println(glb_RequestSms.node2);
  DebugSerial.print("Value: ");
  DebugSerial.println(glb_RequestSms.value);
  DebugSerial.print("Option: ");
  DebugSerial.println(glb_RequestSms.option);
#endif



  if (glb_RequestSms.request.equalsIgnoreCase("CHD")) {

#if DebugSerial_Enable
    DebugSerial.println("Change ID");
#endif
    // request server
    if (ServerAllowChange(glb_RequestSms.node1, glb_RequestSms.node2)) {
      SendChangeIdTask(glb_RequestSms.node1, glb_RequestSms.node2);
    }
  }
  else if (glb_RequestSms.request.equalsIgnoreCase("CHI")) {

#if DebugSerial_Enable
    DebugSerial.println("Change Interval");
#endif

    SendChangeIntervalTask(glb_RequestSms.node1, glb_RequestSms.value);
  }
  else if (glb_RequestSms.request.equalsIgnoreCase("SAL")) {

#if DebugSerial_Enable
    DebugSerial.println("Request Data");
#endif

    SendRequestDataTask(glb_RequestSms.node1);
  }
  else if (glb_RequestSms.request.equalsIgnoreCase("VAL")) {

#if DebugSerial_Enable
    DebugSerial.println("Change val");
#endif

    ChangeValueWarning(glb_RequestSms.value, glb_RequestSms.option);
  } else if (glb_RequestSms.request.equalsIgnoreCase("DEL")) {
#if DebugSerial_Enable
    DebugSerial.println("Delete message stored");
#endif
    DeleteSmsStore();
  }
}

bool ServerAllowChange(String oldNodeId, String newNodeId) {
  if (AtCommand("AT+HTTPINIT") == false) {
    AtCommand("AT+HTTPTERM");
    AtCommand("AT+HTTPINIT");
  }

  AtCommand("AT+HTTPPARA=\"CID\",1");
  AtCommand(String("AT+HTTPPARA=\"URL\",") + PATTERN_REQUSET_CHANGE(oldNodeId, newNodeId));
  if (AtCommand("AT+HTTPACTION=0") == false) {
    AtCommand("AT+HTTPACTION=0");
  }
  for (int i = 0; i < HTTPREAD_TRIALS; i++) {
    if (AtCommand("AT+HTTPREAD", true) == true) break;
  }
  AtCommand("AT+HTTPTERM");

  if (glb_SimBuffer.indexOf("true") > -1) {
    return true;
  }

  if (glb_SimBuffer.indexOf("exist") > -1) {
    SendSms(glb_RequestSms.numberPhone, String("Sever not allow change id node:") +
            String(oldNodeId) +
            String(" to ") 		+
            String(newNodeId));
    return false;
  }

  SendSms(glb_RequestSms.numberPhone, String("Chang id node: ") +
          String(oldNodeId) +
          String(" to ") 		+
          String(newNodeId) +
          String(", Failed. Server not response!!"));
  return false;
}

void DeleteSmsStore() {
  for (int i = 0; i < 3; i++) {
    if (AtCommand("AT+CMGD=1,3") == true) {
      SendSms(glb_RequestSms.numberPhone, String("Delete Sms") +
              String(", Completed!!"));
      return;
    }
  }
  SendSms(glb_RequestSms.numberPhone, String("Delete Sms ") +
          String(", Failed!!"));
}

void CheckSendSms() {
  if (glb_SimBuffer.indexOf("true") > -1) {
    UpdateStatusNode(glb_LoRaMessage.nodeId, "true");
  }
  else if (glb_SimBuffer.indexOf("alert") > -1) {
    if (UpdateStatusNode(glb_LoRaMessage.nodeId, "alert")) {
      SendSms(DEFAULT_NUM_PHONE, String("WARNING AT NODE :") + String(glb_LoRaMessage.nodeId + "\n") +
              String("PPT : ") + String(glb_LoRaMessage.data));

    }
  }
}

void InitStatusNode() {
  for (int i = 0; i < MAX_NODE; i++) {
    glb_StatusNode[i].node = String(i + 1);
    glb_StatusNode[i].state = "true";
  }
}

bool UpdateStatusNode(String node, String state) {
  for (int i = 0; i < MAX_NODE; i++) {

    if (glb_StatusNode[i].node == node) {

      if (glb_StatusNode[i].state == "true" && state == "alert") {
        glb_StatusNode[i].state = state;
        return true;
      }
      glb_StatusNode[i].state = state;
      return false;
    }
  }
  return false;
}

//
// have 3 type SMS request
// 1.Request ppt at node X
// 2.Set warning value
// 3.Change (swap) id node X and Y
// 4.Delete all "rec read" message
//------> Syntax
// 1:		SAL X   : X is ID node;
// 2:   VAL X Y : X new Warning value, Y option( ALL for all node, number for only one node)
// 3:   CHD X Y : X is old ID, Y new ID
// 4:   DEl
// Remember type request always 3 charcter, ex: SAL, CHD, DEl, ...
bool ReadSmsRequest() {
  int indexUR;
  int indexStartRQ;
  int indexEndRQ;
  String data;
  String request;
  String node1, node2;
  String value;
  String option;
  if (AtCommand("AT+CMGF=1") == false) {
    AtCommand("AT+CMGF=1");
  }
  AtCommand("AT+CMGL=\"REC UNREAD\",0", true);
  indexUR = glb_SimBuffer.indexOf("REC UNREAD");
  if (indexUR == -1) {
    AtCommand("AT+CMGD=1,4");
    return false;
  }
  indexStartRQ = glb_SimBuffer.lastIndexOf("\"") + 3;
  indexEndRQ = glb_SimBuffer.indexOf("\n", indexStartRQ);
  data = glb_SimBuffer.substring(indexStartRQ, indexEndRQ);
  data.trim();
  request = data.substring(0, 3);

#if DebugSerial_Enable
  DebugSerial.println(request);
#endif

  glb_RequestSms.numberPhone = GetPhoneNumber();
  
  if (request.equalsIgnoreCase ("SAL")) { 							// 1.
    node1 = data.substring(4);
#if DebugSerial_Enable
    DebugSerial.println(node1);
#endif
    if (node1.toInt() == 0) {
      AtCommand("AT+CMGD=1,3");
      return false;
    }
    glb_RequestSms.request = request;
    glb_RequestSms.node1 = node1;
    return true;
  }
  
  if (request.equalsIgnoreCase ("VAL")) { 							// 2
    int index1 = data.indexOf(' ');
    int index2 = data.indexOf(' ', index1 + 1);
    value = data.substring(index1 + 1, index2);
    option = data.substring(index2 + 1);

#if DebugSerial_Enable
    DebugSerial.println(request);
    DebugSerial.println(value);
    DebugSerial.println(option);
#endif

    float val = value.toFloat();
    if (!option.equalsIgnoreCase("ALL") && val == 0) {
      AtCommand("AT+CMGD=1,3");
      return false;
    }
    glb_RequestSms.request = request;
    glb_RequestSms.value = value;
    glb_RequestSms.option = option;

    return true;
  }
  
  if (request.equalsIgnoreCase ("CHD")) { 							// 3
    int index1 = data.indexOf(' ');
    int index2 = data.indexOf(' ', index1 + 1);

    node1 = data.substring(index1 + 1, index2);
    node2 = data.substring(index2 + 1);

#if DebugSerial_Enable
    DebugSerial.println(request);
    DebugSerial.println(node1);
    DebugSerial.println(node2);
#endif
    if (node1.toInt() == 0) {
      AtCommand("AT+CMGD=1,3");
      return false;
    }
    if (node2.toInt() == 0) {
      AtCommand("AT+CMGD=1,3");
      return false;
    }
    glb_RequestSms.request = request;
    glb_RequestSms.node1 = node1;
    glb_RequestSms.node2 = node2;
    return true;
  }
  
  if (request.equalsIgnoreCase ("CHI")) { 							// 4
    int index1 = data.indexOf(' ');
    int index2 = data.indexOf(' ', index1 + 1);

    node1 = data.substring(index1 + 1, index2);
    value = data.substring(index2 + 1);

#if DebugSerial_Enable
    DebugSerial.println(request);
    DebugSerial.println(node1);
    DebugSerial.println(value);
#endif
    if (node1.toInt() == 0) {
      AtCommand("AT+CMGD=1,3");
      return false;
    }
    if (value.toInt() == 0) {
      AtCommand("AT+CMGD=1,3");
      return false;
    }
    glb_RequestSms.request = request;
    glb_RequestSms.node1 = node1;
    glb_RequestSms.value = value;
    return true;
  }
  
  if (request.equalsIgnoreCase ("DEL")) { 						//5
    glb_RequestSms.request = "DEL";
    return true;
  }
  //
  //*******define new rule here *****
  //		please check requestSms struct
  //

  return false;
}

String GetPhoneNumber() {
  int indexStart = glb_SimBuffer.indexOf("\"+");
  int indexEnd = glb_SimBuffer.indexOf("\"", indexStart + 2);

  String num = glb_SimBuffer.substring(indexStart + 4, indexEnd);
  return String(0) + num;
}

void SetTimeout(unsigned long timeout = INTERVAl_DEFAULT_TIMEOUT) {
  glb_IntervalTimeout = timeout;
  glb_PreviousTimeout = millis();
}

bool CheckTimeout() {
  glb_CurrentMillis = millis();
  if ((glb_CurrentMillis -  glb_PreviousTimeout) >= glb_IntervalTimeout)
  {
    return true;
  }
  return false;
}

void CheckAUX() {
  for (int i = 0; i < 2000; i ++) {
    while (digitalRead(AUX) == LOW) {
    }
  }
}

void ClearMessage() {
  glb_LoRaMessage.type = "";
  glb_LoRaMessage.nodeId = "";
  glb_LoRaMessage.data = "";
};

void SetLoraMode(loraMode mode) {
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
  pinMode(M1, OUTPUT);
  pinMode(M0, OUTPUT);
  pinMode(AUX, INPUT);

  // Initialize other pins if necessary.
}

bool LoRaDataPresense() {
  if (LoRaSerial.available() > 0) {
    ReceiveAnalysis();
    return true;
  }
  return false;
}

receiveType ReceiveAnalysis() {
  memset(glb_BufferLora, 0, sizeof(glb_BufferLora));
  int buffer_length = LoRaSerial.readBytesUntil(']', glb_BufferLora, BUFFER_LENGTH);
  if (buffer_length > 0) {
    String dataReceive = String(glb_BufferLora);

#if DebugSerial_Enable
    DebugSerial.println("-------------------------");
    DebugSerial.print("RECEIVED FROM CLIENT: ");
    DebugSerial.println(glb_BufferLora);
#endif

    int indexOfFirstSplitter = dataReceive.indexOf(";");
    String type = dataReceive.substring(dataReceive.lastIndexOf('[') + 1, indexOfFirstSplitter);

    if (type == ACKString) {
      glb_Data += (dataReceive + "]");
      return ACK;
    }

    if (type == DATAString) {
      glb_Data += (dataReceive + "]");
      return DATA;
    }

    return IGNORING;
  }
  return IGNORING;
}

receiveType ReceiveProcessing(String _openBracket = "") {
#if DebugSerial_Enable
  DebugSerial.println("-------------------------");
  DebugSerial.print("glb_Data: ");
  DebugSerial.println(glb_Data);
#endif
  ClearMessage();
  String dataReceive;
  int indexOfOpen, indexOfClose;
  if (_openBracket != "") {
    indexOfOpen = glb_Data.indexOf(_openBracket);
    indexOfClose = glb_Data.indexOf("]", indexOfOpen);
    dataReceive = glb_Data.substring(indexOfOpen, indexOfClose);
    glb_Data = glb_Data.substring(0, indexOfOpen) + glb_Data.substring(indexOfClose + 1);
  }
  else {
    indexOfOpen = glb_Data.indexOf("[");
    indexOfClose = glb_Data.indexOf("]", indexOfOpen);
    dataReceive = glb_Data.substring(indexOfOpen, indexOfClose);
    if (indexOfClose == -1) glb_Data = "";
    else glb_Data = glb_Data.substring(glb_Data.indexOf(']') + 1);
  }

  if (dataReceive.length() > 0) {
#if DebugSerial_Enable
    DebugSerial.print("READ FROM glb_Data: ");
    DebugSerial.println(dataReceive);
#endif

    int indexOfFirstSplitter = dataReceive.indexOf(";");
    int indexOfSecondSplitter = dataReceive.indexOf(";", indexOfFirstSplitter + 1);
    glb_LoRaMessage.type = dataReceive.substring(dataReceive.lastIndexOf('[') + 1, indexOfFirstSplitter);
    glb_LoRaMessage.nodeId = String (dataReceive.substring(indexOfFirstSplitter + 1, indexOfSecondSplitter));
    glb_LoRaMessage.data = String (dataReceive.substring(indexOfSecondSplitter + 1));

    if (glb_LoRaMessage.type == ACKString) {
      if (glb_LoRaMessage.data.equals("true")) {

#if DebugSerial_Enable
        DebugSerial.println("This is an ACK message!");
#endif
        return ACK;
      }
      else return IGNORING;
    }
    if (glb_LoRaMessage.type == DATAString) {
      SendBySimHttp(glb_LoRaMessage.nodeId, glb_LoRaMessage.data);
      CheckSendSms();

#if DebugSerial_Enable
      DebugSerial.print("IMPORT COMPLETE: node_id: ");
      DebugSerial.println(glb_LoRaMessage.nodeId + ", data: " + glb_LoRaMessage.data);
#endif

      return DATA;
    }
    else return IGNORING;
  }
  return IGNORING;
}

void SendRequestDataToClient(String nodeId) {
  CheckAUX();
  String dataSend = String("[DATA;" + nodeId + ";true]");
  LoRaSerial.println(dataSend);
  CheckAUX();
}

void SendRequestDataTask(String nodeId) {
  for (int i = 0; i < LORA_NUMBER_OF_TRIALS; i++) {
    SendRequestDataToClient(nodeId);

#if DebugSerial_Enable
    DebugSerial.println("SEND REQUEST TO NODE");
#endif

    SetTimeout(20000); // or SetTimeout() for default value.
    bool timeOut = false;
    while (glb_Data.indexOf("DATA;" + glb_RequestSms.node1) == -1 && !timeOut) {
      if (glb_Data.length() > 0) {
        ReceiveProcessing();
      }
      if (LoRaDataPresense()) {
        ReceiveAnalysis();
      }
      timeOut = CheckTimeout();
    }
    if (!timeOut) {
      ReceiveProcessing("[DATA;" + glb_RequestSms.node1);
#if DebugSerial_Enable
      DebugSerial.println("SEND SMS");
#endif
      SendSms(glb_RequestSms.numberPhone, String("PPT at node ") + String(glb_RequestSms.node1) + String(": ") + String(glb_LoRaMessage.data));
      return true;
    }
  }

  SendSms(glb_RequestSms.numberPhone, String("Can't get PPT at node ") + String(glb_RequestSms.node1));
  return false;
}

void SendChangeIDToClient (String oldNodeId, String newNodeId) {
  CheckAUX();
  String dataSend = String("[CHANGEID;" + oldNodeId + ";" + newNodeId + "]");
  LoRaSerial.println(dataSend);
  CheckAUX();
}

bool SendChangeIdTask (String oldNodeId, String newNodeId) {

  for (int i = 0; i < LORA_NUMBER_OF_TRIALS; i++) {

#if DebugSerial_Enable
    DebugSerial.println("SEND CHANGEID TO NODE");
#endif

    SendChangeIDToClient(oldNodeId, newNodeId);
    bool timeOut = false;
    SetTimeout(15000); // or SetTimeout() for default value.
    while (glb_Data.indexOf("[ACK;" + glb_RequestSms.node2) == -1 && !timeOut) {
      if (glb_Data.length() > 0) {
        ReceiveProcessing();
      }
      if (LoRaDataPresense()) {
        ReceiveAnalysis();
      }
      timeOut = CheckTimeout();
    }
    if (!timeOut) {
      ReceiveProcessing("[ACK;" + glb_RequestSms.node2);
#if DebugSerial_Enable
      DebugSerial.println("SEND SMS");
#endif
      SendSms(glb_RequestSms.numberPhone, String("Change Id node: ") +
              String(oldNodeId) + String(" to ") +
              String(newNodeId) + String(", Complete"));
      return true;
    }
#if DebugSerial_Enable
    DebugSerial.println("Time out");
#endif
  }
  // out of trials request
  ServerAllowChange(newNodeId, oldNodeId);
  SendSms(glb_RequestSms.numberPhone, String("Change Id node: ") +
          String(oldNodeId) + String(" to ") +
          String(newNodeId) + String(", Failed"));
  return false;
}

void SendChangeIntervalToClient (String nodeId, String interval) {
  CheckAUX();
  String dataSend = String("[CHANGEINTERVAL;" + nodeId + ";" + interval + "]");
  LoRaSerial.println(dataSend);
  CheckAUX();
}

bool SendChangeIntervalTask (String nodeId, String interval) {

  for (int i = 0; i < LORA_NUMBER_OF_TRIALS; i++) {

#if DebugSerial_Enable
    DebugSerial.println("SEND CHANGEINTERVAL TO NODE");
#endif

    SendChangeIntervalToClient(nodeId, interval);
    bool timeOut = false;
    SetTimeout(15000); // or SetTimeout() for default value.
    while (glb_Data.indexOf("[ACK;" + glb_RequestSms.node1 + ";" + glb_RequestSms.value) == -1 && !timeOut) {
      if (glb_Data.length() > 0) {
        ReceiveProcessing();
      }
      if (LoRaDataPresense()) {
        ReceiveAnalysis();
      }
      timeOut = CheckTimeout();
    }
    if (!timeOut) {
      ReceiveProcessing("[ACK;" + glb_RequestSms.node1);
#if DebugSerial_Enable
      DebugSerial.println("SEND SMS");
#endif
      SendSms(glb_RequestSms.numberPhone, String("Change interval node: ") +
              nodeId + " to " +
              interval + ", Completed");
      return true;
    }
#if DebugSerial_Enable
    DebugSerial.println("Time out");
#endif
  }
  // out of trials request
  SendSms(glb_RequestSms.numberPhone, String("Change interval node: ") +
          nodeId + " to " +
          interval + ", Failed");
  return false;
}

bool AtCommand(String _atCommand, bool _wantGetBuffer = false) {
  String tempBuffer = "";

  SimSerial.print(_atCommand + "\r\n");

  while (SimSerial.available() == 0) {
    if (LoRaDataPresense()) {
      ReceiveAnalysis();
    }
  }
  while (SimSerial.available() > 0) {
    tempBuffer += SimSerial.readString();
    if (LoRaDataPresense()) {
      ReceiveAnalysis();
    }
  }

  if (_wantGetBuffer == true) {
    glb_SimBuffer = tempBuffer;
  }

  if (tempBuffer.indexOf("CMTI") > -1) glb_NewMessage = true;

#if DebugSerial_Enable
  DebugSerial.println(tempBuffer);
#endif

  if (LoRaDataPresense()) {
    ReceiveAnalysis();
  }
  if (_atCommand.equalsIgnoreCase("AT+HTTPACTION=0")
      && (tempBuffer.indexOf("OK") > -1)) {

    if (tempBuffer.indexOf("+HTTPACTION: 0") == -1) {
      tempBuffer = "";
      while (SimSerial.available() == 0) {
        if (LoRaDataPresense()) {
          ReceiveAnalysis();
        }
      }
      while (SimSerial.available() > 0) {
        tempBuffer += SimSerial.readString();
      }
      if (tempBuffer.indexOf("CMTI") > -1) glb_NewMessage = true;
#if DebugSerial_Enable
      DebugSerial.println(tempBuffer);
#endif
      if ((tempBuffer.indexOf("HTTPACTION") > -1) && (tempBuffer.indexOf("0,200") > -1)) {
        return true;
      }
      return false;
    }

    if (tempBuffer.indexOf("0,200") > -1) return true;
    return false;
  }

  if (tempBuffer.indexOf("OK") > -1 && tempBuffer.indexOf(_atCommand) > -1) return true;
  return false;
}

void InitSim() {
  // please check APN in #define
  AtCommand(String("AT+SAPBR=3,1,\"APN\",\"") + APN + "\"");
  AtCommand("AT+SAPBR=1,1");
  // clear all message
  AtCommand("AT+CMGD=1,4");
}

void SendSms(String _number, String _mess) {
  AtCommand("AT");
  AtCommand("AT+CMGF=1");
  AtCommand("AT+CMGS=\"" + _number + "\"");
  AtCommand(_mess);
  SimSerial.write(26);     // end data message
  // while (SimSerial.available() == 0) {
    // if (LoRaDataPresense()) {
      // ReceiveAnalysis();
    // }
  // }
  // while (SimSerial.available() > 0) {
    // if (LoRaDataPresense()) {
      // ReceiveAnalysis();
    // }
  // }
}

void CheckSimAvailable() {
  while (AtCommand("AT+CPIN?", true) == false) {
#if DebugSerial_Enable
    DebugSerial.println(glb_SimBuffer);
    DebugSerial.println("SIM not available, please recheck!");
#endif
  }
}

void SendBySimHttp(String _node, String _data) {
  if (AtCommand("AT+HTTPINIT") == false) {
    AtCommand("AT+HTTPTERM");
    AtCommand("AT+HTTPINIT");
  }
  AtCommand("AT+HTTPPARA=\"CID\",1");
  AtCommand(String("AT+HTTPPARA=\"URL\",") + PATTERN_SEND_SERVER(_node, _data));
  if (AtCommand("AT+HTTPACTION=0") == false) {
    AtCommand("AT+HTTPACTION=0");
  }
  if (AtCommand("AT+HTTPREAD", true) == false) {
    AtCommand("AT+HTTPREAD", true);
  }
  AtCommand("AT+HTTPTERM");
}

void ChangeValueWarning(String value, String option) {
  if (AtCommand("AT+HTTPINIT") == false) {
    AtCommand("AT+HTTPTERM");
    AtCommand("AT+HTTPINIT");
  }

  AtCommand("AT+HTTPPARA=\"CID\",1");
  AtCommand(String("AT+HTTPPARA=\"URL\",") + PATTERN_CHANGE_WARNING(option, value));
  if (AtCommand("AT+HTTPACTION=0") == false) {
    AtCommand("AT+HTTPACTION=0");
  }
  for (int i = 0; i < HTTPREAD_TRIALS; i++) {
    if (AtCommand("AT+HTTPREAD", true) == true) break;
  }
  AtCommand("AT+HTTPTERM");

  if (glb_SimBuffer.indexOf("true") > -1) {
    SendSms(glb_RequestSms.numberPhone, String("Change warning value ") +
            String(" to ") 									+
            String(value)  									+
            String(" at ") 									+
            String(option) 									+
            String(", Completed!!"));
  }
  else {
    SendSms(glb_RequestSms.numberPhone, String("Change warning value ") +
            String(" to ") 									+
            String(value) 									+
            String(" at ") 									+
            String(option) 									+
            String(", Failed!!"));
  }
}

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
