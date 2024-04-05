import 'express-session';

declare module 'express-session' {
  interface SessionData {
    address: string; // Make it optional to ensure compatibility with sessions that might not have a userId set.
    time: Date;
  }
}