import { setTimeout } from 'node:timers/promises';
import type { users as User } from '@prisma/client';
import type { Collection } from 'discord.js';
import cron, { ScheduledTask } from 'node-cron';
import { Time } from '../enums/Time';
import { Errors } from './Errors';
import { CoreRequestErrorHandler } from '../errors/CoreRequestErrorHandler';
import { ErrorHandler } from '../errors/ErrorHandler';
import { HTTPError } from '../errors/HTTPError';
import { Base } from '../structures/Base';
import type { Module, ModuleOptions } from '../structures/Module';
import { Modules } from '../structures/Modules';
import { Performance } from '../structures/Performance';

/* eslint-disable no-await-in-loop */

export class Core extends Base {
    private cron: ScheduledTask;

    public readonly modules: Modules;

    public readonly errors: Errors;

    public readonly performance: Performance;

    constructor() {
        super();

        this.cron = cron.schedule(
            this.container.config.coreCron,
            async () => {
                await this.preconditions();
            },
            {
                scheduled: false,
            },
        );

        this.errors = new Errors();
        this.modules = new Modules();
        this.performance = new Performance();

        this.container.logger.debug(
            `${this.constructor.name}:`,
            `Cron scheduled with ${this.container.config.coreCron}.`,
        );
    }

    public async init() {
        this.cron = cron.schedule(
            this.container.config.coreCron,
            async () => {
                await this.preconditions();
            },
            {
                scheduled: false,
            },
        );

        if (this.container.config.core) {
            this.cron.start();
        }
    }

    public cronStart() {
        this.cron.start();
    }

    public cronStop() {
        this.cron.stop();
    }

    private async preconditions() {
        try {
            if (this.errors.isTimeout()) {
                return;
            }

            await this.refresh();
        } catch (error) {
            new ErrorHandler(error).init();
        }
    }

    private async refresh() {
        const allUsers = await this.container.database.users.findMany({
            include: {
                modules: true,
            },
        });

        const users = allUsers.filter((user) => Object.values(user.modules).includes(true));

        const moduleStore = this.container.stores.get('modules');

        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            if (this.errors.isTimeout() || this.container.config.core === false) {
                return;
            }

            const enabledModules = moduleStore.filter((module) => user.modules[module.name]);

            await this.refreshUser(user, enabledModules);
        }
    }

    private async refreshUser(
        user: User,
        enabledModules: Collection<string, Module<ModuleOptions>>,
    ) {
        try {
            const shouldFetch = Modules.shouldFetch(enabledModules);

            if (shouldFetch) {
                this.performance.set('fetch');
                const { data, changes } = await this.modules.fetch(user);

                this.performance.set('modules');
                await Modules.executeModulesWithData(user, enabledModules, data, changes);
            } else {
                this.performance.set('modules');
                await Modules.executeModules(user, enabledModules);
            }

            this.performance.addDataPoint();

            const timeoutPer = Time.Minute / this.container.config.hypixelRequestBucket;

            await setTimeout(timeoutPer * this.modules.lastUserFetches);
        } catch (error) {
            if (error instanceof HTTPError) {
                new CoreRequestErrorHandler(error, this).init();
            } else {
                this.errors.addGeneric();
                new ErrorHandler(error).init();
            }
        }
    }
}
