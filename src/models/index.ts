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
TaskHistory.belongsTo(Task, {foreignKey: 'taskId'});
TaskHistory.belongsTo(Account, {foreignKey: 'accountId'});
Task.belongsTo(Game, {foreignKey: 'gameId'});
Account.hasOne(TaskHistory, {foreignKey: 'accountId'});
// Sync all models
SequelizeServiceImpl.addSync((async () => {
  await Account.sync();
  await AccountAttribute.sync();

  await Game.sync();
  await GameData.sync();
  await GamePlay.sync();
  await GameItem.sync();
  await GameInventoryItem.sync();

  await Task.sync();
  await TaskHistory.sync();
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
