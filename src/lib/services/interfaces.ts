// Service interfaces. Mock providers ship by default; Azure-backed providers
// (Planetary Computer Pro, Aurora/ECMWF, AI Foundry, Fabric, Blob Storage)
// implement the same contracts so the UI never changes.

import type {
  Asset,
  AssetRisk,
  CopilotAnswer,
  GeospatialLayer,
  OpsAlert,
  WeatherEvent,
} from "@/lib/domain/types";

export interface AssetService {
  listAssets(): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | null>;
}

export interface WeatherService {
  /** Provider label surfaced to operators in plain language. */
  readonly providerLabel: string;
  listEvents(): Promise<WeatherEvent[]>;
  getEvent(id: string): Promise<WeatherEvent | null>;
}

export interface RiskEngineService {
  scoreEstate(horizonHours?: number): Promise<AssetRisk[]>;
  scoreOne(assetId: string, horizonHours?: number): Promise<AssetRisk | null>;
}

export interface AlertService {
  listAlerts(): Promise<OpsAlert[]>;
  setStatus(id: string, status: OpsAlert["status"]): Promise<OpsAlert[]>;
}

export interface PlanetaryComputerService {
  /** Operator-facing geospatial layers; catalog mechanics stay hidden. */
  listLayers(): Promise<GeospatialLayer[]>;
}

export interface CopilotService {
  ask(question: string): Promise<CopilotAnswer>;
  suggestions(): string[];
}

export interface PlatformServices {
  assets: AssetService;
  weather: WeatherService;
  risk: RiskEngineService;
  alerts: AlertService;
  geospatial: PlanetaryComputerService;
  copilot: CopilotService;
}
