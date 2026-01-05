
export const SAMPLE_CSV_CONTENT = `Company,Website,Location,Industry,Contact Name,Email,Phone,Employees
Acme Corp,acme.com,New York NY,Technology,John Doe,john@acme.com,555-0123,50-100
Globex Inc,globex.com,London UK,Manufacturing,Jane Smith,jane@globex.com,+44 20 7123 4567,1000+
Soylent Corp,soylent.com,San Francisco CA,Food & Bev,Bob Brown,,555-9999,10-50
Massive Dynamic,massivedynamic.com,Boston MA,Biotech,William Bell,william@massivedynamic.com,,500+`;

export const downloadSampleCSV = () => {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lead_import_template.csv';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
