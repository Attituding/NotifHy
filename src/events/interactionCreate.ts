import { Collection, CommandInteraction } from 'discord.js';
import { replyToError, timeout, commandEmbed, isInstanceOfError } from '../utility';
import { blockedUsers, userLimit, api, devMode } from '../../dynamicConfig.json';
import { ownerID } from '../../config.json';
import type { SlashCommand } from '../@types/index';

export const name = 'interactionCreate';
export const once = false;
export const hasParameter = true;

export const execute = async (interaction: CommandInteraction): Promise<void> => {
  try {
    if (interaction.isCommand()) {
      const command: SlashCommand | undefined = interaction.client.commands.get(interaction.commandName);
      if (command === undefined) return;

      await interaction.deferReply({ ephemeral: true });
      await devConstraint(interaction);
      await ownerConstraint(interaction, command);
      await dmConstraint(interaction, command);
      await cooldownConstraint(interaction, command);
      await command.execute(interaction);
    }
  } catch (err) {
    if (!isInstanceOfError(err)) return; //=== false doesn't work for this. Very intuitive. ts(2571)
    if (err.name === 'ConstraintError') return; //Add logging
    await replyToError({ error: err, interaction: interaction });
  }
};

async function devConstraint(interaction: CommandInteraction) {
  if (devMode === true && !ownerID.includes(interaction.user.id)) {
    const devModeEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
			.setTitle('Developer Mode!')
			.setDescription('This bot is in developer only mode, likely due to a major issue or an upgrade that is taking place. Please check back later!');
		await interaction.editReply({ embeds: [devModeEmbed] });
    throw constraintError();
  }
}

async function ownerConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.ownerOnly === true && !ownerID.includes(interaction.user.id)) {
    const ownerEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle(`Insufficient Permissions!`)
     .setDescription('You cannot execute this command witout being an owner!');
   await interaction.editReply({ embeds: [ownerEmbed] });
   throw constraintError();
 }
}

async function dmConstraint(interaction: CommandInteraction, command: SlashCommand) {
  if (command.noDM === true && Boolean(!interaction.guild)) {
     const dmEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle(`DM Channel!`)
      .setDescription('You cannot execute this command in the DM channel! Please switch to a server channel!');
    await interaction.editReply({ embeds: [dmEmbed] });
    throw constraintError();
  }
}

async function cooldownConstraint(interaction: CommandInteraction, command: SlashCommand) {
  const { cooldowns } = interaction.client;

  if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());

  const timestamps = cooldowns.get(command.name);
  const userCooldown = timestamps!.get(interaction.user.id);
  const expirationTime = userCooldown ? userCooldown + command.cooldown : undefined;

  if (expirationTime && Date.now() < expirationTime) {
    const timeLeft = (expirationTime - Date.now()) / 1000;
    const cooldownEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle(`Cooldown!`)
      .setDescription(`You are executing commands too fast! This cooldown of this command is ${command.cooldown / 1000}. This message will turn green in ${timeLeft} after the cooldown expires.`);

    await interaction.editReply({ embeds: [cooldownEmbed] });
    await timeout(timeLeft);

    const cooldownOverEmbed = commandEmbed({ color: '#AA0000', interaction: interaction })
      .setTitle('Cooldown Over!')
      .setDescription(`The cooldown has expired! You can now execute the command ${interaction.commandName}!`);

    await interaction.editReply({ embeds: [cooldownOverEmbed] });
    throw constraintError();
  }

  timestamps!.set(interaction.user.id, Date.now());
}

function constraintError(message?: string) {
  const constraint = new Error(message);
  constraint.name = 'ConstraintError';
  return constraint;
}