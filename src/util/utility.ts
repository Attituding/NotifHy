import type { WebhookConfig } from '../@types/client';
import {
    AwaitMessageCollectorOptionsParams,
    CommandInteraction,
    Formatters,
    MessageActionRow,
    MessageComponentType,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
    PermissionString,
    TextBasedChannel,
    WebhookClient,
    WebhookMessageOptions,
} from 'discord.js';
import { Log } from './Log';
import Constants from '../NotifHy/util/Constants';
import GlobalConstants from '../util/Constants';

export function arrayRemove<Type extends unknown[]>(
    array: Type,
    ...items: unknown[]
): Type {
    return array.filter(item => !(items.includes(item))) as Type;
}

export async function awaitComponent(
    channel: TextBasedChannel,
    component: MessageComponentType,
    options: Omit<AwaitMessageCollectorOptionsParams<typeof component, true>, 'componentType'>,
) {
    try {
        return await channel.awaitMessageComponent({
            componentType: component,
            ...options,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error as Error & { code: string })
                ?.code === 'INTERACTION_COLLECTOR_ERROR'
        ) {
            return null;
        }

        throw error;
    }
}

type Footer =
    | {
        text: string,
        iconURL?: string,
      }
    | CommandInteraction;

export class BetterEmbed extends MessageEmbed {
    constructor(footer?: Footer) {
        super();
        super.setTimestamp();

        if (footer instanceof CommandInteraction) {
            const interaction = footer;
            const avatar = interaction.user.displayAvatarURL({ dynamic: true });
            super.setFooter({ text: `/${interaction.commandName}`, iconURL: avatar });
        } else if (footer !== undefined) {
            super.setFooter({ text: footer.text, iconURL: footer.iconURL });
        }
    }

    setField(name: string, value: string, inline?: boolean | undefined): this {
        super.setFields([{ name: name, value: value, inline: inline }]);

        return this;
    }

    unshiftField(
        name: string,
        value: string,
        inline?: boolean | undefined,
    ): this {
        super.setFields(
            { name: name, value: value, inline: inline },
            ...this.fields,
        );

        return this;
    }
}

export function capitolToNormal(item: string | null) {
    function containsLowerCase(string: string): boolean {
        let lowerCase = false;

        for (let i = 0; i < string.length; i += 1) {
            const character = string.charAt(i);
            if (character === character.toLowerCase()) {
                lowerCase = true;
                break;
            }
        }

        return lowerCase;
    }

    return typeof item === 'string'
        ? item
            .replaceAll('_', ' ')
            .toLowerCase()
            .split(' ')
            .map(value => {
                if (containsLowerCase(value)) {
                    return value.charAt(0).toUpperCase() + value.slice(1);
                }

                return value;
            })
            .join(' ')
        : item;
}

export function cleanDate(ms: number | Date): string | null {
    const newDate = new Date(ms);
    if (
        ms < 0 ||
        !isDate(newDate)
    ) {
        return null;
    }

    const day = newDate.getDate(),
        month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
            newDate,
        ),
        year = newDate.getFullYear();
    return `${month} ${day}, ${year}`;
}

export function cleanGameMode(mode: string | null) {
    if (mode === null) {
        return null;
    }

    if (mode === 'LOBBY') {
        return 'Lobby';
    }

    const gameMode = Constants.clean.modes.find(({ key }) =>
        (Array.isArray(key) ? key.includes(mode) : key === mode));

    return gameMode?.name ?? mode;
}

export function cleanGameType(type: string | null) {
    if (type === null) {
        return null;
    }

    const gameTypes = Constants.clean.gameTypes;

    const gameType =
        gameTypes[type as keyof typeof Constants.clean.gameTypes];

    return gameType ?? type;
}

export function cleanLength(
    ms: number | null,
    rejectZero?: boolean,
): string | null {
    if (!isNumber(ms)) {
        return null;
    }

    let newMS = Math.floor(ms / GlobalConstants.ms.second) *
        GlobalConstants.ms.second;

    if (rejectZero ? newMS <= 0 : newMS < 0) {
        return null;
    }

    const days = Math.floor(newMS / GlobalConstants.ms.day);
    newMS -= days * GlobalConstants.ms.day;
    const hours = Math.floor(newMS / GlobalConstants.ms.hour);
    newMS -= hours * GlobalConstants.ms.hour;
    const minutes = Math.floor(newMS / GlobalConstants.ms.minute);
    newMS -= minutes * GlobalConstants.ms.minute;
    const seconds = Math.floor(newMS / GlobalConstants.ms.second);
    return days > 0
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : minutes > 0
                ? `${minutes}m ${seconds}s`
                : `${seconds}s`;
}

export function cleanRound(number: number, decimals?: number) {
    const decimalsFactor = 10 ** (decimals ?? 2);
    return Math.round(number * decimalsFactor) / decimalsFactor;
}

