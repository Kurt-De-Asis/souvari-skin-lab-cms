import { ISMSProvider } from './sms.service';
import { env } from '../config/env';
import logger from '../utils/logger';
import { toPHNumber } from '../utils/phone';

export class SemaphoreSMSProvider implements ISMSProvider {
  private apiKey: string;
  private senderName: string;

  constructor() {
    this.apiKey = env.SMS_API_KEY;
    this.senderName = env.SMS_SENDER;
  }

  async send(to: string, message: string): Promise<{ success: boolean; externalId?: string; error?: string }> {
    const recipient = toPHNumber(to);
    if (!recipient) {
      const errorMsg = 'Invalid or non-Philippine recipient phone number';
      logger.error(`[SEMAPHORE SMS] ${errorMsg}: ${to}`);
      return { success: false, error: errorMsg };
    }

    try {
      const url = 'https://api.semaphore.co/api/v4/messages';

      const body = new URLSearchParams({
        apikey: this.apiKey,
        number: recipient,
        message,
      });

      if (this.senderName) {
        body.set('sendername', this.senderName);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const result: any = await response.json();

      if (!response.ok) {
        const errorMsg = result?.[0]?.message || result?.message || `HTTP ${response.status}`;
        logger.error(`[SEMAPHORE SMS] Failed to ${recipient}: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      const externalId = result?.[0]?.message_id || `semaphore-${Date.now()}`;
      logger.info(`[SEMAPHORE SMS] Sent to ${recipient}, id: ${externalId}`);
      return { success: true, externalId };
    } catch (err: any) {
      logger.error(`[SEMAPHORE SMS] Error sending to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}