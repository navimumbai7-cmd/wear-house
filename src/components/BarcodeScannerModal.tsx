import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Layers,
  ArrowRight,
  Package,
  MapPin,
  Truck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { detectBarcodeFromMedia, decodeBarcodeFromImageUrl } from '../utils/barcodeDetector';
import { soundEffects } from '../utils/audioFeedback';
import { InventoryItem, StockMovement, DockBay } from '../types/warehouse';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  docks: DockBay[];
  onItemUpdated: (item: InventoryItem) => void;
  onMovementLogged: (movement: StockMovement) => void;
  defaultMode?: 'lookup' | 'inward' | 'putaway' | 'pick' | 'audit';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  inventory,
  docks,
  onItemUpdated,
  onMovementLogged,
  defaultMode = 'lookup',
}) => {
  const [scanMode, setScanMode] = useState<'lookup' | 'inward' | 'putaway' | 'pick' | 'audit'>(defaultMode);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Putaway 2-step workflow state
  const [putawayStage, setPutawayStage] = useState<'scan_item' | 'scan_location'>('scan_item');
  const [putawayItem, setPutawayItem] = useState<InventoryItem | null>(null);

  // Inward / Pick quantity inputs
  const [operationQty, setOperationQty] = useState<number>(10);
  const [selectedDockBay, setSelectedDockBay] = useState<string>(docks[0]?.id || 'dock-1');

  // Video element refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);

  // Sync mode when prop changes
  useEffect(() => {
    setScanMode(defaultMode);
  }, [defaultMode]);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen || !cameraActive) {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function initCamera() {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          startScanningLoop();
        }
      } catch (err: any) {
        console.warn('Camera failed to start:', err);
        setCameraError(err.message || 'Unable to access camera. You can use Simulated Barcodes or Manual Wedge.');
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, cameraActive, facingMode]);

  function stopCamera() {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  // Scanning loop for camera video frames
  function startScanningLoop() {
    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const now = Date.now();
      // Throttle scanning to once every 200ms to maintain 60fps UI
      if (now - lastScanTimeRef.current > 200 && !isProcessingRef.current) {
        isProcessingRef.current = true;
        lastScanTimeRef.current = now;

        try {
          const result = await detectBarcodeFromMedia(videoRef.current);
          if (result && result.code) {
            handleDecodedCode(result.code);
          }
        } catch {
          // ignore detection pass error
        } finally {
          isProcessingRef.current = false;
        }
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  }

  // Handle hardware USB keyboard scanner (wedge mode)
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const currentTime = Date.now();
      // Hardware scanners typically dump characters with < 50ms intervals
      if (currentTime - lastKeyTime > 150) {
        keyBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (keyBuffer.length >= 3) {
          handleDecodedCode(keyBuffer.trim());
          keyBuffer = '';
        }
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inventory, scanMode, putawayStage, putawayItem]);

  // Main code processing pipeline
  const handleDecodedCode = (scannedRaw: string) => {
    const code = scannedRaw.trim();
    if (!code) return;

    // Throttle duplicate rapid identical hits within 1 second
    if (lastScannedCode === code && Date.now() - lastScanTimeRef.current < 1200) {
      return;
    }

    setLastScannedCode(code);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    // Check if code matches a Location Rack barcode (e.g. WH-A01-L1 or LOC-*)
    const isLocationCode = code.startsWith('WH-') || code.startsWith('ST-') || code.startsWith('DP-') || code.startsWith('LOC-');

    if (scanMode === 'putaway') {
      if (putawayStage === 'scan_item') {
        const item = inventory.find((i) => i.barcode === code || i.sku === code);
        if (item) {
          soundEffects.playScanSuccess();
          setPutawayItem(item);
          setPutawayStage('scan_location');
          setActionSuccessMsg(`Item verified: ${item.name}. Now scan target Rack Location barcode!`);
        } else {
          soundEffects.playScanError();
          setActionErrorMsg(`Item barcode "${code}" not found in master catalog.`);
        }
      } else if (putawayStage === 'scan_location') {
        if (putawayItem) {
          const targetLoc = code;
          const updated: InventoryItem = {
            ...putawayItem,
            locationCode: targetLoc,
            lastScannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
          onItemUpdated(updated);
          onMovementLogged({
            id: `mov-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sku: putawayItem.sku,
            itemName: putawayItem.name,
            barcode: putawayItem.barcode,
            type: 'PUTAWAY',
            quantity: putawayItem.quantity,
            fromLocation: putawayItem.locationCode,
            toLocation: targetLoc,
            operator: 'Operator #41 (Mobile Scanner)',
            notes: `Verified putaway to rack ${targetLoc}`,
          });

          soundEffects.playPutawayMatch();
          setActionSuccessMsg(`Success! Putaway completed: Moved ${putawayItem.sku} to Rack ${targetLoc}`);
          setPutawayStage('scan_item');
          setPutawayItem(null);
        }
      }
      return;
    }

    // Default item lookup
    const item = inventory.find((i) => i.barcode === code || i.sku === code);

    if (item) {
      soundEffects.playScanSuccess();
      setMatchedItem(item);

      if (scanMode === 'inward') {
        // Dock Inward workflow
        const inwardQty = operationQty > 0 ? operationQty : 10;
        const dock = docks.find((d) => d.id === selectedDockBay) || docks[0];
        const updated: InventoryItem = {
          ...item,
          quantity: item.quantity + inwardQty,
          status: item.quantity + inwardQty <= item.minThreshold ? 'low_stock' : 'in_stock',
          lastScannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        onItemUpdated(updated);
        onMovementLogged({
          id: `mov-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          sku: item.sku,
          itemName: item.name,
          barcode: item.barcode,
          type: 'INWARD',
          quantity: inwardQty,
          fromLocation: `${dock?.name || 'Truck Bay'} (Receipt)`,
          toLocation: item.locationCode,
          operator: 'Dock Receiver (Automated Scanner)',
          notes: `Inward receipt of +${inwardQty} ${item.unit}. New Stock: ${updated.quantity}`,
        });
        setActionSuccessMsg(`Inward Complete: Added +${inwardQty} ${item.unit} to ${item.name} at Bay ${dock?.bayNumber || 1}.`);
      } else if (scanMode === 'pick') {
        // Pick and dispatch workflow
        const pickQty = operationQty > 0 ? Math.min(operationQty, item.quantity) : 1;
        if (item.quantity < pickQty) {
          soundEffects.playScanError();
          setActionErrorMsg(`Insufficient stock! Requested: ${pickQty}, Available: ${item.quantity}`);
          return;
        }
        const updated: InventoryItem = {
          ...item,
          quantity: item.quantity - pickQty,
          status: item.quantity - pickQty === 0 ? 'out_of_stock' : item.quantity - pickQty <= item.minThreshold ? 'low_stock' : 'in_stock',
          lastScannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        onItemUpdated(updated);
        onMovementLogged({
          id: `mov-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          sku: item.sku,
          itemName: item.name,
          barcode: item.barcode,
          type: 'PICK',
          quantity: pickQty,
          fromLocation: item.locationCode,
          toLocation: 'Dispatch Staging (Bay 2)',
          operator: 'Picker #12 (Voice & Barcode)',
          notes: `Picked -${pickQty} ${item.unit} for outgoing shipment. Remaining: ${updated.quantity}`,
        });
        setActionSuccessMsg(`Pick Confirmed: -${pickQty} ${item.unit} removed from ${item.locationCode}.`);
      } else if (scanMode === 'audit') {
        // Audit count workflow
        setActionSuccessMsg(`Audit verified: SKU ${item.sku} confirmed in ${item.locationCode}. Current system count: ${item.quantity} ${item.unit}.`);
      } else {
        setActionSuccessMsg(`Item Found: ${item.name} (${item.sku}) in ${item.locationCode}`);
      }
    } else {
      if (isLocationCode) {
        soundEffects.playScanSuccess();
        setActionSuccessMsg(`Location Barcode detected: ${code}. Select Putaway mode to transfer items to this bin.`);
      } else {
        soundEffects.playScanError();
        setActionErrorMsg(`No inventory item found matching barcode: "${code}"`);
      }
      setMatchedItem(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      const res = await decodeBarcodeFromImageUrl(url);
      if (res && res.code) {
        handleDecodedCode(res.code);
      } else {
        soundEffects.playScanError();
        setActionErrorMsg('Could not detect a clear barcode in the uploaded image.');
      }
    } catch {
      soundEffects.playScanError();
      setActionErrorMsg('Error processing image file.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Automated Barcode Scanner
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Detection
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1D/2D Barcode (Code128, EAN-13, QR) via Camera, Wedge, or Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                soundEffects.setSoundEnabled(next);
              }}
              title={soundOn ? 'Mute Scan Sound' : 'Enable Scan Sound'}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {soundOn ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow Mode Tabs */}
        <div className="px-6 py-2.5 bg-slate-800/40 border-b border-slate-700/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Mode:</span>
          {(
            [
              { id: 'lookup', label: 'Item Lookup', icon: Barcode },
              { id: 'inward', label: 'Dock Inward (+Stock)', icon: Truck },
              { id: 'putaway', label: 'Smart Putaway (2-Step)', icon: MapPin },
              { id: 'pick', label: 'Pick & Dispatch (-Stock)', icon: Package },
              { id: 'audit', label: 'Cycle Audit', icon: Layers },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            const active = scanMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setScanMode(m.id);
                  setPutawayStage('scan_item');
                  setPutawayItem(null);
                  setActionSuccessMsg(null);
                  setActionErrorMsg(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera Viewfinder & Controls */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-video sm:aspect-[4/3] bg-black rounded-xl border-2 border-slate-700 overflow-hidden flex items-center justify-center group">
              {cameraActive && !cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />

                  {/* High-tech Industrial Aiming Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-44 sm:w-72 sm:h-48 border-2 border-amber-400/70 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                      {/* Corner Target Markers */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

                      {/* Moving Red/Amber Laser Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse absolute top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                      title="Flip Camera"
                      className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-slate-400 max-w-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">Camera Stream Standby</p>
                  <p className="text-xs text-slate-400 mb-4">
                    {cameraError || 'Camera preview is off. You can re-enable it or use Simulated/Hardware scans below.'}
                  </p>
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      setCameraError(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    Enable Camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual Hardware Wedge & File Upload */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Scan or type barcode (e.g. 8901234567890)..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode.trim()) {
                      handleDecodedCode(manualCode.trim());
                      setManualCode('');
                    }
                  }}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    if (manualCode.trim()) {
                      handleDecodedCode(manualCode.trim());
                      setManualCode('');
                    }
                  }}
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded transition-colors"
                >
                  Enter
                </button>
              </div>

              <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload Image
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Quick Test Simulated Barcodes (Crucial for instant desktop testing) */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instant Simulator Barcodes (Click to Test)
                </div>
                <span className="text-[10px] text-slate-400">Triggers real scan sound & logic</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inventory.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDecodedCode(item.barcode)}
                    className="text-left p-2 rounded-lg bg-slate-900/80 border border-slate-700/80 hover:border-amber-400/80 hover:bg-slate-800/80 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                      {item.name}
                    </div>
                    <div className="font-mono text-[11px] text-amber-400/90 truncate flex items-center gap-1">
                      <Barcode className="w-3 h-3 shrink-0" />
                      {item.barcode}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Actions & Match Details */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Feedback Alert Banners */}
            {actionSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{actionSuccessMsg}</div>
              </div>
            )}
            {actionErrorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{actionErrorMsg}</div>
              </div>
            )}

            {/* Mode-specific configuration card */}
            {scanMode === 'inward' && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Dock Inward Receipt Parameters
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Receiving Truck Bay</label>
                    <select
                      value={selectedDockBay}
                      onChange={(e) => setSelectedDockBay(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    >
                      {docks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Inward Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={operationQty}
                      onChange={(e) => setOperationQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scanning any SKU barcode will automatically increment physical inventory and log an INWARD manifest movement.
                </p>
              </div>
            )}

            {scanMode === 'pick' && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Picking & Outward Parameters
                </h3>
                <div className="text-xs mb-2">
                  <label className="text-slate-400 block mb-1">Quantity per Scan</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={operationQty}
                    onChange={(e) => setOperationQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Deducts scanned items from warehouse rack stock and stages for Dispatch at Truck Bay 2.
                </p>
              </div>
            )}

            {scanMode === 'putaway' && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Two-Step Guided Putaway
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex-1 p-2 rounded-lg text-center text-xs font-semibold ${
                      putawayStage === 'scan_item'
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-slate-700/80 text-emerald-300'
                    }`}
                  >
                    1. Scan Item Barcode
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div
                    className={`flex-1 p-2 rounded-lg text-center text-xs font-semibold ${
                      putawayStage === 'scan_location'
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    2. Scan Rack Location
                  </div>
                </div>

                {putawayItem && (
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700 text-xs mb-3">
                    <div className="font-semibold text-white">{putawayItem.name}</div>
                    <div className="text-slate-400 text-[11px]">Current Location: {putawayItem.locationCode}</div>
                  </div>
                )}

                {/* Quick location barcodes for easy click-testing */}
                <div className="text-[11px] text-slate-400 mb-1">Quick Test Location Barcodes:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['WH-A01-L1', 'WH-B04-L3', 'WH-C02-L1', 'WH-D05-L2', 'AX-A02-L1'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleDecodedCode(loc)}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[11px] font-mono transition-colors"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Product Dossier */}
            {matchedItem ? (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {matchedItem.category}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                      {matchedItem.name}
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      matchedItem.status === 'in_stock'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : matchedItem.status === 'low_stock'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {matchedItem.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-900/90 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">SKU / Barcode</span>
                    <span className="font-mono text-white font-semibold">{matchedItem.sku}</span>
                    <span className="text-[11px] font-mono text-slate-400 block">{matchedItem.barcode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rack Bin Location</span>
                    <span className="font-mono text-amber-400 font-bold text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {matchedItem.locationCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">On-Hand Quantity</span>
                    <span className="text-white font-bold text-base">
                      {matchedItem.quantity}{' '}
                      <span className="text-xs font-normal text-slate-400">{matchedItem.unit}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Batch & Unit Weight</span>
                    <span className="text-slate-300 font-mono text-[11px]">{matchedItem.batchNumber}</span>
                    <span className="text-slate-400 text-[11px] block">{matchedItem.weightKg} kg / unit</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/60">
                  <span>Last Scanned:</span>
                  <span className="text-slate-200 font-mono">{matchedItem.lastScannedAt || 'Just now'}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-500">
                <Barcode className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-slate-400 font-medium">Ready to scan</p>
                <p className="text-[11px] text-slate-500">
                  Aim camera at any barcode, use the hardware wedge input, or click any simulation barcode.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
