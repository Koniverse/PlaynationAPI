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

interface ZealyUser {
    id: string;
    name: string;
    avatar: string | null;
}

interface ZealyTask {
    value: string;
    id: string;
    createdAt: string;
    status: 'pending' | 'success' | 'fail' | 'in-review';
    type: string;
    settings: Settings;
    requestId?: string;
    statusCode?: number;
    response?: string;
}

interface ItemQuest {
    id: string;
    user: ZealyUser;
    quest: Quest;
    status: 'pending' | 'success' | 'fail' | 'in-review';
    mark: string | null;
    createdAt: string;
    updatedAt: string;
    lastReviewerId: string | null;
    autoValidated: boolean;
    tasks: ZealyTask[];
}

export interface ResponseZealy {
    items: ItemQuest[];
}

export interface WebhookZealy {
    id:     string;
    type:   string;
    data:   Data;
    time:   number;
    secret: string;
}

export interface Data {
    community:  Community;
    user:       User;
    quest:      Quest;
    taskInputs: TaskInput[];
    status:     string;
}

export interface Community {
    id:         string;
    name:       string;
    subdomain:  string;
    website:    null;
    twitter:    string;
    discord:    null;
    opensea:    null;
    blockchain: string;
}

export interface Quest {
    id:             string;
    name:           string;
    autoValidate:   boolean;
    published:      boolean;
    categoryId:     string;
    tasks:          Task[];
    xp:             number;
    lastReviewerId: null;
    claimId:        string;
    categoryName:   string;
}

export interface Task {
    id:       string;
    type:     string;
    input:    Input;
    settings: Settings;
}

export interface Settings {
    title:         string;
    description:   string;
    autoValidated: boolean;
}

export interface TaskInput {
    taskId:   string;
    taskType: string;
    input:    Input;
}

export interface Input {
    value: string;
}

export interface User {
    id:        string;
    name:      string;
    addresses: any;
    twitter:   Twitter;
    discord:   Discord;
    email:     string;
}
export interface Discord {
    id:     string;
    handle: string;
}

export interface Twitter {
    id:       string;
    username: string;
}
