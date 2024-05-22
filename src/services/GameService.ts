import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {Account, GameData, GamePlay, Game, LeaderboardPerson} from '@src/models';
import { v4 } from 'uuid';
import {AccountService} from '@src/services/AccountService';
import {QueryTypes} from 'sequelize';

export interface newGamePlayParams {
  gameId: number;
}

export interface SubmitGamePlayParams {
  gamePlayId: number;
  signature: string;
  point: number;
}

interface LeaderboardRecord {
  rank: string; // SQL query returns rank as string
  accountId: number;
  address: string;
  firstName: string;
  lastName: string;
  point: string; // SQL query returns point as string
  telegramUsername: string;
  avatar: string;
  mine: boolean;
}

const accountService = AccountService.instance;

export interface GameContentCms {
    id: number,
    name: string,
    description: string,
    url: string,
    maxEnergy: number,
    slug: string,
    active: boolean,
    maxPoint: number,
    energyPerGame: number,
    maxPointPerGame: number,
    icon: string,
    rank_definition: string,
    banner: string,
    startTime: Date,
    endTime: Date,

}

export class GameService {
  private gameMap: Record<string, Game> | undefined;

  constructor(private sequelizeService: SequelizeService) {
    
  }

  async generateDefaultData() {
    const existed = await Game.findOne({ where: { slug: 'play_booka' } });
    if (existed) {
      return existed;
    }

    return await Game.create({
      contentId: 1,
      slug: 'booka',
      name: 'Booka Game',
      url: 'https://booka.com',
      description: 'Default event type',
      maxEnergy: 1440,
      energyPerGame: 90,
      maxPointPerGame: 100000000,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      rankDefinition: '{}',
      active: true,
    });
  }

