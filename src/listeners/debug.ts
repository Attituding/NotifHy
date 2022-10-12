import {
    Events,
    Listener,
} from '@sapphire/framework';
import { Sentry } from '../structures/Sentry';

export class DebugListener extends Listener {
    public constructor(context: Listener.Context, options: Listener.Options) {
        super(context, {
            ...options,
            once: false,
            event: Events.Debug,
        });
    }

    public run(info: string) {
        return;
        this.container.logger.debug(
            `${this.constructor.name}:`,
            info,
        );

        new Sentry()
            .setSeverity('debug')
            .captureMessages(info);
    }
}