import type { ClientCommand } from '../@types/client';
import { Constants } from '../utility/Constants';
import { BetterEmbed } from '../../utility/utility';
import { Log } from '../../utility/Log';
import { RegionLocales } from '../locales/RegionLocales';
import { setTimeout } from 'node:timers/promises';
import { SQLite } from '../utility/SQLite';

export const properties: ClientCommand['properties'] = {
    name: 'accessdb',
    description: 'Access the database.',
    cooldown: 0,
    ephemeral: true,
    noDM: false,
    ownerOnly: true,
    requireRegistration: false,
    structure: {
        name: 'accessdb',
        description: 'Access the database',
        options: [
            {
                name: 'timeout',
                type: 4,
                description: 'Timeout in milliseconds',
                required: true,
            },
        ],
    },
};

export const execute: ClientCommand['execute'] = async (
    interaction,
    locale,
): Promise<void> => {
    const text = RegionLocales.locale(locale).commands.accessdb;
    const replace = RegionLocales.replace;

    const timeout = interaction.options.getInteger('timeout', true);

    const currentAPI = interaction.client.config.enabled;
    const curentDevMode = interaction.client.config.devMode;

    interaction.client.config.enabled = false;
    interaction.client.config.devMode = true;

    Log.interaction(interaction, 'API disabled and Developer Mode enabled');

    await setTimeout(5_000);

    SQLite.removeKey();
    SQLite.close();

    const decrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.decrypted.title)
        .setDescription(replace(text.decrypted.description, {
            timeout: timeout,
        }));

    await interaction.editReply({ embeds: [decrypted] });

    await setTimeout(timeout);

    SQLite.open();
    SQLite.rekey();

    interaction.client.config.enabled = currentAPI;
    interaction.client.config.devMode = curentDevMode;

    Log.interaction(interaction, 'API and Developer Mode restored');

    const encrypted = new BetterEmbed(interaction)
        .setColor(Constants.colors.normal)
        .setTitle(text.encrypted.title)
        .setDescription(text.encrypted.description);

    await interaction.followUp({
        embeds: [encrypted],
        ephemeral: true,
    });
};