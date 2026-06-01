import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

TextStyle fBody({double size = 14, Color? color, FontWeight weight = FontWeight.w400}) =>
    GoogleFonts.inter(fontSize: size, color: color, fontWeight: weight);

TextStyle fDisp({double size = 24, Color? color, FontWeight weight = FontWeight.w900}) =>
    GoogleFonts.inter(fontSize: size, color: color, fontWeight: FontWeight.w900, letterSpacing: -1);

TextStyle fMono({double size = 11, Color? color, FontWeight weight = FontWeight.w700}) =>
    GoogleFonts.jetBrainsMono(fontSize: size, color: color, fontWeight: weight, letterSpacing: 0.5);

TextStyle fSerif({double size = 16, Color? color, FontStyle style = FontStyle.italic}) =>
    GoogleFonts.playfairDisplay(fontSize: size, color: color, fontStyle: style);
