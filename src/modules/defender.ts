import type { FriendsModule, UserAPIData, UserData } from '../@types/database';
import { CleanHypixelPlayerData } from '../@types/hypixel';
import { SQLiteWrapper } from '../database';

export const properties = {
  name: 'defenderEvent',
};

export const execute = async ({
  differences,
  userAPIData,
}: {
  differences: Partial<CleanHypixelPlayerData>,
  userAPIData: UserAPIData
}): Promise<void> => {
  const friendModule = await SQLiteWrapper.getUser<FriendsModule, FriendsModule>({
    discordID: userAPIData.discordID,
    table: 'friends',
    allowUndefined: false,
    columns: ['enabled', 'channel'],
  }) as FriendsModule;
};