import {
  CreationOptional,
  DataTypes,
  HasOneCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import AccountAttribute from '@src/models/AccountAttribute';

export interface ReferralParams {
  referralCode?: string;
}

export interface ITelegramParams {
  telegramId: number;
  telegramUsername: string;
  isBot?: boolean;
  isPremium?: boolean;
  addedToAttachMenu?: boolean;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
}

export enum WalletTypeEnum {
  EVM = 'EVM',
  SUBSTRATE = 'SUBSTRATE',
}

export interface WalletParams {
  address: string;
  signature: string;
  type?: WalletTypeEnum;
}

export interface AccountPublicInfo {
  id: number;
  telegramUsername: string;
  firstName: string;
  lastName: string;
  address: string;
  avatar?: string;
  mine?: boolean;
}

export interface LeaderboardPerson {
  rank: number;
  point: number;
  accountInfo: AccountPublicInfo;
}

export interface ReferralRecord {
  point: number;
  total_count: number;
  referralSuccessTime: number;
  accountInfo: AccountPublicInfo;
}

export type AccountParams = ReferralParams & ITelegramParams & WalletParams;

export class Account
  extends Model<InferAttributes<Account>, InferCreationAttributes<Account>>
  implements ITelegramParams, WalletParams
{
  declare id: CreationOptional<number>; // id on db

  // Login information
  declare address: string;
  declare type: CreationOptional<WalletTypeEnum>;
  declare signature: CreationOptional<string>;
  declare sessionTime: CreationOptional<Date>;

  declare inviteCode: CreationOptional<string>;

  // Telegram information
  declare telegramId: number;
  declare telegramUsername: string;
  declare isBot: CreationOptional<boolean>;
  declare addedToAttachMenu: CreationOptional<boolean>;
  declare isPremium: CreationOptional<boolean>;
  declare firstName: CreationOptional<string>;
  declare lastName: CreationOptional<string>;
  declare photoUrl: CreationOptional<string>;
  declare languageCode: CreationOptional<string>;

  // Account information
  declare getAccountAttribute: HasOneCreateAssociationMixin<AccountAttribute>;
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
  declare cronAvatar: CreationOptional<boolean>;
  declare isEnabled: CreationOptional<boolean>;
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    address: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.ENUM,
      values: [WalletTypeEnum.EVM, WalletTypeEnum.SUBSTRATE],
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    inviteCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sessionTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    telegramId: {
      type: DataTypes.BIGINT,
    },
    telegramUsername: {
      type: DataTypes.STRING,
    },
    isBot: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    addedToAttachMenu: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    languageCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cronAvatar: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    indexes: [
      { unique: true, fields: ['address'] },
      { unique: true, fields: ['inviteCode'] },
    ],
    tableName: 'account',
    sequelize: SequelizeServiceImpl.sequelize,
    createdAt: true,
    updatedAt: true,
  },
);

export default Account;
