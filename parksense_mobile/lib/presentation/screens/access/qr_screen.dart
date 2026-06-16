// lib/presentation/screens/access/qr_screen.dart

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/constants/app_colors.dart';

/// QR Access Screen – Gate entry via dynamic QR code
class QrScreen extends StatefulWidget {
  const QrScreen({Key? key}) : super(key: key);

  @override
  State<QrScreen> createState() => _QrScreenState();
}

class _QrScreenState extends State<QrScreen> {
  late String _qrData;
  int _secondsRemaining = 180; // 3 minutes
  Timer? _timer;

  // Mock user data
  final String _vehicleType = 'Car';
  final String _licensePlate = 'B 1234 XYZ';
  final String _accessPoint = 'Gate A';

  @override
  void initState() {
    super.initState();
    _generateQrData();
    _startTimer();
  }

  void _generateQrData() {
    final payload = {
      'userId': '2021110045',
      'plate': _licensePlate,
      'gate': _accessPoint,
      'exp': DateTime.now()
          .add(const Duration(minutes: 3))
          .millisecondsSinceEpoch,
    };
    _qrData = jsonEncode(payload);
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining <= 0) {
        timer.cancel();
        _showExpiredDialog();
      } else {
        setState(() => _secondsRemaining--);
      }
    });
  }

  void _regenerate() {
    setState(() {
      _secondsRemaining = 180;
      _generateQrData();
    });
    _startTimer();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'QR Code regenerated successfully',
          style: TextStyle(color: Colors.white), // <-- Tambahkan style ini
        ),
        backgroundColor: const Color(0xFF3D677A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showExpiredDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('QR Code Expired'),
        content:
        const Text('Your access code has expired. Generate a new one?'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _regenerate();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3D677A),
            ),
            child:
            const Text('Regenerate', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString()}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF3D677A),
      body: SafeArea(
        child: Column(
          children: [
            // App Bar
            _buildAppBar(),

            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    // QR Card
                    _buildQrCard(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Regenerate Button at bottom
            _buildRegenerateButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.maybePop(context),
            child: const Icon(Icons.chevron_left, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'Scan at Gate',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Present this QR code at the entrance gate',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQrCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // QR Code
          QrImageView(
            data: _qrData,
            version: QrVersions.auto,
            size: 200,
            gapless: true,
          ),
          const SizedBox(height: 20),

          // Timer
          Text(
            'Valid for',
            style: TextStyle(fontSize: 13, color: Colors.grey[500]),
          ),
          const SizedBox(height: 4),
          Text(
            _formatTime(_secondsRemaining),
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
              color: _secondsRemaining <= 30
                  ? AppColors.error
                  : const Color(0xFF3D677A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Token expires automatically',
            style: TextStyle(fontSize: 12, color: Colors.grey[400]),
          ),

          const SizedBox(height: 20),
          Divider(color: Colors.grey[200]),
          const SizedBox(height: 16),

          // Vehicle Info Rows
          _infoRow('Vehicle Type:', _vehicleType),
          const SizedBox(height: 12),
          _infoRow('License Plate:', _licensePlate),
          const SizedBox(height: 12),
          _infoRow('Access Point:', _accessPoint),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A2E),
          ),
        ),
      ],
    );
  }

  Widget _buildRegenerateButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton.icon(
          onPressed: _regenerate,
          icon: const Icon(Icons.refresh, size: 20),
          label: const Text(
            'Regenerate Code',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF264851),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 0,
          ),
        ),
      ),
    );
  }
}