export interface ISMSProvider {
  send(to: string, message: string): Promise<{ success: boolean; externalId?: string; error?: string }>;
}

export interface SMSLogData {
  userId?: number;
  recipientPhone: string;
  message: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  externalId?: string;
  errorMessage?: string;
}

import { env } from '../config/env';

let cachedProvider: ISMSProvider | null = null;

export function getSMSProvider(): ISMSProvider {
  if (cachedProvider) return cachedProvider;

  if (env.SMS_PROVIDER === 'semaphore' && env.SMS_API_KEY) {
    const { SemaphoreSMSProvider } = require('./semaphore-sms.provider');
    cachedProvider = new SemaphoreSMSProvider();
  } else if (env.SMS_PROVIDER === 'textbee' && env.SMS_API_KEY && env.TEXTBEE_DEVICE_ID) {
    const { TextBeeSMSProvider } = require('./textbee-sms.provider');
    cachedProvider = new TextBeeSMSProvider();
  } else {
    const { MockSMSProvider } = require('./mock-sms.provider');
    cachedProvider = new MockSMSProvider();
  }

  return cachedProvider!;
}