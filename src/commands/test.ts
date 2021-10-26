import type { CommandProperties } from '../@types/index';
import { queryGet, queryGetAll, queryRun } from '../database';
import { CommandInteraction } from 'discord.js';
import { commandEmbed } from '../util/utility';

export const properties: CommandProperties = {
  name: 'test',
  description: 'Does stuff',
  usage: '/test',
  cooldown: 0,
  noDM: false,
  ownerOnly: true,
  structure: {
    name: 'test',
    description: 'does stuff',
  },
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  try {
    const tablename = 'barry';
    const columns = 'bay INTEGER, PLOY NOT NULL';
    const now = Date.now();
    const two = await queryGetAll(`SELECT * FROM test`);
    console.log(two, Date.now() - now);
    await interaction.editReply({ content: `placeholder` });
  } catch (err) {
    console.log(err);
  }
};