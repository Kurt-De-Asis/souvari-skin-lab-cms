import { ISMSProvider } from './sms.service';
import { env } from '../config/env';
import logger from '../utils/logger';

export class TextBeeSMSProvider implements ISMSProvider {
  private apiKey: string;
  private deviceId: string;
  private sender: string;

  constructor() {
    this.apiKey = env.SMS_API_KEY;
    this.deviceId = env.TEXTBEE_DEVICE_ID || '';
    this.sender = env.SMS_SENDER;
  }

  async send(to: string, message: string): Promise<{ success: boolean; externalId?: string; error?: string }> {
    try {
      const url = `https://api.textbee.dev/api/v1/gateway/devices/${this.deviceId}/send-sms`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          recipients: [to],
          message,
        }),
      });

      const result: any = await response.json();

      if (!response.ok) {
        const errorMsg = result?.message || result?.error || `HTTP ${response.status}`;
        logger.error(`[TEXTBEE SMS] Failed to ${to}: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      const externalId = result?.data?.id || result?.id || `textbee-${Date.now()}`;
      logger.info(`[TEXTBEE SMS] Sent to ${to}, id: ${externalId}`);
      return { success: true, externalId };
    } catch (err: any) {
      logger.error(`[TEXTBEE SMS] Error sending to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}