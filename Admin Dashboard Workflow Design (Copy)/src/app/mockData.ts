export interface Store {
  id: string;
  name: string;
  storeNumber: string;
  location: string;
  manager: string;
  compliance: number;
  nfcCount: number;
  activeAlerts: number;
  lastSync: string;
  tags: NFCTag[];
  alerts: Alert[];
  rounds: Round[];
  complianceHistory: ComplianceData[];
}

export interface NFCTag {
  id: string;
  uid: string;
  location: string;
  area: string;
  floor: string;
  zone: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'error' | 'warning' | 'deactivated';
  storeId: string;
  lastScanned?: string;
  registeredAt?: string;
  notes?: string;
}

export type AlertType = 'critical' | 'warning' | 'fraud';
export type AlertCategory = 'missing-round' | 'duplicate-scan' | 'gps-mismatch' | 'low-compliance' | 'too-quick';

export interface Alert {
  id: string;
  storeId: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  description: string;
  time: string;
  location?: string;
  staff?: string;
}

export interface ScanLog {
  id: string;
  location: string;
  time: string;
  status: 'verified' | 'missed' | 'pending';
  nfcUid: string;
  staff: string;
  compliance: number;
}

export interface Round {
  id: string;
  storeId: string;
  name: string;
  time: string;
  staff: string;
  compliance: number;
  totalScans: number;
  completedScans: number;
  scans: ScanLog[];
}

export interface ComplianceData {
  hour: string;
  done: number;
  missed: number;
}

