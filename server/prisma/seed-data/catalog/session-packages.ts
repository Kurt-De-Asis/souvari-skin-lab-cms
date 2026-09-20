import { SectionDef } from '../types';
import { vipNm } from '../helpers';

type Row = [string, string, number, number, number];

const SRC = 'PDF p.10-16 · Session Series';

// [name, slug, sessions, vip, non_member]
const rows: Row[] = [
  // 3 Session Series · UltraTight HIFU
  ['3 Sess. UltraTight V-Jaw & Chin Lift', 'sp-hifu-v-jaw-chin-3', 3, 7249, 9665],
  ['3 Sess. Full Face Lift: Jaw, Chin & Neck', 'sp-hifu-full-face-3', 3, 12413, 16550],
  ['3 Sess. Neck Contouring', 'sp-hifu-neck-3', 3, 6484, 8645],
  ['3 Sess. Cheeks & Nasolabial Folds', 'sp-hifu-cheeks-3', 3, 8208, 10944],
  ['3 Sess. Eye Area HIFU', 'sp-hifu-eye-3', 3, 5719, 7625],
  ['3 Sess. Arms', 'sp-hifu-arms-3', 3, 7249, 9665],
  ['3 Sess. Abdomen', 'sp-hifu-abdomen-3', 3, 17194, 22925],
  ['3 Sess. Thighs', 'sp-hifu-thighs-3', 3, 15282, 20375],
  ['3 Sess. Back', 'sp-hifu-back-3', 3, 16238, 21650],
  ['3 Sess. Buttocks', 'sp-hifu-buttocks-3', 3, 15282, 20375],
  ['3 Sess. Flanks', 'sp-hifu-flanks-3', 3, 15282, 20375],
  // 7 Session Series · RF
  ['7 Sess. Double Chin', 'sp-rf-double-chin-7', 7, 5625, 7500],
  ['7 Sess. Neck', 'sp-rf-neck-7', 7, 5625, 7500],
  ['7 Sess. Face', 'sp-rf-face-7', 7, 7500, 10000],
  ['7 Sess. Face + Neck', 'sp-rf-face-neck-7', 7, 9375, 12500],
  ['7 Sess. Underarms', 'sp-rf-underarms-7', 7, 5625, 7500],
  ['7 Sess. Upper Arms', 'sp-rf-upper-arms-7', 7, 9375, 12500],
  ['7 Sess. Bra Fat', 'sp-rf-bra-fat-7', 7, 7500, 10000],
  ['7 Sess. Abdomen', 'sp-rf-abdomen-7', 7, 11250, 15000],
  ['7 Sess. Waist/Love Handles', 'sp-rf-waist-7', 7, 9375, 12500],
  ['7 Sess. Abdomen + Waist', 'sp-rf-abdomen-waist-7', 7, 16875, 22500],
  ['7 Sess. Full Back', 'sp-rf-full-back-7', 7, 13125, 17500],
  ['7 Sess. Buttocks', 'sp-rf-buttocks-7', 7, 11250, 15000],
  ['7 Sess. Inner Thighs', 'sp-rf-inner-thighs-7', 7, 11250, 15000],
  ['7 Sess. Outer Thighs', 'sp-rf-outer-thighs-7', 7, 11250, 15000],
  ['7 Sess. Full Thighs', 'sp-rf-full-thighs-7', 7, 16875, 22500],
  ['7 Sess. Knees', 'sp-rf-knees-7', 7, 5625, 7500],
  ['7 Sess. Calves', 'sp-rf-calves-7', 7, 9375, 12500],
  // 7 Session Series · RF Combination Packages
  ['7 Sess. Face + Neck + Double Chin', 'sp-rfc-face-neck-chin-7', 7, 13125, 17500],
  ['7 Sess. Arms + Bra Fat', 'sp-rfc-arms-brafat-7', 7, 15000, 20000],
  ['7 Sess. Abdomen + Waist', 'sp-rfc-abdomen-waist-7', 7, 16875, 22500],
  ['7 Sess. Abdomen + Waist + Back', 'sp-rfc-abdomen-waist-back-7', 7, 24375, 32500],
  ['7 Sess. Thighs + Buttocks', 'sp-rfc-thighs-buttocks-7', 7, 22500, 30000],
  ['7 Sess. Lower Body RF', 'sp-rfc-lower-body-7', 7, 28125, 37500],
  // 7 Session Series · Signature Facials
  ['7 Sess. - Diamond Glow', 'sp-facial-diamond-glow-7', 7, 2227, 2969],
  ['7 Sess. - Signature DermaClear Facial', 'sp-facial-dermaclear-7', 7, 3567, 4754],
  ['7 Sess. - Signature DermaClear+ Diamond Facial', 'sp-facial-dermaclear-diamond-7', 7, 4458, 5944],
  ['7 Sess. - Signature DermaClear+ Mask & PDT Facial', 'sp-facial-dermaclear-mask-pdt-7', 7, 5574, 7432],
  ['7 Sess. - Signature Diamond DermaClear+ Mask & PDT Facial', 'sp-facial-diamond-mask-pdt-7', 7, 7136, 9514],
  ['7 Sess. - Signature DermaClear+ RejuvaLight Facial', 'sp-facial-dermaclear-rejuvalight-7', 7, 8028, 10704],
  ['7 Sess. - Signature DermaClear+ RejuvaLight + Mask & PDT Facial', 'sp-facial-rejuvalight-mask-pdt-7', 7, 8926, 11894],
  ['7 Sess. - Signature DermaClear+ Contour RF Facial', 'sp-facial-dermaclear-rf-7', 7, 10260, 13679],
  ['7 Sess. - Signature DermaClear+ Contour RF + Mask & PDT Facial', 'sp-facial-rf-mask-pdt-7', 7, 11598, 15464],
  ['7 Sess. - Signature Diamond Contour RF + Mask & PDT Facial', 'sp-facial-diamond-rf-mask-pdt-7', 7, 12491, 16654],
  ['7 Sess. - Signature DermaClear+ Clinical O2 AcneClear with Anti-Aging', 'sp-facial-o2-acne-7', 7, 13383, 17844],
  ['7 Sess. - Signature Diamond DermaClear+ Clinical O2 AcneClear with Anti-Aging', 'sp-facial-diamond-o2-acne-7', 7, 15614, 20819],
  ['7 Sess. - 10 in 1 HydraFacial', 'sp-facial-10in1-hydrafacial-7', 7, 5797, 7729],
  ['7 Sess. - Hollywood Carbon Laser Peel (Face)', 'sp-facial-carbon-peel-7', 7, 6690, 8919],
  // 7 Session Series · Body Whitening
  ['7 Sess. - Underarms Carbon Laser Whitening', 'sp-bw-underarm-carbon-7', 7, 3566, 4754],
  ['7 Sess. - Elbow Carbon Laser Whitening', 'sp-bw-elbow-carbon-7', 7, 3566, 4754],
  ['7 Sess. - Neck / Nape Carbon Laser Whitening', 'sp-bw-neck-carbon-7', 7, 4686, 6248],
  ['7 Sess. - Bikini Area Carbon Laser Whitening', 'sp-bw-bikini-carbon-7', 7, 5351, 7134],
  ['7 Sess. - Knees Carbon Laser Whitening', 'sp-bw-knee-carbon-7', 7, 5351, 7134],
  ['7 Sess. - Buttocks Carbon Laser Whitening', 'sp-bw-buttocks-carbon-7', 7, 5351, 7134],
  ['7 Sess. - Underarm Diamond Peel w/ Bleach', 'sp-bw-underarm-dp-bleach-7', 7, 5351, 7134],
  ['7 Sess. - Underarm Diamond Peel + Carbon Laser Whitening', 'sp-bw-underarm-dp-carbon-7', 7, 6690, 8919],
  // 7 Session Series · Beauty Glow Combos
  ['7 Sess. - Signature DermaClear + Carbon Laser & PDT', 'sp-gc-dermaclear-carbon-pdt-7', 7, 9446, 12594],
  ['7 Sess. - Signature DermaClear + Carbon Laser + Mask & PDT', 'sp-gc-dermaclear-carbon-mask-pdt-7', 7, 11336, 15114],
  ['7 Sess. - 10 in 1 HydraFacial + Hollywood Carbon Laser Peel, Mask & PDT', 'sp-gc-hydrafacial-carbon-7', 7, 12281, 16374],
  ['7 Sess. - Signature DermaClear + Carbon Laser + Diamond Peel + Mask & PDT', 'sp-gc-carbon-diamond-peel-7', 7, 13698, 18264],
  ['7 Sess. - Signature DermaClear + Diamond Peel + Hydra-Oxy + Mask & PDT', 'sp-gc-diamond-hydra-oxy-7', 7, 15588, 20784],
  ['7 Sess. - Underarm Carbon Laser Whitening + Diode Hair Removal', 'sp-gc-underarm-carbon-diode-7', 7, 6842, 9122],
  ['7 Sess. - Underarm Diamond Peel + Carbon Laser Whitening + Diode Hair Removal', 'sp-gc-underarm-dp-carbon-diode-7', 7, 10149, 13532],
  // 7 Session Series · DIODE Laser Hair Removal
  ['7 Sess. - Diode Upper Lip / Lower Lip', 'sp-di-upper-lip-7', 7, 2927, 3902],
  ['7 Sess. - Diode Chin', 'sp-di-chin-7', 7, 3904, 5202],
  ['7 Sess. - Diode Sideburns / Cheeks', 'sp-di-sideburns-7', 7, 3566, 4754],
  ['7 Sess. - Diode Jawline / Beard Area', 'sp-di-jawline-7', 7, 4196, 5594],
  ['7 Sess. - Diode Full Face', 'sp-di-full-face-7', 7, 7766, 10354],
  ['7 Sess. - Diode Underarm', 'sp-di-underarm-7', 7, 4196, 5594],
  ['7 Sess. - Diode Half Arm', 'sp-di-half-arm-7', 7, 7556, 10074],
  ['7 Sess. - Diode Full Arm', 'sp-di-full-arm-7', 7, 10496, 13994],
  ['7 Sess. - Diode Half Legs', 'sp-di-half-legs-7', 7, 9491, 12594],
  ['7 Sess. - Diode Full Legs', 'sp-di-full-legs-7', 7, 14276, 19034],
  ['7 Sess. - Diode Bikini Line', 'sp-di-bikini-7', 7, 6506, 8674],
  ['7 Sess. - Diode Brazilian', 'sp-di-brazilian-7', 7, 6926, 9234],
  ['7 Sess. - Diode Chest', 'sp-di-chest-7', 7, 10916, 14554],
  ['7 Sess. - Diode Abdomen', 'sp-di-abdomen-7', 7, 10916, 14554],
  ['7 Sess. - Diode Lower Back (Midline)', 'sp-di-lower-back-7', 7, 6506, 8674],
  ['7 Sess. - Diode Inner Thigh / Under Buttocks', 'sp-di-inner-thigh-7', 7, 5666, 7554],
  ['7 Sess. - Diode Full Back', 'sp-di-full-back-7', 7, 15116, 20154],
  // 7 Session Series · Targeted Facials
  ['7 Sess. - Mild Acne Treatment + Mask', 'sp-acne-mild-7', 7, 5574, 7342],
  ['7 Sess. - Severe Acne Treatment + Mask', 'sp-acne-severe-7', 7, 6913, 9217],
  ['7 Sess. - Mild Acne + Mask + Hydra-Oxy', 'sp-acne-mild-hydra-7', 7, 8698, 11597],
  ['7 Sess. - Severe Acne + Mask + Hydra-Oxy', 'sp-acne-severe-hydra-7', 7, 9813, 13084],
];

const section: SectionDef = {
  slug: 'session-packages',
  name: 'Session Series',
  display_order: 7,
  services: rows.map(([name, slug, sessions, vip, nm]) => ({
    name,
    slug,
    category: 'package',
    duration_minutes: 60,
    inclusions: [name.replace(/^\d Sess\.\s*-\s*/i, '')],
    prices: vipNm(vip, nm, { source_ref: SRC }),
    package: {
      sessions_included: sessions,
      session_price: Math.round(vip / sessions * 100) / 100,
    },
  })),
};

export default section;