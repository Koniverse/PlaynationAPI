import {BalanceService, BalanceServiceImpl} from '@src/services/BalanceService';
import NftMintRequest from '@src/models/NftMintRequest';
import {CheckMintParams, DuplicateCheckType, MintParams, ValidateExtrinsicParams} from '@src/services/type';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {
  NftMintRequestStatus,
  RMRKMetadata,
  SubscanBalanceItem,
  SubscanExtrinsicItem,
  SubscanResponse,
} from '@src/types';
import {NftCampaign, NftCollection, User} from '@src/models';
import {Op} from 'sequelize';
import {validateSignature} from '@src/utils';
import RMRKServiceImpl from '@src/services/RMRKService';
import {decodeAddress, encodeAddress, isAddress} from '@polkadot/util-crypto';
import {UserServiceImpl} from '@src/services/UserService';
import fetch from 'node-fetch';
import EnvVars from '@src/constants/EnvVars';
import {getMetadata} from '@src/utils/ipfs';


const NETWORK_MAP: Record<string, string> = {
  'bifrost_dot': 'bifrost',
};

export class MintService {
  public constructor(private balanceService: BalanceService) {

  }

  public async validateExtrinsic(network: string, extrinsicHash: string, address: string) {
    try {
      const add1 = encodeAddress(decodeAddress(address), 42);

      const subscanUrl = EnvVars.SUBSCAN_URL.replace('polkadot', NETWORK_MAP[network] || network);
      const rs = await fetch(
        `${subscanUrl}/api/scan/extrinsic`,
        {
          headers: {
            ...EnvVars.SUBSCAN_HEADER,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({hash: extrinsicHash}),
        }).then(response => response.json()) as SubscanResponse<SubscanExtrinsicItem>;

      if (!rs?.data) {
        return false;
      }

      console.log(rs.data);

      // Not allow extrinsic older than 30 minutes
      if (((new Date()).getTime() / 1000 - (rs.data.block_timestamp || 0)) > 1800) {
        return false;
      }

      const add2 = rs.data.account_id = encodeAddress(decodeAddress(rs.data.account_id), 42);

      return add1 === add2;
    } catch (e) {
      console.error(e);
      
      return false;
    }
  }

  private async findAllSuccessOrMinting(props: Omit<Partial<NftMintRequest>, 'status'>) {
    await SequelizeServiceImpl.syncAll();
    return await NftMintRequest.findAll({
      where: {
        ...props,
        status: {
          [Op.in]: [NftMintRequestStatus.MINTING, NftMintRequestStatus.SUCCESS],
        },
      },
    });
  }

  private async findOneChecked(props: Omit<Partial<NftMintRequest>, 'status'>) {
    await SequelizeServiceImpl.syncAll();
    return await NftMintRequest.findOne({where: {...props, status: NftMintRequestStatus.CHECKED}});
  }

  public async fetch(address: string, rmrkCollectionId?: string) {
    await SequelizeServiceImpl.syncAll();

    // Create fetch params
    const fetchParams: Omit<Partial<NftMintRequest>, 'status'> = {address};
    if (rmrkCollectionId) {
      const collection = await NftCollection.findOne({where: {rmrkCollectionId}});
      if (!collection) {
        return [];
      }
      fetchParams.collectionId = collection.id;
    }

    const queryRs = await this.findAllSuccessOrMinting(fetchParams);

    return queryRs.map((item) => {
      // Fill out signature
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {signature, balanceData, ...result} = item.toJSON();

      return result;
    });
  }

  public async check({address, campaignId, signature, userId, category, additionalData}: CheckMintParams) {
    const mintCategory = category || '__default';
    // Init validate default info
    const validateInfo = {
      requestId: null as number | null,
      userId: null as number | null,
      validUser: false,
      validCampaign: false,
      validCategory: false,
      validExtrinsic: false,
      isWhiteList: false,
      isOwner: false,
      hasBalance: false,
      notDuplicated: false,
      inMintingTime: false,
    };

    let user: User | null = userId && await User.findByPk(userId) || null;
    const [campaign, existed] = await Promise.all([NftCampaign.findByPk(campaignId), await this.findOneChecked({address, campaignId, mintCategory})]);

    validateInfo.validUser = !!user;
    validateInfo.validCampaign = !!campaign;


    if (!campaign || (!user && campaign?.validateOwner)) {
      return validateInfo;
    }

    // Create user if not existed white not required validate owner
    if (!user) {
      user = await UserServiceImpl.requestUserWithRandomCode(address);
      validateInfo.userId = user.id;
      validateInfo.validUser = true;
    }

    const collectionId = campaign?.collectionId;
    const collection = await NftCollection.findByPk(campaign?.collectionId);
    const mintCategories = Object.keys(JSON.parse(collection?.nftMetadata || '{}') as Record<string, RMRKMetadata>);
    validateInfo.validCategory = mintCategories.includes(mintCategory);

    const now = new Date();
    const inMintingTime = now >= campaign.startTime && now <= campaign.endTime;
    validateInfo.inMintingTime = inMintingTime;

    if (existed) {
      if (!inMintingTime) {
        existed.status = NftMintRequestStatus.EXPIRED;
        await existed.save({fields: ['status']});
      }

      return {
        requestId: inMintingTime ? existed.id : null,
        userId: user.id,
        validUser: true,
        validCampaign: true,
        validCategory: true,
        validExtrinsic: true,
        isWhiteList: true,
        isOwner: true,
        hasBalance: true,
        notDuplicated: true,
        inMintingTime,
      };
    }

    // Todo: Validate white list in the future

    // Validate signature
    if (!campaign.validateOwner) {
      validateInfo.isOwner = true;
    } else {
      validateInfo.isOwner = !!signature && validateSignature(address, user?.randomCode, signature);
    }

    // Validate balance
    let  balanceData: boolean | SubscanBalanceItem[] = false;
    if (!campaign.validateBalance) {
      validateInfo.hasBalance = true;
    } else {
      const [hasBalance, x] = await BalanceServiceImpl.checkBalance(address);
      balanceData = x;
      validateInfo.hasBalance = hasBalance as boolean;
    }

    // Validate duplicated
    let isDuplicated = false;
    if (campaign.duplicateCheck === DuplicateCheckType.COLLECTION) {
      isDuplicated = (await this.findAllSuccessOrMinting({address, collectionId})).length > 0;
    } else if (campaign.duplicateCheck === DuplicateCheckType.CAMPAIGN) {
      isDuplicated = (await this.findAllSuccessOrMinting({address, campaignId})).length > 0;
    } else if (campaign.duplicateCheck === DuplicateCheckType.CATEGORY) {
      isDuplicated = (await this.findAllSuccessOrMinting({address, campaignId, mintCategory})).length > 0;
    }
    validateInfo.notDuplicated = !isDuplicated;

    // Validate extrinsic hash
    if (!campaign.validateExtrinsic) {
      validateInfo.validExtrinsic = true;
    } else {
      const aData = additionalData as ValidateExtrinsicParams;
      if (!(aData?.extrinsicHash)) {
        validateInfo.validExtrinsic = false;
      } else  {
        validateInfo.validExtrinsic = await this.validateExtrinsic(aData.network, aData.extrinsicHash, address);

        if (!validateInfo.validExtrinsic) {
          // Wait for 3 seconds and check again
          await new Promise((resolve) => setTimeout(resolve, 3000));
          validateInfo.validExtrinsic = await this.validateExtrinsic(aData.network, aData.extrinsicHash, address);
        }

        if (!validateInfo.validExtrinsic) {
          // Wait for 3 seconds and check again
          await new Promise((resolve) => setTimeout(resolve, 6000));
          validateInfo.validExtrinsic = await this.validateExtrinsic(aData.network, aData.extrinsicHash, address);
        }

        if (!validateInfo.validExtrinsic) {
          // Wait for 3 seconds and check again
          await new Promise((resolve) => setTimeout(resolve, 9000));
          validateInfo.validExtrinsic = await this.validateExtrinsic(aData.network, aData.extrinsicHash, address);
        }
      }
    }

    // Create minting request if all check is ok
    if (validateInfo.isOwner && validateInfo.hasBalance && validateInfo.notDuplicated && validateInfo.validExtrinsic && validateInfo.validCategory && validateInfo.inMintingTime) {
      const mintRequest = await NftMintRequest.create({
        userId: user.id,
        campaignId,
        collectionId: campaign.id,
        address: address,
        signature: signature || '',
        status: NftMintRequestStatus.CHECKED,
        balanceData: JSON.stringify(balanceData),
        mintCategory,
        additionalData: JSON.stringify(additionalData),
      });

      validateInfo.requestId = mintRequest?.id;
    }

    return validateInfo;
  }

  public async mint({requestId, recipient}: MintParams) {
    // Validate mint request
    const mintRequest = await NftMintRequest.findByPk(requestId);

    if (!isAddress(recipient)) {
      throw new Error('Invalid mint recipient');
    }

    if (!mintRequest) {
      throw new Error('Invalid mint request');
    }

    if (mintRequest.status === NftMintRequestStatus.CHECKED) {
      const [collection, campaign] = await Promise.all([NftCollection.findByPk(mintRequest.collectionId), NftCampaign.findByPk(mintRequest.campaignId)]);

      if (!collection) {
        throw new Error('Invalid mint collection');
      }

      if (!campaign) {
        throw new Error('Invalid mint campaign');
      }

      const now = new Date();
      if (now < campaign.startTime || now > campaign.endTime) {
        mintRequest.status = NftMintRequestStatus.EXPIRED;
        await mintRequest.save({fields: ['status']});
        throw new Error('The mint campaign is not start or ended');
      }

      // Start minting
      mintRequest.status = NftMintRequestStatus.MINTING;
      mintRequest.recipient = recipient || mintRequest.address;
      mintRequest.mintDate = new Date();
      await mintRequest.save();

      try {
        const metadataMap = JSON.parse(collection.nftMetadata) as Record<string, RMRKMetadata>;
        const metadata = metadataMap[mintRequest.mintCategory];

        const {
          blockNumber,
          symbol,
          collection: rmrkCollectionId,
          extrinsicHash,
          metadata: metadataUri,
          sn,
        } = await RMRKServiceImpl.mintNFT(collection.rmrkCollectionId, mintRequest.recipient, metadata);
        const rmrkNftId = `${blockNumber || ''}-${rmrkCollectionId}-${symbol}-${sn}`;
        
        const realMetadata = await getMetadata<RMRKMetadata>(metadataUri);

        // Save minting result
        Object.assign(mintRequest, {
          status: NftMintRequestStatus.SUCCESS,
          rmrkNftId,
          metadata: metadataUri,
          nftName: symbol,
          nftImage: realMetadata.mediaUri,
          blockNumber,
          extrinsicHash,
        });
        await mintRequest.save();
        collection.minted = await NftMintRequest.count({
          where: {
            collectionId: collection.id,
            status: {[Op.in]: [NftMintRequestStatus.SUCCESS]},
          },
        });
        await collection.save({fields: ['minted']});
      } catch (e) {
        console.error(e);

        // Save minting result
        Object.assign(mintRequest, {
          status: NftMintRequestStatus.CHECKED,
        });
        await mintRequest.save();
      }
    }

    // Return latest mint request
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {signature, balanceData, ...result} = mintRequest.toJSON();

    return result;
  }
}

export const MintServiceImpl = new MintService(BalanceServiceImpl);