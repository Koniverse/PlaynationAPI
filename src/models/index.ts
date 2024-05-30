import SequelizeServiceImpl from '@src/services/SequelizeService';
import AccountAttribute from '@src/models/AccountAttribute';
import Account from '@src/models/Account';
import Game from '@src/models/Game';
import GameData from '@src/models/GameData';
import GamePlay from '@src/models/GamePlay';
import GameInventoryItem from '@src/models/GameInventoryItem';
import GameItem from '@src/models/GameItem';
import Task from '@src/models/Task';
import TaskHistory from '@src/models/TaskHistory';
import ReferralLog from '@src/models/ReferralLog';
import GiveAwayPoint from '@src/models/GiveAwayPoint';
import Receipt from './Receipt';
import TaskCategory from '@src/models/TaskCategory';
import AirdropCampaign from './AirdropCampaign';
import AirdropRecord from './AirdropRecord';
import AirdropRecordLog from './AirdropRecordLog';
import AirdropEligibility from '@src/models/AirdropEligibility';
import AirdropTransactionLog from '@src/models/AirdropTransactionLog';

AccountAttribute.belongsTo(Account, { foreignKey: 'accountId' });
Account.hasOne(AccountAttribute, { foreignKey: 'accountId' });
Account.hasOne(TaskHistory, { foreignKey: 'accountId' });

GamePlay.belongsTo(Game, { foreignKey: 'gameId' });
GamePlay.belongsTo(Account, { foreignKey: 'AccountId' });

GameItem.belongsTo(Game, { foreignKey: 'gameId' });

GameInventoryItem.belongsTo(Game, { foreignKey: 'gameId' });
GameInventoryItem.belongsTo(Account, { foreignKey: 'accountId' });
GameInventoryItem.belongsTo(GameItem, { foreignKey: 'itemId' });
GameInventoryItem.belongsTo(GameData, { foreignKey: 'gameDataId' });

TaskHistory.belongsTo(Task, { foreignKey: 'taskId' });
TaskHistory.belongsTo(Account, { foreignKey: 'accountId' });

Task.belongsTo(Game, { foreignKey: 'gameId' });
AirdropEligibility.belongsTo(AirdropCampaign, { foreignKey: 'campaign_id' });

// Sync all models
SequelizeServiceImpl.addSync(Account.sync.bind(Account));
SequelizeServiceImpl.addSync(AccountAttribute.sync.bind(AccountAttribute));
SequelizeServiceImpl.addSync(Game.sync.bind(Game));
SequelizeServiceImpl.addSync(GameData.sync.bind(GameData));
SequelizeServiceImpl.addSync(GamePlay.sync.bind(GamePlay));
SequelizeServiceImpl.addSync(GameItem.sync.bind(GameItem));
SequelizeServiceImpl.addSync(GameInventoryItem.sync.bind(GameInventoryItem));
SequelizeServiceImpl.addSync(TaskCategory.sync.bind(TaskCategory));
SequelizeServiceImpl.addSync(Task.sync.bind(Task));
SequelizeServiceImpl.addSync(TaskHistory.sync.bind(TaskHistory));
SequelizeServiceImpl.addSync(ReferralLog.sync.bind(ReferralLog));
SequelizeServiceImpl.addSync(GiveAwayPoint.sync.bind(GiveAwayPoint));
SequelizeServiceImpl.addSync(Receipt.sync.bind(Receipt));
SequelizeServiceImpl.addSync(AirdropCampaign.sync.bind(AirdropCampaign));
SequelizeServiceImpl.addSync(AirdropRecord.sync.bind(AirdropRecord));
SequelizeServiceImpl.addSync(AirdropRecordLog.sync.bind(AirdropRecordLog));
SequelizeServiceImpl.addSync(AirdropEligibility.sync.bind(AirdropEligibility));
SequelizeServiceImpl.addSync(AirdropTransactionLog.sync.bind(AirdropTransactionLog));

export * from '@src/models/AccountAttribute';
export * from '@src/models/Account';
export * from '@src/models/Game';
export * from '@src/models/GameData';
export * from '@src/models/GamePlay';
export * from '@src/models/GameInventoryItem';
export * from '@src/models/GameItem';
export * from '@src/models/TaskCategory';
export * from '@src/models/Task';
export * from '@src/models/TaskHistory';
export * from '@src/models/ReferralLog';
export * from '@src/models/GiveAwayPoint';
export * from '@src/models/Receipt';
export * from '@src/models/AirdropCampaign';
export * from '@src/models/AirdropRecord';
export * from '@src/models/AirdropRecordLog';
export * from '@src/models/AirdropEligibility';
export * from '@src/models/AirdropTransactionLog';
