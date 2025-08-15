// REAL DATA ONLY - NO PLACEHOLDERS ANYWHERE
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

class RealDataManager {
  constructor() {
    this.supabase = createClientComponentClient();
    this.realStatsCache = new Map();
    this.lastUpdated = null;
  }

  // Get REAL dashboard statistics - NO MOCK DATA
  async getRealDashboardStats() {
    try {
      const [contactsResult, callsResult, dealsResult, revenueResult] = await Promise.all([
        this.getRealContactCount(),
        this.getRealCallStats(),
        this.getRealDealStats(),
        this.getRealRevenueStats()
      ]);

      const stats = {
        totalContacts: contactsResult.total || 0,
        newContactsToday: contactsResult.today || 0,
        totalCalls: callsResult.total || 0,
        callsToday: callsResult.today || 0,
        totalDeals: dealsResult.total || 0,
        activeDeals: dealsResult.active || 0,
        totalRevenue: revenueResult.total || 0,
        monthlyRevenue: revenueResult.monthly || 0,
        conversionRate: this.calculateRealConversionRate(contactsResult.total, dealsResult.total),
        lastUpdated: new Date().toISOString()
      };

      this.realStatsCache.set('dashboard', stats);
      this.lastUpdated = new Date();
      
      return stats;
    } catch (error) {
      console.error('Error fetching real dashboard stats:', error);
      // Return zeros instead of mock data
      return {
        totalContacts: 0,
        newContactsToday: 0,
        totalCalls: 0,
        callsToday: 0,
        totalDeals: 0,
        activeDeals: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch real data'
      };
    }
  }

  // Get REAL contact count from database
  async getRealContactCount() {
    try {
      // Total contacts
      const { count: totalContacts } = await this.supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Today's contacts
      const today = new Date().toISOString().split('T')[0];
      const { count: todayContacts } = await this.supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      return {
        total: totalContacts || 0,
        today: todayContacts || 0
      };
    } catch (error) {
      console.error('Error fetching real contact count:', error);
      return { total: 0, today: 0 };
    }
  }

  // Get REAL call statistics from database
  async getRealCallStats() {
    try {
      // Total calls
      const { count: totalCalls } = await this.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true });

