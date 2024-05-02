import SequelizeServiceImpl from '@src/services/SequelizeService';
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export enum ReceiptEnum {
    BUY_ENERGY = 'BUY_ENERGY',
    BUY_LEVEL = 'BUY_LEVEL',
    BUY_ITEM = 'BUY_ITEM',
}

export class Receipt extends Model<InferAttributes<Receipt>, InferCreationAttributes<Receipt>> {

    declare id: CreationOptional<number>;
    declare type: CreationOptional<ReceiptEnum>;
    declare userId: number;
    declare gameId?: number;
    declare gameItemId?: number;
    declare point: number;
    declare game_inventory_item_id?: number;
    declare createdTime: CreationOptional<number>;

}

Receipt.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    type: {
        type: DataTypes.ENUM(ReceiptEnum.BUY_ENERGY, ReceiptEnum.BUY_LEVEL, ReceiptEnum.BUY_ITEM),
    },
    userId: {
        type: DataTypes.INTEGER,
    },
    gameId: {
        type: DataTypes.INTEGER,
    },
    gameItemId: {
        type: DataTypes.INTEGER,
    },
    point: {
        type: DataTypes.INTEGER,
    },
    game_inventory_item_id: {
        type: DataTypes.INTEGER,
    },
    createdTime: {
        type: DataTypes.DATE,
    }
    
}, {
    indexes: [],
    tableName: 'receipt',
    sequelize: SequelizeServiceImpl.sequelize,

})

export default Receipt