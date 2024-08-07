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
export type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML';
export interface TelegramParams {
  caption?: string; // Text content of the notification
  photo?: string; // URL to an image
  chatId?: number; // Chat identifier (likely specific to the platform)
  parse_mode: ParseMode; // Indicates HTML formatting for caption
  reply_markup?: ReplyMarkup; // Object containing button details
  user_id?: number;
  file_id?: string;
  message?: string;
}

// Interface for the inline keyboard layout
export interface ReplyMarkup {
  inline_keyboard: InlineKeyboardButton[][]; // Array of rows of buttons
}

// Interface for individual buttons within the inline keyboard
export interface InlineKeyboardButton {
  text: string; // Text displayed on the button
  webApp: {
    url: string; // URL of the web app to open when clicked
  };
}

export interface EventSubmissionsResponse {
    data: EventSubmissionsData;
    errors: any[];
}

export interface EventSubmissionsData {
    eventSubmissions: EventSubmissions;
}

export interface EventSubmissions {
    data:  EventSubmissionsItem[];
    total: number;
}

export interface EventSubmissionsItem {
    id:          string;
    points:      number;
    xp:          number;
    taskId:      string;
    userId:      string;
    auth:        Auth;
    provider:    null;
    providerId:  null;
    status:      string;
    primaryAuth: Auth;
    hashedIp:    null;
}

export interface Auth {
    provider:   string;
    providerId: string;
    userId:     string;
    username:   string;
}
export interface MeResponse {
  data: MeData;
}
interface MeData {
  me: AirlyftMe;
}
interface AirlyftMe {
  createdAt: string;
  updatedAt: string;
  id: string;
  firstName: string;
  lastName: string;
  email?: any;
  avatar?: any;
  auth: Auth[];
  onboarded: any[];
  auths: Auth2[];
}
interface Auth2 {
  userId: string;
  verified: boolean;
}

export interface LeaderboardContentCms {
  data: LeaderboardItem[];
  leaderboard_general: LeaderboardGeneral[];
}
export interface LeaderboardGeneral {
  leaderboardGroupId: number;
  leaderboardGroupName: string;
  leaderboards: LeaderboardItem[];
}


export interface LeaderboardMetadata {
    refLevel?: number;
}

export interface LeaderboardItem {
  id: number;
  name: string;
  slug: string;
  type: string;
  specialTime: string;
  startTime?: any;
  endTime?: any;
  metadata?: LeaderboardMetadata;
  games: number[];
  tasks: number[];
}

export interface ChainData {
  address: string;
  seedPhrase: string;
  minimumBalance: number;
  estimatedFee: number;
}