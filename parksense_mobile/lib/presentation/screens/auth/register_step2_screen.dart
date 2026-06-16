// lib/presentation/screens/auth/register_step2_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../main.dart';
import '../../providers/auth_provider.dart';

class RegisterStep2Screen extends StatefulWidget {
  final String email;
  final String name;
  final String password;

  const RegisterStep2Screen({super.key, required this.email, required this.name, required this.password});

  @override
  State<RegisterStep2Screen> createState() => _RegisterStep2ScreenState();
}

class _RegisterStep2ScreenState extends State<RegisterStep2Screen> {
  final _formKey = GlobalKey<FormState>();
  final _plateController = TextEditingController();
  String _selectedVehicle = 'Car'; // Default

  void _finishRegistration() async {
    if (_formKey.currentState!.validate()) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final success = await auth.register(
        widget.email,
        widget.name,
        widget.password,
        _selectedVehicle,
        _plateController.text,
      );

      if (!mounted) return;

      if (success) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainNavigator()),
              (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = Provider.of<AuthProvider>(context).isLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Vehicle info', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                const SizedBox(height: 8),
                const Text('Add your vehicle details to continue', style: TextStyle(fontSize: 16, color: Colors.grey)),
                const SizedBox(height: 24),

                // Progress Bar
                Row(
                  children: [
                    Expanded(child: Container(height: 4, decoration: BoxDecoration(color: const Color(0xFF3D677A), borderRadius: BorderRadius.circular(2)))),
                    const SizedBox(width: 8),
                    Expanded(child: Container(height: 4, decoration: BoxDecoration(color: const Color(0xFF3D677A), borderRadius: BorderRadius.circular(2)))),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('Step 2 of 2', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 32),

                // Vehicle Type Selection
                const Text('Vehicle Type', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildVehicleOption('Car', Icons.directions_car_outlined)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildVehicleOption('Motorcycle', Icons.motorcycle_outlined)),
                  ],
                ),
                const SizedBox(height: 24),

                // Plate Number
                const Text('Plate Number', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _plateController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'E.G., B 1234 XYZ',
                    filled: true,
                    fillColor: Colors.grey[50],
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Plate number cannot be empty';
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                const Text("Enter your vehicle's license plate number", style: TextStyle(color: Colors.grey, fontSize: 12)),

                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : _finishRegistration,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3D677A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: isLoading
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Save and Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVehicleOption(String title, IconData icon) {
    bool isSelected = _selectedVehicle == title;
    return GestureDetector(
      onTap: () => setState(() => _selectedVehicle = title),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.grey[50],
          border: Border.all(color: isSelected ? const Color(0xFF3D677A) : Colors.grey[200]!, width: isSelected ? 2 : 1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF3D677A) : Colors.grey[200],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: isSelected ? Colors.white : Colors.black87),
                ),
                const SizedBox(height: 12),
                Text(title, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal, color: const Color(0xFF0F172A))),
              ],
            ),
            if (isSelected)
              const Positioned(
                top: -12,
                right: 8,
                child: Icon(Icons.check_circle, color: Color(0xFF3D677A), size: 24),
              ),
          ],
        ),
      ),
    );
  }
}