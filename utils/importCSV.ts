
import { Lead } from '../types';

// Helper to parse a CSV line handling quotes
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let start = 0;
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      inQuotes = !inQuotes;
    } else if (text[i] === ',' && !inQuotes) {
      result.push(text.substring(start, i).replace(/^"|"$/g, '').trim());
      start = i + 1;
    }
  }
  result.push(text.substring(start).replace(/^"|"$/g, '').trim());
  return result;
};

export const parseCSV = async (file: File): Promise<Lead[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return resolve([]);

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("CSV file is empty or missing headers");

        // Parse Headers
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        // Column Mapping Heuristics
        const map = {
          company: headers.findIndex(h => h.includes('company') || h.includes('business') || h.includes('name') || h.includes('organization')),
          location: headers.findIndex(h => h.includes('location') || h.includes('city') || h.includes('address') || h.includes('country')),
          website: headers.findIndex(h => h.includes('website') || h.includes('url') || h.includes('domain')),
          industry: headers.findIndex(h => h.includes('industry') || h.includes('category') || h.includes('sector')),
          contact: headers.findIndex(h => h.includes('email') || h.includes('phone') || h.includes('contact')),
          phone: headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('tel')),
          email: headers.findIndex(h => h.includes('email') || h.includes('mail')),
          employees: headers.findIndex(h => h.includes('employee') || h.includes('size')),
          linkedin: headers.findIndex(h => h.includes('linkedin')),
        };

        const leads: Lead[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 2) continue; // Skip empty rows

          // Construct Contact String
          let contact = cols[map.contact] || 'N/A';
          if (map.phone > -1 && cols[map.phone]) contact = cols[map.phone];
          if (map.email > -1 && cols[map.email]) contact = contact !== 'N/A' ? `${contact} | ${cols[map.email]}` : cols[map.email];

          // Construct Socials
          const socials: any = {};
          if (map.linkedin > -1 && cols[map.linkedin]) socials.linkedin = cols[map.linkedin];

          leads.push({
            id: Date.now() + i + Math.random(),
            company: map.company > -1 ? cols[map.company] : 'Unknown Company',
            description: 'Imported via CSV',
            location: map.location > -1 ? cols[map.location] : 'Unknown',
            confidence: 100, // User provided data is trusted
            website: map.website > -1 ? cols[map.website] : '',
            contact: contact,
            industry: map.industry > -1 ? cols[map.industry] : 'Imported',
            employees: map.employees > -1 ? cols[map.employees] : '',
            socials,
            management: [],
            status: 'new'
          });
        }

        resolve(leads);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
