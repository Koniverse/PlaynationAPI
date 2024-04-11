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

AccountAttribute.belongsTo(Account, {foreignKey: 'accountId'});
Account.hasOne(AccountAttribute, {foreignKey: 'accountId'});

GamePlay.belongsTo(Game, {foreignKey: 'gameId'});
GamePlay.belongsTo(Account, {foreignKey: 'AccountId'});

GameItem.belongsTo(Game, {foreignKey: 'gameId'});

GameInventoryItem.belongsTo(Game, {foreignKey: 'gameId'});
GameInventoryItem.belongsTo(Account, {foreignKey: 'accountId'});
GameInventoryItem.belongsTo(GameItem, {foreignKey: 'itemId'});
GameInventoryItem.belongsTo(GameData, {foreignKey: 'gameDataId'});

// Sync all models
SequelizeServiceImpl.addSync((async () => {
  await Account.sync({force: true});
  await AccountAttribute.sync({force: true});

  await Game.sync({force: true});
  await GameData.sync({force: true});
  await GamePlay.sync({force: true});
  await GameItem.sync({force: true});
  await GameInventoryItem.sync({force: true});

  await Task.sync({force: true});
  await TaskHistory.sync({force: true});
})());


export * from '@src/models/AccountAttribute';
export * from '@src/models/Account';
export * from '@src/models/Game';
export * from '@src/models/GameData';
export * from '@src/models/GamePlay';
export * from '@src/models/GameInventoryItem';
export * from '@src/models/GameItem';
export * from '@src/models/Task';
export * from '@src/models/TaskHistory';
