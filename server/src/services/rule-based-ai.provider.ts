import { IAIProvider } from './ai.service';
import logger from '../utils/logger';

export class RuleBasedAIProvider implements IAIProvider {
  private readonly DISCLAIMER = '\n\nPlease note: This is general information only. For personalized advice, please consult our clinic professionals directly.';

  async sendMessage(message: string, context: { services: any[]; clinicInfo: any }): Promise<string> {
    const lower = message.toLowerCase();

    if (lower.includes('diagnos') || lower.includes('prescrib') || lower.includes('medication') || lower.includes('cure')) {
      return 'I am not able to provide medical diagnoses, prescribe medication, or determine treatments. Please consult with our qualified clinic professionals for personalized medical advice.' + this.DISCLAIMER;
    }

    if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('severe pain')) {
      return 'If you are experiencing a medical emergency, please call emergency services immediately (911 in the Philippines). For urgent clinic concerns, please contact us directly at our clinic number.' + this.DISCLAIMER;
    }

    if (lower.includes('hour') || lower.includes('open') || lower.includes('close') || lower.includes('schedule')) {
      const hours = context.clinicInfo?.business_hours || '9:00 AM - 6:00 PM';
      return `Our clinic operating hours are ${hours}. We are open Monday to Saturday. For appointments, you can book online or call us directly.` + this.DISCLAIMER;
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      const serviceList = context.services.map((s: any) => `- ${s.name}: ₱${s.price}`).join('\n');
      return `Here are our available services and prices:\n${serviceList}\n\nPrices may vary. Please contact us for the most current pricing.` + this.DISCLAIMER;
    }

    if (lower.includes('service') || lower.includes('treatment') || lower.includes('offer') || lower.includes('available')) {
      const serviceList = context.services.map((s: any) => `- ${s.name} (${s.duration_minutes} min) - ₱${s.price}`).join('\n');
      return `We offer the following services:\n${serviceList}\n\nWould you like to know more about any specific service?` + this.DISCLAIMER;
    }

    if (lower.includes('book') || lower.includes('appointment') || lower.includes('reserve') || lower.includes('schedule')) {
      return 'To book an appointment, you can use our online booking system or call us directly. You\'ll need to select a service, choose a preferred date and time, and select a staff member. Would you like help with the booking process?' + this.DISCLAIMER;
    }

    if (lower.includes('cancel') || lower.includes('reschedule')) {
      return 'To cancel or reschedule an appointment, please log into your account and navigate to your appointments. You can also call us directly. Please note that cancellations should be made at least 24 hours in advance.' + this.DISCLAIMER;
    }

    if (lower.includes('acne') || lower.includes('pimple') || lower.includes('oily')) {
      const acneServices = context.services.filter((s: any) =>
        s.name.toLowerCase().includes('acne') || s.name.toLowerCase().includes('facial') || s.name.toLowerCase().includes('chemical')
      );
      const serviceList = acneServices.length > 0
        ? acneServices.map((s: any) => `- ${s.name}: ₱${s.price}`).join('\n')
        : 'Please browse our services catalog for available options.';
      return `As a general informational suggestion, services related to skin cleansing and treatment may be worth discussing with the clinic. Available services include:\n${serviceList}\n\nOur professionals can recommend the most suitable option during a consultation.` + this.DISCLAIMER;
    }

    if (lower.includes('wrinkle') || lower.includes('anti-aging') || lower.includes('aging')) {
      const agingServices = context.services.filter((s: any) =>
        s.name.toLowerCase().includes('botox') || s.name.toLowerCase().includes('filler') || s.name.toLowerCase().includes('rejuvenation') || s.name.toLowerCase().includes('laser')
      );
      const serviceList = agingServices.length > 0
        ? agingServices.map((s: any) => `- ${s.name}: ₱${s.price}`).join('\n')
        : 'Please browse our services catalog for available options.';
      return `As a general informational suggestion, services related to skin rejuvenation may be worth discussing with the clinic. Available services include:\n${serviceList}\n\nOur professionals can recommend the most suitable option during a consultation.` + this.DISCLAIMER;
    }

    if (lower.includes('skin') || lower.includes('glow') || lower.includes('bright')) {
      const skinServices = context.services.filter((s: any) =>
        s.category === 'facial' || s.category === 'skin_rejuvenation'
      );
      const serviceList = skinServices.length > 0
        ? skinServices.map((s: any) => `- ${s.name}: ₱${s.price}`).join('\n')
        : 'Please browse our services catalog for available options.';
      return `As a general informational suggestion, our facial and skin rejuvenation services may be relevant. Available services include:\n${serviceList}\n\nOur professionals can recommend the most suitable option during a consultation.` + this.DISCLAIMER;
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good morning') || lower.includes('good afternoon')) {
      return 'Hello! Welcome to Souvari Skin Lab. I can help you with information about our services, pricing, clinic hours, and booking appointments. How can I assist you today?';
    }

    if (lower.includes('thank')) {
      return 'You\'re welcome! If you have any other questions, feel free to ask. We look forward to seeing you at Souvari Skin Lab.';
    }

    return 'I can help you with information about our services, pricing, clinic hours, and booking appointments. Could you please tell me what you\'d like to know? You can ask about:\n- Our services and treatments\n- Pricing and availability\n- How to book an appointment\n- Clinic hours and location' + this.DISCLAIMER;
  }
}
