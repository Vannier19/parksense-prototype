// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'parking_slot_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ParkingSlotModel _$ParkingSlotModelFromJson(Map<String, dynamic> json) =>
    ParkingSlotModel(
      slotId: json['slot_id'] as String,
      zone: json['zone'] as String,
      status: (json['status'] as num).toInt(),
      distanceCm: (json['distance_cm'] as num?)?.toInt(),
      source: json['source'] as String?,
      timestamp: json['timestamp'] as String?,
      vehicleType: json['vehicle_type'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$ParkingSlotModelToJson(ParkingSlotModel instance) =>
    <String, dynamic>{
      'slot_id': instance.slotId,
      'zone': instance.zone,
      'status': instance.status,
      'distance_cm': instance.distanceCm,
      'source': instance.source,
      'timestamp': instance.timestamp,
      'vehicle_type': instance.vehicleType,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
    };

ParkingRecommendation _$ParkingRecommendationFromJson(
  Map<String, dynamic> json,
) => ParkingRecommendation(
  slot: ParkingSlotModel.fromJson(json['slot'] as Map<String, dynamic>),
  distanceToDestination: (json['distance_to_destination'] as num).toDouble(),
  walkingTime: (json['walking_time'] as num).toInt(),
  confidenceScore: (json['confidence_score'] as num).toDouble(),
  reasons: (json['reasons'] as List<dynamic>).map((e) => e as String).toList(),
  trafficLevel: json['traffic_level'] as String? ?? 'low',
);

Map<String, dynamic> _$ParkingRecommendationToJson(
  ParkingRecommendation instance,
) => <String, dynamic>{
  'slot': instance.slot,
  'distance_to_destination': instance.distanceToDestination,
  'walking_time': instance.walkingTime,
  'confidence_score': instance.confidenceScore,
  'reasons': instance.reasons,
  'traffic_level': instance.trafficLevel,
};

ZoneStatistics _$ZoneStatisticsFromJson(Map<String, dynamic> json) =>
    ZoneStatistics(
      zoneName: json['zoneName'] as String,
      totalSlots: (json['total_slots'] as num).toInt(),
      availableSlots: (json['available_slots'] as num).toInt(),
      occupiedSlots: (json['occupied_slots'] as num).toInt(),
      occupancyRate: (json['occupancy_rate'] as num).toDouble(),
      lastUpdated: json['last_updated'] as String,
    );

Map<String, dynamic> _$ZoneStatisticsToJson(ZoneStatistics instance) =>
    <String, dynamic>{
      'zoneName': instance.zoneName,
      'total_slots': instance.totalSlots,
      'available_slots': instance.availableSlots,
      'occupied_slots': instance.occupiedSlots,
      'occupancy_rate': instance.occupancyRate,
      'last_updated': instance.lastUpdated,
    };
