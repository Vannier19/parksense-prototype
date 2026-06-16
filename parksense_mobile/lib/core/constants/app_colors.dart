// lib/core/constants/app_colors.dart

import 'package:flutter/material.dart';

/// ParkSense App Color Palette - Premium Dark Modern Theme
class AppColors {
  // Primary Background Colors
  static const Color backgroundDark = Color(0xFF0F172A); // Slate 900
  static const Color backgroundMedium = Color(0xFF1E293B); // Slate 800
  static const Color backgroundLight = Color(0xFF334155); // Slate 700

  // Accent Colors
  static const Color primaryBlue = Color(0xFF38BDF8); // Sky 400
  static const Color primaryBlueDark = Color(0xFF0EA5E9); // Sky 500
  static const Color primaryBlueLight = Color(0xFF7DD3FC); // Sky 300

  // Status Colors
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color successLight = Color(0xFF34D399); // Emerald 400
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color warningLight = Color(0xFFFBBF24); // Amber 400
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color errorLight = Color(0xFFF87171); // Red 400

  // Parking Status Colors
  static const Color slotAvailable = Color(0xFF10B981); // Green
  static const Color slotOccupied = Color(0xFFEF4444); // Red
  static const Color slotReserved = Color(0xFFF59E0B); // Amber
  static const Color slotDisabled = Color(0xFF6B7280); // Gray 500

  // Text Colors
  static const Color textPrimary = Color(0xFFF8FAFC); // Slate 50
  static const Color textSecondary = Color(0xFFCBD5E1); // Slate 300
  static const Color textMuted = Color(0xFF94A3B8); // Slate 400
  static const Color textDisabled = Color(0xFF64748B); // Slate 500

  // Card & Surface Colors
  static const Color cardBackground = Color(0xFF1E293B); // Slate 800
  static const Color cardElevated = Color(0xFF334155); // Slate 700
  static const Color divider = Color(0xFF475569); // Slate 600

  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryBlue, primaryBlueDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [backgroundDark, backgroundMedium],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient successGradient = LinearGradient(
    colors: [success, successLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Overlay Colors
  static const Color overlay = Color(0x80000000); // 50% black
  static const Color shimmerBase = Color(0xFF1E293B);
  static const Color shimmerHighlight = Color(0xFF334155);

  // Border Colors
  static const Color borderPrimary = Color(0xFF475569); // Slate 600
  static const Color borderSecondary = Color(0xFF334155); // Slate 700
  static const Color borderFocus = primaryBlue;

  // Navigation Bar Colors
  static const Color navBarBackground = Color(0xFF1E293B);
  static const Color navBarActive = primaryBlue;
  static const Color navBarInactive = Color(0xFF94A3B8);

  // QR Code Colors
  static const Color qrForeground = Color(0xFF000000);
  static const Color qrBackground = Color(0xFFFFFFFF);

  // Map Colors
  static const Color mapBackground = Color(0xFF0F172A);
  static const Color mapBorder = Color(0xFF475569);
  static const Color mapBuildingFill = Color(0xFF334155);

  // AI Recommendation Card Colors
  static const Color aiCardBackground = Color(0xFF1E293B);
  static const Color aiCardBorder = primaryBlue;
  static const Color aiCardHighlight = Color(0x1A38BDF8); // 10% opacity

  // Opacity Variants
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  // Helper method to get status color
  static Color getSlotStatusColor(int status) {
    switch (status) {
      case 0:
        return slotAvailable; // Available
      case 1:
        return slotOccupied; // Occupied
      case 2:
        return slotReserved; // Reserved
      default:
        return slotDisabled; // Unknown/Disabled
    }
  }

  // Helper method to get status text
  static String getSlotStatusText(int status) {
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
}