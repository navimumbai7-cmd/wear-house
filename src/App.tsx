import React, { useState, useEffect } from 'react';
import {
  Compass,
  HardHat,
  Package,
  Truck,
  Barcode,
  Layers,
  Globe,
  Activity,
  Printer,
  Sparkles,
  CheckCircle2,
  Bell,
  Volume2,
  X,
} from 'lucide-react';
import {
  WarehouseZone,
  ConstructionPhase,
  MachineryResource,
  InventoryItem,
  StockMovement,
  DockBay,
} from './types/warehouse';
import {
  INITIAL_ZONES,
  INITIAL_CONSTRUCTION_PHASES,
  INITIAL_MACHINERY,
  INITIAL_INVENTORY,
  INITIAL_DOCKS,
  PROJECT_DETAILS,
} from './data/initialMasterplan';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { ConstructionTracker } from './components/ConstructionTracker';
import { InventoryManager } from './components/InventoryManager';
import { DockDispatchHub } from './components/DockDispatchHub';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BarcodeGeneratorStudio } from './components/BarcodeGeneratorStudio';
import { PWAInstallButton } from './components/PWAInstallButton';
import { soundEffects } from './utils/audioFeedback';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'blueprint' | 'construction' | 'inventory' | 'docks' | 'labels'
  >('blueprint');

  // Language: English or Hindi (honoring the PDF blueprint document)
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Application Data States (with localStorage caching)
  const [zones, setZones] = useState<WarehouseZone[]>(() => {
    const saved = localStorage.getItem('wareforge_zones');
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [phases, setPhases] = useState<ConstructionPhase[]>(() => {
    const saved = localStorage.getItem('wareforge_phases');
    return saved ? JSON.parse(saved) : INITIAL_CONSTRUCTION_PHASES;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('wareforge_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [docks, setDocks] = useState<DockBay[]>(() => {
    const saved = localStorage.getItem('wareforge_docks');
    return saved ? JSON.parse(saved) : INITIAL_DOCKS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('wareforge_movements');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'mov-init-1',
            timestamp: '08:30:15',
            sku: 'SKU-IND-1001',
            itemName: 'M35 High-Early Strength Cement (50kg)',
            barcode: '8901234567890',
            type: 'INWARD',
            quantity: 200,
            fromLocation: 'Truck Bay 1',
            toLocation: 'WH-A01-L1',
            operator: 'Dock Receiver #02',
            notes: 'Verified barcode batch BAT-2026-M35-08',
          },
          {
            id: 'mov-init-2',
            timestamp: '09:15:40',
            sku: 'SKU-ELEC-2001',
            itemName: 'High-Bay LED Luminaire 200W',
            barcode: '8904561237894',
            type: 'PUTAWAY',
            quantity: 42,
            fromLocation: 'Staging Bay 2',
            toLocation: 'WH-B04-L3',
            operator: 'Forklift Driver (Ramesh)',
            notes: 'Laser rack scan putaway verified',
          },
        ];
  });

  // Selected Zone for Blueprint inspector
  const [selectedZone, setSelectedZone] = useState<WarehouseZone | null>(INITIAL_ZONES[0]);

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerDefaultMode, setScannerDefaultMode] = useState<
    'lookup' | 'inward' | 'putaway' | 'pick' | 'audit'
  >('lookup');

  // Live IoT Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('wareforge_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('wareforge_phases', JSON.stringify(phases));
  }, [phases]);

  useEffect(() => {
    localStorage.setItem('wareforge_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('wareforge_docks', JSON.stringify(docks));
  }, [docks]);

  useEffect(() => {
    localStorage.setItem('wareforge_movements', JSON.stringify(movements));
  }, [movements]);

  // Live Warehouse Activity Simulation Loop (Periodically simulates AGV / Putaway / Inward movements)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Pick random inventory item to adjust
      const randomItemIdx = Math.floor(Math.random() * inventory.length);
      const targetItem = inventory[randomItemIdx];
      if (!targetItem) return;

      const isReceipt = Math.random() > 0.5;
      const delta = isReceipt ? Math.floor(1 + Math.random() * 5) : -Math.floor(1 + Math.random() * 3);
      const newQty = Math.max(1, targetItem.quantity + delta);

      const updated: InventoryItem = {
        ...targetItem,
        quantity: newQty,
        status: newQty <= targetItem.minThreshold ? 'low_stock' : 'in_stock',
        lastScannedAt: new Date().toLocaleTimeString(),
      };

      setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));

      const movType = isReceipt ? 'INWARD' : 'PICK';
      const newMovement: StockMovement = {
        id: `mov-sim-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sku: targetItem.sku,
        itemName: targetItem.name,
        barcode: targetItem.barcode,
        type: movType,
        quantity: Math.abs(delta),
        fromLocation: isReceipt ? 'Dock Bay 1' : targetItem.locationCode,
        toLocation: isReceipt ? targetItem.locationCode : 'Outward Conveyor',
        operator: 'Automated AGV Robot #03',
        notes: `Simulated live IoT transfer (${delta > 0 ? '+' : ''}${delta} ${targetItem.unit})`,
      };

      setMovements((prev) => [newMovement, ...prev.slice(0, 49)]);

      setLiveToast(
        `IoT Real-Time Event: ${movType} of ${Math.abs(delta)} ${targetItem.unit} for ${targetItem.name}`
      );

      soundEffects.playScanSuccess();

      setTimeout(() => {
        setLiveToast((current) =>
          current?.includes(targetItem.name) ? null : current
        );
      }, 4000);
    }, 7000);

    return () => clearInterval(interval);
  }, [isSimulating, inventory]);

  // Handler callbacks
  const handleItemUpdated = (updated: InventoryItem) => {
    setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleItemAdded = (newItem: InventoryItem) => {
    setInventory((prev) => [newItem, ...prev]);
  };

  const handleMovementLogged = (movement: StockMovement) => {
    setMovements((prev) => [movement, ...prev.slice(0, 49)]);
  };

  const handleUpdateDock = (updatedDock: DockBay) => {
    setDocks((prev) => prev.map((d) => (d.id === updatedDock.id ? updatedDock : d)));
  };

  const handleToggleTask = (phaseNum: number, milestoneIdx: number, taskId: string) => {
    setPhases((prevPhases) =>
      prevPhases.map((phase) => {
        if (phase.phaseNumber !== phaseNum) return phase;

        const updatedMilestones = phase.milestones.map((milestone, idx) => {
          if (idx !== milestoneIdx) return milestone;

          const updatedTasks = milestone.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          );

          const allCompleted = updatedTasks.every((t) => t.completed);
          const anyCompleted = updatedTasks.some((t) => t.completed);

          return {
            ...milestone,
            tasks: updatedTasks,
            status: allCompleted ? ('completed' as const) : anyCompleted ? ('in_progress' as const) : ('pending' as const),
          };
        });

        // Recalculate phase progress
        const totalPhaseTasks = updatedMilestones.reduce((acc, m) => acc + m.tasks.length, 0);
        const completedPhaseTasks = updatedMilestones.reduce(
          (acc, m) => acc + m.tasks.filter((t) => t.completed).length,
          0
        );
        const progress = Math.round((completedPhaseTasks / (totalPhaseTasks || 1)) * 100);

        return {
          ...phase,
          milestones: updatedMilestones,
          progress,
        };
      })
    );
  };

  const openScannerWithMode = (mode: 'lookup' | 'inward' | 'putaway' | 'pick' | 'audit') => {
    setScannerDefaultMode(mode);
    setIsScannerOpen(true);
  };

  const isHi = language === 'hi';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Industrial Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* App Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Package className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white">
                    Ware<span className="text-amber-400">Forge</span>
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                    WMS 4.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-none">
                  {isHi ? 'बदलापुर 7,363 m² वेयरहाउस एवं स्मार्ट इन्वेंट्री' : 'Badlapur 7,363 m² Hub & Real-Time Tracking'}
                </p>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setActiveTab('blueprint')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'blueprint'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                {isHi ? 'ब्लूप्रिंट स्टूडियो' : 'Blueprint Studio'}
              </button>

              <button
                onClick={() => setActiveTab('construction')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'construction'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                {isHi ? '30-दिवसीय निर्माण' : '30-Day Masterplan'}
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'inventory'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                {isHi ? 'इन्वेंट्री ट्रैकिंग' : 'Real-Time Inventory'}
              </button>

              <button
                onClick={() => setActiveTab('docks')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'docks'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                {isHi ? 'लॉजिस्टिक्स बे' : 'Dock Logistics'}
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'labels'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                {isHi ? 'बारकोड स्टूडियो' : 'Barcode Labels'}
              </button>
            </nav>

            {/* Quick Actions, PWA Install & Language Toggle */}
            <div className="flex items-center gap-2">
              {/* Install on Mobile PWA Button */}
              <PWAInstallButton />

              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
              </button>

              {/* Automated Scanner Launch Button */}
              <button
                onClick={() => openScannerWithMode('lookup')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-95"
              >
                <Barcode className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">
                  {isHi ? 'बारकोड स्कैनर' : 'Scan Barcode'}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile sub-navigation bar */}
          <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800">
            {[
              { id: 'blueprint', label: isHi ? 'ब्लूप्रिंट' : 'Blueprint', icon: Compass },
              { id: 'construction', label: isHi ? 'निर्माण' : 'Build Plan', icon: HardHat },
              { id: 'inventory', label: isHi ? 'इन्वेंट्री' : 'Inventory', icon: Package },
              { id: 'docks', label: isHi ? 'डॉक' : 'Docks', icon: Truck },
              { id: 'labels', label: isHi ? 'बारकोड' : 'Labels', icon: Barcode },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    active ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Real-time Notification Banner for Live Sim Events */}
      {liveToast && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center gap-2 w-full">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">{liveToast}</span>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-amber-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'blueprint' && (
          <BlueprintCanvas
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={(z) => setSelectedZone(z)}
            onUpdateZone={(upd) =>
              setZones((prev) => prev.map((z) => (z.id === upd.id ? upd : z)))
            }
            onAddCustomZone={(newZ) => setZones((prev) => [...prev, newZ])}
            language={language}
          />
        )}

        {activeTab === 'construction' && (
          <ConstructionTracker
            phases={phases}
            machinery={INITIAL_MACHINERY}
            onToggleTask={handleToggleTask}
            language={language}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            movements={movements}
            onItemUpdated={handleItemUpdated}
            onItemAdded={handleItemAdded}
            onMovementLogged={handleMovementLogged}
            onOpenScanner={openScannerWithMode}
            onOpenLabelStudio={(item) => {
              setActiveTab('labels');
            }}
            isSimulating={isSimulating}
            onToggleSimulation={() => setIsSimulating(!isSimulating)}
            language={language}
          />
        )}

        {activeTab === 'docks' && (
          <DockDispatchHub
            docks={docks}
            onUpdateDock={handleUpdateDock}
            onOpenScanner={(mode) => openScannerWithMode(mode)}
            onMovementLogged={handleMovementLogged}
            language={language}
          />
        )}

        {activeTab === 'labels' && (
          <BarcodeGeneratorStudio
            inventory={inventory}
            onAddNewItem={handleItemAdded}
          />
        )}
      </main>

      {/* Automated Barcode Scanner Modal with Camera, Wedge, and Quick Sim */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        inventory={inventory}
        docks={docks}
        onItemUpdated={handleItemUpdated}
        onMovementLogged={handleMovementLogged}
        defaultMode={scannerDefaultMode}
      />

      {/* Floating Action Button for Rapid Barcode Scanning */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => openScannerWithMode('lookup')}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-[0_10px_30px_rgba(245,158,11,0.4)] hover:shadow-[0_12px_35px_rgba(245,158,11,0.6)] transition-all transform hover:-translate-y-0.5 active:scale-95"
        >
          <Barcode className="w-5 h-5 stroke-[2.5]" />
          <span>Quick Barcode Scan</span>
        </button>
      </div>

      {/* Industrial Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Badlapur PEB Industrial Warehouse (7,363 m² Plot | 4,140 m² Covered Area)</span>
          </div>
          <div>
            ISO 9001:2015 & GS1 Barcode Standards Compliant | Real-Time WMS Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
