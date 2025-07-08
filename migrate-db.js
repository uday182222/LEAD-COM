const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'udaytomar',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lead_management',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function migrateDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting modern schema migration (template_id only, uuid safe)...');
    await client.query('BEGIN');

    // 1. Create templates table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Ensured templates table exists');

    // 2. Ensure template_id column exists and is uuid
    const colCheck = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'template_id'
    `);
    if (colCheck.rows.length === 0) {
      await client.query(`ALTER TABLE campaigns ADD COLUMN template_id UUID`);
      console.log('✅ Added template_id column to campaigns (uuid)');
    } else {
      const type = colCheck.rows[0].data_type;
      if (type !== 'uuid') {
        await client.query(`ALTER TABLE campaigns DROP COLUMN template_id`);
        await client.query(`ALTER TABLE campaigns ADD COLUMN template_id UUID`);
        console.log('🔄 Dropped and re-added template_id column as uuid');
      } else {
        console.log('ℹ️ template_id column already exists and is uuid');
      }
    }

    // 3. Add foreign key constraint
    const fkCheck = await client.query(`
      SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'campaigns' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_template'
    `);
    if (fkCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE campaigns
        ADD CONSTRAINT fk_template
        FOREIGN KEY (template_id)
        REFERENCES templates(id)
      `);
      console.log('✅ Added foreign key constraint campaigns.template_id → templates.id');
    } else {
      console.log('ℹ️ Foreign key constraint already exists');
    }

    // 4. Clean up orphaned campaigns (template_id IS NULL)
    const orphanedCount = await client.query(`
      DELETE FROM campaigns WHERE template_id IS NULL
    `);
    console.log(`🗑️ Deleted ${orphanedCount.rowCount} orphaned campaigns (template_id IS NULL)`);

    // 5. Add check constraint for template_id not null
    const checkCheck = await client.query(`
      SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'campaigns' AND constraint_type = 'CHECK' AND constraint_name = 'check_template_id_not_null'
    `);
    if (checkCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE campaigns
        ADD CONSTRAINT check_template_id_not_null
        CHECK (template_id IS NOT NULL)
      `);
      console.log('✅ Added check constraint: template_id must not be null');
    } else {
      console.log('ℹ️ Check constraint already exists');
    }

    await client.query('COMMIT');
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateDatabase }; 