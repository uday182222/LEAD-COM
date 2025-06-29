import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    whatsappSent: 0
  });
  const [campaignData, setCampaignData] = useState([]);
  const [leadData, setLeadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState({ to: '', subject: '', body: '' });
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const campaignsResponse = await fetch('http://localhost:5001/api/campaigns');
      const campaignsData = await campaignsResponse.json();
      
      // Fetch leads
      const leadsResponse = await fetch('http://localhost:5001/api/available-leads');
      const leadsData = await leadsResponse.json();
      
      if (campaignsData.success && leadsData.success) {
        const campaigns = campaignsData.campaigns || [];
        const leads = leadsData.leads || [];
        
        // Calculate stats
        const totalLeads = leads.length;
        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter(c => c.status === 'RUNNING').length;
        const emailsSent = campaigns.reduce((sum, c) => sum + (c.leadCount || 0), 0);
        
        setStats({
          totalLeads,
          totalCampaigns,
          activeCampaigns,
          emailsSent,
          whatsappSent: 0 // Placeholder for WhatsApp stats
        });

        // Prepare campaign chart data
        const campaignChartData = campaigns.map(campaign => ({
          name: campaign.name,
          leads: campaign.leadCount || 0,
          status: campaign.status
        }));

        // Prepare lead source data
        const leadSources = {};
        leads.forEach(lead => {
          const source = lead.source || 'Unknown';
          leadSources[source] = (leadSources[source] || 0) + 1;
        });

        const leadSourceData = Object.entries(leadSources).map(([source, count]) => ({
          name: source,
          value: count
        }));

        setCampaignData(campaignChartData);
        setLeadData(leadSourceData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmailChange = (e) => {
    const { name, value } = e.target;
    setTestEmail(prev => ({ ...prev, [name]: value }));
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setSendingTestEmail(true);
    try {
      const response = await fetch('http://localhost:5001/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.to,
          subject: testEmail.subject,
          body: testEmail.body
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Test email sent successfully!');
        setTestEmail({ to: '', subject: '', body: '' });
      } else {
        toast.error(data.error || 'Failed to send test email');
      }
    } catch (err) {
      toast.error('Error sending test email');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const COLORS = [colors.primary, colors.secondary, colors.success, colors.warning, colors.error, colors.info];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: colors.text 
      }}>
        <div style={{ 
          animation: 'spin 1s linear infinite',
          width: '40px',
          height: '40px',
          border: `4px solid ${colors.border}`,
          borderTop: `4px solid ${colors.primary}`,
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: colors.background,
      minHeight: '100vh',
      color: colors.text
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto' 
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: colors.primary,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            📊 Dashboard
          </h1>
          <p style={{ 
            color: colors.textSecondary,
            fontSize: '1.1rem'
          }}>
            Monitor your lead management performance
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <StatCard 
            title="Total Leads" 
            value={stats.totalLeads} 
            icon="👥" 
            color={colors.primary}
            colors={colors}
          />
          <StatCard 
            title="Total Campaigns" 
            value={stats.totalCampaigns} 
            icon="📢" 
            color={colors.secondary}
            colors={colors}
          />
          <StatCard 
            title="Active Campaigns" 
            value={stats.activeCampaigns} 
            icon="🚀" 
            color={colors.success}
            colors={colors}
          />
          <StatCard 
            title="Emails Sent" 
            value={stats.emailsSent} 
            icon="📧" 
            color={colors.info}
            colors={colors}
          />
        </div>

        {/* Charts Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Campaign Performance Chart */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              📈 Campaign Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="name" 
                  stroke={colors.textSecondary}
                  fontSize={12}
                />
                <YAxis stroke={colors.textSecondary} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
                <Bar dataKey="leads" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Sources Chart */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              🎯 Lead Sources
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill={colors.primary}
                  dataKey="value"
                >
                  {leadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Email vs WhatsApp Chart */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              📊 Communication Channels
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { name: 'Email', sent: stats.emailsSent, delivered: stats.emailsSent * 0.95 },
                { name: 'WhatsApp', sent: stats.whatsappSent, delivered: stats.whatsappSent * 0.98 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="name" 
                  stroke={colors.textSecondary}
                  fontSize={12}
                />
                <YAxis stroke={colors.textSecondary} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stackId="1" 
                  stroke={colors.primary} 
                  fill={colors.primary} 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="delivered" 
                  stackId="1" 
                  stroke={colors.success} 
                  fill={colors.success} 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ 
              color: colors.primary,
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              ⏰ Recent Activity
            </h3>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <ActivityItem 
                icon="📧" 
                title="Email Campaign Started" 
                description="Test Campaign 2" 
                time="2 hours ago"
                colors={colors}
              />
              <ActivityItem 
                icon="👥" 
                title="Leads Imported" 
                description="100 new leads added" 
                time="1 day ago"
                colors={colors}
              />
              <ActivityItem 
                icon="📢" 
                title="Campaign Completed" 
                description="Introduction Campaign" 
                time="2 days ago"
                colors={colors}
              />
              <ActivityItem 
                icon="💬" 
                title="WhatsApp Template Created" 
                description="Welcome Message" 
                time="3 days ago"
                colors={colors}
              />
            </div>
          </div>
        </div>

        {/* Manual Test Email Form - Moved to bottom */}
        <div style={{
          background: colors.surface,
          borderRadius: '16px',
          padding: '1.5rem',
          border: `1px solid ${colors.border}`,
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <h3 style={{ color: colors.info, marginBottom: '1rem' }}>✉️ Send Test Email</h3>
          <form onSubmit={handleSendTestEmail}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>To (Recipient Email):</label>
              <input
                type="email"
                name="to"
                value={testEmail.to}
                onChange={handleTestEmailChange}
                required
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}
                placeholder="recipient@example.com"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Subject:</label>
              <input
                type="text"
                name="subject"
                value={testEmail.subject}
                onChange={handleTestEmailChange}
                required
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}
                placeholder="Test Subject"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Body:</label>
              <textarea
                name="body"
                value={testEmail.body}
                onChange={handleTestEmailChange}
                required
                rows={5}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${colors.border}` }}
                placeholder="Test email body..."
              />
            </div>
            <button
              type="submit"
              disabled={sendingTestEmail}
              style={{
                background: colors.info,
                color: '#fff',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                cursor: sendingTestEmail ? 'not-allowed' : 'pointer',
                opacity: sendingTestEmail ? 0.7 : 1
              }}
            >
              {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, colors }) => (
  <div style={{
    background: colors.surface,
    borderRadius: '16px',
    padding: '1.5rem',
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-4px)';
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)';
  }}
  >
    <div style={{ 
      fontSize: '2rem',
      marginBottom: '0.5rem'
    }}>
      {icon}
    </div>
    <div style={{ 
      fontSize: '2rem',
      fontWeight: 'bold',
      color: color,
      marginBottom: '0.5rem'
    }}>
      {value.toLocaleString()}
    </div>
    <div style={{ 
      color: colors.textSecondary,
      fontSize: '0.9rem'
    }}>
      {title}
    </div>
  </div>
);

const ActivityItem = ({ icon, title, description, time, colors }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    background: colors.background
  }}>
    <div style={{ 
      fontSize: '1.5rem',
      width: '40px',
      textAlign: 'center'
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ 
        fontWeight: 'bold',
        color: colors.text,
        fontSize: '0.9rem'
      }}>
        {title}
      </div>
      <div style={{ 
        color: colors.textSecondary,
        fontSize: '0.8rem'
      }}>
        {description}
      </div>
    </div>
    <div style={{ 
      color: colors.textSecondary,
      fontSize: '0.75rem'
    }}>
      {time}
    </div>
  </div>
);

export default Dashboard; 