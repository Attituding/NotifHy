import type { users as User } from '@prisma/client';
import { Piece } from '@sapphire/framework';
import type { CleanHypixelData } from '../@types/Hypixel';
import type { Changes } from '../core/Data';
import type { locales } from '../locales/locales';

export abstract class Module<O extends Module.Options = Module.Options> extends Piece<O> {
    public override name: 'defender' | 'friends' | 'rewards';

    public readonly localization: keyof typeof locales[keyof typeof locales];

    public readonly requireStatusAPI: boolean;

    public constructor(context: Module.Context, options: O = {} as O) {
        super(context, options);

        this.name = options.name;
        this.localization = options.localization;
        this.requireStatusAPI = options.requireStatusAPI ?? false;
    }

    public abstract run(user: User, newData: CleanHypixelData, changes: Changes): Promise<void>;
}

export interface ModuleOptions extends Piece.Options {
    readonly name: 'defender' | 'friends' | 'rewards';
    readonly localization: keyof typeof locales[keyof typeof locales];
    readonly requireStatusAPI: boolean;
}

export namespace Module {
    export type Options = ModuleOptions;
    export type Context = Piece.Context;
}