export interface ExtrinsicSubscanResult {
  code: number,
  message: string,
  generated_at: number,
  data: ExtrinsicSubscanData,

}

export interface ExtrinsicSubscanData {
  block_timestamp: number;
  block_num: number;
  extrinsic_index: string;
  call_module_function: string;
  call_module: string;
  account_id: string;
  signature: string;
  nonce: number;
  extrinsic_hash: string;
  success: boolean;
  params: Param[];
  transfer: null;
  event: Event[];
  event_count: number;
  fee: string;
  feeUsed: string;
  error: null;
  finalized: boolean;
  lifetime: Lifetime;
  tip: string;
  account_display: AccountDisplay;
  block_hash: string;
  pending: boolean;
  subCalls: null;
}

export interface Param {
  name: string;
  type: string;
  type_name: string;
  value: string;
}

interface Event {
  event_index: string;
  block_num: number;
  extrinsic_idx: number;
  module_id: string;
  event_id: string;
  params: string;
  phase: number;
  event_idx: number;
  extrinsic_hash: string;
  finalized: boolean;
  block_timestamp: number;
}

interface Lifetime {
  birth: number;
  death: number;
}

interface AccountDisplay {
  address: string;
}
