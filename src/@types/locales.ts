import type { MessageSelectMenuOptions } from 'discord.js';
import { Button } from '../util/ToggleButtons';

/*
Misc. Interfaces
*/
export interface ModuleButton {
    [key: string]: string | boolean;
    label: string;
    id: string;
    style: string;
    invert: boolean;
}

export interface ModuleButtons {
    [key: string]: ModuleButton;
    enable: ModuleButton;
    disable: ModuleButton;
    settings: ModuleButton;
}

/*
General Interfaces
*/
export interface BaseEmbed {
    title: string;
    description: string;
}

export interface Field {
    name: string;
    value: string;
}

export interface ModuleData {
    label: string;
    description: string;
    longDescription: string;
    value: string;
    emoji: string;
}

/*
Command Interface
*/
export interface Data {
    delete: {
        confirm: BaseEmbed;
        deleted: BaseEmbed;
        aborted: BaseEmbed;
        yesButton: string;
        noButton: string;
    };
}

export interface Help {
    information: BaseEmbed;
    all: {
        field: Field;
    } & BaseEmbed;
    specific: {
        invalid: BaseEmbed;
        title: string;
        description: string;
        usage: Field;
        cooldown: Field;
        dm: Field;
        owner: Field;
    };
}

export interface Language {
    alreadySet: BaseEmbed;
    title: string;
    description: string;
}

export interface ModulesCommand {
    defender: {
        title: string;
        description: string;
        menuPlaceholder: string;
        missingConfigField: {
            name: string;
            value: string;
        };
        menu: {
            toggle: {
                button: Button;
            } & ModuleData;
        };
    };
    friends: {
        title: string;
        description: string;
        menuPlaceholder: string;
        missingConfigField: {
            name: string;
            value: string;
        };
        menu: {
            toggle: {
                button: Button;
            } & ModuleData;
            channel: {
                select: MessageSelectMenuOptions
            } & ModuleData;
        };
    };
    rewards: {
        title: string;
        description: string;
        menuPlaceholder: string;
        missingConfigField: {
            name: string;
            value: string;
        };
        menu: {
            toggle: {
                button: {
                    enable: string;
                    disable: string;
                    enableCustomID: string;
                    disableCustomID: string;
                }
            } & ModuleData;
            alertTime: {
                select: MessageSelectMenuOptions
            } & ModuleData;
            claimNotification: {
                button: Button;
            } & ModuleData;
            notificationInterval: {
                select: MessageSelectMenuOptions
            } & ModuleData;
            milestones: {
                button: Button;
            } & ModuleData;
        };
    };
}

export interface Ping {
    embed1: {
        title: string;
    };
    embed2: BaseEmbed;
}

export interface Register {
    invalid: BaseEmbed;
    notFound: BaseEmbed;
    unlinked: BaseEmbed;
    mismatched: BaseEmbed;
    title: string;
    description: string;
    field: Field;
}

export interface Commands {
    data: Data;
    help: Help;
    language: Language;
    modules: ModulesCommand;
    ping: Ping;
    register: Register;
}

/*
Constraint Interface
*/
export interface Constraints {
    blockedUsers: BaseEmbed;
    devMode: BaseEmbed;
    owner: BaseEmbed;
    dm: BaseEmbed;
    cooldown: {
        embed1: BaseEmbed;
        embed2: BaseEmbed;
    };
}

/*
Modules
*/
export interface Friends {
    missingData: {
        footer: string;
    } & BaseEmbed;
    receivedData: {
        footer: string;
    } & BaseEmbed;
    missingPermissions: {
        footer: string;
    } & BaseEmbed;
    suppressNext: {
        footer: string;
    } & BaseEmbed;
    login: {
        description: string;
    };
    logout: {
        description: string;
    };
}

export interface Rewards {
    claimedNotification: {
        footer: string;
    } & BaseEmbed;
    milestone: {
        footer: string;
    } & BaseEmbed;
    rewardReminder: {
        title: string;
        footer: string;
        description: string[];
    };
}

export interface Modules {
    friends: Friends;
    rewards: Rewards;
}

/*
Base
*/
export interface Locale {
    constraints: Constraints;
    commands: Commands;
    modules: Modules;
}

export interface Locales {
    'en-us': Locale;
    'fr-FR': Locale;
    pirate: Locale;
}

export type LocaleTree =
    | Locale
    | Commands
    | Help
    | Language
    | ModulesCommand
    | Ping
    | Register
    | Constraints
    | Modules
    | Friends;

export interface Parameters {
    [index: string]: string | number;
}
