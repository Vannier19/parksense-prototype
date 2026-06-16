// lib/presentation/screens/home/home_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/constants/app_colors.dart';
import '../../providers/parking_provider.dart';
import '../../../data/models/parking_slot_model.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onNavigateToFind;

  // Use super.key to follow Dart best practices
  const HomeScreen({super.key, this.onNavigateToFind});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final MapController _mapController = MapController();
  static const LatLng _itbCenter = LatLng(-6.8915, 107.6107);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<ParkingProvider>(context, listen: false);
      if (provider.totalSlots == 0) {
        provider.addMockData();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ParkingProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            _buildMap(),
            _buildSearchBar(),
            if (!provider.isNavigating) _buildQuickFindButton(),
            if (provider.isNavigating) _buildNavigationOverlay(provider),
            _buildBottomLegend(),
          ],
        ),
      ),
    );
  }

  Widget _buildMap() {
    final provider = Provider.of<ParkingProvider>(context);

    return FlutterMap(
      mapController: _mapController,
      options: const MapOptions( // Added const
        initialCenter: _itbCenter,
        initialZoom: 17.5,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.parksense.app',
        ),
        PolylineLayer(
          polylines: [
            if (provider.isNavigating)
              Polyline(
                points: provider.currentRoute,
                color: const Color(0xFF3D677A),
                strokeWidth: 5.0,
              ),
          ],
        ),
        MarkerLayer(
          markers: [
            // Using spread operator (...) without .toList() to improve performance
            ...provider.parkingSlots.values.map((slot) => _buildRealMarker(slot)),

            // Current Location Marker
            if (provider.isNavigating)
              Marker(
                point: const LatLng(-6.8931, 107.6105), // Front Gate
                width: 20,
                height: 20,
                child: Container(
                  decoration: BoxDecoration(
                      color: Colors.blueAccent,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.blue.withValues(alpha: 0.5), // Changed from withOpacity
                            blurRadius: 10,
                            spreadRadius: 5
                        )
                      ]
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Marker _buildRealMarker(ParkingSlotModel slot) {
    // Status 1 artinya Occupied (Penuh)
    final bool isFull = slot.status == 1;
    final Color markerColor = isFull ? AppColors.error : AppColors.success;

    // Buat fungsi kecil untuk mencocokkan slot_id dengan lokasi GPS
    LatLng getCoordinatesForSlot(String id) {
      switch (id) {
        case 'A-01':
          return const LatLng(-6.8911, 107.6104); // Titik Lot A (Oktagon)
        case 'A-02':
          return const LatLng(-6.8918, 107.6108); // Titik Lot C (Labtek V)
        case 'B-01':
          return const LatLng(-6.8906, 107.6100); // Titik Lot B (GKU Barat)
        default:
        // Jika ID tidak dikenali, geser sedikit dari tengah agar tidak menumpuk
          return const LatLng(-6.8915, 107.6107);
      }
    }

    final position = getCoordinatesForSlot(slot.slotId);

    return Marker(
      point: position,
      width: 60,
      height: 70,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: markerColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: markerColor.withValues(alpha: 0.4),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              isFull ? '0' : '1',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
          Icon(Icons.arrow_drop_down, color: markerColor, size: 20),
        ],
      ),
    );
  }

  Widget _buildNavigationOverlay(ParkingProvider provider) {
    return Positioned(
      top: 80, // Just below search bar
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1), // Changed from withOpacity
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Heading to Lot C',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1A1A2E)),
                ),
                const SizedBox(height: 2),
                Text(
                  'ETA: 2 mins (120m)',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600], fontWeight: FontWeight.w500),
                ),
              ],
            ),
            ElevatedButton(
              onPressed: () {
                // Logic when arriving
                provider.stopNavigation();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Arrived at parking lot', style: TextStyle(color: Colors.white)),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: const Text('Arrive', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Positioned(
      top: 12,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.08), // Changed from withOpacity
                blurRadius: 10,
                offset: const Offset(0, 2)
            )
          ],
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: Colors.grey[400], size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Search parking lot or building...',
                style: TextStyle(color: Colors.grey[400], fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Quick Find button above the hotbar
  Widget _buildQuickFindButton() {
    return Positioned(
      bottom: 80, // Right above the legend/hotbar
      right: 24,
      child: ElevatedButton.icon(
        onPressed: widget.onNavigateToFind,
        icon: const Icon(Icons.auto_awesome, size: 18),
        label: const Text('Quick Find'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF3D677A),
          foregroundColor: Colors.white,
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      ),
    );
  }

  Widget _buildBottomLegend() {
    return Positioned(
      bottom: 12,
      left: 24,
      right: 24,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.08), // Changed from withOpacity
                blurRadius: 10,
                offset: const Offset(0, 2)
            )
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _legendDot(AppColors.success, 'Available'),
            const SizedBox(width: 20),
            _legendDot(AppColors.error, 'Full'),
            const SizedBox(width: 20),
            Icon(Icons.location_on_outlined, color: Colors.grey[500], size: 16),
            const SizedBox(width: 4),
            Text('4 Lots', style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }
}