export const stores: Store[] = [
  {
    id: 'store-042',
    name: 'FreshMart Superstore',
    storeNumber: '#042',
    location: 'Level 1, East Wing Mall',
    manager: 'James Okafor',
    compliance: 85,
    nfcCount: 12,
    activeAlerts: 5,
    lastSync: '2 min ago',
    complianceHistory: [
      { hour: '6AM', done: 4, missed: 1 },
      { hour: '7AM', done: 6, missed: 2 },
      { hour: '8AM', done: 7, missed: 1 },
      { hour: '9AM', done: 5, missed: 0 },
      { hour: '10AM', done: 8, missed: 2 },
      { hour: '11AM', done: 6, missed: 1 },
    ],
    tags: [
      { id: 't1',  uid: '04:A3:7F:2B:C1:88', location: 'Produce Section',     area: 'Aisle 1',   floor: 'Floor A', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-042', lastScanned: '09:37 AM' },
      { id: 't2',  uid: '04:B2:3C:1D:E5:22', location: 'Bakery Section',      area: 'Aisle 2',   floor: 'Floor A', zone: 'Retail',     priority: 'medium', status: 'active',  storeId: 'store-042', lastScanned: '09:15 AM' },
      { id: 't3',  uid: '04:C4:5E:3F:G7:44', location: 'Dairy – Aisle 3',    area: 'Aisle 3',   floor: 'Floor A', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-042', lastScanned: '09:00 AM' },
      { id: 't4',  uid: '04:D5:6F:4G:H8:55', location: 'Meat & Seafood',     area: 'Aisle 4',   floor: 'Floor A', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-042', lastScanned: '08:45 AM' },
      { id: 't5',  uid: '04:E6:7G:5H:I9:66', location: 'Restrooms – Level 1',area: 'Side',      floor: 'Floor A', zone: 'Facilities', priority: 'high',   status: 'active',  storeId: 'store-042', lastScanned: '08:32 AM' },
      { id: 't6',  uid: '04:F7:8H:6I:J0:77', location: 'Checkout Lanes 1–6', area: 'Front',     floor: 'Floor A', zone: 'Retail',     priority: 'medium', status: 'error',   storeId: 'store-042', lastScanned: '08:00 AM' },
      { id: 't7',  uid: '04:G8:9I:7J:K1:88', location: 'Beverages – Aisle 7',area: 'Aisle 7',  floor: 'Floor A', zone: 'Retail',     priority: 'low',    status: 'active',  storeId: 'store-042', lastScanned: '07:55 AM' },
      { id: 't8',  uid: '04:H9:0J:8K:L2:99', location: 'Frozen Foods',       area: 'Aisle 8',  floor: 'Floor A', zone: 'Storage',    priority: 'medium', status: 'active',  storeId: 'store-042', lastScanned: '07:30 AM' },
      { id: 't9',  uid: '04:I0:1K:9L:M3:00', location: 'Staff Break Room',   area: 'Back Area', floor: 'Floor B', zone: 'Facilities', priority: 'low',    status: 'active', storeId: 'store-042', registeredAt: 'Jun 10, 2026' },
      { id: 't10', uid: '04:J1:2L:0M:N4:11', location: 'Loading Dock',       area: 'Back Area', floor: 'Floor B', zone: 'Storage',    priority: 'medium', status: 'active', storeId: 'store-042', registeredAt: 'Jun 10, 2026' },
      { id: 't11', uid: '04:K2:3M:1N:O5:22', location: "Manager's Office",   area: 'Back Area', floor: 'Floor B', zone: 'Office',     priority: 'low',    status: 'active', storeId: 'store-042', registeredAt: 'Jun 10, 2026' },
      { id: 't12', uid: '04:L3:4N:2O:P6:33', location: 'Deli Counter',       area: 'Aisle 2',  floor: 'Floor A', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-042', lastScanned: '09:20 AM' },
    ],
    alerts: [
      {
        id: 'a1', storeId: 'store-042', type: 'critical', category: 'missing-round',
        title: 'Missing Round – Beverages Aisle 7',
        description: 'Morning Round #1 completed at 07:00 AM. No new round started after 75 min — exceeds 60-min threshold. Beverages Aisle 7 unattended.',
        time: '08:15 AM', location: 'Beverages Aisle 7',
      },
      {
        id: 'a2', storeId: 'store-042', type: 'critical', category: 'low-compliance',
        title: 'Low Compliance – Morning Round #2',
        description: 'Round completed with 58% compliance (7/12 checkpoints scanned). Below 75% threshold. Staff: Priya Nair.',
        time: '07:15 AM', staff: 'Priya Nair',
      },
      {
        id: 'a3', storeId: 'store-042', type: 'fraud', category: 'gps-mismatch',
        title: 'GPS Mismatch – Checkout Lane 3',
        description: 'Scan recorded but GPS is 45 m from the registered tag location. Possible fraudulent check-in.',
        time: '08:12 AM', location: 'Checkout Lanes 1–6',
      },
      {
        id: 'a4', storeId: 'store-042', type: 'warning', category: 'duplicate-scan',
        title: 'Duplicate Scan – Restrooms Level 1',
        description: 'Restrooms Level 1 scanned at 08:32 AM and again at 08:49 AM — only 17 min apart, within the 30-min duplicate window.',
        time: '08:49 AM', location: 'Restrooms – Level 1', staff: 'Maria Santos',
      },
      {
        id: 'a5', storeId: 'store-042', type: 'warning', category: 'missing-round',
        title: 'Missing Round – Checkout Lanes 1–6',
        description: 'Morning Round #3 completed at 09:37 AM. No new round started after 60 min. Next round is overdue.',
        time: '10:37 AM', location: 'Checkout Lanes 1–6',
      },
    ],
    rounds: [
      {
        id: 'r1', storeId: 'store-042', name: 'Morning Round #3', time: '09:37 AM', staff: 'Maria Santos', compliance: 75, totalScans: 12, completedScans: 9,
        scans: [
          { id: 's1',  location: 'Produce Section',     time: '08:00 AM', status: 'verified', nfcUid: '04:A3:7F', staff: 'Maria Santos', compliance: 100 },
          { id: 's2',  location: 'Bakery Section',      time: '08:10 AM', status: 'verified', nfcUid: '04:B2:3C', staff: 'Maria Santos', compliance: 100 },
          { id: 's3',  location: 'Dairy – Aisle 3',    time: '08:20 AM', status: 'verified', nfcUid: '04:C4:5E', staff: 'Maria Santos', compliance: 100 },
          { id: 's4',  location: 'Meat & Seafood',     time: '08:30 AM', status: 'verified', nfcUid: '04:D5:6F', staff: 'Maria Santos', compliance: 100 },
          { id: 's5',  location: 'Restrooms – Level 1',time: '08:40 AM', status: 'verified', nfcUid: '04:E6:7G', staff: 'Maria Santos', compliance: 100 },
          { id: 's6',  location: 'Checkout Lanes 1–6', time: '08:50 AM', status: 'missed',   nfcUid: '04:F7:8H', staff: 'Maria Santos', compliance: 0 },
          { id: 's7',  location: 'Beverages – Aisle 7',time: '09:00 AM', status: 'verified', nfcUid: '04:G8:9I', staff: 'Maria Santos', compliance: 100 },
          { id: 's8',  location: 'Frozen Foods',       time: '09:10 AM', status: 'verified', nfcUid: '04:H9:0J', staff: 'Maria Santos', compliance: 100 },
          { id: 's9',  location: 'Deli Counter',       time: '09:20 AM', status: 'verified', nfcUid: '04:L3:4N', staff: 'Maria Santos', compliance: 100 },
          { id: 's10', location: 'Staff Break Room',   time: '09:30 AM', status: 'pending',  nfcUid: '04:I0:1K', staff: 'Maria Santos', compliance: 0 },
          { id: 's11', location: 'Loading Dock',       time: '09:35 AM', status: 'pending',  nfcUid: '04:J1:2L', staff: 'Maria Santos', compliance: 0 },
          { id: 's12', location: "Manager's Office",   time: '09:40 AM', status: 'pending',  nfcUid: '04:K2:3M', staff: 'Maria Santos', compliance: 0 },
        ],
      },
      {
        id: 'r2', storeId: 'store-042', name: 'Morning Round #2', time: '07:15 AM', staff: 'Priya Nair', compliance: 58, totalScans: 12, completedScans: 7,
        scans: [
          { id: 's13', location: 'Produce Section',     time: '06:30 AM', status: 'verified', nfcUid: '04:A3:7F', staff: 'Priya Nair', compliance: 100 },
          { id: 's14', location: 'Bakery Section',      time: '06:40 AM', status: 'verified', nfcUid: '04:B2:3C', staff: 'Priya Nair', compliance: 100 },
          { id: 's15', location: 'Dairy – Aisle 3',    time: '06:50 AM', status: 'missed',   nfcUid: '04:C4:5E', staff: 'Priya Nair', compliance: 0 },
          { id: 's16', location: 'Meat & Seafood',     time: '07:00 AM', status: 'verified', nfcUid: '04:D5:6F', staff: 'Priya Nair', compliance: 100 },
          { id: 's17', location: 'Restrooms – Level 1',time: '07:05 AM', status: 'verified', nfcUid: '04:E6:7G', staff: 'Priya Nair', compliance: 100 },
          { id: 's18', location: 'Checkout Lanes 1–6', time: '07:10 AM', status: 'missed',   nfcUid: '04:F7:8H', staff: 'Priya Nair', compliance: 0 },
          { id: 's19', location: 'Beverages – Aisle 7',time: '07:12 AM', status: 'verified', nfcUid: '04:G8:9I', staff: 'Priya Nair', compliance: 100 },
          { id: 's20', location: 'Frozen Foods',       time: '07:14 AM', status: 'verified', nfcUid: '04:H9:0J', staff: 'Priya Nair', compliance: 100 },
          { id: 's21', location: 'Deli Counter',       time: '—',        status: 'missed',   nfcUid: '04:L3:4N', staff: 'Priya Nair', compliance: 0 },
          { id: 's22', location: 'Staff Break Room',   time: '—',        status: 'missed',   nfcUid: '04:I0:1K', staff: 'Priya Nair', compliance: 0 },
          { id: 's23', location: 'Loading Dock',       time: '—',        status: 'missed',   nfcUid: '04:J1:2L', staff: 'Priya Nair', compliance: 0 },
          { id: 's24', location: "Manager's Office",   time: '—',        status: 'missed',   nfcUid: '04:K2:3M', staff: 'Priya Nair', compliance: 0 },
        ],
      },
      {
        id: 'r0', storeId: 'store-042', name: 'Morning Round #1', time: '05:30 AM', staff: 'James Okafor', compliance: 92, totalScans: 12, completedScans: 11,
        scans: [
          { id: 'r0s1',  location: 'Produce Section',     time: '04:45 AM', status: 'verified', nfcUid: '04:A3:7F', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s2',  location: 'Bakery Section',      time: '04:55 AM', status: 'verified', nfcUid: '04:B2:3C', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s3',  location: 'Dairy – Aisle 3',    time: '05:05 AM', status: 'verified', nfcUid: '04:C4:5E', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s4',  location: 'Meat & Seafood',     time: '05:10 AM', status: 'verified', nfcUid: '04:D5:6F', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s5',  location: 'Restrooms – Level 1',time: '05:15 AM', status: 'verified', nfcUid: '04:E6:7G', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s6',  location: 'Checkout Lanes 1–6', time: '05:20 AM', status: 'missed',   nfcUid: '04:F7:8H', staff: 'James Okafor', compliance: 0 },
          { id: 'r0s7',  location: 'Beverages – Aisle 7',time: '05:22 AM', status: 'verified', nfcUid: '04:G8:9I', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s8',  location: 'Frozen Foods',       time: '05:25 AM', status: 'verified', nfcUid: '04:H9:0J', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s9',  location: 'Deli Counter',       time: '05:27 AM', status: 'verified', nfcUid: '04:L3:4N', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s10', location: 'Staff Break Room',   time: '05:28 AM', status: 'verified', nfcUid: '04:I0:1K', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s11', location: 'Loading Dock',       time: '05:29 AM', status: 'verified', nfcUid: '04:J1:2L', staff: 'James Okafor', compliance: 100 },
          { id: 'r0s12', location: "Manager's Office",   time: '05:30 AM', status: 'verified', nfcUid: '04:K2:3M', staff: 'James Okafor', compliance: 100 },
        ],
      },
    ],
  },
  {
    id: 'store-018',
    name: 'QuickShop Mall',
    storeNumber: '#018',
    location: 'Level 2, North Plaza',
    manager: 'Sara Thompson',
    compliance: 72,
    nfcCount: 8,
    activeAlerts: 5,
    lastSync: '5 min ago',
    complianceHistory: [
      { hour: '6AM', done: 3, missed: 2 },
      { hour: '7AM', done: 4, missed: 3 },
      { hour: '8AM', done: 5, missed: 2 },
      { hour: '9AM', done: 4, missed: 3 },
      { hour: '10AM', done: 6, missed: 2 },
      { hour: '11AM', done: 5, missed: 3 },
    ],
    tags: [
      { id: 't13', uid: '05:A1:2B:3C:4D:01', location: 'Entrance Hall',      area: 'Main',      floor: 'Floor 2', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-018', lastScanned: '09:10 AM' },
      { id: 't14', uid: '05:B2:3C:4D:5E:02', location: 'Electronics Section',area: 'Aisle A',   floor: 'Floor 2', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-018', lastScanned: '08:50 AM' },
      { id: 't15', uid: '05:C3:4D:5E:6F:03', location: 'Food Court',         area: 'Center',    floor: 'Floor 2', zone: 'Food',       priority: 'high',   status: 'active',  storeId: 'store-018', lastScanned: '08:30 AM' },
      { id: 't16', uid: '05:D4:5E:6F:7G:04', location: 'Restrooms East',     area: 'East Wing', floor: 'Floor 2', zone: 'Facilities', priority: 'high',   status: 'error',   storeId: 'store-018', lastScanned: '07:00 AM' },
      { id: 't17', uid: '05:E5:6F:7G:8H:05', location: 'Restrooms West',     area: 'West Wing', floor: 'Floor 2', zone: 'Facilities', priority: 'high',   status: 'active',  storeId: 'store-018', lastScanned: '08:45 AM' },
      { id: 't18', uid: '05:F6:7G:8H:9I:06', location: 'Parking Entrance',   area: 'Ground',    floor: 'Ground',  zone: 'Facilities', priority: 'medium', status: 'active',  storeId: 'store-018', lastScanned: '09:00 AM' },
      { id: 't19', uid: '05:G7:8H:9I:0J:07', location: 'Security Office',    area: 'Back',      floor: 'Floor 2', zone: 'Office',     priority: 'low',    status: 'active', storeId: 'store-018', registeredAt: 'Jun 12, 2026' },
      { id: 't20', uid: '05:H8:9I:0J:1K:08', location: 'Loading Bay',        area: 'Back',      floor: 'Ground',  zone: 'Storage',    priority: 'medium', status: 'active',  storeId: 'store-018', lastScanned: '08:15 AM' },
    ],
    alerts: [
      {
        id: 'a6', storeId: 'store-018', type: 'critical', category: 'missing-round',
        title: 'Missing Round – Restrooms East',
        description: 'Morning Round #1 completed at 07:00 AM. No new round started after 3 hours — far exceeds 60-min threshold. Restrooms East unattended.',
        time: '08:00 AM', location: 'Restrooms East',
      },
      {
        id: 'a7', storeId: 'store-018', type: 'warning', category: 'low-compliance',
        title: 'Low Compliance – Morning Round #2',
        description: 'Round completed with 60% compliance (5/8 checkpoints). Below 75% threshold. Food Court and Electronics Section unscanned.',
        time: '09:10 AM', location: 'Food Court',
      },
      {
        id: 'a8', storeId: 'store-018', type: 'fraud', category: 'gps-mismatch',
        title: 'GPS Mismatch – Parking Entrance',
        description: 'Scan recorded at Parking Entrance but GPS coordinates are 30 m from the registered tag position. Possible fraudulent check-in.',
        time: '09:00 AM', location: 'Parking Entrance',
      },
      {
        id: 'a9', storeId: 'store-018', type: 'warning', category: 'duplicate-scan',
        title: 'Duplicate Scan – Loading Bay',
        description: 'Loading Bay scanned at 08:15 AM and again at 08:38 AM — only 23 min apart, within the 30-min duplicate window.',
        time: '08:38 AM', location: 'Loading Bay', staff: 'Tom Lee',
      },
      {
        id: 'a10', storeId: 'store-018', type: 'warning', category: 'too-quick',
        title: 'Round Too Quick – Morning Round #3',
        description: 'Morning Round #3 was completed in approximately 12 minutes (8 checkpoints in 12 min). Minimum expected round duration is 30 minutes. Scans may have been made without proper physical presence at each location.',
        time: '10:12 AM', staff: 'Tom Lee',
      },
    ],
    rounds: [
      {
        id: 'r3', storeId: 'store-018', name: 'Morning Round #2', time: '09:10 AM', staff: 'Tom Lee', compliance: 63, totalScans: 8, completedScans: 5,
        scans: [
          { id: 's25', location: 'Entrance Hall',      time: '08:00 AM', status: 'verified', nfcUid: '05:A1:2B', staff: 'Tom Lee', compliance: 100 },
          { id: 's26', location: 'Electronics Section',time: '08:20 AM', status: 'missed',   nfcUid: '05:B2:3C', staff: 'Tom Lee', compliance: 0 },
          { id: 's27', location: 'Food Court',         time: '08:40 AM', status: 'verified', nfcUid: '05:C3:4D', staff: 'Tom Lee', compliance: 100 },
          { id: 's28', location: 'Restrooms East',     time: '09:00 AM', status: 'missed',   nfcUid: '05:D4:5E', staff: 'Tom Lee', compliance: 0 },
          { id: 's29', location: 'Restrooms West',     time: '09:10 AM', status: 'verified', nfcUid: '05:E5:6F', staff: 'Tom Lee', compliance: 100 },
          { id: 's30', location: 'Parking Entrance',   time: '09:20 AM', status: 'verified', nfcUid: '05:F6:7G', staff: 'Tom Lee', compliance: 100 },
          { id: 's31', location: 'Security Office',    time: '09:30 AM', status: 'missed',   nfcUid: '05:G7:8H', staff: 'Tom Lee', compliance: 0 },
          { id: 's32', location: 'Loading Bay',        time: '09:40 AM', status: 'verified', nfcUid: '05:H8:9I', staff: 'Tom Lee', compliance: 100 },
        ],
      },
      {
        id: 'r3c', storeId: 'store-018', name: 'Morning Round #3', time: '10:12 AM', staff: 'Tom Lee', compliance: 100, totalScans: 8, completedScans: 8,
        scans: [
          { id: 'r3cs1', location: 'Entrance Hall',      time: '10:00 AM', status: 'verified', nfcUid: '05:A1:2B', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs2', location: 'Electronics Section',time: '10:01 AM', status: 'verified', nfcUid: '05:B2:3C', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs3', location: 'Food Court',         time: '10:03 AM', status: 'verified', nfcUid: '05:C3:4D', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs4', location: 'Restrooms East',     time: '10:05 AM', status: 'verified', nfcUid: '05:D4:5E', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs5', location: 'Restrooms West',     time: '10:06 AM', status: 'verified', nfcUid: '05:E5:6F', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs6', location: 'Parking Entrance',   time: '10:08 AM', status: 'verified', nfcUid: '05:F6:7G', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs7', location: 'Security Office',    time: '10:10 AM', status: 'verified', nfcUid: '05:G7:8H', staff: 'Tom Lee', compliance: 100 },
          { id: 'r3cs8', location: 'Loading Bay',        time: '10:12 AM', status: 'verified', nfcUid: '05:H8:9I', staff: 'Tom Lee', compliance: 100 },
        ],
      },
      {
        id: 'r3b', storeId: 'store-018', name: 'Morning Round #1', time: '07:00 AM', staff: 'Sara Thompson', compliance: 88, totalScans: 8, completedScans: 7,
        scans: [
          { id: 'r3bs1', location: 'Entrance Hall',      time: '06:10 AM', status: 'verified', nfcUid: '05:A1:2B', staff: 'Sara Thompson', compliance: 100 },
          { id: 'r3bs2', location: 'Electronics Section',time: '06:20 AM', status: 'verified', nfcUid: '05:B2:3C', staff: 'Sara Thompson', compliance: 100 },
          { id: 'r3bs3', location: 'Food Court',         time: '06:30 AM', status: 'verified', nfcUid: '05:C3:4D', staff: 'Sara Thompson', compliance: 100 },
          { id: 'r3bs4', location: 'Restrooms East',     time: '06:40 AM', status: 'missed',   nfcUid: '05:D4:5E', staff: 'Sara Thompson', compliance: 0 },
          { id: 'r3bs5', location: 'Restrooms West',     time: '06:50 AM', status: 'verified', nfcUid: '05:E5:6F', staff: 'Sara Thompson', compliance: 100 },
          { id: 'r3bs6', location: 'Parking Entrance',   time: '06:55 AM', status: 'verified', nfcUid: '05:F6:7G', staff: 'Sara Thompson', compliance: 100 },
          { id: 'r3bs7', location: 'Security Office',    time: '06:58 AM', status: 'verified', nfcUid: '05:G7:8H', staff: 'Sara Thompson', compliance: 100 },
          { id: 'r3bs8', location: 'Loading Bay',        time: '07:00 AM', status: 'verified', nfcUid: '05:H8:9I', staff: 'Sara Thompson', compliance: 100 },
        ],
      },
    ],
  },
  {
    id: 'store-031',
    name: 'CityMart Express',
    storeNumber: '#031',
    location: 'Ground Floor, Central Station',
    manager: 'Ana Rivera',
    compliance: 91,
    nfcCount: 6,
    activeAlerts: 2,
    lastSync: '1 min ago',
    complianceHistory: [
      { hour: '6AM', done: 5, missed: 0 },
      { hour: '7AM', done: 6, missed: 1 },
      { hour: '8AM', done: 6, missed: 0 },
      { hour: '9AM', done: 5, missed: 1 },
      { hour: '10AM', done: 6, missed: 0 },
      { hour: '11AM', done: 6, missed: 0 },
    ],
    tags: [
      { id: 't21', uid: '06:A1:B2:C3:D4:01', location: 'Main Entrance',   area: 'Front',  floor: 'Ground', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-031', lastScanned: '09:30 AM' },
      { id: 't22', uid: '06:B2:C3:D4:E5:02', location: 'Express Checkout',area: 'Center', floor: 'Ground', zone: 'Retail',     priority: 'high',   status: 'active',  storeId: 'store-031', lastScanned: '09:15 AM' },
      { id: 't23', uid: '06:C3:D4:E5:F6:03', location: 'Fresh Produce',   area: 'Aisle 1',floor: 'Ground', zone: 'Retail',     priority: 'medium', status: 'active',  storeId: 'store-031', lastScanned: '09:00 AM' },
      { id: 't24', uid: '06:D4:E5:F6:G7:04', location: 'Restroom',        area: 'Side',   floor: 'Ground', zone: 'Facilities', priority: 'high',   status: 'active',  storeId: 'store-031', lastScanned: '08:45 AM' },
      { id: 't25', uid: '06:E5:F6:G7:H8:05', location: 'Staff Room',      area: 'Back',   floor: 'Ground', zone: 'Facilities', priority: 'low',    status: 'active',  storeId: 'store-031', lastScanned: '08:30 AM' },
      { id: 't26', uid: '06:F6:G7:H8:I9:06', location: 'Storage Room',    area: 'Back',   floor: 'Ground', zone: 'Storage',    priority: 'medium', status: 'warning', storeId: 'store-031', lastScanned: '07:00 AM' },
    ],
    alerts: [
      {
        id: 'a11', storeId: 'store-031', type: 'warning', category: 'low-compliance',
        title: 'Low Compliance – Morning Round #1',
        description: 'Round completed with 70% compliance (4/6 checkpoints). Restroom and Storage Room missed. Below 75% threshold.',
        time: '07:00 AM', location: 'Storage Room',
      },
      {
        id: 'a12', storeId: 'store-031', type: 'warning', category: 'duplicate-scan',
        title: 'Duplicate Scan – Main Entrance',
        description: 'Main Entrance scanned at 09:30 AM and again at 09:52 AM — only 22 min apart, within the 30-min duplicate window.',
        time: '09:52 AM', location: 'Main Entrance',
      },
    ],
    rounds: [
      {
        id: 'r4', storeId: 'store-031', name: 'Morning Round #2', time: '09:30 AM', staff: 'Ana Rivera', compliance: 83, totalScans: 6, completedScans: 5,
        scans: [
          { id: 's33', location: 'Main Entrance',   time: '08:45 AM', status: 'verified', nfcUid: '06:A1:B2', staff: 'Ana Rivera', compliance: 100 },
          { id: 's34', location: 'Express Checkout',time: '08:55 AM', status: 'verified', nfcUid: '06:B2:C3', staff: 'Ana Rivera', compliance: 100 },
          { id: 's35', location: 'Fresh Produce',   time: '09:05 AM', status: 'verified', nfcUid: '06:C3:D4', staff: 'Ana Rivera', compliance: 100 },
          { id: 's36', location: 'Restroom',        time: '09:15 AM', status: 'verified', nfcUid: '06:D4:E5', staff: 'Ana Rivera', compliance: 100 },
          { id: 's37', location: 'Staff Room',      time: '09:25 AM', status: 'verified', nfcUid: '06:E5:F6', staff: 'Ana Rivera', compliance: 100 },
          { id: 's38', location: 'Storage Room',    time: '09:30 AM', status: 'missed',   nfcUid: '06:F6:G7', staff: 'Ana Rivera', compliance: 0 },
        ],
      },
      {
        id: 'r4b', storeId: 'store-031', name: 'Morning Round #1', time: '07:00 AM', staff: 'Ana Rivera', compliance: 70, totalScans: 6, completedScans: 4,
        scans: [
          { id: 'r4bs1', location: 'Main Entrance',   time: '05:30 AM', status: 'verified', nfcUid: '06:A1:B2', staff: 'Ana Rivera', compliance: 100 },
          { id: 'r4bs2', location: 'Express Checkout',time: '05:45 AM', status: 'verified', nfcUid: '06:B2:C3', staff: 'Ana Rivera', compliance: 100 },
          { id: 'r4bs3', location: 'Fresh Produce',   time: '06:00 AM', status: 'verified', nfcUid: '06:C3:D4', staff: 'Ana Rivera', compliance: 100 },
          { id: 'r4bs4', location: 'Restroom',        time: '06:30 AM', status: 'missed',   nfcUid: '06:D4:E5', staff: 'Ana Rivera', compliance: 0 },
          { id: 'r4bs5', location: 'Staff Room',      time: '06:45 AM', status: 'verified', nfcUid: '06:E5:F6', staff: 'Ana Rivera', compliance: 100 },
          { id: 'r4bs6', location: 'Storage Room',    time: '07:00 AM', status: 'missed',   nfcUid: '06:F6:G7', staff: 'Ana Rivera', compliance: 0 },
        ],
      },
    ],
  },
];

export const globalComplianceHistory: ComplianceData[] = [
  { hour: '6AM', done: 12, missed: 3 },
  { hour: '7AM', done: 16, missed: 6 },
  { hour: '8AM', done: 18, missed: 3 },
  { hour: '9AM', done: 14, missed: 4 },
  { hour: '10AM', done: 20, missed: 4 },
  { hour: '11AM', done: 17, missed: 4 },
];

export const totalAlertCount = stores.reduce((sum, s) => sum + s.alerts.length, 0);
