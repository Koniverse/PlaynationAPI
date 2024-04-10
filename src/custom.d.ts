import 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: number;
      address: string;
      loginTime: number;
    };
  }
}