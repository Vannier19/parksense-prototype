// lib/presentation/providers/auth_provider.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider with ChangeNotifier {
  bool _isLoading = false;
  bool _isLoggedIn = false;
  String? _userName;

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String? get userName => _userName;

  // Cek cache saat aplikasi baru dibuka
  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _isLoggedIn = prefs.getBool('isLoggedIn') ?? false;
    _userName = prefs.getString('userName');
    notifyListeners();
  }

  // Logika Login
  Future<bool> login(String email, String password) async {
    _setLoading(true);

    // Simulasi delay API
    await Future.delayed(const Duration(seconds: 2));

    // Edge Case: Simulasi validasi (Bisa diganti dengan API sungguhan)
    if (password.length >= 6) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isLoggedIn', true);
      await prefs.setString('userName', email.split('@')[0]); // Ambil nama dari email
      _isLoggedIn = true;
      _userName = email.split('@')[0];
      _setLoading(false);
      return true;
    }

    _setLoading(false);
    return false; // Login gagal
  }

  // Logika Register
  Future<bool> register(String email, String name, String password, String vehicleType, String plateNumber) async {
    _setLoading(true);

    await Future.delayed(const Duration(seconds: 2));

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoggedIn', true);
    await prefs.setString('userName', name);
    // Simpan data kendaraan jika diperlukan...

    _isLoggedIn = true;
    _userName = name;
    _setLoading(false);
    return true;
  }

  // Logika Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear(); // Hapus semua cache
    _isLoggedIn = false;
    _userName = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}