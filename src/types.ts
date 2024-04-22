export enum AccountType {
    SUBSTRATE = 'substrate',
    ETHEREUM = 'ethereum'
}

export enum NetworkType {
    SUBSTRATE = 'substrate',
    ETHEREUM = 'ethereum'
}

export enum RequirementType {
    SIGNATURE = 'signature',
    BALANCE = 'balance',
    STAKING = 'staking',
    NONE = 'none'
}

export enum NftMintRequestStatus {
    CHECKED = 'checked',
    MINTING = 'minting',
    SUCCESS = 'success',
    EXPIRED = 'expired',
    FAILED = 'failed'
}

export interface RMRKMintInput {
    collection: string;
    symbol: string;
    transferable: number;
    sn: string;
    metadata: string;
}

export interface RMRKMetadata {
  description: string,
  external_url?: string,
  properties?: any,
  name: string,
  mediaUri: string,
  thumbnailUri?: string,
  image?: string,
}
export interface RMRKCollectionInfo {
    id: string;
    block: number;
    metadata: string;
    issuer: string;
    symbol: string;
    max: number;
    metadataContent?: RMRKMetadata;
}

export interface SimpleBalanceItem {
    network: string,
    free?: string;
    reserved?: string;
    frozen?: string;
    flags?: string;
}

export interface SubscanBalanceItem {
    network: string,
    symbol: string,
    decimal: number,
    price: string,
    category: string,
    balance: string,
    locked: string,
    reserved: string,
    bonded: string,
    unbonding: string,
    democracy_lock: string,
    election_lock: string,
    nomination_bonded: string,
    token_unique_id: string
}

export interface SubscanExtrinsicItem {
    account_id: string,
    success: boolean,
    block_timestamp: number,
    block_num: number,
    extrinsic_index: string,
    extrinsic_hash: string,
    fee: number,
    fee_used: number,
    error: boolean,
    finalized: boolean,
}

export interface SubscanResponse<T> {
    code: number,
    data: T,
    message: string,
    generated_at: number
}

export interface ExtrinsicEventData {
    id: string;
    blockNumber?: number;
    blockHash?: string;
    extrinsicHash?: string;
}

export interface ChainServiceEventMap {
    'extrinsic_add': (eData: ExtrinsicEventData) => void ;
    'extrinsic_success': (eData: ExtrinsicEventData) => void ;
    'extrinsic_error': (eData: ExtrinsicEventData) => void ;
}
export enum ExtensionAccountType {
    SUBWALLET = 'subwallet',
    POLKADOT = 'polkadotjs',
}

export interface TelegramResponse<T> {
    ok: boolean,
    result: T,
}
export interface TelegramFile {
    file_id: string,
    file_size?: number,
    width?: number,
    height?: number,
    file_unique_id: string,
    file_path?: string
}
export interface TelegramUserProfilePhotos {
    photos: TelegramFile[][],
    total_count: number
}
