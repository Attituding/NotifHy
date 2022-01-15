import {
    cleanLength,
    cleanRound,
    sendWebHook,
} from '../../utility';
import {
    fatalWebhook,
    hypixelAPIWebhook,
    keyLimit,
    ownerID,
} from '../../../../config.json';
import { RequestManager } from '../../../hypixelAPI/RequestManager';
import AbortError from '../AbortError';
import BaseErrorHandler from './BaseErrorHandler';
import HTTPError from '../HTTPError';
import RateLimitError from '../RateLimitError';
import { FetchError } from 'node-fetch';

export default class RequestErrorHandler extends BaseErrorHandler {
    readonly requestManager: RequestManager;
    readonly timeout: string | null;

    constructor(error: unknown, requestManager: RequestManager) {
        super(error);
        this.requestManager = requestManager;

        const { errors } = this.requestManager;

        if (this.error instanceof AbortError) {
            errors.addAbort();
        } else if (this.error instanceof RateLimitError) {
            errors.addRateLimit({
                rateLimitGlobal: this.error.json?.global ?? null,
                ratelimitReset: this.error.response?.headers?.get('ratelimit-reset') ?? null,
            });
        } else {
            errors.addError();
        }

        this.errorLog();

        const { resumeAfter } = this.requestManager.instance;

        this.timeout = cleanLength(resumeAfter - Date.now(), true);
    }

    private errorLog() {
        if (this.error instanceof AbortError) {
            this.log(this.error.name);
        } else {
            this.log(this.error);
        }
    }

    private statusEmbed() {
        const {
            instanceUses,
            keyPercentage,
        } = this.requestManager.instance;

        const {
            errors: {
                abort,
                rateLimit,
                error,
            },
        } = this.requestManager;

        const embed = this.errorEmbed()
            .setTitle('Degraded Performance')
            .addFields([
                {
                    name: 'Type',
                    value:
                        this.error instanceof Error
                            ? this.error.name
                            : 'Unknown',
                },
                {
                    name: 'Resuming In',
                    value:
                        this.timeout ??
                        'Not applicable',
                },
                {
                    name: 'Global Rate Limit',
                    value:
                        this.error instanceof RateLimitError &&
                        rateLimit.isGlobal === true
                                ? 'Yes'
                                : 'No',
                },
                {
                    name: 'Last Minute Statistics',
                    value: `Abort Errors: ${abort.lastMinute} 
                    Rate Limit Hits: ${rateLimit.lastMinute}
                    Other Errors: ${error.lastMinute}`,
                },
                {
                    name: 'Next Timeouts',
                    value: `May not be accurate
                     Abort Errors: ${cleanLength(
                        abort.timeout,
                    )}
                    Rate Limit Errors: ${cleanLength(
                        rateLimit.timeout,
                    )}
                    Other Errors: ${cleanLength(
                        error.timeout,
                    )}`,
                },
                {
                    name: 'API Key',
                    value: `Dedicated Queries: ${cleanRound(
                        keyPercentage * keyLimit,
                    )} or ${cleanRound(keyPercentage * 100)}%
                    Instance Queries: ${instanceUses}`,
                },
            ]);

        return embed;
    }

    async systemNotify() {
        const embeds = [];
        const embed = this.statusEmbed();

        if (this.error instanceof AbortError) {
            if (this.timeout !== null) {
                embed
                    .setDescription('A timeout has been applied.');
            }

            embeds.push(embed);
        } else if (this.error instanceof RateLimitError) {
            const headers = this.error.response?.headers;

            embed
                .setDescription(
                    'A timeout has been applied. Dedicated queries have been lowered by 5%.',
                )
                .addField(
                    'Header Data',
                    `Remaining: ${headers?.get('ratelimit-remaining') ?? 'Unknown'}
                    Reset: ${headers?.get('ratelimit-reset') ?? 'Unknown'}`,
                );

            embeds.push(embed);
        } else if (this.error instanceof HTTPError) {
            embed
                .setDescription('A timeout has been applied.')
                .addField(
                    'Request',
                    `Status: ${this.error.status}`,
                );

            embeds.push(embed);
        } else if (this.error instanceof FetchError) {
            embed
                .setDescription('A timeout has been applied.');

            embeds.push(embed);
        } else {
            embed
                .setTitle('Unexpected Error');

            embeds.push(embed);
            embeds.push(this.errorStackEmbed(this.error));
        }

        await sendWebHook({
            content:
                this.timeout === null
                    ? null
                    : `<@${ownerID.join('><@')}>`,
            embeds: embeds,
            webhook:
                this.error instanceof HTTPError ||
                this.error instanceof FetchError
                    ? hypixelAPIWebhook
                    : fatalWebhook,
            suppressError: true,
        });
    }
}