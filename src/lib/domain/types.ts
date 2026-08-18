// Core domain model for the Oil & Gas Weather & Asset Risk platform.
// Deliberately provider-agnostic: mock providers and future Azure providers
// (Planetary Computer Pro, Aurora/ECMWF, AI Foundry) implement the same shapes.

export type AssetType =
  | "offshore_platform"
  | "pipeline"
  | "well"
  | "refinery"
  | "lng_terminal"
  | "storage"
  | "port";

export type RiskLevel = "normal" | "monitor" | "elevated" | "high" | "critical";

export type OperatingStatus = "producing" | "reduced" | "shut_in" | "evacuating" | "standby";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  lat: number;
  lon: number;
  /** Optional line geometry for pipelines / corridors. */
  geometry?: Array<[number, number]>;
  operator: string;
  region: string;
  businessUnit: string;
  status: OperatingStatus;
  criticality: "standard" | "important" | "business_critical";
  metadata: Record<string, string | number>;
}

export interface ForecastPoint {
  /** Hours from the current analysis time. */
  hour: number;
  lat: number;
  lon: number;
  /** Sustained wind, mph. */
  windMph: number;
  /** Radius of the uncertainty cone, in miles. */
  coneRadiusMi: number;
  category: number;
  pressureMb: number;
}

export interface WeatherEvent {
  id: string;
  name: string;
  kind: "hurricane" | "tropical_storm" | "severe_convective" | "flood";
  status: string;
  basin: string;
  currentCategory: number;
  currentWindMph: number;
  gustMph: number;
  pressureMb: number;
  movementDeg: number;
  movementMph: number;
  lat: number;
  lon: number;
  confidence: "low" | "moderate" | "high";
  modelSource: string;
  updatedAtIso: string;
  expectedLandfall: string;
  history: Array<[number, number]>;
  forecast: ForecastPoint[];
}

export interface RiskFactor {
  label: string;
  detail: string;
  points: number;
}

export interface AssetRisk {
  assetId: string;
  score: number;
  level: RiskLevel;
  eventId: string | null;
  distanceMi: number;
  forecastWindMph: number;
  rainfallIn: number;
  hoursToImpact: number | null;
  insideCone: boolean;
  factors: RiskFactor[];
  recommendations: string[];
}

export type AlertSeverity = "info" | "advisory" | "warning" | "critical";

export interface OpsAlert {
  id: string;
  title: string;
  detail: string;
  severity: AlertSeverity;
  assetId?: string;
  eventId?: string;
  status: "open" | "acknowledged" | "resolved";
  owner: string;
  createdAtIso: string;
}

export interface CopilotCitation {
  label: string;
  kind: "asset" | "event" | "risk" | "alert" | "dataset";
  refId?: string;
}

export interface CopilotAnswer {
  text: string;
  citations: CopilotCitation[];
  /** Assets the map should highlight for this answer. */
  highlightAssetIds: string[];
}

export interface GeospatialLayer {
  id: string;
  name: string;
  /** Operator-facing description — never STAC/Azure jargon. */
  description: string;
  updatedLabel: string;
  defaultOn: boolean;
}
