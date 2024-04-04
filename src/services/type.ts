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
