import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import EnvVars from '@src/constants/EnvVars';
import {IReq} from '@src/routes/types';


export function requireLogin(req: IReq<any>, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  jwt.verify(token, EnvVars.Jwt.Secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = decoded as {id: number, address: string, loginTime: number};
    return next();
  });
}

export function requireSecret(req: IReq<any>, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (token !== EnvVars.Secret.Token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export function requireChainSecret(req: IReq<any>, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (token !== EnvVars.ChainService.Token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export function getUserAddress(req: IReq<any>) {
  req.user?.address;
}
