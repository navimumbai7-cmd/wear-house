import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Barcode,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  History,
  Activity,
  Edit,
  Trash2,
} from 'lucide-react';
import { InventoryItem, StockMovement, StockCategory, ItemStatus } from '../types/warehouse';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  movements: StockMovement[];
  onItemUpdated: (item: InventoryItem) => void;
  onItemAdded: (item: InventoryItem) => void;
  onMovementLogged: (movement: StockMovement) => void;
  onOpenScanner: (mode: 'lookup' | 'inward' | 'putaway' | 'pick' | 'audit') => void;
  onOpenLabelStudio: (item: InventoryItem) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  language?: 'en' | 'hi';
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  movements,
  onItemUpdated,
  onItemAdded,
  onMovementLogged,
  onOpenScanner,
  onOpenLabelStudio,
  isSimulating,
  onToggleSimulation,
  language = 'en',
}) => {
  const isHi = language === 'hi';
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  // Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Manual cycle count adjustment');

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<StockCategory>('Construction Raw');
  const [newItemQty, setNewItemQty] = useState<number>(50);
  const [newItemUnit, setNewItemUnit] = useState<string>('Units');
  const [newItemLocation, setNewItemLocation] = useState<string>('WH-A02-L1');
  const [newItemWeight, setNewItemWeight] = useState<number>(10);
  const [newItemPrice, setNewItemPrice] = useState<number>(500);

  // Filtered inventory list
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm) ||
      item.locationCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Metrics
  const totalUnits = inventory.reduce((acc, i) => acc + i.quantity, 0);
  const lowStockCount = inventory.filter((i) => i.status === 'low_stock' || i.quantity <= i.minThreshold).length;
  const totalValue = inventory.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  const handleAdjustSubmit = () => {
    if (!adjustingItem) return;
    const newQty = Math.max(0, adjustingItem.quantity + adjustQty);
    const updated: InventoryItem = {
      ...adjustingItem,
      quantity: newQty,
      status: newQty === 0 ? 'out_of_stock' : newQty <= adjustingItem.minThreshold ? 'low_stock' : 'in_stock',
      lastScannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onItemUpdated(updated);
    onMovementLogged({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sku: adjustingItem.sku,
      itemName: adjustingItem.name,
      barcode: adjustingItem.barcode,
      type: 'AUDIT_ADJUST',
      quantity: adjustQty,
      fromLocation: adjustingItem.locationCode,
      toLocation: adjustingItem.locationCode,
      operator: 'WMS Supervisor',
      notes: `${adjustReason} (${adjustQty > 0 ? '+' : ''}${adjustQty})`,
    });

    setAdjustingItem(null);
    setAdjustQty(0);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = '890';
    const randBarcode = `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`.substring(0, 13);

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: `SKU-${newItemCategory.substring(0, 4).toUpperCase()}-${randomSuffix}`,
      barcode: randBarcode,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQty,
      unit: newItemUnit,
      minThreshold: Math.round(newItemQty * 0.2),
      maxCapacity: newItemQty * 3,
      zoneId: 'zone-main-hall',
      locationCode: newItemLocation,
      batchNumber: `BAT-2026-${randomSuffix}`,
      weightKg: newItemWeight,
      status: 'in_stock',
      unitPrice: newItemPrice,
      lastScannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onItemAdded(item);
    onMovementLogged({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sku: item.sku,
      itemName: item.name,
      barcode: item.barcode,
      type: 'INWARD',
      quantity: item.quantity,
      fromLocation: 'Truck Bay (Initial Receipt)',
      toLocation: item.locationCode,
      operator: 'Catalog Admin',
      notes: 'Initial SKU master creation & inward',
    });

    setIsAddModalOpen(false);
    setNewItemName('');
  };

  const exportCsv = () => {
    const headers = ['SKU', 'Barcode', 'Item Name', 'Category', 'Quantity', 'Unit', 'Location', 'Batch', 'WeightKg', 'UnitPrice', 'Status'];
    const rows = inventory.map((i) => [
      i.sku,
      i.barcode,
      `"${i.name.replace(/"/g, '""')}"`,
      i.category,
      i.quantity,
      i.unit,
      i.locationCode,
      i.batchNumber,
      i.weightKg,
      i.unitPrice,
      i.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warehouse_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Inventory Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {isHi ? 'कुल सक्रिय एसकेयू' : 'Active Catalog SKUs'}
            </span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">
              {inventory.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {isHi ? 'कुल इन्वेंट्री यूनिट्स' : 'Total On-Hand Units'}
            </span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">
              {totalUnits.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {isHi ? 'कम स्टॉक चेतावनी' : 'Low Stock Alerts'}
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">
              {lowStockCount}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {isHi ? 'कुल इन्वेंटरी मूल्यांकन' : 'Total Inventory Value'}
            </span>
            <span className="text-2xl font-black text-indigo-400 font-mono mt-0.5 block">
              ₹{(totalValue / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Actions & Simulation Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            {isHi ? 'इन्वेंट्री कैटलॉग' : 'Real-Time Inventory'}
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'movements'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {isHi ? 'स्टॉक मूवमेंट लेजर' : 'Stock Audit Ledger'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Simulation Engine Toggle */}
          <button
            onClick={onToggleSimulation}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              isSimulating
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            {isSimulating ? 'Live IoT Simulation Active' : 'Start Live Activity Sim'}
          </button>

          <button
            onClick={() => onOpenScanner('lookup')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
          >
            <Barcode className="w-4 h-4" />
            {isHi ? 'स्कैन करें' : 'Scan Barcode'}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            {isHi ? 'नया आइटम' : 'Add Item'}
          </button>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Filter & Search Bar */}
          <div className="p-4 bg-slate-850/60 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isHi ? 'SKU, नाम, बारकोड, या रैक बिन से खोजें...' : 'Search by SKU, Name, Barcode, or Rack Bin...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Construction Raw">Construction Raw</option>
                <option value="Electronics">Electronics</option>
                <option value="Industrial Tools">Industrial Tools</option>
                <option value="FMCG & Packaging">FMCG & Packaging</option>
                <option value="Automotive Spares">Automotive Spares</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Rack Bin</th>
                  <th className="py-3 px-4">Stock Qty</th>
                  <th className="py-3 px-4">Batch / Unit Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-850/70 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.barcode}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px] inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.locationCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold font-mono text-sm">
                        {item.quantity}
                      </span>{' '}
                      <span className="text-slate-400 text-[10px]">{item.unit}</span>
                      {item.quantity <= item.minThreshold && (
                        <div className="text-[10px] text-amber-400 font-semibold">
                          Min: {item.minThreshold}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-300">{item.batchNumber}</div>
                      <div className="text-slate-400 text-[10px]">₹{item.unitPrice.toLocaleString()}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'in_stock'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.status === 'low_stock'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustQty(0);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                          title="Adjust Quantity"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => onOpenLabelStudio(item)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors"
                          title="Generate & Print Barcode Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Movement Ledger */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-850/60 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              Stock Movement Audit Ledger (Inward, Putaway, Pick, Dispatch)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {movements.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-4">Qty</th>
                  <th className="py-2.5 px-4">From → To</th>
                  <th className="py-2.5 px-4">Operator / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {m.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'INWARD'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : m.type === 'PUTAWAY'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : m.type === 'PICK' || m.type === 'DISPATCH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{m.itemName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{m.sku}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      <span className="text-slate-400">{m.fromLocation}</span> →{' '}
                      <span className="text-amber-400 font-semibold">{m.toLocation}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div className="text-slate-300">{m.operator}</div>
                      <div className="text-slate-500 text-[10px]">{m.notes}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Quantity Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Adjust Stock: {adjustingItem.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {adjustingItem.sku} | Current On-Hand: {adjustingItem.quantity} {adjustingItem.unit}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Quantity Change (+ or -)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustQty((q) => q - 10)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setAdjustQty((q) => q - 1)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-center font-mono text-white text-sm"
                  />
                  <button
                    onClick={() => setAdjustQty((q) => q + 1)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setAdjustQty((q) => q + 10)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                  >
                    +10
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Resulting Stock:{' '}
                  <span className="font-bold text-white font-mono">
                    {Math.max(0, adjustingItem.quantity + adjustQty)} {adjustingItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAdjustingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustSubmit}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateNewItem}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4"
          >
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              Add New Warehouse Inventory Item
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Item Name</label>
              <input
                type="text"
                required
                placeholder="e.g. 50-Ton Hydraulic Crane Spares Kit"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as StockCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Construction Raw">Construction Raw</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Industrial Tools">Industrial Tools</option>
                  <option value="FMCG & Packaging">FMCG & Packaging</option>
                  <option value="Automotive Spares">Automotive Spares</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Rack Bin Location</label>
                <input
                  type="text"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Initial Qty</label>
                <input
                  type="number"
                  min={1}
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Unit</label>
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * A GS1/EAN-13 barcode and SKU will be automatically assigned and generated.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                Create Item & Barcode
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
