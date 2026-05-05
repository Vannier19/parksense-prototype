// lib/data/models/mqtt_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart'; // Added for debugPrint
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';
import 'package:mqtt_client/mqtt_browser_client.dart'; // Web-specific client
import 'package:uuid/uuid.dart';
import '../../core/constants/mqtt_config.dart';

/// MQTT Service for real-time IoT communication via WebSocket
class MqttService {
  // Singleton pattern
  static final MqttService _instance = MqttService._internal();
  factory MqttService() => _instance;
  MqttService._internal();

  MqttServerClient? _client; // Changed to BrowserClient
  final StreamController<Map<String, dynamic>> _messageController =
  StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<MqttConnectionState> _connectionController =
  StreamController<MqttConnectionState>.broadcast();

  bool _isConnected = false;
  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;

  // Public streams
  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<MqttConnectionState> get connectionStream => _connectionController.stream;
  bool get isConnected => _isConnected;

  /// Initialize and connect to MQTT broker
  Future<bool> connect() async {
    try {
      final clientId = MqttConfig.clientPrefix + const Uuid().v4().substring(0, 8);

      // 3. Hapus 'ws://' dan gunakan IP/Host bawaan
      _client = MqttServerClient.withPort(
        MqttConfig.broker,
        clientId,
        MqttConfig.port,
      );

      // Configure client
      _client!.logging(on: true);
      _client!.keepAlivePeriod = MqttConfig.keepAlivePeriod;
      _client!.connectTimeoutPeriod = MqttConfig.connectionTimeout;
      _client!.onConnected = _onConnected;
      _client!.onDisconnected = _onDisconnected;
      _client!.onSubscribed = _onSubscribed;
      _client!.autoReconnect = true;
      _client!.resubscribeOnAutoReconnect = true;

      // Connection message
      final connMessage = MqttConnectMessage()
          .withClientIdentifier(clientId)
          .withWillTopic(MqttConfig.lwTopic)
          .withWillMessage(MqttConfig.lwMessage)
          .startClean()
          .withWillQos(MqttQos.atLeastOnce);

      if (MqttConfig.username != null && MqttConfig.password != null) {
        connMessage.authenticateAs(MqttConfig.username!, MqttConfig.password!);
      }
      _client!.connectionMessage = connMessage;

      // Attempt connection
      debugPrint('  Connecting to MQTT broker: ${MqttConfig.broker}:${MqttConfig.port}');
      await _client!.connect();

      if (_client!.connectionStatus!.state == MqttConnectionState.connected) {
        debugPrint('  MQTT Connected successfully');
        _isConnected = true;
        _reconnectAttempts = 0;
        _connectionController.add(MqttConnectionState.connected);

        // Subscribe to topics
        _subscribeToTopics();
        // Setup message listener
        _setupMessageListener();

        return true;
      } else {
        debugPrint('  MQTT Connection failed: ${_client!.connectionStatus}');
        _isConnected = false;
        _connectionController.add(MqttConnectionState.disconnected);
        return false;
      }
    } on NoConnectionException catch (e) {
      debugPrint('  MQTT NoConnectionException: $e');
      _handleReconnection();
      return false;
    } catch (e) {
      debugPrint('  MQTT Connection error: $e');
      _handleReconnection();
      return false;
    }
  }

  /// Subscribe to all required topics
  void _subscribeToTopics() {
    final topics = [
      MqttConfig.topicSlotStatus,
      MqttConfig.topicSlotUpdate,
      MqttConfig.topicGateAccess,
    ];

    for (var topic in topics) {
      _client!.subscribe(topic, MqttQos.atLeastOnce);
      debugPrint('  Subscribed to: $topic');
    }
  }

  /// Setup message listener
  void _setupMessageListener() {
    _client!.updates!.listen((List<MqttReceivedMessage<MqttMessage>> messages) {
      for (var message in messages) {
        final recMess = message.payload as MqttPublishMessage;
        final payload = MqttPublishPayload.bytesToStringAsString(recMess.payload.message);

        try {
          final data = json.decode(payload) as Map<String, dynamic>;
          data['topic'] = message.topic;
          data['timestamp'] = DateTime.now().toIso8601String();

          debugPrint('  MQTT Message received on ${message.topic}: $data');
          _messageController.add(data);
        } catch (e) {
          debugPrint('  Error parsing MQTT message: $e');
          debugPrint('Raw payload: $payload');
        }
      }
    });
  }

  /// Publish message to MQTT broker
  Future<void> publish(String topic, Map<String, dynamic> message, {int qos = 1}) async {
    if (_client == null || !_isConnected) {
      debugPrint('  Cannot publish: MQTT not connected');
      return;
    }

    try {
      final builder = MqttClientPayloadBuilder();
      builder.addString(json.encode(message));

      _client!.publishMessage(
        topic,
        MqttQos.values[qos],
        builder.payload!,
      );
      debugPrint('  Published to $topic: $message');
    } catch (e) {
      debugPrint('  Error publishing message: $e');
    }
  }

  /// Handle reconnection logic
  void _handleReconnection() {
    if (_reconnectAttempts >= MqttConfig.maxConnectionAttempts) {
      debugPrint('  Max reconnection attempts reached');
      return;
    }

    _reconnectAttempts++;
    final delay = MqttConfig.reconnectDelay * _reconnectAttempts;

    debugPrint('  Attempting reconnection in ${delay.inSeconds}s (Attempt $_reconnectAttempts)');
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(delay, () {
      connect();
    });
  }

  /// Connection callbacks
  void _onConnected() {
    debugPrint('  MQTT onConnected callback');
    _isConnected = true;
    _reconnectAttempts = 0;
    _connectionController.add(MqttConnectionState.connected);
  }

  void _onDisconnected() {
    debugPrint('  MQTT onDisconnected callback');
    _isConnected = false;
    _connectionController.add(MqttConnectionState.disconnected);
    _handleReconnection();
  }

  void _onSubscribed(String topic) {
    debugPrint('  Successfully subscribed to: $topic');
  }

  /// Disconnect from MQTT broker
  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    _client?.disconnect();
    _isConnected = false;
    _connectionController.add(MqttConnectionState.disconnected);
    debugPrint('  MQTT Disconnected');
  }

  /// Dispose resources
  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}