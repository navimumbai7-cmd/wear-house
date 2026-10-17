import React, { useState } from 'react';
import {
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  Sliders,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Barcode,
  Power,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { DockBay, StockMovement } from '../types/warehouse';

interface DockDispatchHubProps {
  docks: DockBay[];
  onUpdateDock: (updated: DockBay) => void;
  onOpenScanner: (mode: 'inward' | 'pick') => void;
  onMovementLogged: (movement: StockMovement) => void;
  language?: 'en' | 'hi';
}

export const DockDispatchHub: React.FC<DockDispatchHubProps> = ({
  docks,
  onUpdateDock,
  onOpenScanner,
  onMovementLogged,
  language = 'en',
}) => {
  const isHi = language === 'hi';
  const [selectedDockId, setSelectedDockId] = useState<string>(docks[0]?.id || 'dock-1');

  const selectedDock = docks.find((d) => d.id === selectedDockId) || docks[0];

  const handleToggleShutter = (dock: DockBay) => {
    const nextShutter = dock.motorizedShutter === 'open' ? 'closed' : 'open';
    onUpdateDock({
      ...dock,
      motorizedShutter: nextShutter,
    });
  };

  const handleToggleLeveler = (dock: DockBay) => {
    const nextLeveler = dock.dockLevelerStatus === 'engaged' ? 'level' : 'engaged';
    onUpdateDock({
      ...dock,
      dockLevelerStatus: nextLeveler,
    });
  };

  const handleDispatchTruck = (dock: DockBay) => {
    if (dock.currentTruckNumber) {
      onMovementLogged({
        id: `mov-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sku: 'MANIFEST-TRK',
        itemName: `Truck ${dock.currentTruckNumber} Departed`,
        barcode: dock.manifestPo || 'TRK-DISPATCH',
        type: 'DISPATCH',
        quantity: 1,
        fromLocation: dock.name,
        toLocation: 'External Transit (Neral-Karjat Road)',
        operator: 'Gate Security & Weighbridge',
        notes: `Vehicle clear. Manifest: ${dock.manifestPo || 'N/A'}. Carrier: ${dock.carrier}`,
      });
    }

    onUpdateDock({
      ...dock,
      status: 'available',
      currentTruckNumber: undefined,
      driverName: undefined,
      manifestPo: undefined,
      progress: 0,
      carrier: 'Available for Inward/Outward',
      motorizedShutter: 'closed',
      dockLevelerStatus: 'level',
    });
  };

  const handleSimulateArrival = (dock: DockBay) => {
    const truckNums = ['MH-12-RN-7801', 'MH-04-BG-9912', 'MH-43-CC-5100'];
    const carriers = ['V-Trans Freight', 'Safexpress Logistics', 'Bluedart Surface'];
    const randomIdx = Math.floor(Math.random() * truckNums.length);

    onUpdateDock({
      ...dock,
      status: 'unloading',
      currentTruckNumber: truckNums[randomIdx],
      driverName: 'Rameshwar Yadav',
      manifestPo: `PO-2026-ARR-${Math.floor(100 + Math.random() * 900)}`,
      progress: 10,
      carrier: carriers[randomIdx],
      motorizedShutter: 'open',
      dockLevelerStatus: 'engaged',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              LOGISTICS PORTAL (6M × 18M)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-400" />
            {isHi ? '3-बे इनवर्ड एवं डिस्पैच लॉजिस्टिक्स हब' : '3-Bay Inward & Dispatch Logistics Hub'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {isHi
              ? '3 मोटराइज्ड रोलर शटर्स, 15-टन हाइड्रोलिक डॉक लेवेलर्स, एवं बारकोड वेरिफिकेशन गेट्स।'
              : 'Direct connection to Neral-Karjat Road. Calibrated for 15-ton dynamic axle loading with motorized shutters & laser alignment.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenScanner('inward')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
          >
            <Barcode className="w-4 h-4" />
            {isHi ? 'डॉक इनवर्ड बारकोड स्कैन' : 'Scan Inward Manifest'}
          </button>
        </div>
      </div>

      {/* 3 Truck Bays Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {docks.map((dock) => {
          const isSelected = selectedDockId === dock.id;
          const isOccupied = dock.status !== 'available';

          return (
            <div
              key={dock.id}
              onClick={() => setSelectedDockId(dock.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                      #{dock.bayNumber}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Truck Bay 0{dock.bayNumber}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">Heavy Vehicle Bay</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dock.status === 'unloading'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : dock.status === 'loading'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {dock.status.toUpperCase()}
                  </span>
                </div>

                {isOccupied ? (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px]">VEHICLE NUMBER</span>
                      <span className="font-mono font-bold text-white">{dock.currentTruckNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px]">CARRIER / MANIFEST</span>
                      <span className="text-slate-300 text-[11px] truncate">{dock.carrier}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[10px]">PO MANIFEST</span>
                      <span className="font-mono text-amber-400 text-[11px]">{dock.manifestPo}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Cargo Transfer</span>
                        <span className="font-mono font-bold text-white">{dock.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${dock.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 mb-3">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold text-slate-400">Bay Ready & Vacant</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Motorized shutter lowered</p>
                  </div>
                )}
              </div>

              {/* Shutter & Leveler Status Badges */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dock.motorizedShutter === 'open' ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  Shutter: <span className="font-bold text-white capitalize">{dock.motorizedShutter}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  Leveler: <span className="font-bold text-white capitalize">{dock.dockLevelerStatus}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Bay Telemetry & Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                ACTIVE DOCK CONTROL TERMINAL
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedDock.name}</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Sensor Node: DOCK-SN-0{selectedDock.bayNumber}
            </span>
          </div>

          {/* Actuator Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Motorized Roller Shutter</span>
                <span className="text-[11px] text-slate-400">
                  Industrial high-speed roll door with safety sensor
                </span>
              </div>
              <button
                onClick={() => handleToggleShutter(selectedDock)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDock.motorizedShutter === 'open'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {selectedDock.motorizedShutter === 'open' ? 'OPEN (LIFTED)' : 'CLOSED (LOWERED)'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Hydraulic Dock Leveler</span>
                <span className="text-[11px] text-slate-400">
                  15-Ton dynamic lip bridge for forklift drive-in
                </span>
              </div>
              <button
                onClick={() => handleToggleLeveler(selectedDock)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDock.dockLevelerStatus === 'engaged'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {selectedDock.dockLevelerStatus === 'engaged' ? 'ENGAGED' : 'RETRACTED'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {selectedDock.status !== 'available' ? (
              <button
                onClick={() => handleDispatchTruck(selectedDock)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg"
              >
                Complete & Release Truck (Gate Clearance)
              </button>
            ) : (
              <button
                onClick={() => handleSimulateArrival(selectedDock)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg"
              >
                Simulate Incoming Freight Truck Arrival
              </button>
            )}

            <button
              onClick={() => onOpenScanner('inward')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Barcode className="w-3.5 h-3.5 text-amber-400" />
              Scan Inward Manifest Barcode
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-950/60 rounded-xl border border-slate-800 p-4 text-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gate & Weighbridge Telemetry
          </h4>
          <div className="space-y-2 text-slate-300 text-[11px]">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Connecting Road:</span>
              <span className="font-mono text-slate-200">Neral-Karjat 24M</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Security Checkpoint:</span>
              <span className="text-emerald-400 font-semibold">Active & Green</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Weighbridge Scale:</span>
              <span className="font-mono text-slate-200">60-Ton Automated</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Canopy Clearance:</span>
              <span className="font-mono text-slate-200">5.5M Heavy Trailer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
