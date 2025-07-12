import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'udaytomar',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lead_management',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

const cleanupDemoData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting demo data cleanup...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete all campaigns (this will cascade delete campaign_leads)
    console.log('🗑️ Deleting all campaigns...');
    const deleteCampaignsResult = await client.query('DELETE FROM campaigns');
    console.log(`✅ Deleted ${deleteCampaignsResult.rowCount} campaigns`);
    
    // Delete all leads
    console.log('🗑️ Deleting all leads...');
    const deleteLeadsResult = await client.query('DELETE FROM leads');
    console.log(`✅ Deleted ${deleteLeadsResult.rowCount} leads`);
    
    // Reset sequences
    console.log('🔄 Resetting auto-increment sequences...');
    await client.query('ALTER SEQUENCE leads_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE campaigns_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE campaign_leads_id_seq RESTART WITH 1');
    console.log('✅ Sequences reset successfully');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Demo data cleanup completed successfully!');
    console.log('📝 Database is now clean and ready for your real data.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Demo data cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run cleanup if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('⚠️  WARNING: This will delete ALL existing leads and campaigns!');
  console.log('📋 Summary of what will be deleted:');
  console.log('   - All leads in the database');
  console.log('   - All campaigns and campaign data');
  console.log('   - All campaign-lead relationships');
  console.log('');
  console.log('🔄 Starting cleanup in 3 seconds...');
  
  setTimeout(() => {
    cleanupDemoData()
      .then(() => {
        console.log('✅ Cleanup completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
      });
  }, 3000);
}

export { cleanupDemoData }; 