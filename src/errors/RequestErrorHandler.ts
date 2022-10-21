import { AbortError } from './AbortError';
import { BaseErrorHandler } from './BaseErrorHandler';
import { ErrorHandler } from './ErrorHandler';
import { HTTPError } from './HTTPError';
import { RateLimitError } from './RateLimitError';

export class RequestErrorHandler<E> extends BaseErrorHandler<E> {
    public constructor(error: E) {
        super(error);

        if (this.error instanceof AbortError) {
            this.sentry.setSeverity('warning');
        } else if (this.error instanceof RateLimitError) {
            this.sentry.setSeverity('error');
        } else if (this.error instanceof HTTPError) {
            this.sentry.setSeverity('warning');
        } else {
            this.sentry.setSeverity('error');
        }
    }

    public init() {
        try {
            if (this.error instanceof AbortError) {
                this.log(this.error.name);
            } else {
                this.log(this.error);
            }

            this.sentry.captureException(this.error);
        } catch (error) {
            new ErrorHandler(error, this.incidentId).init();
        }
    }
}
