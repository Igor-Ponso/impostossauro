/**
 * Marcas de reconhecimento a 20px, não reproduções oficiais: brasão vira
 * silhueta. Eslovênia e Eslováquia só se distinguem pelo brasão, e a silhueta
 * delas fica em posição diferente de propósito.
 */
const VIEWBOX = '0 0 60 40';

export const BANDEIRAS: Record<string, string> = {
  IRL: "<rect width='20' height='40' fill='#169B62'/><rect x='20' width='20' height='40' fill='#fff'/><rect x='40' width='20' height='40' fill='#FF883E'/>",
  CHE: "<rect width='60' height='40' fill='#D52B1E'/><rect x='25' y='9' width='10' height='22' fill='#fff'/><rect x='19' y='15' width='22' height='10' fill='#fff'/>",
  USA: "<rect width='60' height='40' fill='#fff'/><g fill='#B22234'><rect width='60' height='3.1'/><rect y='6.2' width='60' height='3.1'/><rect y='12.4' width='60' height='3.1'/><rect y='18.6' width='60' height='3.1'/><rect y='24.8' width='60' height='3.1'/><rect y='31' width='60' height='3.1'/><rect y='37.2' width='60' height='2.8'/></g><rect width='26' height='21.7' fill='#3C3B6E'/><g fill='#fff'><circle cx='5' cy='5' r='1.5'/><circle cx='13' cy='5' r='1.5'/><circle cx='21' cy='5' r='1.5'/><circle cx='9' cy='11' r='1.5'/><circle cx='17' cy='11' r='1.5'/><circle cx='5' cy='17' r='1.5'/><circle cx='13' cy='17' r='1.5'/><circle cx='21' cy='17' r='1.5'/></g>",
  AUS: "<rect width='60' height='40' fill='#00008B'/><rect width='30' height='20' fill='#00247D'/><path d='M0 0 L30 20 M30 0 L0 20' stroke='#fff' stroke-width='4'/><path d='M15 0 V20 M0 10 H30' stroke='#fff' stroke-width='6'/><path d='M15 0 V20 M0 10 H30' stroke='#CF142B' stroke-width='3'/><circle cx='45' cy='12' r='2.6' fill='#fff'/><circle cx='40' cy='26' r='1.8' fill='#fff'/><circle cx='50' cy='28' r='1.8' fill='#fff'/><circle cx='15' cy='31' r='2.2' fill='#fff'/>",
  ISR: "<rect width='60' height='40' fill='#fff'/><rect y='5' width='60' height='5' fill='#0038B8'/><rect y='30' width='60' height='5' fill='#0038B8'/><path d='M30 13 L36 24 L24 24 Z' fill='none' stroke='#0038B8' stroke-width='2'/><path d='M30 27 L24 16 L36 16 Z' fill='none' stroke='#0038B8' stroke-width='2'/>",
  KOR: "<rect width='60' height='40' fill='#fff'/><circle cx='30' cy='20' r='9' fill='#CD2E3A'/><path d='M30 11 a4.5 4.5 0 0 1 0 9 a4.5 4.5 0 0 0 0 9 a9 9 0 0 1 0 -18' fill='#0047A0'/><g fill='#000'><rect x='8' y='9' width='9' height='1.5'/><rect x='8' y='11.6' width='9' height='1.5'/><rect x='43' y='27' width='9' height='1.5'/><rect x='43' y='29.6' width='9' height='1.5'/></g>",
  NZL: "<rect width='60' height='40' fill='#00247D'/><rect width='30' height='20' fill='#00247D'/><path d='M0 0 L30 20 M30 0 L0 20' stroke='#fff' stroke-width='4'/><path d='M15 0 V20 M0 10 H30' stroke='#fff' stroke-width='6'/><path d='M15 0 V20 M0 10 H30' stroke='#CF142B' stroke-width='3'/><g fill='#CC142B' stroke='#fff' stroke-width='.8'><circle cx='47' cy='11' r='2'/><circle cx='42' cy='22' r='2'/><circle cx='52' cy='24' r='2'/><circle cx='46' cy='32' r='2'/></g>",
  CAN: "<rect width='60' height='40' fill='#fff'/><rect width='15' height='40' fill='#D52B1E'/><rect x='45' width='15' height='40' fill='#D52B1E'/><path d='M30 9 L32 16 L38 14 L35 20 L40 22 L33 23 L34 30 L30 26 L26 30 L27 23 L20 22 L25 20 L22 14 L28 16 Z' fill='#D52B1E'/>",
  ISL: "<rect width='60' height='40' fill='#02529C'/><rect x='16' width='12' height='40' fill='#fff'/><rect y='14' width='60' height='12' fill='#fff'/><rect x='19' width='6' height='40' fill='#DC1E35'/><rect y='17' width='60' height='6' fill='#DC1E35'/>",
  JPN: "<rect width='60' height='40' fill='#fff'/><circle cx='30' cy='20' r='11' fill='#BC002D'/>",
  ARG: "<rect width='60' height='40' fill='#fff'/><rect width='60' height='13.3' fill='#74ACDF'/><rect y='26.7' width='60' height='13.3' fill='#74ACDF'/><circle cx='30' cy='20' r='4.4' fill='#FCDD09' stroke='#B8860B' stroke-width='.6'/>",
  NOR: "<rect width='60' height='40' fill='#BA0C2F'/><rect x='16' width='12' height='40' fill='#fff'/><rect y='14' width='60' height='12' fill='#fff'/><rect x='19' width='6' height='40' fill='#00205B'/><rect y='17' width='60' height='6' fill='#00205B'/>",
  GBR: "<rect width='60' height='40' fill='#012169'/><path d='M0 0 L60 40 M60 0 L0 40' stroke='#fff' stroke-width='8'/><path d='M0 0 L60 40 M60 0 L0 40' stroke='#C8102E' stroke-width='4'/><path d='M30 0 V40 M0 20 H60' stroke='#fff' stroke-width='13'/><path d='M30 0 V40 M0 20 H60' stroke='#C8102E' stroke-width='7'/>",
  URY: "<rect width='60' height='40' fill='#fff'/><g fill='#0038A8'><rect y='4.4' width='60' height='4.4'/><rect y='13.3' width='60' height='4.4'/><rect y='22.2' width='60' height='4.4'/><rect y='31.1' width='60' height='4.4'/></g><rect width='26' height='22.2' fill='#fff'/><circle cx='13' cy='11' r='5' fill='#FCD116' stroke='#B8860B' stroke-width='.6'/>",
  CZE: "<rect width='60' height='20' fill='#fff'/><rect y='20' width='60' height='20' fill='#D7141A'/><path d='M0 0 L28 20 L0 40 Z' fill='#11457E'/>",
  DEU: "<rect width='60' height='13.3' fill='#000'/><rect y='13.3' width='60' height='13.3' fill='#DD0000'/><rect y='26.7' width='60' height='13.3' fill='#FFCE00'/>",
  SVN: "<rect width='60' height='13.3' fill='#fff'/><rect y='13.3' width='60' height='13.3' fill='#0000A0'/><rect y='26.7' width='60' height='13.3' fill='#DE1F26'/><path d='M12 8 L20 8 L20 15 L16 19 L12 15 Z' fill='#0000A0' stroke='#fff' stroke-width='1'/>",
  ESP: "<rect width='60' height='10' fill='#AA151B'/><rect y='10' width='60' height='20' fill='#F1BF00'/><rect y='30' width='60' height='10' fill='#AA151B'/><rect x='14' y='15' width='8' height='10' rx='1' fill='#AA151B'/>",
  SVK: "<rect width='60' height='13.3' fill='#fff'/><rect y='13.3' width='60' height='13.3' fill='#0B4EA2'/><rect y='26.7' width='60' height='13.3' fill='#EE1C25'/><path d='M20 12 L28 12 L28 22 L24 27 L20 22 Z' fill='#EE1C25' stroke='#fff' stroke-width='1'/>",
  FRA: "<rect width='20' height='40' fill='#002395'/><rect x='20' width='20' height='40' fill='#fff'/><rect x='40' width='20' height='40' fill='#ED2939'/>",
  HUN: "<rect width='60' height='13.3' fill='#CE2939'/><rect y='13.3' width='60' height='13.3' fill='#fff'/><rect y='26.7' width='60' height='13.3' fill='#477050'/>",
  SWE: "<rect width='60' height='40' fill='#006AA7'/><rect x='17' width='8' height='40' fill='#FECC00'/><rect y='16' width='60' height='8' fill='#FECC00'/>",
  FIN: "<rect width='60' height='40' fill='#fff'/><rect x='17' width='8' height='40' fill='#003580'/><rect y='16' width='60' height='8' fill='#003580'/>",
  GRC: "<rect width='60' height='40' fill='#fff'/><g fill='#0D5EAF'><rect width='60' height='4.44'/><rect y='8.9' width='60' height='4.44'/><rect y='17.8' width='60' height='4.44'/><rect y='26.7' width='60' height='4.44'/><rect y='35.6' width='60' height='4.4'/></g><rect width='22' height='22.2' fill='#0D5EAF'/><rect x='9' width='4.4' height='22.2' fill='#fff'/><rect y='8.9' width='22' height='4.44' fill='#fff'/>",
  DNK: "<rect width='60' height='40' fill='#C8102E'/><rect x='17' width='8' height='40' fill='#fff'/><rect y='16' width='60' height='8' fill='#fff'/>",
  BEL: "<rect width='20' height='40' fill='#000'/><rect x='20' width='20' height='40' fill='#FAE042'/><rect x='40' width='20' height='40' fill='#ED2939'/>",
  LUX: "<rect width='60' height='13.3' fill='#ED2939'/><rect y='13.3' width='60' height='13.3' fill='#fff'/><rect y='26.7' width='60' height='13.3' fill='#00A1DE'/>",
  AUT: "<rect width='60' height='13.3' fill='#ED2939'/><rect y='13.3' width='60' height='13.3' fill='#fff'/><rect y='26.7' width='60' height='13.3' fill='#ED2939'/>",
  ITA: "<rect width='20' height='40' fill='#008C45'/><rect x='20' width='20' height='40' fill='#fff'/><rect x='40' width='20' height='40' fill='#CD212A'/>",
  BRA: "<rect width='60' height='40' fill='#009739'/><path d='M30 4 L56 20 L30 36 L4 20 Z' fill='#FEDD00'/><circle cx='30' cy='20' r='9' fill='#012169'/><path d='M21.5 17.5 a18 18 0 0 1 17 0' stroke='#fff' stroke-width='2.2' fill='none'/>",
};

/** Decorativa: o nome do país está sempre ao lado, por isso `aria-hidden`. */
export function bandeiraDe(iso: string): string {
  const corpo = BANDEIRAS[iso];
  if (!corpo) return '';
  return `<svg viewBox="${VIEWBOX}" aria-hidden="true" focusable="false" `
    + `preserveAspectRatio="xMidYMid slice">${corpo}</svg>`;
}
