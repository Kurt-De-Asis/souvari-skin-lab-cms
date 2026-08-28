import { ISMSProvider } from './sms.service';
import logger from '../utils/logger';

export class MockSMSProvider implements ISMSProvider {
  async send(to: string, message: string): Promise<{ success: boolean; externalId?: string; error?: string }> {
    logger.info(`[MOCK SMS] Recipient: ${to}\nMessage: ${message}`);
    return { success: true, externalId: `mock-${Date.now()}` };
  }
}
