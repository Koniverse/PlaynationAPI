export interface ExtrinsicSubscanResult {
  code: number,
  message: string,
  generated_at: number,
  data: ExtrinsicSubscanData,

}

export interface ExtrinsicSubscanData {
  blockTimestamp: number;
  blockNum: number;
  extrinsicIndex: string;
  callModuleFunction: string;
  callModule: string;
  accountId: string;
  signature: string;
  nonce: number;
  extrinsicHash: string;
  success: boolean;
  params: Param[];
  transfer: null;
  event: Event[];
  eventCount: number;
  fee: string;
  feeUsed: string;
  error: null;
  finalized: boolean;
  lifetime: Lifetime;
  tip: string;
  accountDisplay: AccountDisplay;
  blockHash: string;
  pending: boolean;
  subCalls: null;
}

export interface Param {
  name: string;
  type: string;
  typeName: string;
  value: string;
}

interface Event {
  eventIndex: string;
  blockNum: number;
  extrinsicIdx: number;
  moduleId: string;
  eventId: string;
  params: string;
  phase: number;
  eventIdx: number;
  extrinsicHash: string;
  finalized: boolean;
  blockTimestamp: number;
}

interface Lifetime {
  birth: number;
  death: number;
}

interface AccountDisplay {
  address: string;
}
