// lib/presentation/providers/parking_provider.dart

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../data/models/parking_slot_model.dart';
import '../../data/models/mqtt_service.dart';
import 'package:latlong2/latlong.dart';

/// Provider untuk mengelola state parking slots dengan real-time updates
class ParkingProvider with ChangeNotifier {
  final MqttService _mqttService = MqttService();

  // State
  Map<String, ParkingSlotModel> _parkingSlots = {};
  Map<String, ZoneStatistics> _zoneStats = {};
  bool _isLoading = false;
  bool _isMqttConnected = false;
  String? _errorMessage;
  StreamSubscription? _mqttSubscription;
  StreamSubscription? _connectionSubscription;

  // Getters
  Map<String, ParkingSlotModel> get parkingSlots => _parkingSlots;
  Map<String, ZoneStatistics> get zoneStats => _zoneStats;
  bool get isLoading => _isLoading;
  bool get isMqttConnected => _isMqttConnected;
  String? get errorMessage => _errorMessage;

  int get totalAvailableSlots =>
      _parkingSlots.values.where((slot) => slot.isAvailable).length;

  int get totalOccupiedSlots =>
      _parkingSlots.values.where((slot) => slot.isOccupied).length;

  int get totalSlots => _parkingSlots.length;

  ParkingProvider() {
    _initializeMqtt();
  }

  /// Initialize MQTT connection and listeners
  Future<void> _initializeMqtt() async {
    _setLoading(true);

    try {
      // Connect to MQTT broker
      final connected = await _mqttService.connect();

      if (connected) {
        // Listen to connection state changes
        _connectionSubscription = _mqttService.connectionStream.listen((state) {
          _isMqttConnected = state.toString().contains('connected');
          notifyListeners();
        });

        // Listen to incoming MQTT messages
        _mqttSubscription = _mqttService.messageStream.listen(
          _handleMqttMessage,
          onError: (error) {
            _setError('MQTT Error: $error');
          },
        );

        _setError(null);
      } else {
        _setError('Failed to connect to MQTT broker');
      }
    } catch (e) {
      _setError('MQTT Initialization error: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Handle incoming MQTT messages
  void _handleMqttMessage(Map<String, dynamic> message) {
    try {
      final topic = message['topic'] as String?;

      if (topic == null) return;

      // Handle slot status updates
      if (topic.contains('slot/status') || topic.contains('slot/update')) {
        _updateSlotFromMessage(message);
      }

    } catch (e) {
      print('⚠️ Error handling MQTT message: $e');
    }
  }

  /// Update slot from MQTT message
  void _updateSlotFromMessage(Map<String, dynamic> message) {
    try {
      final slot = ParkingSlotModel.fromJson(message);
      _parkingSlots[slot.slotId] = slot;

      // Update zone statistics
      _updateZoneStatistics(slot.zone);

      print('✅ Updated slot: ${slot.slotId} - ${slot.statusText}');
      notifyListeners();
    } catch (e) {
      print('⚠️ Error updating slot: $e');
    }
  }

  /// Update zone statistics based on current slots
  void _updateZoneStatistics(String zoneName) {
    final slotsInZone = _parkingSlots.values
        .where((slot) => slot.zone == zoneName)
        .toList();

    if (slotsInZone.isEmpty) return;

    final totalSlots = slotsInZone.length;
    final availableSlots = slotsInZone.where((s) => s.isAvailable).length;
    final occupiedSlots = slotsInZone.where((s) => s.isOccupied).length;
    final occupancyRate = totalSlots > 0.0 ? (occupiedSlots / totalSlots) * 100 : 0.0;

    _zoneStats[zoneName] = ZoneStatistics(
      zoneName: zoneName,
      totalSlots: totalSlots,
      availableSlots: availableSlots,
      occupiedSlots: occupiedSlots,
      occupancyRate: occupancyRate,
      lastUpdated: DateTime.now().toIso8601String(),
    );
  }

  /// Get slots by zone
  List<ParkingSlotModel> getSlotsByZone(String zone) {
    return _parkingSlots.values
        .where((slot) => slot.zone == zone)
        .toList();
  }

  /// Get available slots by zone
  List<ParkingSlotModel> getAvailableSlotsByZone(String zone) {
    return _parkingSlots.values
        .where((slot) => slot.zone == zone && slot.isAvailable)
        .toList();
  }

  /// Refresh parking data
  Future<void> refresh() async {
    _setLoading(true);

    // Reconnect MQTT if needed
    if (!_isMqttConnected) {
      await _initializeMqtt();
    }

    _setLoading(false);
  }

  /// Manual update slot (for testing)
  void updateSlot(ParkingSlotModel slot) {
    _parkingSlots[slot.slotId] = slot;
    _updateZoneStatistics(slot.zone);
    notifyListeners();
  }

  /// Add mock data for testing (remove in production)
  void addMockData() {
    final mockSlots = [
      ParkingSlotModel(
        slotId: 'A-01',
        zone: 'Labtek V',
        status: 0,
        distanceCm: 120,
        source: 'mock',
        latitude: -6.8915,
        longitude: 107.6107,
      ),
      ParkingSlotModel(
        slotId: 'A-02',
        zone: 'Labtek V',
        status: 1,
        distanceCm: 20,
        source: 'mock',
        latitude: -6.8916,
        longitude: 107.6108,
      ),
      ParkingSlotModel(
        slotId: 'B-01',
        zone: 'GKU Barat',
        status: 0,
        distanceCm: 115,
        source: 'mock',
        latitude: -6.8905,
        longitude: 107.6100,
      ),
    ];

    for (var slot in mockSlots) {
      _parkingSlots[slot.slotId] = slot;
      _updateZoneStatistics(slot.zone);
    }

    notifyListeners();
  }

  // Helper methods
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? error) {
    _errorMessage = error;
    notifyListeners();
  }
  bool _isNavigating = false;
  List<LatLng> _currentRoute = [];

  bool get isNavigating => _isNavigating;
  List<LatLng> get currentRoute => _currentRoute;

  void startNavigation(LatLng destination) {
    _isNavigating = true;
    _currentRoute = [
      const LatLng(-6.8931, 107.6105),
      const LatLng(-6.8925, 107.6105),
      const LatLng(-6.8925, 107.6108),
      destination,
    ];
    notifyListeners();
  }

  void stopNavigation() {
    _isNavigating = false;
    _currentRoute = [];
    notifyListeners();
  }
  // --------------------------------------------------------
  @override
  void dispose() {
    _mqttSubscription?.cancel();
    _connectionSubscription?.cancel();
    _mqttService.disconnect();
    super.dispose();
  }
}