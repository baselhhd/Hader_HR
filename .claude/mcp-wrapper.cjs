#!/usr/bin/env node

/**
 * MCP Wrapper Script
 * يقرأ متغيرات البيئة من .env ويمررها إلى @supabase/mcp-server-supabase
 */

const { config } = require('dotenv');
const { spawn } = require('child_process');
const path = require('path');

// تحميل متغيرات البيئة من ملف .env في جذر المشروع
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

// التحقق من وجود المتغيرات المطلوبة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.VITE_SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error('❌ Error: VITE_SUPABASE_URL not found in .env file');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY not found in .env file');
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Error: VITE_SUPABASE_ACCESS_TOKEN not found in .env file');
  process.exit(1);
}

// تشغيل MCP server مع تمرير المتغيرات
const mcpServer = spawn('npx', ['-y', '@supabase/mcp-server-supabase'], {
  env: {
    ...process.env,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ACCESS_TOKEN
  },
  stdio: ['inherit', 'inherit', 'inherit'],
  shell: true // مطلوب على Windows لتشغيل npx
});

// التعامل مع الأخطاء
mcpServer.on('error', (error) => {
  console.error('❌ Error starting MCP server:', error);
  process.exit(1);
});

// التعامل مع إنهاء البرنامج
mcpServer.on('close', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  mcpServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  mcpServer.kill('SIGTERM');
});
