import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { SendMessageInput } from './ai.validation';
import crypto from 'crypto';

class AiService {
  private systemPrompt = '';

  async buildSystemPrompt(): Promise<string> {
    if (this.systemPrompt) {
      return this.systemPrompt;
    }

    const [services, settings] = await Promise.all([
      prisma.services.findMany({
        where: { status: 'active', deleted_at: null },
        select: { name: true, description: true, price: true, duration_minutes: true, category: true },
      }),
      prisma.system_settings.findMany({
        where: {
          setting_key: { in: ['clinic_name', 'clinic_hours', 'clinic_phone', 'clinic_address'] },
        },
      }),
    ]);

    const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));

    const clinicName = settingsMap.get('clinic_name')?.replace(/"/g, '') || 'Souvari Skin Lab';
    const clinicHours = settingsMap.get('clinic_hours')?.replace(/"/g, '') || 'Monday-Saturday: 9:00 AM - 6:00 PM, Sunday: Closed';
    const clinicPhone = settingsMap.get('clinic_phone')?.replace(/"/g, '') || 'Please contact the clinic for phone number';
    const clinicAddress = settingsMap.get('clinic_address')?.replace(/"/g, '') || 'Please contact the clinic for address';

    const serviceList = services
      .map(
        (s) =>
          `- ${s.name} (${s.category}): ₱${s.price} - ${s.duration_minutes} minutes. ${s.description || ''}`
      )
      .join('\n');

    this.systemPrompt = `You are a helpful AI assistant for ${clinicName}, a beauty and aesthetics clinic.

CLINIC INFORMATION:
- Name: ${clinicName}
- Hours: ${clinicHours}
- Phone: ${clinicPhone}
- Address: ${clinicAddress}

AVAILABLE SERVICES:
${serviceList || 'No services currently listed. Please contact the clinic directly.'}

IMPORTANT SAFETY INSTRUCTIONS:
- NEVER provide medical diagnoses or health assessments
- NEVER recommend medications, drugs, or treatments for medical conditions
- NEVER provide emergency medical guidance - always direct to emergency services (call 911 or local emergency number)
- ONLY recommend services that exist in the system listed above
- Always include a disclaimer: "Please consult with our clinic professionals for personalized advice."
- If you are uncertain about anything, say: "I don't have enough information. Please contact the clinic directly."
- Do not make up services, prices, or information not provided above
- Focus on booking inquiries, service information, clinic hours, and general beauty/aesthetics questions

You should be friendly, professional, and helpful while staying within these boundaries.`;

    return this.systemPrompt;
  }

  async processMessage(input: SendMessageInput, userId?: number) {
    let sessionToken = input.session_token;
    let session;

    if (sessionToken) {
      session = await prisma.chat_sessions.findUnique({
        where: { session_token: sessionToken },
      });
    }

    if (!session) {
      sessionToken = crypto.randomBytes(32).toString('hex');
      session = await prisma.chat_sessions.create({
        data: {
          user_id: userId || null,
          session_token: sessionToken,
        },
      });
    }

    await prisma.chat_messages.create({
      data: {
        session_id: session.id,
        sender_type: 'user',
        content: input.message,
      },
    });

    let botResponse: string;

    if (env.AI_API_KEY) {
      botResponse = await this.callOpenAI(input.message, session.id);
    } else {
      botResponse = await this.ruleBasedResponse(input.message);
    }

    await prisma.chat_messages.create({
      data: {
        session_id: session.id,
        sender_type: 'bot',
        content: botResponse,
      },
    });

    return {
      session_token: sessionToken,
      response: botResponse,
    };
  }

  private async callOpenAI(message: string, sessionId: number): Promise<string> {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: env.AI_API_KEY });

      const recentMessages = await prisma.chat_messages.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      const history = recentMessages.reverse().map((m) => ({
        role: m.sender_type === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

      const systemPrompt = await this.buildSystemPrompt();

      const completion = await openai.chat.completions.create({
        model: env.AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please contact the clinic directly.";
    } catch (error) {
      console.error('OpenAI API error:', error);
      return "I'm experiencing technical difficulties. Please contact the clinic directly for assistance.";
    }
  }

  private async ruleBasedResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    const systemPrompt = await this.buildSystemPrompt();

    const services = await prisma.services.findMany({
      where: { status: 'active', deleted_at: null },
      select: { name: true, price: true, duration_minutes: true, category: true },
    });

    if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('close') || lowerMessage.includes('time')) {
      const settings = await prisma.system_settings.findUnique({
        where: { setting_key: 'clinic_hours' },
      });
      const hours = settings?.setting_value?.replace(/"/g, '') || 'Monday-Saturday: 9:00 AM - 6:00 PM, Sunday: Closed';
      return `Our clinic hours are:\n${hours}\n\nPlease consult with our clinic professionals for personalized advice. For appointments, please contact us directly.`;
    }

    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('reserve')) {
      return `To book an appointment, please contact us directly or use our online booking system.\n\nAvailable services:\n${services.map((s) => `- ${s.name}: ₱${s.price} (${s.duration_minutes} min)`).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') || lowerMessage.includes('fee')) {
      if (services.length === 0) {
        return "Please contact the clinic directly for pricing information.\n\nPlease consult with our clinic professionals for personalized advice.";
      }
      return `Our service prices:\n${services.map((s) => `- ${s.name}: ₱${s.price} (${s.duration_minutes} min)`).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('treatment') || lowerMessage.includes('what do you')) {
      if (services.length === 0) {
        return "Please contact the clinic directly to learn about our services.\n\nPlease consult with our clinic professionals for personalized advice.";
      }
      return `We offer the following services:\n${services.map((s) => `- ${s.name} (${s.category}): ₱${s.price} - ${s.duration_minutes} minutes`).join('\n')}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('address') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      const settings = await prisma.system_settings.findMany({
        where: { setting_key: { in: ['clinic_phone', 'clinic_address'] } },
      });
      const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));
      const phone = settingsMap.get('clinic_phone')?.replace(/"/g, '') || 'Please contact the clinic for phone number';
      const address = settingsMap.get('clinic_address')?.replace(/"/g, '') || 'Please contact the clinic for address';
      return `Contact Information:\nPhone: ${phone}\nAddress: ${address}\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey') || lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon')) {
      return `Hello! Welcome to Souvari Skin Lab. I can help you with:\n- Service information and pricing\n- Clinic hours and contact details\n- Booking appointments\n\nHow can I assist you today?\n\nPlease consult with our clinic professionals for personalized advice.`;
    }

    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! If you have any other questions, feel free to ask. For personalized advice, please consult with our clinic professionals.";
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('help me') || lowerMessage.includes('pain') || lowerMessage.includes('reaction')) {
      return "If you are experiencing a medical emergency, please call 911 or your local emergency number immediately.\n\nFor non-urgent concerns, please contact the clinic directly to speak with our professionals.";
    }

    return "I can help you with information about our services, pricing, clinic hours, and booking appointments. Could you please tell me what you'd like to know?\n\nPlease consult with our clinic professionals for personalized advice. If you need immediate assistance, please contact the clinic directly.";
  }
}

export const aiService = new AiService();
