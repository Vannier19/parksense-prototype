// lib/presentation/screens/profile/profile_screen.dart

import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../auth/welcome_screen.dart';

/// Profile Screen – User & Vehicle information
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  _buildVehicleCard(),
                  const SizedBox(height: 16),
                  _buildSettingsSection(),
                  const SizedBox(height: 24),
                  _buildLogoutButton(context),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 30),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF235563), Color(0xFF3D677A)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Top row with title & edit
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                'My Profile',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Icon(Icons.edit, color: Colors.white70, size: 20),
            ],
          ),
          const SizedBox(height: 20),

          // Avatar + info
          Row(
            children: [
              // Avatar circle
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white38, width: 2),
                  color: Colors.white24,
                ),
                child: const Icon(Icons.person_outline,
                    color: Colors.white, size: 36),
              ),
              const SizedBox(width: 16),

              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ahmad Rizki Pratama',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Student ID: 2021110045',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2E7D32),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.check, color: Colors.white, size: 12),
                        SizedBox(width: 4),
                        Text(
                          'Verified',
                          style: TextStyle(color: Colors.white, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard() {
    return _card(
      icon: Icons.directions_car_outlined,
      title: 'Vehicle Information',
      children: [
        _infoRow('Type', 'Car'),
        _divider(),
        _infoRow('License Plate', 'B 1234 XYZ'),
        _divider(),
        _infoRow('Registered', 'Mar 15, 2026'),
      ],
    );
  }

  Widget _buildPersonalInfoCard() {
    return _card(
      icon: Icons.badge_outlined,
      title: 'Personal Information',
      children: [
        _infoRow('Full Name', 'Stevan'),
        _divider(),
        _infoRow('ID Number', '2021110045'),
        _divider(),
        _infoRow('Email', 'test@itb.ac.id'),
        _divider(),
        _infoRow('Member Since', 'January 2021'),
      ],
    );
  }

  Widget _card({required IconData icon,
    required String title,
    required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: const Color(0xFF3D677A)),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1A2E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A2E),
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Divider(color: Colors.grey[100], height: 1);

  Widget _buildSettingsSection() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          _settingsTile(Icons.notifications_outlined, 'Notifications'),
          Divider(color: Colors.grey[100], height: 1),
          _settingsTile(Icons.shield_outlined, 'Privacy & Security'),
          Divider(color: Colors.grey[100], height: 1),
          _settingsTile(Icons.help_outline, 'Help & Support'),
        ],
      ),
    );
  }

  Widget _settingsTile(IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey[600], size: 22),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      ),
      trailing: Icon(Icons.chevron_right, color: Colors.grey[400], size: 20),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18),
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return TextButton.icon(
      onPressed: () async {
        final auth = Provider.of<AuthProvider>(context, listen: false);
        await auth.logout();

        if (!context.mounted) return;

        // Buang seluruh riwayat navigasi dan kembali ke WelcomeScreen
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const WelcomeScreen()),
              (route) => false,
        );
      },
      icon: const Icon(Icons.logout, color: Colors.redAccent, size: 20),
      label: const Text(
        'Log Out',
        style: TextStyle(
          color: Colors.redAccent,
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}