import type { HypixelRequestCall } from './HypixelRequestCall';
import { HypixelAPI } from '../@types/hypixel';
import { RateLimitError } from '../util/error/RateLimitError';
import { isAbortError } from '../util/error/helper';

export class Abort {
  abortsLastMinute: number;
  baseTimeout: number;
  timeoutLength: number;

  constructor() {
    this.abortsLastMinute = 0;
    this.baseTimeout = 30000;
    this.timeoutLength = this.baseTimeout;
  }

  addAbort(): void {
    this.abortsLastMinute += 1;
    setTimeout(() => {
      this.abortsLastMinute -= 1;
    }, 60000);
  }

  generateTimeoutLength(): number {
    const timeout = this.timeoutLength;
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, timeout + (this.baseTimeout * 50));
    return timeout;
  }

  reportAbortError(RequestInstance: HypixelRequestCall): void {
    const currentTimeout = Math.max(RequestInstance.instance.resumeAfter, Date.now());
    this.addAbort();
    if (this.timeoutLength > this.baseTimeout || this.abortsLastMinute > 1) {
      const newTimeoutLength = this.generateTimeoutLength();
      RequestInstance.instance.resumeAfter = currentTimeout + newTimeoutLength;
    }
  }
}

export class RateLimit {
  baseTimeout: number;
  isGlobal: boolean;
  rateLimitErrorsLastMinute: number;
  timeoutLength: number;

  constructor() {
    this.baseTimeout = 60000;
    this.isGlobal = false;
    this.rateLimitErrorsLastMinute = 0;
    this.timeoutLength = this.baseTimeout;
  }

  addRateLimit(): void {
    this.rateLimitErrorsLastMinute += 1;
    setTimeout(() => {
      this.rateLimitErrorsLastMinute -= 1;
    }, 60000);
  }

  generateTimeoutLength(): number {
    if (this.isGlobal === true) return this.timeoutLength + 5 * this.baseTimeout;
    else {
      const timeout = this.timeoutLength;
      this.timeoutLength += this.baseTimeout;
      setTimeout(() => {
        this.timeoutLength -= this.baseTimeout;
      }, timeout + (this.baseTimeout * 50));
      return timeout;
    }
  }

  reportRateLimitError(RequestInstance: HypixelRequestCall, error: RateLimitError): void {
    const currentTimeout = Math.max(RequestInstance.instance.resumeAfter, Date.now());
    const additionalTimeout = currentTimeout + this.generateTimeoutLength();
    this.addRateLimit();
    this.isGlobal = error.json?.global ?? false;
    RequestInstance.instance.keyPercentage -= 0.05;
    RequestInstance.instance.resumeAfter = additionalTimeout;
  }
}

export class Unusual {
  baseTimeout: number;
  timeoutLength: number;
  unusualErrorsLastMinute: number;

  constructor() {
    this.baseTimeout = 30000;
    this.timeoutLength = this.baseTimeout;
    this.unusualErrorsLastMinute = 0;
  }

  addUnusualError(): void {
    this.unusualErrorsLastMinute += 1;
    setTimeout(() => {
      this.unusualErrorsLastMinute -= 1;
    }, 60000);
  }

  generateTimeoutLength(): number {
    const timeout = this.timeoutLength;
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, timeout + (this.baseTimeout * 50));
    return timeout;
  }

  reportUnusualError(RequestInstance: HypixelRequestCall): void {
    const currentTimeout = Math.max(RequestInstance.instance.resumeAfter, Date.now());
    const additionalTimeout = currentTimeout + this.generateTimeoutLength();
    this.addUnusualError();
    RequestInstance.instance.resumeAfter = additionalTimeout;
  }
}

export class Instance {
  abortThreshold: number;
  readonly baseURL: string;
  enabled: boolean;
  instanceUses: number;
  keyPercentage: number;
  resumeAfter: number;
  readonly userTable: string;

  constructor() {
    this.abortThreshold = 2500;
    this.baseURL = 'https://api.hypixel.net/%{type}%?uuid=%{uuid}%';
    this.enabled = true;
    this.instanceUses = 0;
    this.keyPercentage = 0.20;
    this.resumeAfter = 0;
    this.userTable = 'api';
  }
}