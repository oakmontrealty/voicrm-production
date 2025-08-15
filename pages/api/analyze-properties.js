// API endpoint for property valuation analysis
import { getPropertyAnalyzer } from '../../lib/property-valuation-analyzer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action = 'analyze', limit = 100 } = req.body;
    
    // Get contacts from our imported data
    const contacts = global.importedContacts || [];
    
    if (contacts.length === 0) {
      return res.status(400).json({
        error: 'No contacts found. Please import contacts first.'
      });
    }

    const analyzer = getPropertyAnalyzer();

    switch (action) {
      case 'analyze':
        console.log(`Starting property analysis for ${contacts.length} contacts...`);
        
        // Take a subset if specified
        const contactsToAnalyze = contacts.slice(0, limit);
        
        // Run analysis
        const report = await analyzer.analyzeContactProperties(contactsToAnalyze);
        
        // Store results globally for export
        global.propertyAnalysisReport = report;
        
        return res.status(200).json({
          success: true,
          message: `Analyzed ${report.summary.successful} properties successfully`,
          report
        });

      case 'status':
        // Check if analysis is available
        if (global.propertyAnalysisReport) {
          return res.status(200).json({
            success: true,
            hasReport: true,
            summary: global.propertyAnalysisReport.summary
          });
        } else {
          return res.status(200).json({
            success: true,
            hasReport: false,
            message: 'No analysis report available. Run analysis first.'
          });
        }

      case 'export':
        // Export results to CSV
        if (!global.propertyAnalysisReport) {
          return res.status(400).json({
            error: 'No analysis report available'
          });
        }
        
        const csv = generateCSV(global.propertyAnalysisReport);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="property-analysis.csv"');
        return res.status(200).send(csv);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['analyze', 'status', 'export']
        });
    }

  } catch (error) {
    console.error('Property analysis error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
}

function generateCSV(report) {
  const headers = [
    'Contact Name',
    'Owner/Agent',
    'Address',
    'Estimated Value',
    'Value Range Min',
    'Value Range Max',
    'Property Type',
    'Bedrooms',
    'Bathrooms',
    'Land Size',
    'Last Sold Date',
    'Last Sold Price',
    'Confidence Score',
    'Key Insights'
  ];
  
  const rows = report.results.map(r => {
    const analysis = r.analysis;
    if (!analysis) {
      return [
        r.contactName,
        r.contactOwner,
        r.address,
        'Error',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        r.error || 'Analysis failed'
      ];
    }
    
    return [
      r.contactName,
      r.contactOwner,
      r.address,
      analysis.estimatedValue || '',
      analysis.valuationRange?.min || '',
      analysis.valuationRange?.max || '',
      analysis.propertyDetails?.propertyType || '',
      analysis.propertyDetails?.bedrooms || '',
      analysis.propertyDetails?.bathrooms || '',
      analysis.propertyDetails?.landSize || '',
      analysis.propertyDetails?.lastSold?.date || '',
      analysis.propertyDetails?.lastSold?.price || '',
      analysis.confidence || '',
      analysis.insights?.map(i => i.message).join('; ') || ''
    ];
  });
  
  // Add headers
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csv;
}