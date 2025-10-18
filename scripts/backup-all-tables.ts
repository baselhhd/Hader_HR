/**
 * Backup all tables data from Supabase
 * Run with: npx tsx scripts/backup-all-tables.ts
 */

import { supabaseAdmin } from './_env-config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TableBackupResult {
  table: string;
  count: number;
  success: boolean;
  error?: string;
}

// قائمة جميع الجداول للنسخ الاحتياطي
const TABLES_TO_BACKUP = [
  'companies',
  'branches',
  'locations',
  'location_managers',
  'users',
  'employees',
  'shifts',
  'qr_codes',
  'color_codes',
  'numeric_codes',
  'attendance_records',
  'leave_requests',
  'custom_requests',
  'verification_codes',
  'verification_requests',
];

async function backupTable(tableName: string): Promise<TableBackupResult> {
  try {
    console.log(`📦 جاري نسخ جدول: ${tableName}...`);

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`   ❌ خطأ في ${tableName}:`, error.message);
      return {
        table: tableName,
        count: 0,
        success: false,
        error: error.message
      };
    }

    // إنشاء مجلد backup إذا لم يكن موجوداً
    const backupDir = join(process.cwd(), 'backup-data');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // حفظ البيانات في ملف JSON
    const fileName = join(backupDir, `${tableName}.json`);
    writeFileSync(fileName, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`   ✅ تم نسخ ${data?.length || 0} صف من ${tableName}`);

    return {
      table: tableName,
      count: data?.length || 0,
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ خطأ غير متوقع في ${tableName}:`, errorMessage);
    return {
      table: tableName,
      count: 0,
      success: false,
      error: errorMessage
    };
  }
}

async function backupAllTables() {
  console.log('🚀 بدء النسخ الاحتياطي لجميع الجداول...\n');
  console.log('='.repeat(80));

  const results: TableBackupResult[] = [];

  // نسخ جميع الجداول
  for (const table of TABLES_TO_BACKUP) {
    const result = await backupTable(table);
    results.push(result);
    console.log(''); // سطر فارغ
  }

  // إنشاء ملف تقرير
  const backupDir = join(process.cwd(), 'backup-data');
  const summaryFile = join(backupDir, '_backup_summary.json');

  const summary = {
    backup_date: new Date().toISOString(),
    total_tables: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    total_rows: results.reduce((sum, r) => sum + r.count, 0),
    tables: results
  };

  writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');

  // طباعة النتيجة النهائية
  console.log('='.repeat(80));
  console.log('📊 ملخص النسخ الاحتياطي:\n');
  console.log(`   إجمالي الجداول: ${summary.total_tables}`);
  console.log(`   نجحت: ${summary.successful} ✅`);
  console.log(`   فشلت: ${summary.failed} ❌`);
  console.log(`   إجمالي الصفوف: ${summary.total_rows}`);
  console.log(`\n📁 موقع الملفات: backup-data/`);
  console.log('='.repeat(80));

  // طباعة الجداول التي فشلت
  const failedTables = results.filter(r => !r.success);
  if (failedTables.length > 0) {
    console.log('\n⚠️  الجداول التي فشلت:');
    failedTables.forEach(t => {
      console.log(`   - ${t.table}: ${t.error}`);
    });
  }

  // طباعة تفاصيل كل جدول
  console.log('\n📋 تفاصيل الجداول:\n');
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`   ${icon} ${r.table.padEnd(25)} ${r.count.toString().padStart(6)} صف`);
  });

  console.log('\n✅ اكتمل النسخ الاحتياطي!');
}

// تشغيل النسخ الاحتياطي
backupAllTables().catch(console.error);
