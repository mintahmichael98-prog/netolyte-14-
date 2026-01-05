


import { Lead, LeadStatus } from '../types';
import toast from 'react-hot-toast';

// Declare XLSX for TypeScript since it's loaded via CDN
declare const XLSX: any;

export interface ReportConfig {
  startDate: string;
  endDate: string;
  status: LeadStatus | 'all';
  industry: string;
  location: string;
}

export const generateExcelReport = (leads: Lead[], config: ReportConfig) => {
  try {
    const wb = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];
    const avgDealSize = 15000; // Estimated value per lead in GHS

    // 1. FILTER DATA
    const start = new Date(config.startDate).getTime();
    const end = new Date(config.endDate).getTime();

    const filteredLeads = leads.filter(l => {
      // Fallback logic for date: if ID looks like timestamp use it, else assume it matches
      const leadDate = l.id > 1000000000000 ? l.id : Date.now(); 
      const inDateRange = leadDate >= start && leadDate <= end + 86400000; // +1 day buffer
      
      const inStatus = config.status === 'all' || (l.status || 'new') === config.status;
      
      const inIndustry = config.industry === 'all' || (l.industry || 'Unknown') === config.industry;
      
      // Fuzzy match for location
      const inLocation = config.location === 'all' || 
        (l.location && l.location.toLowerCase().includes(config.location.toLowerCase()));

      return inDateRange && inStatus && inIndustry && inLocation;
    });

    if (filteredLeads.length === 0) {
      toast.error("No leads found for the selected criteria.");
      return;
    }

    // 2. PREPARE AGGREGATES (Pivot Data)
    const statusCounts: Record<string, { count: number, value: number }> = {};
    const industryCounts: Record<string, number> = {};

    filteredLeads.forEach(lead => {
      // Status Aggregation
      const s = (lead.status || 'new').toUpperCase();
      if (!statusCounts[s]) statusCounts[s] = { count: 0, value: 0 };
      statusCounts[s].count++;
      statusCounts[s].value += avgDealSize; 

      // Industry Aggregation
      const i = lead.industry || 'Unknown';
      industryCounts[i] = (industryCounts[i] || 0) + 1;
    });

    // 3. BUILD DASHBOARD SUMMARY SHEET
    const summaryRows = [
      ["NETOLYTE - EXECUTIVE DASHBOARD"],
      ["Report Date", timestamp],
      ["Period", `${config.startDate} to ${config.endDate}`],
      ["Total Leads", filteredLeads.length],
      ["Filters Applied", `Status: ${config.status}, Ind: ${config.industry}, Loc: ${config.location}`],
      ["Currency", "GHS (Ghana Cedis)"],
      [], // Spacer
      ["PIPELINE STATUS BREAKDOWN"], // Header
      ["Status", "Count", "Value (Est GHS)", "% Distribution", "Action"], // Table Header
    ];

    // Add Status Rows
    const statusKeys = Object.keys(statusCounts);
    statusKeys.forEach(key => {
      const { count, value } = statusCounts[key];
      const percent = ((count / filteredLeads.length) * 100).toFixed(1) + '%';
      
      summaryRows.push([
        key,
        count,
        value.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' }),
        percent,
        "View Details" // Placeholder for link
      ]);
    });

    summaryRows.push([]); // Spacer
    summaryRows.push([]); // Spacer
    summaryRows.push(["TOP INDUSTRIES ANALYSIS"]);
    summaryRows.push(["Industry", "Count"]);

    // Add Industry Rows
    Object.entries(industryCounts)
      .sort((a,b) => b[1] - a[1]) // Sort descending
      .slice(0, 10) // Top 10
      .forEach(([ind, count]) => {
        summaryRows.push([
          ind,
          count
        ]);
      });

    // Create Summary Worksheet
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

    // --- APPLY HYPERLINKS ---
    // Status table starts at row 9 (index 8). Links in Column E (index 4)
    let currentRow = 8; 
    statusKeys.forEach((key) => {
      const cellRef = XLSX.utils.encode_cell({ r: currentRow + 1, c: 4 }); 
      const sheetName = key.replace(/[\[\]\*\/\\\?]/g, '').substring(0, 31); // Safe name
      
      // Add Hyperlink
      if (!wsSummary[cellRef]) wsSummary[cellRef] = { t: 's', v: "View Details" };
      wsSummary[cellRef].l = { Target: `#${sheetName}!A1`, Tooltip: `Go to ${sheetName} Sheet` };
      
      currentRow++;
    });

    // Set Column Widths
    wsSummary['!cols'] = [
      { wch: 25 }, // Status
      { wch: 10 }, // Count
      { wch: 20 }, // Value
      { wch: 15 }, // %
      { wch: 15 }, // Link
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "DASHBOARD");

    // 4. GENERATE INDIVIDUAL DATA SHEETS
    const statuses = config.status === 'all' 
      ? ['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost'] 
      : [config.status];

    statuses.forEach(status => {
      const sUpper = status.toUpperCase();
      const leadsInStatus = filteredLeads.filter(l => (l.status || 'new') === status);
      
      // Create sheet if data exists
      if (statusCounts[sUpper] || leadsInStatus.length === 0) {
        // Prepare Data
        const sheetData = leadsInStatus.map(l => ({
          "Company": l.company,
          "Status": (l.status || 'new').toUpperCase(),
          "Contact Name": l.management?.[0]?.name || '',
          "Role": l.management?.[0]?.role || '',
          "Email": l.management?.[0]?.email || '',
          "Phone": l.contact,
          "Website": l.website,
          "Location": l.location,
          "Industry": l.industry,
          "Confidence": l.confidence + '%',
          "Last Contact": l.lastContacted ? new Date(l.lastContacted).toLocaleDateString() : '-'
        }));

        // Empty row hack to ensure headers appear even if no data
        if (sheetData.length === 0) {
          sheetData.push({ "Company": "No leads", "Status": "", "Contact Name": "", "Role": "", "Email": "", "Phone": "", "Website": "", "Location": "", "Industry": "", "Confidence": "", "Last Contact": "" });
        }

        const ws = XLSX.utils.json_to_sheet(sheetData);
        ws['!cols'] = [{wch:25}, {wch:12}, {wch:20}, {wch:20}, {wch:25}, {wch:20}, {wch:25}, {wch:20}, {wch:20}, {wch:10}, {wch:12}];
        
        const safeName = sUpper.replace(/[\[\]\*\/\\\?]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      }
    });

    // 5. EXPORT
    XLSX.writeFile(wb, `Netolyte_Report_${timestamp}.xlsx`);
    toast.success("Report generated successfully!");

  } catch (error) {
    console.error("Export failed", error);
    toast.error("Failed to generate report.");
  }
};