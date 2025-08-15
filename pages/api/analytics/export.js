import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  const { format = 'json', range = 'week', type = 'full' } = req.query;

  try {
    // Fetch analytics data
    const analyticsRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/analytics?range=${range}`);
    const analyticsData = await analyticsRes.json();

    // Fetch additional data for comprehensive report
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .order('lead_score', { ascending: false })
      .limit(100);

    const { data: callLogs } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: range,
      analytics: analyticsData,
      topContacts: contacts?.slice(0, 20) || [],
      recentCalls: callLogs?.slice(0, 50) || []
    };

    switch (format) {
      case 'excel':
        return await exportToExcel(reportData, res);
      case 'pdf':
        return await exportToPDF(reportData, res);
      case 'csv':
        return await exportToCSV(reportData, res);
      default:
        return res.status(200).json(reportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export analytics', details: error.message });
  }
}

async function exportToExcel(data, res) {
  const workbook = new ExcelJS.Workbook();
  
  // Overview Sheet
  const overviewSheet = workbook.addWorksheet('Overview');
  overviewSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
    { header: 'Change %', key: 'change', width: 15 }
  ];

  overviewSheet.addRows([
    { metric: 'Total Contacts', value: data.analytics.overview.totalContacts, change: '+3.2%' },
    { metric: 'Active Contacts', value: data.analytics.overview.activeContacts, change: '+5.1%' },
    { metric: 'Total Calls', value: data.analytics.overview.totalCalls, change: '+12.5%' },
    { metric: 'Completed Calls', value: data.analytics.overview.completedCalls, change: '+8.3%' },
    { metric: 'Conversion Rate', value: `${data.analytics.overview.conversionRate}%`, change: '+15.2%' },
    { metric: 'Total Revenue', value: `$${(data.analytics.overview.totalRevenue / 1000000).toFixed(2)}M`, change: '+18.5%' }
  ]);

  // Style the header
  overviewSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  overviewSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '636B56' }
  };

  // Lead Sources Sheet
  const leadSheet = workbook.addWorksheet('Lead Sources');
  leadSheet.columns = [
    { header: 'Source', key: 'source', width: 25 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 15 }
  ];

  if (data.analytics.leadSources) {
    leadSheet.addRows(data.analytics.leadSources);
  }

  // Top Contacts Sheet
  const contactsSheet = workbook.addWorksheet('Top Contacts');
  contactsSheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Company', key: 'company', width: 30 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Lead Score', key: 'lead_score', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  if (data.topContacts) {
    contactsSheet.addRows(data.topContacts.map(c => ({
      name: c.name,
      company: c.company || 'N/A',
      phone: c.phone_number,
      lead_score: c.lead_score || 0,
      status: c.status
    })));
  }

  // Pipeline Sheet
  const pipelineSheet = workbook.addWorksheet('Pipeline');
  pipelineSheet.columns = [
    { header: 'Stage', key: 'stage', width: 25 },
    { header: 'Count', key: 'count', width: 15 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  const pipelineData = [
    { stage: 'New Leads', count: data.analytics.pipeline.newLeads, value: data.analytics.pipeline.newLeads * 250000 },
    { stage: 'Contacted', count: data.analytics.pipeline.contacted, value: data.analytics.pipeline.contacted * 220000 },
    { stage: 'Qualified', count: data.analytics.pipeline.qualified, value: data.analytics.pipeline.qualified * 280000 },
    { stage: 'Proposal', count: data.analytics.pipeline.proposal, value: data.analytics.pipeline.proposal * 320000 },
    { stage: 'Negotiation', count: data.analytics.pipeline.negotiation, value: data.analytics.pipeline.negotiation * 350000 },
    { stage: 'Closed Won', count: data.analytics.pipeline.closedWon, value: data.analytics.pipeline.closedWon * 380000 }
  ];

  pipelineSheet.addRows(pipelineData.map(p => ({
    stage: p.stage,
    count: p.count,
    value: `$${p.value.toLocaleString()}`
  })));

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=VoiCRM_Analytics_${data.period}_${new Date().toISOString().split('T')[0]}.xlsx`);
  res.send(buffer);
}

