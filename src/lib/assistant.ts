import { filterProviders } from './providers';
import { providers } from './providers';
export function ruleBasedReply(input: string): string {
  const q = input.toLowerCase();
  if (/suicid|kill myself|self.harm/.test(q))
    return 'If you may hurt yourself or are in immediate danger, call 911. In the US, call or text 988 for the Suicide & Crisis Lifeline. I can help navigate care, but cannot provide crisis support.';
  if (/emergency|chest pain|can.t breathe|severe bleeding|fainting/.test(q))
    return 'If this could be an emergency, call 911 or seek emergency care now. Ellie cannot assess symptoms or urgency.';
  if (/diagnos|symptom|pregnan|pain|bleed|treatment|medicine|medication|dose/.test(q))
    return 'I can help you find care, but cannot diagnose symptoms or recommend treatment. Contact a qualified healthcare professional to discuss your concerns. If you think it is an emergency, call 911.';
  if (/book|appointment|calendar/.test(q))
    return 'Contact a clinic directly to request and confirm a booking. In My Care, you can save a personal appointment record, edit it, and export it to Google or Apple Calendar. Saving here does not book a clinic visit. Reminders are not available yet.';
  if (/insurance|cost|afford|free|pay|low.cost/.test(q))
    return 'Before a visit, ask the clinic: Do you accept my exact insurance plan? Is this service covered? What might I pay out of pocket? Is a sliding fee scale available, and what documents are needed? Ellie does not have verified pricing or insurance acceptance. HRSA’s official directory can help locate health centers: https://findahealthcenter.hrsa.gov/';
  if (/pap|hpv|vaccine|screen/.test(q))
    return 'A clinic can confirm whether it offers Pap/HPV screening or HPV vaccination and discuss eligibility with you. I cannot recommend a personal screening schedule. Read CDC’s original guidance in Resources, and confirm services and fees with the clinic.';
  if (/pcos|fibroid|birth control|gynec|provider|clinic|broward|miami|find/.test(q)) {
    const county = /broward/.test(q) ? 'Broward' : /miami/.test(q) ? 'Miami-Dade' : '';
    const matches = filterProviders(providers, {
      location: county,
      service: '',
      insurance: '',
      affordability: '',
    });
    if (matches.length)
      return `These source-reviewed directory entries may help you start: ${matches
        .slice(0, 3)
        .map((p) => `${p.name} (${p.city}) — ${p.website}`)
        .join(
          '; ',
        )}. Confirm the specific service, insurance, cost and appointments directly with each clinic.`;
    return 'Ellie focuses on Broward and Miami-Dade. Our source-reviewed provider directory is not populated yet, so I cannot make a verified provider match. Start with the Florida Department of Health county directories in Find Care or HRSA’s Find a Health Center: https://findahealthcenter.hrsa.gov/. Ask the clinic about your specific service, insurance and cost.';
  }
  return 'I’m Ellie, your rule-based care navigator. I can help you prepare questions about costs or insurance, explain how to organize appointments, and point you to official care directories. Try “How do I find affordable care?” or “How do I save an appointment?” Please leave out names, symptoms, and other private health details.';
}
