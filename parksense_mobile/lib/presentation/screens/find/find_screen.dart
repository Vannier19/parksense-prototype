// lib/presentation/screens/find/find_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../providers/parking_provider.dart';

class FindScreen extends StatelessWidget {
  final VoidCallback? onNavigateToMap;
  const FindScreen({Key? key, this.onNavigateToMap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background Peta Statis
          FlutterMap(
            options: MapOptions(
              initialCenter: const LatLng(-6.8915, 107.6107),
              initialZoom: 17.5,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.none), // Peta dikunci
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.parksense.app',
              ),
              // Overlay Gelap agar Pop-up terlihat jelas
              Container(color: Colors.black.withOpacity(0.4)),
            ],
          ),

          // Pop-up Card di bawah (Bottom Sheet)
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              height: MediaQuery.of(context).size.height * 0.65, // Mengambil 65% layar bawah
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Transform.translate(
                      offset: const Offset(0, -30),
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFF3D677A),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: const Color(0xFF3D677A).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
                      ),
                    ),
                    const Text('Optimal Parking Found', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1A2E))),
                    const SizedBox(height: 6),
                    Text('Based on your destination and current traffic', style: TextStyle(fontSize: 13, color: Colors.grey[500])),
                    const SizedBox(height: 20),

                    _buildParkingInfoCard(),

                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          // Logika kalkulasi rute diaktifkan
                          final targetLot = const LatLng(-6.8918, 107.6108); // Koordinat Lot C Labtek V
                          Provider.of<ParkingProvider>(context, listen: false).startNavigation(targetLot);

                          // Pindah kembali ke layar Maps
                          if (onNavigateToMap != null) onNavigateToMap!();
                        },
                        icon: const Icon(Icons.navigation, size: 20),
                        label: const Text('Navigate Here', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3D677A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton(
                        onPressed: () {
                          Provider.of<ParkingProvider>(context, listen: false).stopNavigation();
                          if (onNavigateToMap != null) onNavigateToMap!();
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF333333),
                          side: BorderSide(color: Colors.grey[300]!),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('View Other Options', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildParkingInfoCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Parking Lot C', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1A1A2E))),
                  SizedBox(height: 2),
                  Text('Labtek V, Engineering Faculty', style: TextStyle(fontSize: 13, color: Colors.grey)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: const Color(0xFFE8F5E9), borderRadius: BorderRadius.circular(8)),
                child: const Text('12 spots', style: TextStyle(color: Color(0xFF2E7D32), fontWeight: FontWeight.w600, fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _infoChip(Icons.location_on_outlined, 'Distance', '120 meters'),
              const SizedBox(width: 16),
              _infoChip(Icons.access_time, 'Walking Time', '2 min'),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Why this lot?', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF3D677A))),
          const SizedBox(height: 8),
          _reasonItem('Closest to your destination building'),
          const SizedBox(height: 6),
          _reasonItem('High availability (12/40 spots)'),
          const SizedBox(height: 6),
          _reasonItem('Low traffic congestion route'),
        ],
      ),
    );
  }

  Widget _infoChip(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey[500]),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
            Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          ],
        ),
      ],
    );
  }

  Widget _reasonItem(String text) {
    return Row(
      children: [
        Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF3D677A), shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF444444)))),
      ],
    );
  }
}