      // Today's calls
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCalls } = await this.supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      return {
        total: totalCalls || 0,
        today: todayCalls || 0
      };
    } catch (error) {
      console.error('Error fetching real call stats:', error);
      return { total: 0, today: 0 };
    }
  }

  // Get REAL deal statistics from database
  async getRealDealStats() {
    try {
      // Total deals
      const { count: totalDeals } = await this.supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      // Active deals
      const { count: activeDeals } = await this.supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'negotiating', 'pending']);

      return {
        total: totalDeals || 0,
        active: activeDeals || 0
      };
    } catch (error) {
      console.error('Error fetching real deal stats:', error);
      return { total: 0, active: 0 };
    }
  }

  // Get REAL revenue statistics from database
  async getRealRevenueStats() {
    try {
      // Total revenue from closed deals
      const { data: totalRevenueData } = await this.supabase
        .from('deals')
        .select('value')
        .eq('status', 'closed_won');

      const totalRevenue = totalRevenueData?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      // This month's revenue
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: monthlyRevenueData } = await this.supabase
        .from('deals')
        .select('value')
        .eq('status', 'closed_won')
        .gte('closed_at', currentMonth + '-01');

      const monthlyRevenue = monthlyRevenueData?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      return {
        total: totalRevenue,
        monthly: monthlyRevenue
      };
    } catch (error) {
      console.error('Error fetching real revenue stats:', error);
      return { total: 0, monthly: 0 };
    }
  }

  // Calculate REAL conversion rate
  calculateRealConversionRate(totalContacts, totalDeals) {
    if (totalContacts === 0) return 0;
    return Math.round((totalDeals / totalContacts) * 100 * 100) / 100; // Round to 2 decimals
  }

  // Get REAL recent activities - NO MOCK DATA
  async getRealRecentActivities() {
    try {
      const { data: activities } = await this.supabase
        .from('activities')
        .select(`
          *,
          contacts (name, company),
          deals (title, value)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      return activities || [];
    } catch (error) {
      console.error('Error fetching real activities:', error);
      return [];
    }
  }

  // Get REAL callback data with full contact information
  async getRealCallbacksWithFullInfo() {
    try {
      // Get contacts with scheduled callbacks
      const { data: callbacks } = await this.supabase
        .from('contacts')
        .select(`
          *,
          contact_activities (
            id, type, scheduled_date, notes, status
          ),
          deals (
            id, title, value, status, stage
          ),
          call_logs (
            id, duration, status, created_at
          )
        `)
        .not('next_follow_up', 'is', null)
        .order('next_follow_up', { ascending: true });

      // Enrich with calculated fields
      const enrichedCallbacks = (callbacks || []).map(contact => {
        const lastCall = contact.call_logs?.[0];
        const activeDeal = contact.deals?.find(deal => deal.status === 'active');
        
        return {
          ...contact,
          days_since_contact: lastCall 
            ? Math.floor((new Date() - new Date(lastCall.created_at)) / (1000 * 60 * 60 * 24))
            : null,
          is_overdue: new Date(contact.next_follow_up) < new Date(),
          active_deal_value: activeDeal?.value || 0,
          total_call_count: contact.call_logs?.length || 0,
          last_call_duration: lastCall?.duration || 0
        };
      });

      return enrichedCallbacks;
    } catch (error) {
      console.error('Error fetching real callbacks:', error);
      return [];
    }
  }

  // Ensure NO placeholder data anywhere
  validateNoPlaceholders(data) {
    const placeholderPatterns = [
      /lorem ipsum/i,
      /placeholder/i,
      /example\.com/i,
      /test@/i,
      /sample/i,
      /demo/i,
      /fake/i,
      /mock/i,
      /555-/,
      /123-456-/,
      /John Doe/i,
      /Jane Smith/i
    ];

    const checkObject = (obj, path = '') => {
      if (typeof obj === 'string') {
        for (const pattern of placeholderPatterns) {
          if (pattern.test(obj)) {
            console.warn(`⚠️ PLACEHOLDER DETECTED at ${path}: ${obj}`);
            return false;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (!checkObject(value, `${path}.${key}`)) {
            return false;
          }
        }
      }
      return true;
    };

    return checkObject(data);
  }

  // Get REAL PipeDrive contacts with full extraction
  async extractFullPipedriveData() {
    try {
      // This would integrate with PipeDrive API
      const response = await fetch('/api/pipedrive/full-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extract_all: true,
          include_custom_fields: true,
          include_activities: true,
          include_deals: true,
          include_notes: true,
          include_files: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Extracted ${data.contacts_count} real contacts from PipeDrive`);
        return data;
      } else {
        console.error('❌ PipeDrive extraction failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error extracting PipeDrive data:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify all data is real and complete
  async verifyDataIntegrity() {
    console.log('🔍 Verifying data integrity - NO PLACEHOLDERS ALLOWED');
    
    const checks = [
      {
        name: 'Dashboard Stats',
        check: async () => {
          const stats = await this.getRealDashboardStats();
          return this.validateNoPlaceholders(stats);
        }
      },
      {
        name: 'Contact Data',
        check: async () => {
          const { data: contacts } = await this.supabase
            .from('contacts')
            .select('*')
            .limit(10);
          return this.validateNoPlaceholders(contacts);
        }
      },
      {
        name: 'Callback Data',
        check: async () => {
          const callbacks = await this.getRealCallbacksWithFullInfo();
          return this.validateNoPlaceholders(callbacks);
        }
      }
    ];

    let allValid = true;
    for (const check of checks) {
      try {
        const isValid = await check.check();
        if (!isValid) {
          console.error(`❌ ${check.name} contains placeholder data!`);
          allValid = false;
        } else {
          console.log(`✅ ${check.name} is clean - no placeholders`);
        }
      } catch (error) {
        console.error(`❌ ${check.name} validation failed:`, error);
        allValid = false;
      }
    }

    return allValid;
  }
}

export default new RealDataManager();