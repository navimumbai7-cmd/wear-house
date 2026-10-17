import React, { useState } from 'react';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Box,
  Eye,
  Info,
  Truck,
  ShieldCheck,
  Zap,
  Grid,
  ChevronRight,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { WarehouseZone, StructuralType } from '../types/warehouse';
import { PROJECT_DETAILS } from '../data/initialMasterplan';

interface BlueprintCanvasProps {
  zones: WarehouseZone[];
  selectedZone: WarehouseZone | null;
  onSelectZone: (zone: WarehouseZone) => void;
  onUpdateZone: (updated: WarehouseZone) => void;
  onAddCustomZone: (zone: WarehouseZone) => void;
  language?: 'en' | 'hi';
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onUpdateZone,
  language = 'en',
}) => {
  const [viewMode, setViewMode] = useState<'blueprint' | 'heatmap' | 'isometric'>('blueprint');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showRacks, setShowRacks] = useState<boolean>(true);
  const [showStructuralGrid, setShowStructuralGrid] = useState<boolean>(true);
  const [showSafetyRoutes, setShowSafetyRoutes] = useState<boolean>(false);

  // Quick preset scale calculation
  // Base SVG viewBox 0 0 1000 680 representing the 7,363 m² Badlapur Plot
  const isHi = language === 'hi';

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setViewMode('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'blueprint'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            {isHi ? 'आर्किटेक्चरल ब्लूप्रिंट' : 'CAD Architectural Blueprint'}
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'heatmap'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            {isHi ? 'स्टोरेज हीटमैप' : 'Operational Heatmap'}
          </button>
          <button
            onClick={() => setViewMode('isometric')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'isometric'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            {isHi ? '3D आइसोमेट्रिक व्यू' : '3D Spatial Elevation'}
          </button>
        </div>

        {/* Center: Layer Visibility Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-slate-800/50">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="rounded accent-sky-500 w-3 h-3"
            />
            {isHi ? 'आयाम (Dimensions)' : 'Dimensions'}
          </label>
          <label className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-slate-800/50">
            <input
              type="checkbox"
              checked={showRacks}
              onChange={(e) => setShowRacks(e.target.checked)}
              className="rounded accent-sky-500 w-3 h-3"
            />
            {isHi ? 'रैकिंग ग्रिड' : 'Racking Bays'}
          </label>
          <label className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-slate-800/50">
            <input
              type="checkbox"
              checked={showStructuralGrid}
              onChange={(e) => setShowStructuralGrid(e.target.checked)}
              className="rounded accent-sky-500 w-3 h-3"
            />
            {isHi ? 'PEB पोर्टल फ्रेम' : 'PEB Columns'}
          </label>
          <label className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-slate-800/50">
            <input
              type="checkbox"
              checked={showSafetyRoutes}
              onChange={(e) => setShowSafetyRoutes(e.target.checked)}
              className="rounded accent-sky-500 w-3 h-3"
            />
            {isHi ? 'सुरक्षा मार्ग' : 'Safety Fire Routes'}
          </label>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 px-1">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 ml-1"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Blueprint Stage & Technical Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Engineering Blueprint Canvas */}
        <div className="lg:col-span-8 bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col">
          {/* Blueprint Canvas Header */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sky-400 font-bold tracking-wider">
                NERAL-KARJAT ROAD PLOT: 7,363 m²
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                Ground Coverage: 4,140 m² (56%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Compass className="w-3 h-3 text-sky-400" />
                NORTH ↑
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono">
                1m = 10px SCALE
              </span>
            </div>
          </div>

          {/* Interactive SVG Container */}
          <div className="relative w-full h-[540px] overflow-auto flex items-center justify-center p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative"
            >
              <svg
                width="840"
                height="500"
                viewBox="0 0 840 500"
                className="select-none filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
              >
                {/* Defs for blueprint grid & patterns */}
                <defs>
                  <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="mainHallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0369a1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="heatHigh" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Plot Boundary (7,363 m² perimeter) */}
                <rect
                  x="10"
                  y="10"
                  width="820"
                  height="480"
                  fill="url(#cadGrid)"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Neral-Karjat Road (South Perimeter) */}
                <g>
                  <rect x="10" y="440" width="820" height="50" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <line x1="20" y1="465" x2="820" y2="465" stroke="#facc15" strokeWidth="2" strokeDasharray="16 10" />
                  <text
                    x="420"
                    y="480"
                    fill="#94a3b8"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    नेरल - कर्जत मुख्य मार्ग (NERAL - KARJAT ROAD) — 24M WIDE CORRIDOR
                  </text>
                  <text
                    x="760"
                    y="430"
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ENTRY →
                  </text>
                </g>

                {/* Main Warehouse Hall: 72m x 48m -> scaled to 520 x 280 */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-main-hall');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer group"
                >
                  <rect
                    x="160"
                    y="50"
                    width="460"
                    height="270"
                    fill={viewMode === 'heatmap' ? 'url(#heatHigh)' : 'url(#mainHallGrad)'}
                    stroke={selectedZone?.id === 'zone-main-hall' ? '#38bdf8' : '#0284c7'}
                    strokeWidth={selectedZone?.id === 'zone-main-hall' ? 3 : 1.5}
                    rx="4"
                    className="transition-all"
                  />

                  {/* PEB Structural Column Pads along perimeter */}
                  {showStructuralGrid && (
                    <g>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <rect
                          key={`col-t-${i}`}
                          x={160 + i * 65 - 4}
                          y={46}
                          width="8"
                          height="8"
                          fill="#38bdf8"
                        />
                      ))}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <rect
                          key={`col-b-${i}`}
                          x={160 + i * 65 - 4}
                          y={316}
                          width="8"
                          height="8"
                          fill="#38bdf8"
                        />
                      ))}
                      {/* Truss Center Ridge Line */}
                      <line
                        x1="160"
                        y1="185"
                        x2="620"
                        y2="185"
                        stroke="#0284c7"
                        strokeWidth="1"
                        strokeDasharray="6 3"
                      />
                    </g>
                  )}

                  {/* Storage Racking Grid (Aisles A, B, C, D, E) */}
                  {showRacks && (
                    <g opacity={viewMode === 'heatmap' ? 0.9 : 0.65}>
                      {['A', 'B', 'C', 'D', 'E'].map((aisle, idx) => {
                        const yPos = 80 + idx * 46;
                        return (
                          <g key={aisle}>
                            {/* Dual back-to-back racks */}
                            <rect
                              x="190"
                              y={yPos}
                              width="380"
                              height="12"
                              fill="#1e293b"
                              stroke="#64748b"
                              strokeWidth="0.8"
                              rx="2"
                            />
                            <rect
                              x="190"
                              y={yPos + 16}
                              width="380"
                              height="12"
                              fill="#1e293b"
                              stroke="#64748b"
                              strokeWidth="0.8"
                              rx="2"
                            />
                            {/* Aisle Label */}
                            <text
                              x="175"
                              y={yPos + 18}
                              fill="#38bdf8"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {aisle}
                            </text>
                            {/* Capacity blocks */}
                            {Array.from({ length: 9 }).map((_, bIdx) => (
                              <rect
                                key={`bin-${bIdx}`}
                                x={200 + bIdx * 40}
                                y={yPos + 2}
                                width="34"
                                height="8"
                                fill={
                                  viewMode === 'heatmap'
                                    ? bIdx % 3 === 0
                                      ? '#ef4444'
                                      : '#10b981'
                                    : '#0284c7'
                                }
                                opacity="0.75"
                              />
                            ))}
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Main Hall Center Callout */}
                  <text
                    x="390"
                    y="75"
                    fill="#f8fafc"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    MAIN WAREHOUSE (मुख्य वेयरहाउस)
                  </text>
                  <text
                    x="390"
                    y="92"
                    fill="#7dd3fc"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    72.00 M × 48.00 M | 3,456.00 m² | 150mm VDF Trimix
                  </text>
                </g>

                {/* Side Extension (Auxiliary Warehouse): 12m x 24m -> scaled to 110 x 180 */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-side-ext');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect
                    x="35"
                    y="90"
                    width="110"
                    height="190"
                    fill="#0f766e"
                    fillOpacity="0.3"
                    stroke={selectedZone?.id === 'zone-side-ext' ? '#2dd4bf' : '#0d9488'}
                    strokeWidth={selectedZone?.id === 'zone-side-ext' ? 2.5 : 1.2}
                    rx="3"
                  />
                  <text x="90" y="175" fill="#ccfbf1" fontSize="10" fontWeight="bold" textAnchor="middle">
                    AUXILIARY HALL
                  </text>
                  <text x="90" y="190" fill="#ccfbf1" fontSize="9" textAnchor="middle">
                    (सहायक वेयरहाउस)
                  </text>
                  <text x="90" y="206" fill="#5eead4" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    12M × 24M (Lean-to)
                  </text>
                </g>

                {/* Inward & Dispatch Bay (Truck Bays 1, 2, 3) */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-dispatch-bay');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect
                    x="635"
                    y="60"
                    width="170"
                    height="150"
                    fill="#78350f"
                    fillOpacity="0.3"
                    stroke={selectedZone?.id === 'zone-dispatch-bay' ? '#fbbf24' : '#f59e0b'}
                    strokeWidth={selectedZone?.id === 'zone-dispatch-bay' ? 2.5 : 1.2}
                    rx="3"
                  />
                  <text x="720" y="80" fill="#fef3c7" fontSize="10" fontWeight="bold" textAnchor="middle">
                    DISPATCH & INWARD
                  </text>
                  <text x="720" y="93" fill="#fde68a" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    6M × 18M | 3 Dock Levelers
                  </text>

                  {/* 3 Truck Dock Bays */}
                  {[
                    { no: 1, y: 100, label: 'TRUCK BAY 1' },
                    { no: 2, y: 135, label: 'TRUCK BAY 2' },
                    { no: 3, y: 170, label: 'TRUCK BAY 3' },
                  ].map((bay) => (
                    <g key={bay.no}>
                      <rect
                        x="645"
                        y={bay.y}
                        width="150"
                        height="26"
                        fill="#1e293b"
                        stroke="#f59e0b"
                        strokeWidth="1"
                        rx="2"
                      />
                      <circle cx="658" cy={bay.y + 13} r="4" fill="#10b981" />
                      <text x="670" y={bay.y + 17} fill="#ffffff" fontSize="9" fontWeight="bold">
                        {bay.label}
                      </text>
                      <text x="760" y={bay.y + 17} fill="#fbbf24" fontSize="8" fontFamily="monospace">
                        [DOCK #{bay.no}]
                      </text>
                    </g>
                  ))}
                </g>

                {/* Ancillary Buildings (Right & Bottom Perimeter from Masterplan) */}
                {/* Store Block 6x3m */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-store-block');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect x="635" y="220" width="80" height="40" fill="#334155" fillOpacity="0.4" stroke="#64748b" rx="2" />
                  <text x="675" y="242" fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">
                    STORE (6x3M)
                  </text>
                </g>

                {/* Toilet Block 12x3m */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-toilet-block');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect x="725" y="220" width="80" height="40" fill="#0369a1" fillOpacity="0.3" stroke="#38bdf8" rx="2" />
                  <text x="765" y="242" fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">
                    TOILET (12x3M)
                  </text>
                </g>

                {/* Substation 6x3m */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-substation');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect x="635" y="270" width="170" height="35" fill="#7f1d1d" fillOpacity="0.4" stroke="#ef4444" rx="2" />
                  <text x="720" y="292" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">
                    SUBSTATION (500 kVA Panel)
                  </text>
                </g>

                {/* Staff Area: 12x24m */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-staff-utility');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect x="500" y="340" width="120" height="80" fill="#581c87" fillOpacity="0.3" stroke="#8b5cf6" rx="2" />
                  <text x="560" y="375" fill="#e9d5ff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    STAFF UTILITY
                  </text>
                  <text x="560" y="390" fill="#c084fc" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    12x24M
                  </text>
                </g>

                {/* Admin Office: 24x12m */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-admin-office');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect x="330" y="340" width="150" height="80" fill="#312e81" fillOpacity="0.4" stroke="#6366f1" rx="2" />
                  <text x="405" y="375" fill="#e0e7ff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ADMIN OFFICE (G+1)
                  </text>
                  <text x="405" y="392" fill="#a5b4fc" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    24M × 12M | Control Room
                  </text>
                </g>

                {/* Security Cabin & Gatehouse */}
                <g
                  onClick={() => {
                    const z = zones.find((x) => x.id === 'zone-security-cabin');
                    if (z) onSelectZone(z);
                  }}
                  className="cursor-pointer"
                >
                  <rect x="730" y="375" width="60" height="45" fill="#064e3b" fillOpacity="0.4" stroke="#10b981" rx="2" />
                  <text x="760" y="400" fill="#6ee7b7" fontSize="8" fontWeight="bold" textAnchor="middle">
                    SECURITY
                  </text>
                  <text x="760" y="412" fill="#a7f3d0" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    3.29M
                  </text>
                </g>

                {/* Car Parking slots */}
                <g>
                  {['CAR', 'CAR', 'CAR'].map((label, cIdx) => (
                    <g key={cIdx}>
                      <rect x={645 + cIdx * 26} y={340} width={22} height={30} fill="#1e293b" stroke="#475569" rx="1" />
                      <text x={656 + cIdx * 26} y="360" fill="#94a3b8" fontSize="7" textAnchor="middle">
                        CAR
                      </text>
                    </g>
                  ))}
                </g>

                {/* Exterior Dimensions Arrows & Callouts */}
                {showDimensions && (
                  <g stroke="#38bdf8" strokeWidth="1" opacity="0.8">
                    {/* Top 72m dimension */}
                    <line x1="160" y1="35" x2="620" y2="35" />
                    <line x1="160" y1="30" x2="160" y2="40" />
                    <line x1="620" y1="30" x2="620" y2="40" />
                    <text x="390" y="30" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      72.00 M
                    </text>

                    {/* Left 48m dimension */}
                    <line x1="140" y1="50" x2="140" y2="320" />
                    <line x1="135" y1="50" x2="145" y2="50" />
                    <line x1="135" y1="320" x2="145" y2="320" />
                    <text
                      x="130"
                      y="185"
                      fill="#38bdf8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      transform="rotate(-90 130 185)"
                    >
                      48.00 M
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Technical Inspector & Structural Specifications */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedZone ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                    ZONE TECHNICAL DOSSIER
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {isHi ? selectedZone.nameHi : selectedZone.name}
                  </h3>
                  <span className="text-xs text-slate-400">{selectedZone.dimensions}</span>
                </div>
                <div
                  className="w-4 h-4 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: selectedZone.color }}
                />
              </div>

              {/* Area & Structural Type */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Total Floor Area</span>
                  <span className="text-white font-bold font-mono text-sm">
                    {selectedZone.areaSqM.toLocaleString()} m²
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Structural Framing</span>
                  <span className="text-slate-200 font-semibold text-[11px] leading-tight block">
                    {selectedZone.structuralType}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                {selectedZone.description}
              </p>

              {/* Engineering Features */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Structural & Engineering Features:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedZone.features.map((feat, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 border border-slate-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3 text-sky-400" />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Racking & Storage Utilization if applicable */}
              {selectedZone.rackCapacity && (
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400">Pallet Bay Utilization:</span>
                    <span className="text-white font-bold font-mono">
                      {selectedZone.currentPallets} / {selectedZone.rackCapacity} Pallets (
                      {Math.round(((selectedZone.currentPallets || 0) / selectedZone.rackCapacity) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-amber-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((selectedZone.currentPallets || 0) / selectedZone.rackCapacity) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Action: Edit Zone Capacity */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Zone Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase text-[10px]">
                  {selectedZone.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
              <Info className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Select Any Blueprint Zone</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Click on the Main Hall, Loading Bay 1-3, Admin Office, or Substation on the blueprint canvas to inspect technical engineering details.
              </p>
            </div>
          )}

          {/* Quick Zone Picker Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Blueprint Zones Quick Index
            </h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => onSelectZone(z)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                    selectedZone?.id === z.id
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                    <span className="truncate">{isHi ? z.nameHi : z.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 shrink-0">
                    {z.areaSqM} m²
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
