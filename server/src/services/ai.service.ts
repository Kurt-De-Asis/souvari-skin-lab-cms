export interface IAIProvider {
  sendMessage(message: string, context: { services: any[]; clinicInfo: any; history?: any[] }): Promise<string>;
}
