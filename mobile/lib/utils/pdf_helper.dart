import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../theme/app_theme.dart';

class PdfHelper {
  static String formatAmount(dynamic amount) {
    if (amount == null) return '0.00';
    final num = double.tryParse(amount.toString()) ?? 0.0;
    return num.toStringAsFixed(2).replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]},',
        );
  }

  /// Constructs the branded PDF Document for the transaction
  static Future<pw.Document> buildReceiptPdf(Map<String, dynamic> tx) async {
    final metadata = tx['metadata'] as Map<String, dynamic>? ?? {};
    final rawStatus = tx['status']?.toString().toLowerCase();
    String status = 'Successful';
    if (rawStatus == 'failed' || rawStatus == 'cancelled' || rawStatus == 'declined') {
      status = 'Failed';
    } else if (rawStatus == 'pending' || rawStatus == 'processing') {
      status = 'Pending';
    }

    final desc = tx['description'] ?? tx['planName'] ?? tx['service'] ?? 'Data Purchase';
    final ref = tx['reference'] ?? tx['transactionReference'] ?? 'TX_${DateTime.now().millisecondsSinceEpoch}';
    final isCredit = tx['type'] == 'credit';
    final amount = double.tryParse(tx['amount']?.toString() ?? '0') ?? 0.0;
    final dateStr = tx['createdAt'] != null
        ? tx['createdAt'].toString().replaceAll('T', ' ').substring(0, 19)
        : DateTime.now().toString().substring(0, 19);

    // Extract specific metadata
    final phone = metadata['phoneNumber'] ?? metadata['phone'] ?? tx['phoneNumber'] ?? '';
    final network = (metadata['network'] ?? tx['network'] ?? '').toString().toUpperCase();
    final planName = metadata['planName'] ?? metadata['bundleName'] ?? tx['planName'] ?? desc;
    final token = metadata['tokenKey'] ?? metadata['token'] ?? metadata['token_key'] ?? '';
    final meter = metadata['meterNumber'] ?? metadata['meter_number'] ?? '';
    final customerName = metadata['customerName'] ?? metadata['customer_name'] ?? '';
    final units = metadata['unitsPurchased'] ?? metadata['units'] ?? '';
    final smartCard = metadata['smartCardNumber'] ?? metadata['cardNumber'] ?? '';
    final bouquet = metadata['bouquet'] ?? metadata['packageName'] ?? '';
    final examPin = metadata['pin'] ?? metadata['serial'] ?? '';

    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: const PdfPageFormat(80 * PdfPageFormat.mm, 155 * PdfPageFormat.mm, marginAll: 5 * PdfPageFormat.mm),
        build: (pw.Context ctx) {
          return pw.Container(
            decoration: pw.BoxDecoration(
              color: PdfColors.white,
              border: pw.Border.all(color: PdfColors.grey400, width: 1),
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
            ),
            padding: const pw.EdgeInsets.all(10),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Center(
                  child: pw.Text(
                    'AB DATA HUB',
                    style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800),
                  ),
                ),
                pw.Center(
                  child: pw.Text(
                    'TRANSACTION RECEIPT',
                    style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
                  ),
                ),
                pw.SizedBox(height: 6),
                pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
                pw.SizedBox(height: 6),

                if (phone.toString().isNotEmpty) _pdfRow('Phone Number', phone.toString()),
                if (network.isNotEmpty) _pdfRow('Network', network),
                _pdfRow('Service / Plan', planName.toString()),
                _pdfRow('Amount', '${isCredit ? "+" : ""}₦${formatAmount(amount)}'),
                _pdfRow('Reference', ref.toString()),
                _pdfRow('Date & Time', dateStr),
                _pdfRow('Status', status),

                if (token.isNotEmpty) _pdfRow('Token', token.toString()),
                if (meter.isNotEmpty) _pdfRow('Meter Number', meter.toString()),
                if (customerName.isNotEmpty) _pdfRow('Customer', customerName.toString()),
                if (units.isNotEmpty) _pdfRow('Units', '$units units'),
                if (smartCard.isNotEmpty) _pdfRow('Decoder Number', smartCard.toString()),
                if (bouquet.isNotEmpty) _pdfRow('Package', bouquet.toString()),
                if (examPin.isNotEmpty) _pdfRow('Exam PIN', examPin.toString()),

                pw.SizedBox(height: 8),
                pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
                pw.SizedBox(height: 6),
                pw.Center(
                  child: pw.Text(
                    'Thank you for choosing AB Data Hub!',
                    style: pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600, fontStyle: pw.FontStyle.italic),
                  ),
                ),
                pw.Center(
                  child: pw.Text(
                    'Support: 08133887526 | WhatsApp: 07045357195',
                    style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey600),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    return pdf;
  }

  /// Share receipt as PDF file
  static Future<void> shareTransactionReceipt(
    BuildContext context,
    Map<String, dynamic> tx,
  ) async {
    try {
      final ref = tx['reference'] ?? tx['transactionReference'] ?? 'TX_${DateTime.now().millisecondsSinceEpoch}';
      final pdf = await buildReceiptPdf(tx);
      final pdfBytes = await pdf.save();

      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: 'AB_Data_Hub_Receipt_$ref.pdf',
      );
    } catch (e) {
      debugPrint('Error generating/sharing PDF: $e');
      final desc = tx['description'] ?? tx['planName'] ?? 'Transaction';
      final ref = tx['reference'] ?? tx['transactionReference'] ?? 'REF';
      final amount = tx['amount'] ?? 0;
      final receiptText =
          'AB Data Hub Receipt\n-------------------\nService: $desc\nAmount: NGN ${formatAmount(amount)}\nReference: $ref\nStatus: ${tx['status'] ?? 'Successful'}';
      await Clipboard.setData(ClipboardData(text: receiptText));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Receipt details copied to clipboard!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    }
  }

  /// Share receipt as high-resolution PNG Image (ideal for WhatsApp & social sharing)
  static Future<void> shareTransactionReceiptAsImage(
    BuildContext context,
    Map<String, dynamic> tx,
  ) async {
    try {
      final ref = tx['reference'] ?? tx['transactionReference'] ?? 'TX_${DateTime.now().millisecondsSinceEpoch}';
      final pdf = await buildReceiptPdf(tx);
      final pdfBytes = await pdf.save();

      // Rasterize the first page of the PDF into a crisp 250 DPI PNG
      await for (final page in Printing.raster(pdfBytes, pages: [0], dpi: 250)) {
        final imageBytes = await page.toPng();
        final tempDir = await getTemporaryDirectory();
        final filePath = '${tempDir.path}/AB_Data_Hub_Receipt_$ref.png';
        final file = File(filePath);
        await file.writeAsBytes(imageBytes);

        await Share.shareXFiles(
          [XFile(file.path, mimeType: 'image/png')],
          text: 'AB Data Hub Transaction Receipt - $ref',
        );
        return;
      }
    } catch (e) {
      debugPrint('Error generating/sharing Image receipt: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not generate receipt image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  static pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2.5),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
          pw.Flexible(
            child: pw.Text(
              value,
              textAlign: pw.TextAlign.right,
              style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
