export type StructuralType =
  | 'PEB Steel Portal Frame'
  | 'PEB Lean-to Structure'
  | 'G+1 Civil / Prefab Structure'
  | 'Heavy Canopy Structural Steel'
  | 'Drywall / Modular Brickwork'
  | 'Masonry Wall Partition'
  | 'RCC Slab & Plumbing Core'
  | 'Fire-rated Enclosure'
  | 'Prefab Modular Cabin';

export interface WarehouseZone {
  id: string;
  name: string;
  nameHi: string;
  category: 'main_hall' | 'extension' | 'office' | 'dispatch' | 'staff' | 'store' | 'toilet' | 'substation' | 'security' | 'entry';
  dimensions: string; // e.g. "72.00 m × 48.00 m"
  widthM: number;
  lengthM: number;
  areaSqM: number;
  structuralType: StructuralType;
  x: number; // canvas placement in meters
  y: number;
  color: string;
  description: string;
  features: string[];
  rackCapacity?: number;
  currentPallets?: number;
  status: 'operational' | 'under_construction' | 'planned';
}

export interface ConstructionMilestone {
  dayRange: string;
  startDay: number;
  endDay: number;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  tasks: { id: string; text: string; textHi: string; completed: boolean }[];
  status: 'completed' | 'in_progress' | 'pending';
  machineryUsed: string[];
}

export interface ConstructionPhase {
  phaseNumber: number;
  title: string;
  titleHi: string;
  days: string;
  startDay: number;
  endDay: number;
  progress: number;
  milestones: ConstructionMilestone[];
  qcNotes: string;
}

export interface MachineryResource {
  id: string;
  category: string;
  categoryHi: string;
  equipment: string;
  equipmentHi: string;
  quantity: string;
  purpose: string;
  purposeHi: string;
  status: 'active' | 'standby' | 'scheduled';
}

export type StockCategory = 'Electronics' | 'Industrial Tools' | 'Construction Raw' | 'FMCG & Packaging' | 'Cold Chain' | 'Automotive Spares';

export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved' | 'quarantine';

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  maxCapacity: number;
  zoneId: string;
  locationCode: string; // e.g. "WH-A03-L2" (Aisle A, Bay 03, Level 2)
  batchNumber: string;
  expiryDate?: string;
  weightKg: number;
  status: ItemStatus;
  lastScannedAt?: string;
  unitPrice: number;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  sku: string;
  itemName: string;
  barcode: string;
  type: 'INWARD' | 'PUTAWAY' | 'PICK' | 'DISPATCH' | 'AUDIT_ADJUST' | 'TRANSFER';
  quantity: number;
  fromLocation: string;
  toLocation: string;
  operator: string;
  notes: string;
}

export interface DockBay {
  id: string;
  bayNumber: number;
  name: string;
  status: 'available' | 'loading' | 'unloading' | 'maintenance';
  currentTruckNumber?: string;
  driverName?: string;
  manifestPo?: string;
  progress: number; // 0 - 100
  carrier: string;
  dockLevelerStatus: 'engaged' | 'retracted' | 'level';
  motorizedShutter: 'open' | 'closed' | 'transit';
}

export interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: string;
  raw?: any;
}