  async syncData(data: GameContentCms[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = {...item} as unknown as Game;
      const existed = await Game.findOne({where: {contentId: item.id}});
      itemData.rankDefinition = JSON.stringify(item.rank_definition);
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await Game.create(itemData);
      }
    }
    await this.buildGameMap();
    return response;
  }

  async buildGameMap() {
    const data = await Game.findAll();
    const gameMap: Record<string, Game> = {};
    data.forEach((game) => {
      gameMap[game.id.toString()] = game;
    });

    this.gameMap = gameMap;
    return gameMap;
  }

  async listGame() {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return Object.values(gameMap);
  }

  async findGame(gameId: number) {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return gameMap[gameId.toString()];
  }
  
  async getGameData(accountId: number, gameId: number) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const game = await this.findGame(gameId);

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    const existed = await GameData.findOne({
      where: {
        accountId,
        gameId,
      },
    });

    if (existed) {
      return existed;
    } else {
      return GameData.create({
        gameId,
        accountId,
        level: 1,
        point: 0,
        rank: 0,
        dayLimit: 0,
      });
    }
  }

  async newGamePlay(accountId: number, gameId: number) {
    const gameData = await this.getGameData(accountId, gameId);
    const game = await this.findGame(gameId);
    const usedEnergy = game?.energyPerGame || 0;

    await accountService.useAccountEnergy(accountId, usedEnergy);

    return GamePlay.create({
      accountId: gameData.accountId,
      gameId: gameData.gameId,
      gameDataId: gameData.id,
      startTime: new Date(),
      energy: game?.energyPerGame || 0,
      token: v4(),
    });
  }

  async addGameDataPoint(accountId: number, gameId: number, point: number) {
    const gameData = await this.getGameData(accountId, gameId);
    await gameData.update({
      point: gameData.point + point,
    });
    await accountService.addAccountPoint(accountId, point);
  }

  async submitGameplay(params: SubmitGamePlayParams) {
    const gamePlay = await GamePlay.findByPk(params.gamePlayId);

    if (!gamePlay) {
      throw new Error('Game play not found');
    }


    const game = await this.findGame(gamePlay?.gameId || 0);
    if (!game) {
      throw new Error('Game not found');
    }

    // Validate max point
    if (params.point > game.maxPointPerGame) {
      throw new Error('Point limit exceeded');
    }

    // Validate point <0
    if (params.point < 0) {
      throw new Error('Invalid point');
    }

    // Validate submitted
    if (gamePlay.endTime) {
      throw new Error('Game already submitted');
    }

    // Todo: Validate signature

    // Validate by time
    // Each game must be at least 25s
    // May be cheating
    // const timeDiff = new Date().getTime() - gamePlay.startTime.getTime();
    // if (timeDiff < 25000) {
    //   await gamePlay.update({
    //     point: -1,
    //     endTime: new Date(),
    //     success: false,
    //   });
    //
    //   throw new Error('Invalid game');
    // }

    // Timeout if game is submitting too long

    await gamePlay.update({
      point: params.point,
      endTime: new Date(),
      success: true,
    });

    await this.addGameDataPoint(gamePlay.accountId, gamePlay.gameId, params.point);

    return gamePlay;
  }

  async getGameplayHistory(accountId: number, gameId?: number) {
    return GamePlay.findAll({
      where: {
        accountId,
        gameId,
      },
    });
  }

  async getTotalLeaderboard(accountId: number) {
    const sql = `
    WITH RankedUsers AS (
      SELECT 
        a.id,
        a."address",
        a."firstName",
        a."lastName",
        a."telegramUsername",
        a."photoUrl" as avatar,
        aa."accumulatePoint" as point,
        RANK() OVER (ORDER BY aa."accumulatePoint" DESC) as rank,
        (a.id = :accountId) as mine
      FROM account_attribute aa
      JOIN public.account a ON a.id = aa."accountId"
    )
    SELECT
      rank,
      id as accountId,
      "address",
      "firstName",
      "lastName",
      point,
      "telegramUsername",
      avatar,
      mine
    FROM RankedUsers
    WHERE rank <= 100 OR mine = true
    ORDER BY rank;
  `;

    try {
      const data = await this.sequelizeService.sequelize.query<LeaderboardRecord>(sql, {
        replacements: { accountId },  // Use replacements for parameterized queries
        type: QueryTypes.SELECT,
      });

      return data.map(item => ({
        rank: parseInt(item.rank),
        point: parseInt(item.point),
        mine: item.mine,
        accountInfo: {
          telegramUsername: item.telegramUsername,
          lastName: item.lastName,
          firstName: item.firstName,
          avatar: item.avatar,
          id: item.accountId,
          address: item.address,
        },
      }) as LeaderboardPerson);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [] as LeaderboardPerson[];  // Return an empty array in case of an error
    }
  }
  async getLeaderBoard(accountId: number, gameId?: number) {
    const queryGameId = gameId ? ` and aa."gameId" = ${gameId}`  : '';
    const sql = `
    with leader as (SELECT a.id,
                           a."address",
                       a."firstName",
                       a."lastName",
                       a."telegramUsername",
                       a."photoUrl",
                       aa.point
                from game_data aa
                         JOIN public.account a on a.id = aa."accountId"
                where 1=1 ${queryGameId}
                order by aa.point desc
                limit 100),
     mine as (SELECT a.id,
                  a."address",
                     a."firstName",
                        a."lastName",
                       a."telegramUsername",
                       a."photoUrl",
                     aa.point
              from game_data aa
                  JOIN public.account a
              on a.id = aa."accountId"
              where a.id = ${accountId} ${queryGameId}),
     data_all as (select *
                  from leader
                  union
                  select *
                  from mine)
        select row_number() over (order by point desc) as rank,
               id as accountId,
            "address",
               "firstName",
               "lastName",
               point,
                "telegramUsername",
                "photoUrl" as avatar,
               case
                   when id = ${accountId} then true
                   else false
                   end                                 as mine
        from data_all
        order by point desc;
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    if (data.length > 0) {
      return data[0].map((item) => {
        // @ts-ignore
        const {rank, point, telegramUsername, lastName, firstName, avatar, mine, accountId, address} = item;
        return {
          rank: parseInt(rank as string),
          point: parseInt(point as string),
          mine: mine as boolean,
          accountInfo: {
            telegramUsername: telegramUsername as string,
            lastName: lastName as string,
            firstName: firstName as string,
            avatar: avatar as string,
            id: accountId as number,
            address: address as string,
          },
        } as LeaderboardPerson;
      });
    }
    return[];
  }

  // Singleton
  private static _instance: GameService;
  public static get instance() {
    if (!GameService._instance) {
      GameService._instance = new GameService(SequelizeServiceImpl);
    }
    return GameService._instance;
  }
}
