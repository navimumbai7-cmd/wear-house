import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Printer,
  Barcode,
  Layers,
  MapPin,
  Download,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Sliders,
  FileText,
} from 'lucide-react';
import { InventoryItem } from '../types/warehouse';

interface BarcodeGeneratorStudioProps {
  inventory: InventoryItem[];
  onAddNewItem?: (item: InventoryItem) => void;
}

export const BarcodeGeneratorStudio: React.FC<BarcodeGeneratorStudioProps> = ({
  inventory,
  onAddNewItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(inventory[0]?.id || 'custom');
  const [barcodeText, setBarcodeText] = useState<string>(inventory[0]?.barcode || '8901234567890');
  const [barcodeFormat, setBarcodeFormat] = useState<string>('CODE128');
  const [labelType, setLabelType] = useState<'item_tag' | 'rack_label' | 'shipping_pallet'>('item_tag');
  const [lineColor, setLineColor] = useState<string>('#000000');
  const [barWidth, setBarWidth] = useState<number>(2);
  const [barHeight, setBarHeight] = useState<number>(55);
  const [displayValue, setDisplayValue] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Custom fields
  const [customTitle, setCustomTitle] = useState<string>('M35 Rapid Hardening Cement 50kg');
  const [customSku, setCustomSku] = useState<string>('SKU-IND-1001');
  const [customLocation, setCustomLocation] = useState<string>('WH-A01-L1');
  const [customBatch, setCustomBatch] = useState<string>('BAT-2026-M35-08');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // When selection changes from inventory
  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    if (id === 'custom') return;

    const item = inventory.find((i) => i.id === id);
    if (item) {
      setBarcodeText(item.barcode);
      setCustomTitle(item.name);
      setCustomSku(item.sku);
      setCustomLocation(item.locationCode);
      setCustomBatch(item.batchNumber);
    }
  };

  // Re-render barcode SVG whenever parameters change
  useEffect(() => {
    if (!svgRef.current || !barcodeText.trim()) return;

    try {
      JsBarcode(svgRef.current, barcodeText.trim(), {
        format: barcodeFormat,
        lineColor: lineColor,
        width: barWidth,
        height: barHeight,
        displayValue: displayValue,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
      });
    } catch (e) {
      // Fallback if invalid format for current text
      try {
        JsBarcode(svgRef.current, barcodeText.trim(), {
          format: 'CODE128',
          lineColor: lineColor,
          width: barWidth,
          height: barHeight,
          displayValue: displayValue,
          fontSize: 14,
          margin: 10,
          background: '#ffffff',
        });
      } catch {}
    }
  }, [barcodeText, barcodeFormat, lineColor, barWidth, barHeight, displayValue]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(barcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateRandomEAN = () => {
    const prefix = '890'; // GS1 India standard prefix
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    const code = `${prefix}${rand}`.substring(0, 13);
    setBarcodeText(code);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Studio Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Barcode className="w-6 h-6 text-amber-400" />
            Automated Barcode & Industrial Label Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Generate Code 128, EAN-13, and thermal label formats for rack locations, pallets, and SKU tags.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateRandomEAN}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            Generate New EAN-13
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            Print Thermal Labels
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Label Configuration Form */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Label Configuration
            </h3>
            <span className="text-xs text-slate-400">GS1 / ISO Compliant</span>
          </div>

          {/* Quick Select from existing Inventory */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Select Preset from Active Warehouse Inventory:
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="custom">-- Custom Customization --</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} - {item.name} ({item.barcode})
                </option>
              ))}
            </select>
          </div>

          {/* Label Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Label Application Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'item_tag', label: 'Item Tag', icon: FileText },
                { id: 'rack_label', label: 'Rack Bin (2x1")', icon: MapPin },
                { id: 'shipping_pallet', label: 'Pallet (4x6")', icon: Layers },
              ].map((fmt) => {
                const Icon = fmt.icon;
                const active = labelType === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setLabelType(fmt.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                      active
                        ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
                        : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barcode Encoding & Symbology */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Symbology</label>
              <select
                value={barcodeFormat}
                onChange={(e) => setBarcodeFormat(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="CODE128">Code 128 (Universal)</option>
                <option value="EAN13">EAN-13 (Retail Standard)</option>
                <option value="UPC">UPC-A (North America)</option>
                <option value="CODE39">Code 39 (Industrial)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Bar Height</label>
              <input
                type="range"
                min={30}
                max={90}
                value={barHeight}
                onChange={(e) => setBarHeight(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Barcode Payload Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-400">Barcode Data Payload</label>
              <button
                onClick={handleCopyCode}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <input
              type="text"
              value={barcodeText}
              onChange={(e) => setBarcodeText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-sm text-amber-300"
            />
          </div>

          {/* Custom Metadata Details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Item Title / Description</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">SKU</label>
                <input
                  type="text"
                  value={customSku}
                  onChange={(e) => setCustomSku(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Rack Bin</label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Batch #</label>
                <input
                  type="text"
                  value={customBatch}
                  onChange={(e) => setCustomBatch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Industrial Label Preview */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[440px]">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Print-Ready Thermal Preview ({labelType === 'item_tag' ? 'Inventory Tag' : labelType === 'rack_label' ? 'Rack Location 2"x1"' : 'SSCC Shipping 4"x6"'})
            </span>

            {/* Industrial White Thermal Label Frame */}
            <div
              id="printable-label"
              className={`bg-white text-slate-900 rounded-xl shadow-2xl border-2 border-slate-300 p-5 transition-all flex flex-col ${
                labelType === 'shipping_pallet'
                  ? 'w-full max-w-md aspect-[4/5] justify-between'
                  : labelType === 'rack_label'
                  ? 'w-full max-w-sm aspect-[3/1.8] justify-between'
                  : 'w-full max-w-md justify-between'
              }`}
            >
              {/* Header on label */}
              {labelType === 'shipping_pallet' && (
                <div className="border-b-2 border-black pb-2 mb-2 flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
                      BADLAPUR WAREHOUSE LOGISTICS HUB
                    </span>
                    <h3 className="font-black text-lg tracking-tight leading-tight">MASTER DISPATCH PALLET</h3>
                    <p className="text-[10px] text-slate-700 font-medium">Neral-Karjat Road | Zone: Main Hall</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">DOCK BAY</span>
                    <span className="text-2xl font-black">BAY 02</span>
                  </div>
                </div>
              )}

              {labelType === 'rack_label' && (
                <div className="border-b-2 border-black pb-1 mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    AISLE RACK IDENTIFIER
                  </span>
                  <span className="text-xs font-black bg-black text-white px-2 py-0.5 rounded">
                    ZONE: MAIN HALL
                  </span>
                </div>
              )}

              {labelType === 'item_tag' && (
                <div className="border-b border-slate-300 pb-2 mb-2 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      WAREHOUSE SKU TAG
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{customTitle}</h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    {customSku}
                  </span>
                </div>
              )}

              {/* Center Barcode SVG */}
              <div className="flex flex-col items-center justify-center my-auto py-2">
                <svg ref={svgRef} className="max-w-full" />
              </div>

              {/* Bottom details on label */}
              {labelType === 'rack_label' ? (
                <div className="text-center pt-2 border-t-2 border-black">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase">TARGET BIN LOCATION</span>
                  <span className="font-mono text-2xl font-black tracking-widest text-slate-950">
                    {customLocation}
                  </span>
                </div>
              ) : labelType === 'shipping_pallet' ? (
                <div className="border-t-2 border-black pt-2 grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">DESTINATION</span>
                    <span className="font-bold text-slate-900">Bhiwandi DC #4</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CARRIER</span>
                    <span className="font-bold text-slate-900">TCI Express</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">WEIGHT</span>
                    <span className="font-bold text-slate-900 font-mono">1,450 KG</span>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Location</span>
                    <span className="font-mono font-bold text-slate-800">{customLocation}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Batch Code</span>
                    <span className="font-mono font-bold text-slate-800">{customBatch}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick barcode sheet presets */}
            <div className="mt-6 flex flex-wrap gap-2 items-center justify-center text-xs text-slate-400">
              <span className="text-slate-500 text-xs">Aisle Locations:</span>
              {['WH-A01-L1', 'WH-A02-L2', 'WH-B03-L1', 'WH-C01-L3', 'WH-D02-L1'].map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setLabelType('rack_label');
                    setBarcodeText(loc);
                    setCustomLocation(loc);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px] border border-slate-700"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
