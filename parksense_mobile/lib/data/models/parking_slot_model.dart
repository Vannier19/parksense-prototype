// lib/data/models/parking_slot_model.dart

import 'package:json_annotation/json_annotation.dart';

part 'parking_slot_model.g.dart';

/// Parking Slot Model - represents data from ESP32 MQTT messages
@JsonSerializable()
class ParkingSlotModel {
  @JsonKey(name: 'slot_id')
  final String slotId;

  final String zone;

  @JsonKey(name: 'status')
  final int status; // 0 = Available, 1 = Occupied, 2 = Reserved

  @JsonKey(name: 'distance_cm')
  final int? distanceCm;

  final String? source;

  final String? timestamp;

  @JsonKey(name: 'vehicle_type')
  final String? vehicleType; // 'car' or 'motorcycle'

  final double? latitude;
  final double? longitude;

  ParkingSlotModel({
    required this.slotId,
    required this.zone,
    required this.status,
    this.distanceCm,
    this.source,
    this.timestamp,
    this.vehicleType,
    this.latitude,
    this.longitude,
  });

  /// Factory constructor for creating a new instance from a map
  factory ParkingSlotModel.fromJson(Map<String, dynamic> json) =>
      _$ParkingSlotModelFromJson(json);

  /// Method to convert instance to a map
  Map<String, dynamic> toJson() => _$ParkingSlotModelToJson(this);

  /// Check if slot is available
  bool get isAvailable => status == 0;

  /// Check if slot is occupied
  bool get isOccupied => status == 1;

  /// Check if slot is reserved
  bool get isReserved => status == 2;

  /// Get human-readable status
  String get statusText {
    switch (status) {
      case 0:
        return 'Available';
      case 1:
        return 'Occupied';
      case 2:
        return 'Reserved';
      default:
        return 'Unknown';
    }
  }

  /// Copy with method for immutability
  ParkingSlotModel copyWith({
    String? slotId,
    String? zone,
    int? status,
    int? distanceCm,
    String? source,
    String? timestamp,
    String? vehicleType,
    double? latitude,
    double? longitude,
  }) {
    return ParkingSlotModel(
      slotId: slotId ?? this.slotId,
      zone: zone ?? this.zone,
      status: status ?? this.status,
      distanceCm: distanceCm ?? this.distanceCm,
      source: source ?? this.source,
      timestamp: timestamp ?? this.timestamp,
      vehicleType: vehicleType ?? this.vehicleType,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  @override
  String toString() {
    return 'ParkingSlot(id: $slotId, zone: $zone, status: $statusText, distance: ${distanceCm}cm)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ParkingSlotModel && other.slotId == slotId;
  }

  @override
  int get hashCode => slotId.hashCode;
}

/// Parking Recommendation Model - for AI-based slot recommendation
@JsonSerializable()
class ParkingRecommendation {
  final ParkingSlotModel slot;

  @JsonKey(name: 'distance_to_destination')
  final double distanceToDestination; // in meters

  @JsonKey(name: 'walking_time')
  final int walkingTime; // in minutes

  @JsonKey(name: 'confidence_score')
  final double confidenceScore; // 0.0 to 1.0

  final List<String> reasons;

  @JsonKey(name: 'traffic_level')
  final String trafficLevel; // 'low', 'medium', 'high'

  ParkingRecommendation({
    required this.slot,
    required this.distanceToDestination,
    required this.walkingTime,
    required this.confidenceScore,
    required this.reasons,
    this.trafficLevel = 'low',
  });

  factory ParkingRecommendation.fromJson(Map<String, dynamic> json) =>
      _$ParkingRecommendationFromJson(json);

  Map<String, dynamic> toJson() => _$ParkingRecommendationToJson(this);
}

/// Zone Statistics Model - for dashboard overview
@JsonSerializable()
class ZoneStatistics {
  final String zoneName;

  @JsonKey(name: 'total_slots')
  final int totalSlots;

  @JsonKey(name: 'available_slots')
  final int availableSlots;

  @JsonKey(name: 'occupied_slots')
  final int occupiedSlots;

  @JsonKey(name: 'occupancy_rate')
  final double occupancyRate; // percentage

  @JsonKey(name: 'last_updated')
  final String lastUpdated;

  ZoneStatistics({
    required this.zoneName,
    required this.totalSlots,
    required this.availableSlots,
    required this.occupiedSlots,
    required this.occupancyRate,
    required this.lastUpdated,
  });

  factory ZoneStatistics.fromJson(Map<String, dynamic> json) =>
      _$ZoneStatisticsFromJson(json);

  Map<String, dynamic> toJson() => _$ZoneStatisticsToJson(this);

  /// Calculate availability percentage
  double get availabilityPercentage =>
      totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0;
}