async function exportToCSV(data, res) {
  const csv = [];
  
  // Header
  csv.push('VoiCRM Analytics Report');
  csv.push(`Generated: ${new Date().toISOString()}`);
  csv.push(`Period: ${data.period}`);
  csv.push('');
  
  // Overview metrics
  csv.push('Metric,Value,Change');
  csv.push(`Total Contacts,${data.analytics.overview.totalContacts},+3.2%`);
  csv.push(`Active Contacts,${data.analytics.overview.activeContacts},+5.1%`);
  csv.push(`Total Calls,${data.analytics.overview.totalCalls},+12.5%`);
  csv.push(`Conversion Rate,${data.analytics.overview.conversionRate}%,+15.2%`);
  csv.push(`Total Revenue,$${(data.analytics.overview.totalRevenue / 1000000).toFixed(2)}M,+18.5%`);
  csv.push('');
  
  // Lead Sources
  csv.push('Lead Sources');
  csv.push('Source,Count,Percentage');
  if (data.analytics.leadSources) {
    data.analytics.leadSources.forEach(source => {
      csv.push(`${source.source},${source.count},${source.percentage}%`);
    });
  }
  csv.push('');
  
  // Top Contacts
  csv.push('Top Contacts');
  csv.push('Name,Company,Phone,Lead Score,Status');
  if (data.topContacts) {
    data.topContacts.slice(0, 20).forEach(contact => {
      csv.push(`"${contact.name}","${contact.company || ''}","${contact.phone_number}",${contact.lead_score || 0},${contact.status}`);
    });
  }
  
  const csvContent = csv.join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=VoiCRM_Analytics_${data.period}_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
}

async function exportToPDF(data, res) {
  const doc = new PDFDocument();
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VoiCRM_Analytics_${data.period}_${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfData);
  });
  
  // Add content to PDF
  doc.fontSize(20).text('VoiCRM Analytics Report', { align: 'center' });
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.fontSize(12).text(`Period: ${data.period}`, { align: 'center' });
  doc.moveDown(2);
  
  // Overview Section
  doc.fontSize(16).text('Overview Metrics', { underline: true });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Total Contacts: ${data.analytics.overview.totalContacts}`);
  doc.text(`Active Contacts: ${data.analytics.overview.activeContacts}`);
  doc.text(`Total Calls: ${data.analytics.overview.totalCalls}`);
  doc.text(`Completed Calls: ${data.analytics.overview.completedCalls}`);
  doc.text(`Conversion Rate: ${data.analytics.overview.conversionRate}%`);
  doc.text(`Total Revenue: $${(data.analytics.overview.totalRevenue / 1000000).toFixed(2)}M`);
  doc.moveDown(2);
  
  // Lead Metrics
  doc.fontSize(16).text('Lead Distribution', { underline: true });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`Hot Leads: ${data.analytics.leadMetrics.hot}`);
  doc.text(`Warm Leads: ${data.analytics.leadMetrics.warm}`);
  doc.text(`Cold Leads: ${data.analytics.leadMetrics.cold}`);
  doc.text(`New Leads: ${data.analytics.leadMetrics.new}`);
  doc.moveDown(2);
  
  // Pipeline
  doc.fontSize(16).text('Sales Pipeline', { underline: true });
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`New Leads: ${data.analytics.pipeline.newLeads}`);
  doc.text(`Contacted: ${data.analytics.pipeline.contacted}`);
  doc.text(`Qualified: ${data.analytics.pipeline.qualified}`);
  doc.text(`Proposal: ${data.analytics.pipeline.proposal}`);
  doc.text(`Negotiation: ${data.analytics.pipeline.negotiation}`);
  doc.text(`Closed Won: ${data.analytics.pipeline.closedWon}`);
  doc.moveDown(2);
  
  // Lead Sources
  if (data.analytics.leadSources && data.analytics.leadSources.length > 0) {
    doc.addPage();
    doc.fontSize(16).text('Lead Sources', { underline: true });
    doc.moveDown();
    doc.fontSize(11);
    data.analytics.leadSources.forEach(source => {
      doc.text(`${source.source}: ${source.count} (${source.percentage}%)`);
    });
  }
  
  // Top Contacts
  if (data.topContacts && data.topContacts.length > 0) {
    doc.addPage();
    doc.fontSize(16).text('Top Contacts', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    data.topContacts.slice(0, 10).forEach(contact => {
      doc.text(`${contact.name} - ${contact.company || 'N/A'} - Score: ${contact.lead_score || 0}`);
    });
  }
  
  doc.end();
}