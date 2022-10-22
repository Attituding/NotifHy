import { type ApplicationCommandRegistry, BucketScope, Command } from '@sapphire/framework';
import {
    type CommandInteraction,
    Constants,
    type Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
} from 'discord.js';
import { Time } from '../enums/Time';
import { BetterEmbed } from '../structures/BetterEmbed';
import { Options } from '../utility/Options';
import {
    awaitComponent,
    disableComponents,
    interactionLogContext,
    setPresence,
} from '../utility/utility';

export class DataCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, {
            ...options,
            name: 'data',
            description: 'View or delete your stored by this bot',
            cooldownLimit: 3,
            cooldownDelay: 60_000,
            cooldownScope: BucketScope.User,
            preconditions: ['Base', 'DevMode', 'Registration'],
            requiredUserPermissions: [],
            requiredClientPermissions: [],
        });

        this.chatInputStructure = {
            name: this.name,
            description: this.description,
            options: [
                {
                    name: 'delete',
                    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
                    description: 'Delete your data',
                },
            ],
        };
    }

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(this.chatInputStructure, Options.commandRegistry(this));
    }

    public override async chatInputRun(interaction: CommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'delete':
                await this.delete(interaction);
                break;
            // no default
        }
    }

    public async delete(interaction: CommandInteraction) {
        const { i18n } = interaction;

        const confirmEmbed = new BetterEmbed(interaction)
            .setColor(Options.colorsNormal)
            .setTitle(i18n.getMessage('commandsDataDeleteConfirmTitle'))
            .setDescription(i18n.getMessage('commandsDataDeleteConfirmDescription'));

        const yesButton = new MessageButton()
            .setCustomId('true')
            .setLabel(i18n.getMessage('yes'))
            .setStyle(Constants.MessageButtonStyles.SUCCESS);

        const noButton = new MessageButton()
            .setCustomId('false')
            .setLabel(i18n.getMessage('no'))
            .setStyle(Constants.MessageButtonStyles.DANGER);

        const buttonRow = new MessageActionRow().addComponents(yesButton, noButton);

        const message = (await interaction.editReply({
            embeds: [confirmEmbed],
            components: [buttonRow],
        })) as Message;

        const disabledRows = disableComponents(message.components);

        await interaction.client.channels.fetch(interaction.channelId);

        // eslint-disable-next-line arrow-body-style
        const componentFilter = (i: MessageComponentInteraction) => {
            return interaction.user.id === i.user.id && i.message.id === message.id;
        };

        const button = await awaitComponent(interaction.channel!, {
            componentType: Constants.MessageComponentTypes.BUTTON,
            filter: componentFilter,
            idle: Time.Second * 30,
        });

        if (button === null) {
            this.container.logger.info(
                interactionLogContext(interaction),
                `${this.constructor.name}:`,
                'Ran out of time.',
            );

            await interaction.editReply({
                components: disabledRows,
            });
        } else if (button.customId === yesButton.customId) {
            await this.container.database.$transaction([
                this.container.database.users.delete({
                    where: {
                        id: interaction.user.id,
                    },
                }),
                this.container.database.activities.deleteMany({
                    where: {
                        id: interaction.user.id,
                    },
                }),
                this.container.database.defender.delete({
                    where: {
                        id: interaction.user.id,
                    },
                }),
                this.container.database.friends.delete({
                    where: {
                        id: interaction.user.id,
                    },
                }),
                this.container.database.modules.delete({
                    where: {
                        id: interaction.user.id,
                    },
                }),
                this.container.database.rewards.delete({
                    where: {
                        id: interaction.user.id,
                    },
                }),
                this.container.database.system_messages.deleteMany({
                    where: {
                        id: interaction.user.id,
                    },
                }),
            ]);

            const deleted = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsDataDeleteDeletedTitle'))
                .setDescription(i18n.getMessage('commandsDataDeleteDeletedDescription'));

            this.container.logger.info(
                interactionLogContext(interaction),
                `${this.constructor.name}:`,
                'Accepted data deletion.',
            );

            await button.update({
                embeds: [deleted],
                components: disabledRows,
            });

            setPresence();
        } else {
            const aborted = new BetterEmbed(interaction)
                .setColor(Options.colorsNormal)
                .setTitle(i18n.getMessage('commandsDataDeleteAbortedTitle'))
                .setDescription(i18n.getMessage('commandsDataDeleteAbortedDescription'));

            this.container.logger.info(
                interactionLogContext(interaction),
                `${this.constructor.name}:`,
                'Aborted data deletion.',
            );

            await button.update({
                embeds: [aborted],
                components: disabledRows,
            });
        }
    }
}
