// lib/core/constants/mqtt_config.dart

/// MQTT Configuration Constants for ParkSense IoT Integration
class MqttConfig {
  // Broker Configuration
  static const String broker = 'broker.hivemq.com';
  static const int port = 1883;
  static const int securePort = 8883; // TLS/SSL port
  static const bool useSecure = false; // Set true for production

  // Client Configuration
  static const String clientPrefix = 'parksense_mobile_';
  static const int keepAlivePeriod = 60; // seconds
  static const int connectionTimeout = 30; // seconds
  static const int maxConnectionAttempts = 3;

  // Topics
  static const String topicSlotStatus = 'parksense/itb/slot/status';
  static const String topicSlotUpdate = 'parksense/itb/slot/update';
  static const String topicGateAccess = 'parksense/itb/gate/access';
  static const String topicHeartbeat = 'parksense/itb/heartbeat';

  // Subscribe Topics (with wildcards)
  static const String topicAllSlots = 'parksense/itb/slot/#';
  static const String topicAllGates = 'parksense/itb/gate/#';

  // Quality of Service
  static const int qosAtMostOnce = 0;
  static const int qosAtLeastOnce = 1;
  static const int qosExactlyOnce = 2;
  static const int defaultQos = qosAtLeastOnce;

  // Reconnection Strategy
  static const Duration reconnectDelay = Duration(seconds: 5);
  static const Duration maxReconnectDelay = Duration(minutes: 2);

  // Message Retention
  static const int maxMessagesInQueue = 100;
  static const bool cleanSession = false; // Persist session

  // Authentication (if required by broker)
  static const String? username = null; // Add if needed
  static const String? password = null; // Add if needed

  // Last Will and Testament
  static const String lwTopic = 'parksense/itb/clients/status';
  static const String lwMessage = '{"status": "disconnected", "timestamp": ""}';
  static const int lwQos = qosAtLeastOnce;
  static const bool lwRetain = true;
}

/// Parking Zone Configuration
class ParkingZones {
  static const Map<String, ZoneInfo> zones = {
    'labtek-v': ZoneInfo(
      id: 'labtek-v',
      name: 'Labtek V',
      location: Location(latitude: -6.8915, longitude: 107.6107),
      totalSlots: 40,
    ),
    'labtek-viii': ZoneInfo(
      id: 'labtek-viii',
      name: 'Labtek VIII',
      location: Location(latitude: -6.8920, longitude: 107.6105),
      totalSlots: 35,
    ),
    'gku-barat': ZoneInfo(
      id: 'gku-barat',
      name: 'GKU Barat',
      location: Location(latitude: -6.8905, longitude: 107.6100),
      totalSlots: 50,
    ),
    'gku-timur': ZoneInfo(
      id: 'gku-timur',
      name: 'GKU Timur',
      location: Location(latitude: -6.8905, longitude: 107.6115),
      totalSlots: 50,
    ),
  };
}

/// Zone Information Model
class ZoneInfo {
  final String id;
  final String name;
  final Location location;
  final int totalSlots;

  const ZoneInfo({
    required this.id,
    required this.name,
    required this.location,
    required this.totalSlots,
  });
}

/// Location Model
class Location {
  final double latitude;
  final double longitude;

  const Location({
    required this.latitude,
    required this.longitude,
  });
}