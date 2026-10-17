import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BarcodeScanResult } from '../types/warehouse';

let zxingReader: BrowserMultiFormatReader | null = null;

function getZxingReader(): BrowserMultiFormatReader {
  if (!zxingReader) {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.ITF,
    ]);
    zxingReader = new BrowserMultiFormatReader(hints);
  }
  return zxingReader;
}

/**
 * Detect barcode from HTMLVideoElement or HTMLCanvasElement
 */
export async function detectBarcodeFromMedia(
  source: HTMLVideoElement | HTMLCanvasElement
): Promise<BarcodeScanResult | null> {
  // 1. Try native Web BarcodeDetector API if available
  if ('BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: [
          'code_128',
          'ean_13',
          'ean_8',
          'qr_code',
          'upc_a',
          'upc_e',
          'code_39',
          'code_93',
          'data_matrix',
        ],
      });
      const barcodes = await barcodeDetector.detect(source);
      if (barcodes && barcodes.length > 0) {
        const found = barcodes[0];
        return {
          code: found.rawValue || found.rawValue.trim(),
          format: (found.format || 'code_128').toUpperCase(),
          timestamp: new Date().toISOString(),
          raw: found,
        };
      }
    } catch {
      // Fall through to ZXing
    }
  }

  // 2. Use ZXing BrowserMultiFormatReader as robust fallback
  try {
    const reader = getZxingReader();
    let result;
    if (source instanceof HTMLVideoElement) {
      result = await reader.decodeFromVideoElement(source);
    } else {
      // source is HTMLCanvasElement -> convert to dataURL and decode
      const dataUrl = source.toDataURL('image/png');
      result = await reader.decodeFromImageUrl(dataUrl);
    }

    if (result && result.getText()) {
      return {
        code: result.getText().trim(),
        format: BarcodeFormat[result.getBarcodeFormat()] || 'CODE_128',
        timestamp: new Date().toISOString(),
        raw: result,
      };
    }
  } catch {
    // No barcode found in current frame, normal during scanning
  }

  return null;
}

/**
 * Decode from image URL or Blob
 */
export async function decodeBarcodeFromImageUrl(imageUrl: string): Promise<BarcodeScanResult | null> {
  try {
    const reader = getZxingReader();
    const result = await reader.decodeFromImageUrl(imageUrl);
    if (result) {
      return {
        code: result.getText().trim(),
        format: BarcodeFormat[result.getBarcodeFormat()] || 'CODE_128',
        timestamp: new Date().toISOString(),
        raw: result,
      };
    }
  } catch {
    // If not found
  }
  return null;
}
