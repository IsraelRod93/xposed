// Smoke test básico de la app Xposed.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:xposed_app/main.dart';

void main() {
  testWidgets('La app arranca sin errores', (WidgetTester tester) async {
    await tester.pumpWidget(const XposedApp());
    expect(find.byType(XposedApp), findsOneWidget);
  });
}
