import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {User} from '@src/models';
import {v4} from 'uuid';
import {isAddress, isEthereumAddress} from '@polkadot/util-crypto';
import {AccountType} from '@src/types';

export class UserService {
  constructor(private sequelizeService: SequelizeService) {

  }

  public async findByAddress(address: string) {
    return await User.findOne({where: {address}});
  }

  public async requestUserWithRandomCode(address: string) {
    if (!isAddress(address)) {
      throw new Error('Invalid address');
    }

    // Wait for db to be ready
    await this.sequelizeService.syncAll();

    const existed = await this.findByAddress(address);

    // If user already existed, return random code
    if (existed) {
      return existed;
    } else {
      // If user not existed, create new user
      const randomCode = v4();
      return await User.create({
        address,
        randomCode,
        name: address,
        type: isEthereumAddress(address) ? AccountType.ETHEREUM : AccountType.SUBSTRATE,
      });
    }
  }
}

export const UserServiceImpl = new UserService(SequelizeServiceImpl);