export function compare<Primary, Secondary extends Primary>(
    primary: Primary,
    secondary: Secondary,
) {
    const primaryDifferences = {} as Partial<Primary>;
    const secondaryDifferences = {} as Partial<Secondary>;
    for (const key in primary) {
        //@ts-expect-error hasOwn typing not implemented yet
        if (Object.hasOwn(primary, key) === true) {
            if (primary[key] !== secondary[key]) {
                primaryDifferences[key] = primary[key];
                secondaryDifferences[key] = secondary[key];
            }
        }
    }

    return { primary: primaryDifferences, secondary: secondaryDifferences };
}

//Taken from https://stackoverflow.com/a/13016136 under CC BY-SA 3.0 matching ISO 8601
export function createOffset(date = new Date()): string {
    function pad(value: number) {
        return value < 10 ? `0${value}` : value;
    }

    const sign = date.getTimezoneOffset() > 0 ? '-' : '+',
        offset = Math.abs(date.getTimezoneOffset()),
        hours = pad(Math.floor(offset / 60)),
        minutes = pad(offset % 60);
    return `${sign + hours}:${minutes}`;
}

export function formattedUnix({
    ms = Date.now(),
    date = false,
    utc = true,
}: {
    ms?: number | Date,
    date: boolean,
    utc: boolean,
}): string | null {
    const newDate = new Date(ms);
    if (
        ms < 0 ||
        !isDate(newDate)
    ) {
        return null;
    }

    return `${utc === true ? `UTC${createOffset()} ` : ''
        }${newDate.toLocaleTimeString('en-IN', { hour12: true })}${date === true ? `, ${cleanDate(ms)}` : ''
        }`;
}

export function disableComponents(messageActionRows: MessageActionRow[]) {
    const actionRows = messageActionRows
        .map(row => new MessageActionRow(row));

    for (const actionRow of actionRows) {
        const components = actionRow.components;

        for (const component of components) {
            component.disabled = true;
        }
    }

    return actionRows;
}

export function matchPermissions(
    required: PermissionResolvable,
    subject: Permissions,
): PermissionString[] {
    const missing = subject.missing(required);
    return missing;
}

type AcceptedValues = string | boolean | number;

type GenericObject = {
    [index: string]: GenericObject | AcceptedValues[] | AcceptedValues;
};

type Modifier = (value: AcceptedValues) => unknown; //eslint-disable-line no-unused-vars

export function nestedIterate(
    inParam: GenericObject,
    modify: Modifier,
): unknown {
    //@ts-expect-error typings not available yet for structuredClone
    const modified = structuredClone(inParam);
    recursive(modified);

    function recursive(input: GenericObject) {
        for (const index in input) {
            //@ts-expect-error hasOwn typing not implemented yet
            if (Object.hasOwn(input, index)) {
                if (
                    typeof input[index] === 'object' ||
                    Array.isArray(input[index])
                ) {
                    recursive(input[index] as GenericObject);
                } else if (
                    typeof input[index] === 'string' ||
                    typeof input[index] === 'boolean' ||
                    typeof input[index] === 'number' ||
                    typeof input[index] === 'bigint'
                ) {
                    input[index] = (
                        modify(
                            input[index] as AcceptedValues,
                        ) as typeof input[typeof index]
                    ) ?? input[index];
                }
            }
        }
    }

    return modified;
}

export async function sendWebHook(
    {
        webhook,
        suppressError,
        ...payload
    }: {
        webhook: WebhookConfig,
        suppressError?: boolean,
    } & WebhookMessageOptions,
): Promise<void> {
    try {
        await new WebhookClient({ id: webhook.id, token: webhook.token })
            .send(payload);
    } catch (err) {
        Log.error(
            `An error has occurred while sending an WebHook |`,
            (err as Error)?.stack ?? (err as Error)?.message,
        );

        if (suppressError === true) {
            return;
        }

        throw err;
    }
}

export const slashCommandResolver = (interaction: CommandInteraction) => {
    const commandOptions: (string | number | boolean)[] = [
        `/${interaction.commandName}`,
    ];

    for (let option of interaction.options.data) {
        if (option.value) {
            commandOptions.push(
                `${option.name}: ${option.value}`,
            );
        }

        if (option.type === 'SUB_COMMAND_GROUP') {
            commandOptions.push(option.name);
            [option] = option.options!;
        }

        if (option.type === 'SUB_COMMAND') {
            commandOptions.push(option.name);
        }

        if (Array.isArray(option.options)) {
            for (const subOption of option.options) {
                commandOptions.push(
                    `${subOption.name}: ${subOption.value}`,
                );
            }
        }
    }

    return commandOptions.join(' ');
};

export function timeAgo(ms: unknown): number | null {
    if (
        !isNumber(ms) ||
        ms < 0
    ) {
        return null;
    }

    return Date.now() - ms;
}

export function timestamp(
    ms: unknown,
    style?: typeof Formatters.TimestampStylesString,
) {
    if (
        !isNumber(ms) ||
        ms < 0
    ) {
        return null;
    }

    return Formatters.time(Math.round(ms / 1000), style ?? 'f');
}

function isDate(value: unknown): value is Date {
    return Object.prototype.toString.call(value) === '[object Date]';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}