import type { ClientCommand } from '../@types/client';
import type { UserData } from '../@types/database';
import {
    awaitComponent,
    BetterEmbed,
    disableComponents,
    timestamp,
} from '../../util/utility';
import {
    Constants as DiscordConstants,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
} from 'discord.js';
import { Log } from '../../util/Log';
import { RegionLocales } from '../../../locales/RegionLocales';
import { SQLite } from '../../util/SQLite';
import Constants from '../util/Constants';
import GlobalConstants from '../../util/Constants';

export const properties: ClientCommand['properties'] = {
    name: 'systemmessage',
    description: 'Adds a message to a user\'s system messages.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'systemmessage',
        description: 'Message a user',
        options: [
            {
                name: 'id',
                type: 3,
                description: 'The user to message',
                required: true,
            },
            {
                name: 'name',
                type: 3,
                description: 'Title of the message',
                required: true,
            },
            {
                name: 'value',
                type: 3,
                description: 'Main content of the message',
                required: true,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.systemmessage;
    const { replace } = RegionLocales;

    const id = interaction.options.getString('id', true);

    const userData =
        await SQLite.getUser<UserData>({
            discordID: id,
            table: Constants.tables.users,
            columns: ['systemMessages'],
            allowUndefined: true,
        });

    if (userData === undefined) {
        const notFoundEmbed = new BetterEmbed(interaction)
            .setColor(Constants.colors.normal)
            .setTitle(text.notFound.title)
            .setDescription(replace(text.notFound.description, {
                id: id,
            }));

        await interaction.editReply({
            embeds: [notFoundEmbed],
        });

        return;
    }

    let name = interaction.options.getString('name', true);
    const value = interaction.options.getString('value', true);

    name = `${timestamp(Date.now(), 'D')} - ${name}`;

    const buttons = new MessageActionRow()
        .setComponents(
            new MessageButton()
                .setCustomId('true')
                .setLabel(text.preview.buttonLabel)
                .setStyle(DiscordConstants.MessageButtonStyles.PRIMARY),
        );

    const validateEmbed = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.preview.title)
        .setDescription(text.preview.description)
        .addField('ID', id)
        .addField(name, value);

    const message = await interaction.editReply({
        embeds: [validateEmbed],
        components: [buttons],
    }) as Message;

    await interaction.client.channels.fetch(interaction.channelId);

    const componentFilter = (i: MessageComponentInteraction) =>
        interaction.user.id === i.user.id &&
        i.message.id === message.id;

    const disabledRows = disableComponents([buttons]);

    const button = await awaitComponent(
        interaction.channel!,
        'BUTTON',
        {
            filter: componentFilter,
            idle: GlobalConstants.ms.second * 30,
        },
    );

    if (button === null) {
        Log.command(interaction, 'Ran out of time');

        await interaction.editReply({
            components: disabledRows,
        });

        return;
    }

    await SQLite.updateUser<UserData>({
        discordID: id,
        table: Constants.tables.users,
        data: {
            systemMessages: [
                {
                    name: name,
                    value: value,
                },
                ...userData.systemMessages,
            ],
        },
    });

    const successEmbed = new MessageEmbed(validateEmbed)
        .setTitle(text.success.title)
        .setDescription(text.success.description);

    Log.command(interaction, name);

    await button.update({
        embeds: [successEmbed],
        components: disabledRows,
    });
};