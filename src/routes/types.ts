import * as e from 'express';
import {Query} from 'express-serve-static-core';
import {AddressParams, CollectionParams, SignatureParams} from '@src/services/type';

// **** Express **** //

export interface IQuery<T extends e.Request['query']> extends e.Request {
  query: T;
}

export interface IReq<T = void> extends e.Request {
  body: T;
}

export type IRes = e.Response;

export interface AddressQuery extends AddressParams, Query {}

export interface CollectionQuery extends Partial<CollectionParams>, Query {}

export interface SignatureQuery extends SignatureParams, Query {}