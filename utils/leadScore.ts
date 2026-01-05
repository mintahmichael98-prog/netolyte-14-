
import { Lead } from '../types';

/**
 * Calculates a lead's "Verification Confidence" score.
 * A score of 95%+ indicates a high-fidelity B2B target.
 */
export const calculateLeadScore = (lead: Lead): number => {
  // Use the AI's base confidence or a high default for discovered leads
  let score = lead.confidence || 85;

  // Weight: Industry Relevance (Max +5)
  const highValueIndustries = ['Technology', 'Finance', 'SaaS', 'Healthcare', 'Software', 'Artificial Intelligence'];
  if (highValueIndustries.some(i => lead.industry?.includes(i))) {
    score += 5;
  }

  // Weight: Website Presence (Max +10)
  if (lead.website && lead.website !== 'N/A' && lead.website.length > 4) {
    score += 10;
  }

  // Weight: Contact Data Quality (Max +15)
  // Check if contact contains both email pattern and numbers
  const hasEmail = lead.contact?.includes('@');
  const hasPhone = /[0-9]{7,}/.test(lead.contact || '');
  
  if (hasEmail && hasPhone) score += 15;
  else if (hasEmail || hasPhone) score += 8;

  // Weight: Decision Maker Depth (Max +15)
  if (lead.management && lead.management.length > 0) {
    score += 10;
    // Extra points for having a LinkedIn link for a person
    if (lead.management.some(m => m.linkedin)) {
      score += 5;
    }
  }

  // Weight: Social Profiles (Max +5)
  if (lead.socials?.linkedin || lead.socials?.twitter) {
    score += 5;
  }

  // Cap at 99% (nothing is 100% in real-time data)
  return Math.min(99, score);
};
