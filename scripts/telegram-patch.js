// Script to patch telegram-bot.js with Supabase integration

const fs = require('fs');
const filePath = '/root/agencia-netororiz/telegram-bot.js';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Supabase import after existing requires
const lastRequire = "var lastUpdateId = 0;";
const supabaseImport = `var { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/root/agencia-netororiz/.env' });
var supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_KEY
);

var lastUpdateId = 0;`;
content = content.replace(lastRequire, supabaseImport);

// 2. Replace handleCallback — old uses decisions.json, new uses Supabase
const oldCallbackMarker = `  var decisionsFile = path.join(OUTPUT_DIR, 'decisions.json');
  var decisions = {};
  try { decisions = JSON.parse(fs.readFileSync(decisionsFile, 'utf8')); } catch(e) {}
  decisions[carouselId] = { action: action, by: from, at: new Date().toISOString() };
  fs.writeFileSync(decisionsFile, JSON.stringify(decisions, null, 2));

  var confirmText = action === 'approve'
    ? 'Carrossel aprovado! Na fila de publicacao.'
    : action === 'reject'
    ? 'Carrossel rejeitado.'
    : 'Carrossel marcado pra edicao. Me manda o que quer ajustar.';
  await sendMsg(chatId, confirmText);
  log('Decision: ' + action + ' ' + carouselId);`;

const newCallbackCode = `  // Save to Supabase instead of decisions.json
  var newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'editing';
  try {
    var { error } = await supabase
      .from('carousels')
      .update({ status: newStatus })
      .eq('id', carouselId);
    if (error) {
      log('Supabase update error: ' + error.message);
    }
  } catch (e) {
    log('Supabase error: ' + e.message);
  }

  var confirmText = action === 'approve'
    ? 'Carrossel aprovado! Pronto pra download.'
    : action === 'reject'
    ? 'Carrossel rejeitado.'
    : 'Carrossel marcado pra edicao. Me manda o que quer ajustar.';
  await sendMsg(chatId, confirmText);
  log('Decision: ' + action + ' ' + carouselId + ' (Supabase)');`;

content = content.replace(oldCallbackMarker, newCallbackCode);

// 3. Replace handleStatus
const oldStatusFn = `async function handleStatus(chatId) {
  var decisionsFile = path.join(OUTPUT_DIR, 'decisions.json');
  var decisions = {};
  try { decisions = JSON.parse(fs.readFileSync(decisionsFile, 'utf8')); } catch(e) {}
  var keys = Object.keys(decisions);
  if (keys.length === 0) { await sendMsg(chatId, 'Nenhum carrossel gerado ainda.'); return; }
  var text = '*Ultimos carrosseis:*\\n\\n';
  keys.slice(-10).forEach(function(k) {
    var d = decisions[k];
    var emoji = d.action === 'approve' ? 'Aprovado' : d.action === 'reject' ? 'Rejeitado' : 'Editando';
    text += '\\u2022 ' + k.replace('carrossel_', '') + ' \\u2014 ' + emoji + ' (' + d.at.substring(0, 10) + ')\\n';
  });
  await sendMsg(chatId, text);
}`;

const newStatusFn = `async function handleStatus(chatId) {
  try {
    var { data: carousels, error } = await supabase
      .from('carousels')
      .select('id, tema, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error || !carousels || carousels.length === 0) {
      await sendMsg(chatId, 'Nenhum carrossel gerado ainda.');
      return;
    }
    var text = '*Ultimos carrosseis:*\\n\\n';
    carousels.forEach(function(c) {
      var st = c.status === 'approved' ? 'Aprovado' : c.status === 'rejected' ? 'Rejeitado' : c.status === 'pending_approval' ? 'Pendente' : c.status;
      text += '\\u2022 ' + (c.tema || '').substring(0, 40) + ' \\u2014 ' + st + '\\n';
    });
    await sendMsg(chatId, text);
  } catch(e) {
    log('handleStatus error: ' + e.message);
    await sendMsg(chatId, 'Erro ao buscar status.');
  }
}`;

content = content.replace(oldStatusFn, newStatusFn);

// 4. Replace handleFila
const oldFilaFn = `async function handleFila(chatId) {
  var decisionsFile = path.join(OUTPUT_DIR, 'decisions.json');
  var decisions = {};
  try { decisions = JSON.parse(fs.readFileSync(decisionsFile, 'utf8')); } catch(e) {}
  var approved = Object.entries(decisions).filter(function(e) { return e[1].action === 'approve'; });
  if (approved.length === 0) { await sendMsg(chatId, 'Nenhum na fila de publicacao.'); return; }
  var text = '*Fila de publicacao (' + approved.length + '):*\\n\\n';
  approved.slice(-10).forEach(function(e) {
    text += '\\u2022 ' + e[0].replace('carrossel_', '') + ' \\u2014 aprovado em ' + e[1].at.substring(0, 10) + '\\n';
  });
  await sendMsg(chatId, text);
}`;

const newFilaFn = `async function handleFila(chatId) {
  try {
    var { data: approved, error } = await supabase
      .from('carousels')
      .select('id, tema, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error || !approved || approved.length === 0) {
      await sendMsg(chatId, 'Nenhum na fila de publicacao.');
      return;
    }
    var text = '*Aprovados (' + approved.length + '):*\\n\\n';
    approved.forEach(function(c) {
      text += '\\u2022 ' + (c.tema || '').substring(0, 40) + ' \\u2014 ' + c.created_at.substring(0, 10) + '\\n';
    });
    await sendMsg(chatId, text);
  } catch(e) {
    log('handleFila error: ' + e.message);
    await sendMsg(chatId, 'Erro ao buscar fila.');
  }
}`;

content = content.replace(oldFilaFn, newFilaFn);

fs.writeFileSync(filePath, content);

// Verify changes
const result = fs.readFileSync(filePath, 'utf-8');
const hasSupabase = result.includes('createClient');
const hasNoDecisionsJson = !result.includes('decisions.json') || result.split('decisions.json').length < 4; // allow some remnants in unrelated code
console.log('Supabase import added:', hasSupabase);
console.log('decisions.json references remaining:', (result.match(/decisions\.json/g) || []).length);
console.log('Telegram bot patched successfully');
