import type { EventProperties, SlashCommand } from '../@types/client';
import { BetterEmbed, cleanRound, formattedUnix, timeout } from '../util/utility';
import { Collection, CommandInteraction } from 'discord.js';
import { ConstraintError } from '../util/error/ConstraintError';
import { ownerID } from '../../config.json';
import { RawUserData, UserAPIData, UserData } from '../@types/database';
import { SQLiteWrapper } from '../database';
import Constants from '../util/constants';
import errorHandler from '../util/error/errorHandler';


export const properties: EventProperties = {
  name: 'interactionCreate',
  once: false,
  hasParameter: true,
};

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  try {
    if (interaction.isCommand()) {
      const command: SlashCommand | undefined = interaction.client.commands.get(interaction.commandName);
      if (command === undefined) return;

      console.log(`${formattedUnix({ date: true, utc: true })} | Slash Command from ${interaction.user.tag} (${interaction.user.id}) for the command ${interaction.commandName}`);

      console.log(interaction.options.data);

      await interaction.deferReply({
        ephemeral: command.properties.ephemeral,
      });

      const { blockedUsers, devMode }: { blockedUsers: string[], devMode: boolean } = interaction.client.config;

      const userAPIData = await SQLiteWrapper.getUser({
        discordID: interaction.user.id,
        table: 'api',
        columns: ['*'],
        allowUndefined: true,
      }) as UserAPIData | undefined;

      let userData = await SQLiteWrapper.getUser<RawUserData, UserData>({
          discordID: interaction.user.id,
          table: 'users',
          columns: ['*'],
          allowUndefined: true,
      }) as UserData | undefined;

      userData ??= await SQLiteWrapper.newUser<UserData, RawUserData, UserData>({
        table: 'users',
        returnNew: true,
        data: {
          discordID: interaction.user.id,
          language: 'en-us',
        },
      }) as UserData;

      await blockedConstraint(interaction, userData, blockedUsers);
      await devConstraint(interaction, userData, Boolean(devMode));
      await ownerConstraint(interaction, userData, command);
      await dmConstraint(interaction, userData, command);
      await cooldownConstraint(interaction, userData, command);
      await command.execute(interaction, {
        userData,
        userAPIData,
      });
    }
  } catch (error) {
    await errorHandler({
      error: error,
      interaction: interaction,
    });
  }
};

async function blockedConstraint(interaction: CommandInteraction, userData: UserData, blockedUsers: string[]) {
  const locale = interaction.client.regionLocales.locale(userData.language).constraints;
  if (blockedUsers.includes(interaction.user.id)) {
    const blockedEmbed = new BetterEmbed({
      color: Constants.color.warning,
      footer: interaction,
    })
			.setTitle(locale.blockedUsers.title)
			.setDescription(locale.blockedUsers.description);

		await interaction.editReply({
      embeds: [blockedEmbed],
    });

    throw new ConstraintError('Blocked User');
  }
}

async function devConstraint(interaction: CommandInteraction, userData: UserData, devMode: boolean) {
  const locale = interaction.client.regionLocales.locale(userData.language).constraints;
  if (devMode === true && ownerID.includes(interaction.user.id) === false) {
    const devModeEmbed = new BetterEmbed({
      color: Constants.color.warning,
      footer: interaction,
    })
			.setTitle(locale.devMode.title)
			.setDescription(locale.devMode.description);

		await interaction.editReply({
      embeds: [devModeEmbed],
    });

    throw new ConstraintError('Developer Mode');
  }
}

async function ownerConstraint(interaction: CommandInteraction, userData: UserData, command: SlashCommand) {
  const locale = interaction.client.regionLocales.locale(userData.language).constraints;
  if (command.properties.ownerOnly === true && ownerID.includes(interaction.user.id) === false) {
    const ownerEmbed = new BetterEmbed({
      color: Constants.color.warning,
      footer: interaction,
    })
      .setTitle(locale.owner.title)
     .setDescription(locale.owner.description);

   await interaction.editReply({
     embeds: [ownerEmbed],
    });

   throw new ConstraintError('Owner Requirement');
 }
}

async function dmConstraint(interaction: CommandInteraction, userData: UserData, command: SlashCommand) {
  const locale = interaction.client.regionLocales.locale(userData.language).constraints;
  if (command.properties.noDM === true && !interaction.inGuild()) {
    const dmEmbed = new BetterEmbed({
      color: Constants.color.warning,
      footer: interaction,
    })
      .setTitle(locale.dm.title)
      .setDescription(locale.dm.description);

    await interaction.editReply({
      embeds: [dmEmbed],
    });

    throw new ConstraintError('DM Channel');
  }
}

async function cooldownConstraint(interaction: CommandInteraction, userData: UserData, command: SlashCommand) {
  const locale = interaction.client.regionLocales.locale(userData.language).constraints;
  const replace = interaction.client.regionLocales.replace;
  const { cooldowns } = interaction.client;

  if (cooldowns.has(command.properties.name) === false) cooldowns.set(command.properties.name, new Collection());

  const timestamps = cooldowns.get(command.properties.name);

  if (timestamps === undefined) return;

  const userCooldown = timestamps.get(interaction.user.id);
  const expirationTime = userCooldown ? userCooldown + command.properties.cooldown : undefined;

  //Adding 2500 milliseconds forces a minimum cooldown time of 2.5 seconds
  if (expirationTime && Date.now() + 2500 < expirationTime) {
    const timeLeft = expirationTime - Date.now();
    const cooldownEmbed = new BetterEmbed({
      color: Constants.color.warning,
      footer: interaction,
    })
      .setTitle(locale.cooldown.embed1.title)
      .setDescription(replace(locale.cooldown.embed1.description, {
        cooldown: command.properties.cooldown / 1000,
        timeLeft: cleanRound(timeLeft / 1000, 1),
      }));

    await interaction.editReply({
      embeds: [cooldownEmbed],
    });

    await timeout(timeLeft);

    const cooldownOverEmbed = new BetterEmbed({
      color: Constants.color.on,
      footer: interaction,
    })
      .setTitle(locale.cooldown.embed2.title)
      .setDescription(replace(locale.cooldown.embed2.description, {
        commandName: command.properties.name,
      }));

    await interaction.editReply({
      embeds: [cooldownOverEmbed],
    });

    throw new ConstraintError('Cooldown');
  }

  timestamps.set(interaction.user.id, Date.now());
}