
/**
 * Mock data for GPS provider uploads
 */

export interface UploadHistory {
  id: number;
  filename: string;
  uploadDate: string;
  chassisCount: number;
  status: "processed" | "processing" | "error";
}

export interface GpsData {
  chassisId: string;
  timestamp: string;
  location: string;
  coordinates: string;
  speed: string;
  notes: string;
}

export interface Document {
  id: number;
  filename: string;
  uploadDate: string;
  fileType: string;
  size: string;
  tags: string[];
}

/**
 * Generate mock data for previous uploads
 */
export const generatePreviousUploads = (providerName: string): UploadHistory[] => [
  {
    id: 1,
    filename: `${providerName}_export_20250409.csv`,
    uploadDate: "2025-04-09 08:23 AM",
    chassisCount: 45,
    status: "processed"
  },
  {
    id: 2,
    filename: `${providerName}_export_20250408.csv`,
    uploadDate: "2025-04-08 10:15 AM",
    chassisCount: 42,
    status: "processed"
  },
  {
    id: 3,
    filename: `${providerName}_export_20250407.csv`,
    uploadDate: "2025-04-07 09:30 AM",
    chassisCount: 44,
    status: "processed"
  }
];

/**
 * Mock data for extracted GPS data
 */
export const extractedGpsData: GpsData[] = [
  {
    chassisId: "CMAU1234567",
    timestamp: "2025-04-09 07:53 AM",
    location: "Savannah, GA",
    coordinates: "32.0835° N, 81.0998° W",
    speed: "0 mph",
    notes: "Parked at terminal"
  },
  {
    chassisId: "TCLU7654321",
    timestamp: "2025-04-09 07:42 AM",
    location: "Savannah, GA",
    coordinates: "32.0883° N, 81.1024° W",
    speed: "5 mph",
    notes: "Moving in yard"
  },
  {
    chassisId: "FSCU5555123",
    timestamp: "2025-04-09 07:38 AM",
    location: "Savannah, GA",
    coordinates: "32.0923° N, 81.1054° W",
    speed: "25 mph",
    notes: "In transit"
  },
  {
    chassisId: "NYKU9876543",
    timestamp: "2025-04-09 07:29 AM",
    location: "Savannah, GA",
    coordinates: "32.1027° N, 81.1135° W",
    speed: "45 mph",
    notes: "On highway"
  },
  {
    chassisId: "APHU1122334",
    timestamp: "2025-04-09 07:15 AM",
    location: "Savannah, GA",
    coordinates: "32.1233° N, 81.1278° W",
    speed: "0 mph",
    notes: "Parked at yard"
  }
];

/**
 * Generate mock data for documents
 */
export const generateDocuments = (providerName: string): Document[] => [
  {
    id: 1,
    filename: `${providerName}_Manual_2025.pdf`,
    uploadDate: "2025-04-09",
    fileType: "manual",
    size: "2.4 MB",
    tags: ["manual", "documentation", "2025"]
  },
  {
    id: 2,
    filename: `${providerName}_APISpec_v2.pdf`,
    uploadDate: "2025-03-25",
    fileType: "api",
    size: "1.1 MB",
    tags: ["api", "technical", "spec"]
  },
  {
    id: 3,
    filename: `${providerName}_Installation_Guide.pdf`,
    uploadDate: "2025-02-18",
    fileType: "guide",
    size: "3.7 MB",
    tags: ["installation", "guide"]
  }
];
