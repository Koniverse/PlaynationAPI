export interface AddressParams {
  address: string;
}

export interface CollectionParams {
  rmrkCollectionId: string;
}

export interface SignatureParams {
  signature: string;
}

export type getRandomCodeParams = AddressParams;

export type FetchMintParams = AddressParams;

export interface MintParams {
  requestId: number;
  recipient?: string;
  key?: string;
}

export interface CheckMintParams extends AddressParams {
  campaignId: number;
  userId?: number;
  signature?: string;
  category?: string;
  extrinsicHash?: string;
  additionalData?: any;
}

export interface ValidateExtrinsicParams {
  slug: string;
  network: string;
  extrinsicHash: string;
}

export interface SubmitFaucetParams extends AddressParams, SignatureParams {
  extension: string;
}


export enum DuplicateCheckType {
  NONE = 'none',
  COLLECTION = 'collection',
  CAMPAIGN = 'campaign',
  CATEGORY = 'category',
}

export interface VersionInfo {
  version: number
  minVersion?: number,
  updateMessage?: string
}

export interface RecordVersionInfo extends VersionInfo {
  id: number
  slug: string
}

export interface MaintenanceInfo {
  startTime: number
  endTime: number
  title: string
  message: string
}

export interface AppMetadata {
  lastUpdated: number
  maintenanceInfo?: MaintenanceInfo
  versions: {
    application: VersionInfo
    game?: VersionInfo
    leaderboard?: VersionInfo
    task?: VersionInfo
    achievement?: VersionInfo
    airdrop?: VersionInfo
  },
  recordVersions?: {
    game?: RecordVersionInfo[]
  }
}