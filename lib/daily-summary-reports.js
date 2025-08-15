// Daily Summary Reports with Email Delivery and Historical Tracking
import { Configuration, OpenAIApi } from 'openai';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

class DailySummaryReports {
  constructor() {
    this.openai = null;
    this.transporter = null;
    this.supabase = null;
    this.reports = new Map();
    this.scheduledJobs = new Map();
  }

  async initialize() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.openai = new OpenAIApi(configuration);
    }

    // Initialize Email Transporter (using Gmail/SMTP)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Initialize Supabase for data storage
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_KEY
      );
    }

    // Schedule daily report generation
    this.scheduleDailyReports();
  }

  // Schedule daily report generation at 6 PM Sydney time
  scheduleDailyReports() {
    const scheduleTime = new Date();
    scheduleTime.setHours(18, 0, 0, 0); // 6 PM

    // If it's past 6 PM today, schedule for tomorrow
    if (new Date() > scheduleTime) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    const timeUntilReport = scheduleTime - new Date();

    setTimeout(() => {
      this.generateDailyReport();
      // Schedule next report in 24 hours
      setInterval(() => {
        this.generateDailyReport();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilReport);
  }

  // Generate comprehensive daily report
  async generateDailyReport(date = new Date()) {
    const reportDate = date.toISOString().split('T')[0];
    const reportId = `report_${reportDate}_${Date.now()}`;

    try {
      // Gather all metrics for the day
      const metrics = await this.gatherDailyMetrics(date);
      
      // Generate AI insights
      const insights = await this.generateAIInsights(metrics);
      
      // Create formatted report
      const report = {
        id: reportId,
        date: reportDate,
        generatedAt: new Date(),
        metrics,
        insights,
        summary: await this.generateExecutiveSummary(metrics, insights),
        recommendations: await this.generateRecommendations(metrics, insights),
        alerts: this.identifyAlerts(metrics),
        comparisons: await this.generateComparisons(date)
      };

      // Store report in database
      await this.storeReport(report);

      // Send email to recipients
      await this.sendReportEmails(report);

      // Cache report
      this.reports.set(reportDate, report);

      return report;
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  // Gather all daily metrics
  async gatherDailyMetrics(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics = {
      calls: {
        total: 0,
        answered: 0,
        missed: 0,
        outbound: 0,
        inbound: 0,
        averageDuration: 0,
        totalDuration: 0,
        connectRate: 0,
        byHour: new Array(24).fill(0),
        byAgent: {}
      },
      messages: {
        sms: 0,
        mms: 0,
        emails: 0,
        campaigns: 0,
        deliveryRate: 0,
        responseRate: 0
      },
      leads: {
        new: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
        total: 0,
        bySource: {},
        conversionRate: 0
      },
      appointments: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        showRate: 0
      },
      properties: {
        listed: 0,
        sold: 0,
        priceUpdates: 0,
        inspections: 0,
        avgDaysOnMarket: 0
      },
      agents: {
        active: 0,
        topPerformer: null,
        averageScore: 0,
        totalLogins: 0,
        productivity: {}
      },
      revenue: {
        estimatedCommission: 0,
        dealsClosed: 0,
        averageDealSize: 0,
        pipeline: 0
      }
    };

    // Fetch data from database
    if (this.supabase) {
      // Fetch call data
      const { data: calls } = await this.supabase
        .from('calls')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (calls) {
        metrics.calls.total = calls.length;
        metrics.calls.answered = calls.filter(c => c.status === 'answered').length;
        metrics.calls.outbound = calls.filter(c => c.direction === 'outbound').length;
        metrics.calls.inbound = calls.filter(c => c.direction === 'inbound').length;
        
        const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
        metrics.calls.totalDuration = totalDuration;
        metrics.calls.averageDuration = calls.length > 0 ? totalDuration / calls.length : 0;
        metrics.calls.connectRate = calls.length > 0 ? (metrics.calls.answered / calls.length) * 100 : 0;

        // Calls by hour
        calls.forEach(call => {
          const hour = new Date(call.created_at).getHours();
          metrics.calls.byHour[hour]++;
        });

        // Calls by agent
        calls.forEach(call => {
          if (call.agent_id) {
            if (!metrics.calls.byAgent[call.agent_id]) {
              metrics.calls.byAgent[call.agent_id] = { count: 0, duration: 0 };
            }
            metrics.calls.byAgent[call.agent_id].count++;
            metrics.calls.byAgent[call.agent_id].duration += call.duration || 0;
          }
        });
      }

      // Fetch lead data
      const { data: leads } = await this.supabase
        .from('leads')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (leads) {
        metrics.leads.new = leads.length;
        metrics.leads.qualified = leads.filter(l => l.status === 'qualified').length;
        metrics.leads.converted = leads.filter(l => l.status === 'converted').length;
        metrics.leads.lost = leads.filter(l => l.status === 'lost').length;
        
        leads.forEach(lead => {
          if (lead.source) {
            metrics.leads.bySource[lead.source] = (metrics.leads.bySource[lead.source] || 0) + 1;
          }
        });

        metrics.leads.conversionRate = metrics.leads.new > 0 
          ? (metrics.leads.converted / metrics.leads.new) * 100 
          : 0;
      }

      // Fetch appointment data
      const { data: appointments } = await this.supabase
        .from('appointments')
        .select('*')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString());

      if (appointments) {
        metrics.appointments.scheduled = appointments.length;
        metrics.appointments.completed = appointments.filter(a => a.status === 'completed').length;
        metrics.appointments.cancelled = appointments.filter(a => a.status === 'cancelled').length;
        metrics.appointments.noShow = appointments.filter(a => a.status === 'no_show').length;
        
        const expectedShows = metrics.appointments.scheduled - metrics.appointments.cancelled;
        metrics.appointments.showRate = expectedShows > 0 
          ? (metrics.appointments.completed / expectedShows) * 100 
          : 0;
      }
    }

    return metrics;
  }

  // Generate AI insights from metrics
  async generateAIInsights(metrics) {
    if (!this.openai) {
      return this.generateBasicInsights(metrics);
    }

    try {
      const prompt = `Analyze these real estate CRM daily metrics and provide actionable insights:
      
Calls: ${metrics.calls.total} total, ${metrics.calls.connectRate.toFixed(1)}% connect rate
Leads: ${metrics.leads.new} new, ${metrics.leads.conversionRate.toFixed(1)}% conversion
Appointments: ${metrics.appointments.scheduled} scheduled, ${metrics.appointments.showRate.toFixed(1)}% show rate
Properties: ${metrics.properties.listed} listed, ${metrics.properties.sold} sold

Provide:
1. Key performance highlights
2. Areas of concern
3. Opportunities identified
4. Productivity insights
5. Predictive trends`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a real estate analytics expert providing daily performance insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.data.choices[0].message.content;
      
      return {
        analysis: response,
        keyMetrics: this.extractKeyMetrics(metrics),
        trends: this.identifyTrends(metrics),
        anomalies: this.detectAnomalies(metrics)
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.generateBasicInsights(metrics);
    }
  }

  // Generate basic insights without AI
  generateBasicInsights(metrics) {
    return {
      keyMetrics: this.extractKeyMetrics(metrics),
      trends: this.identifyTrends(metrics),
      anomalies: this.detectAnomalies(metrics),
      analysis: 'AI analysis unavailable'
    };
  }

  // Extract key metrics
  extractKeyMetrics(metrics) {
    return {
      topMetric: this.identifyTopMetric(metrics),
      concernArea: this.identifyConcernArea(metrics),
      bestHour: this.findBestHour(metrics.calls.byHour),
      topAgent: this.findTopAgent(metrics.calls.byAgent),
      leadSource: this.findTopLeadSource(metrics.leads.bySource)
    };
  }

  // Identify trends
  identifyTrends(metrics) {
    const trends = [];
    
    if (metrics.calls.connectRate > 80) {
      trends.push({ type: 'positive', message: 'Excellent call connect rate' });
    }
    
    if (metrics.leads.conversionRate > 30) {
      trends.push({ type: 'positive', message: 'Strong lead conversion performance' });
    }
    
    if (metrics.appointments.showRate < 70) {
      trends.push({ type: 'negative', message: 'Low appointment show rate needs attention' });
    }
    
    return trends;
  }

  // Detect anomalies
  detectAnomalies(metrics) {
    const anomalies = [];
    
    // Check for unusual patterns
    const avgCallsPerHour = metrics.calls.total / 24;
    metrics.calls.byHour.forEach((count, hour) => {
      if (count > avgCallsPerHour * 3) {
        anomalies.push({
          type: 'spike',
          metric: 'calls',
          detail: `Unusual spike at ${hour}:00 - ${count} calls`
        });
      }
    });
    
    return anomalies;
  }

  // Generate executive summary
  async generateExecutiveSummary(metrics, insights) {
    const summary = {
      headline: this.generateHeadline(metrics),
      keyNumbers: {
        calls: metrics.calls.total,
        leads: metrics.leads.new,
        appointments: metrics.appointments.scheduled,
        deals: metrics.revenue.dealsClosed
      },
      performance: this.calculateOverallPerformance(metrics),
      highlights: this.extractHighlights(metrics, insights)
    };
    
    return summary;
  }

  // Generate recommendations
  async generateRecommendations(metrics, insights) {
    const recommendations = [];
    
    // Call performance recommendations
    if (metrics.calls.connectRate < 70) {
      recommendations.push({
        priority: 'high',
        area: 'calls',
        action: 'Review call timing and improve contact data quality',
        impact: 'Could increase connect rate by 15-20%'
      });
    }
    
    // Lead conversion recommendations
    if (metrics.leads.conversionRate < 20) {
      recommendations.push({
        priority: 'high',
        area: 'leads',
        action: 'Implement lead nurturing campaign and follow-up sequences',
        impact: 'Expected 10% improvement in conversion'
      });
    }
    
    // Appointment recommendations
    if (metrics.appointments.showRate < 80) {
      recommendations.push({
        priority: 'medium',
        area: 'appointments',
        action: 'Add SMS reminders 24 hours and 2 hours before appointments',
        impact: 'Could reduce no-shows by 25%'
      });
    }
    
    // Time optimization
    const bestHour = this.findBestHour(metrics.calls.byHour);
    if (bestHour) {
      recommendations.push({
        priority: 'low',
        area: 'productivity',
        action: `Focus calling efforts around ${bestHour}:00 when connect rates are highest`,
        impact: 'Optimize agent productivity'
      });
    }
    
    return recommendations;
  }

  // Identify alerts
  identifyAlerts(metrics) {
    const alerts = [];
    
    // Critical alerts
    if (metrics.calls.total === 0) {
      alerts.push({
        level: 'critical',
        message: 'No calls made today - check system status'
      });
    }
    
    // Warning alerts
    if (metrics.calls.connectRate < 50) {
      alerts.push({
        level: 'warning',
        message: 'Connect rate below 50% - review contact data'
      });
    }
    
    if (metrics.appointments.noShow > metrics.appointments.completed) {
      alerts.push({
        level: 'warning',
        message: 'More no-shows than completed appointments'
      });
    }
    
    // Info alerts
    if (metrics.leads.new > 50) {
      alerts.push({
        level: 'info',
        message: 'High volume of new leads - ensure timely follow-up'
      });
    }
    
    return alerts;
  }

  // Generate comparisons with previous periods
  async generateComparisons(date) {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(date);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(date);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Get historical data
    const yesterdayReport = await this.getReportByDate(yesterday);
    const lastWeekReport = await this.getReportByDate(lastWeek);
    const lastMonthReport = await this.getReportByDate(lastMonth);
    
    return {
      daily: this.compareReports(date, yesterdayReport),
      weekly: this.compareReports(date, lastWeekReport),
      monthly: this.compareReports(date, lastMonthReport)
    };
  }

  // Store report in database
  async storeReport(report) {
    if (!this.supabase) return;
    
    try {
      const { data, error } = await this.supabase
        .from('daily_reports')
        .insert({
          id: report.id,
          date: report.date,
          generated_at: report.generatedAt,
          metrics: report.metrics,
          insights: report.insights,
          summary: report.summary,
          recommendations: report.recommendations,
          alerts: report.alerts,
          comparisons: report.comparisons
        });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error storing report:', error);
      throw error;
    }
  }

  // Send report emails
  async sendReportEmails(report) {
    if (!this.transporter) {
      console.log('Email transporter not configured');
      return;
    }
    
    // Get recipient list
    const recipients = await this.getReportRecipients();
    
    // Generate HTML email
    const htmlContent = this.generateEmailHTML(report);
    const textContent = this.generateEmailText(report);
    
    // Send to each recipient
    for (const recipient of recipients) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: recipient.email,
          subject: `Daily Summary Report - ${report.date}`,
          text: textContent,
          html: htmlContent,
          attachments: [
            {
              filename: `report-${report.date}.json`,
              content: JSON.stringify(report, null, 2)
            }
          ]
        });
        
        console.log(`Report sent to ${recipient.email}`);
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
      }
    }
  }

  // Generate email HTML
  generateEmailHTML(report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .alert { padding: 15px; border-radius: 5px; margin: 10px 0; }
    .alert-critical { background: #fee; border-left: 4px solid #f44; }
    .alert-warning { background: #ffeaa7; border-left: 4px solid #fdcb6e; }
    .alert-info { background: #e3f2fd; border-left: 4px solid #2196f3; }
    .recommendation { background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }
    .chart { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .footer { margin-top: 50px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daily Summary Report</h1>
      <p>${report.date} | ${new Date(report.generatedAt).toLocaleTimeString()}</p>
      <h2>${report.summary.headline}</h2>
    </div>
    
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value">${report.metrics.calls.total}</div>
        <div class="metric-label">Total Calls</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${report.metrics.leads.new}</div>
        <div class="metric-label">New Leads</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${report.metrics.appointments.scheduled}</div>
        <div class="metric-label">Appointments</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${report.metrics.revenue.dealsClosed}</div>
        <div class="metric-label">Deals Closed</div>
      </div>
    </div>
    
    ${report.alerts.length > 0 ? `
      <div class="section">
        <div class="section-title">Alerts</div>
        ${report.alerts.map(alert => `
          <div class="alert alert-${alert.level}">
            <strong>${alert.level.toUpperCase()}:</strong> ${alert.message}
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">Key Performance Metrics</div>
      <table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>vs Yesterday</th>
          <th>Status</th>
        </tr>
        <tr>
          <td>Call Connect Rate</td>
          <td>${report.metrics.calls.connectRate.toFixed(1)}%</td>
          <td>${report.comparisons?.daily?.calls?.connectRate || 'N/A'}</td>
          <td>${report.metrics.calls.connectRate > 70 ? '✅' : '⚠️'}</td>
        </tr>
        <tr>
          <td>Lead Conversion</td>
          <td>${report.metrics.leads.conversionRate.toFixed(1)}%</td>
          <td>${report.comparisons?.daily?.leads?.conversionRate || 'N/A'}</td>
          <td>${report.metrics.leads.conversionRate > 20 ? '✅' : '⚠️'}</td>
        </tr>
        <tr>
          <td>Appointment Show Rate</td>
          <td>${report.metrics.appointments.showRate.toFixed(1)}%</td>
          <td>${report.comparisons?.daily?.appointments?.showRate || 'N/A'}</td>
          <td>${report.metrics.appointments.showRate > 80 ? '✅' : '⚠️'}</td>
        </tr>
      </table>
    </div>
    
    ${report.recommendations.length > 0 ? `
      <div class="section">
        <div class="section-title">Recommendations</div>
        ${report.recommendations.map(rec => `
          <div class="recommendation">
            <strong>${rec.area.toUpperCase()} - Priority: ${rec.priority}</strong><br>
            ${rec.action}<br>
            <em>Expected Impact: ${rec.impact}</em>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">Agent Performance</div>
      <table>
        <tr>
          <th>Agent</th>
          <th>Calls</th>
          <th>Duration</th>
          <th>Appointments</th>
        </tr>
        ${Object.entries(report.metrics.calls.byAgent).map(([agent, data]) => `
          <tr>
            <td>${agent}</td>
            <td>${data.count}</td>
            <td>${Math.round(data.duration / 60)} min</td>
            <td>-</td>
          </tr>
        `).join('')}
      </table>
    </div>
    
    <div class="footer">
      <p>This report was automatically generated by VoiCRM</p>
      <p>To view historical reports, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/reports">Reports Dashboard</a></p>
      <p><small>You received this email because you're subscribed to daily summary reports. <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage preferences</a></small></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Generate email text version
  generateEmailText(report) {
    return `
DAILY SUMMARY REPORT - ${report.date}
=====================================

${report.summary.headline}

KEY METRICS:
- Total Calls: ${report.metrics.calls.total}
- New Leads: ${report.metrics.leads.new}
- Appointments: ${report.metrics.appointments.scheduled}
- Deals Closed: ${report.metrics.revenue.dealsClosed}

PERFORMANCE:
- Call Connect Rate: ${report.metrics.calls.connectRate.toFixed(1)}%
- Lead Conversion: ${report.metrics.leads.conversionRate.toFixed(1)}%
- Show Rate: ${report.metrics.appointments.showRate.toFixed(1)}%

${report.alerts.length > 0 ? `
ALERTS:
${report.alerts.map(a => `- [${a.level.toUpperCase()}] ${a.message}`).join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
RECOMMENDATIONS:
${report.recommendations.map(r => `- ${r.area}: ${r.action}`).join('\n')}
` : ''}

View full report: ${process.env.NEXT_PUBLIC_APP_URL}/reports/${report.date}

--
VoiCRM Daily Summary
    `;
  }

  // Get report recipients
  async getReportRecipients() {
    if (!this.supabase) {
      // Default recipients
      return [
        { email: process.env.ADMIN_EMAIL || 'admin@oakmontrealty.com.au', role: 'admin' },
        { email: process.env.USER_EMAIL || 'user@oakmontrealty.com.au', role: 'user' }
      ];
    }
    
    try {
      const { data } = await this.supabase
        .from('users')
        .select('email, role, preferences')
        .or('role.eq.admin,preferences->daily_reports.eq.true');
      
      return data || [];
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }
  }

  // Get report by date
  async getReportByDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check cache first
    if (this.reports.has(dateStr)) {
      return this.reports.get(dateStr);
    }
    
    // Fetch from database
    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('daily_reports')
          .select('*')
          .eq('date', dateStr)
          .single();
        
        if (data) {
          this.reports.set(dateStr, data);
          return data;
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      }
    }
    
    return null;
  }

  // Get reports for date range
  async getReportsForRange(startDate, endDate) {
    if (!this.supabase) return [];
    
    try {
      const { data } = await this.supabase
        .from('daily_reports')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  // Helper functions
  identifyTopMetric(metrics) {
    const scores = {
      calls: metrics.calls.connectRate,
      leads: metrics.leads.conversionRate,
      appointments: metrics.appointments.showRate
    };
    
    return Object.entries(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  identifyConcernArea(metrics) {
    if (metrics.calls.connectRate < 50) return 'Low call connect rate';
    if (metrics.leads.conversionRate < 10) return 'Poor lead conversion';
    if (metrics.appointments.showRate < 70) return 'High appointment no-shows';
    return null;
  }

  findBestHour(hourlyData) {
    let maxCalls = 0;
    let bestHour = 0;
    
    hourlyData.forEach((count, hour) => {
      if (count > maxCalls) {
        maxCalls = count;
        bestHour = hour;
      }
    });
    
    return bestHour;
  }

  findTopAgent(agentData) {
    let topAgent = null;
    let maxCalls = 0;
    
    Object.entries(agentData).forEach(([agent, data]) => {
      if (data.count > maxCalls) {
        maxCalls = data.count;
        topAgent = agent;
      }
    });
    
    return topAgent;
  }

  findTopLeadSource(sourceData) {
    let topSource = null;
    let maxLeads = 0;
    
    Object.entries(sourceData).forEach(([source, count]) => {
      if (count > maxLeads) {
        maxLeads = count;
        topSource = source;
      }
    });
    
    return topSource;
  }

  generateHeadline(metrics) {
    const performance = this.calculateOverallPerformance(metrics);
    
    if (performance > 90) {
      return '🌟 Outstanding Performance Day!';
    } else if (performance > 75) {
      return '✅ Strong Performance Across All Metrics';
    } else if (performance > 60) {
      return '📊 Solid Day with Room for Improvement';
    } else {
      return '⚠️ Performance Below Expectations - Action Needed';
    }
  }

  calculateOverallPerformance(metrics) {
    const weights = {
      calls: 0.3,
      leads: 0.3,
      appointments: 0.2,
      revenue: 0.2
    };
    
    const scores = {
      calls: Math.min(100, metrics.calls.connectRate),
      leads: Math.min(100, metrics.leads.conversionRate * 3),
      appointments: Math.min(100, metrics.appointments.showRate),
      revenue: metrics.revenue.dealsClosed > 0 ? 100 : 50
    };
    
    return Object.entries(scores).reduce((total, [key, score]) => {
      return total + (score * weights[key]);
    }, 0);
  }

  extractHighlights(metrics, insights) {
    const highlights = [];
    
    if (metrics.calls.total > 100) {
      highlights.push(`High call volume: ${metrics.calls.total} calls`);
    }
    
    if (metrics.leads.conversionRate > 30) {
      highlights.push(`Excellent lead conversion: ${metrics.leads.conversionRate.toFixed(1)}%`);
    }
    
    if (metrics.revenue.dealsClosed > 0) {
      highlights.push(`${metrics.revenue.dealsClosed} deals closed`);
    }
    
    return highlights;
  }

  compareReports(currentDate, previousReport) {
    if (!previousReport) return null;
    
    // Calculate percentage changes
    return {
      calls: {
        total: this.calculateChange(currentDate.metrics?.calls?.total, previousReport.metrics?.calls?.total),
        connectRate: this.calculateChange(currentDate.metrics?.calls?.connectRate, previousReport.metrics?.calls?.connectRate)
      },
      leads: {
        new: this.calculateChange(currentDate.metrics?.leads?.new, previousReport.metrics?.leads?.new),
        conversionRate: this.calculateChange(currentDate.metrics?.leads?.conversionRate, previousReport.metrics?.leads?.conversionRate)
      },
      appointments: {
        scheduled: this.calculateChange(currentDate.metrics?.appointments?.scheduled, previousReport.metrics?.appointments?.scheduled),
        showRate: this.calculateChange(currentDate.metrics?.appointments?.showRate, previousReport.metrics?.appointments?.showRate)
      }
    };
  }

  calculateChange(current, previous) {
    if (!previous || previous === 0) return 'N/A';
    
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    
    return `${sign}${change.toFixed(1)}%`;
  }
}

// Singleton instance
let reportsInstance = null;

export const getDailySummaryReports = () => {
  if (!reportsInstance) {
    reportsInstance = new DailySummaryReports();
    reportsInstance.initialize();
  }
  return reportsInstance;
};

export default DailySummaryReports;