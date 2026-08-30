var CONFIG = {
  sheetName: 'Leads',
  archivedSheetName: 'Archeived Leads',
  timeZone: 'GMT+01:00',
  statusValues: ['New', 'Confirmed', 'Rejected', 'Installed', 'Paid', 'Lost'],
  downloadUrl: 'https://play.google.com/store/apps/details?id=com.yousoft.storesoft',
  whatsappUrl: 'https://wa.me/213654338649',
  senderName: 'Store Soft',
  replyTo: 'store.soft.algeria@gmail.com'
};

var HEADERS = [
  'lead_id',
  'date',
  'time',
  'name',
  'email',
  'status',
  'phone',
  'shop_type',
  'requested_platform',
  'source',
  'medium',
  'campaign',
  'sheet_sync_status',
  'email_sent_at',
  'email_error'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Store Soft')
    .addItem('Setup / repair lead sheet', 'setupLeadSheet')
    .addItem('Sort and group leads by date', 'sortLeadSheet')
    .addItem('Import archived leads', 'importArchivedLeads')
    .addItem('Switch email control to CRM', 'enableCrmEmailControl')
    .addItem('Show webhook settings', 'showWebhookSettings')
    .addToUi();
}

/**
 * Run this once while signed in as store.soft.algeria@gmail.com.
 * It prepares the sheet and preserves the legacy email trigger until the CRM
 * sender is live. Run enableCrmEmailControl only after crm-admin-action has
 * completed a real confirmation email.
 */
function setupLeadSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var properties = PropertiesService.getScriptProperties();
  var secret = properties.getProperty('WEBHOOK_SECRET') ||
    Utilities.getUuid() + Utilities.getUuid();

  properties.setProperties({
    SPREADSHEET_ID: spreadsheet.getId(),
    WEBHOOK_SECRET: secret,
    SENDER_ACCOUNT: Session.getEffectiveUser().getEmail(),
    TIME_ZONE: CONFIG.timeZone
  });

  var sheet = spreadsheet.getSheetByName(CONFIG.sheetName) ||
    spreadsheet.insertSheet(CONFIG.sheetName);
  migrateLeadSheet_(sheet);
  formatLeadSheet_(sheet);
  sortAndGroupLeadSheet_(sheet);
  if (properties.getProperty('CRM_EMAIL_ENABLED') === 'true') {
    disableStatusEditTrigger_();
  } else {
    installStatusEditTrigger_(spreadsheet);
  }

  var result = {
    spreadsheetId: spreadsheet.getId(),
    senderAccount: Session.getEffectiveUser().getEmail(),
    webhookSecret: secret
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function doPost(event) {
  try {
    var payload = JSON.parse(event.postData.contents || '{}');
    var properties = PropertiesService.getScriptProperties();
    if (!payload.secret || payload.secret !== properties.getProperty('WEBHOOK_SECRET')) {
      return response_({ ok: false, error: 'unauthorized' });
    }

    var lead = payload.lead || {};
    var action = payload.action || 'upsert_lead';
    if (!lead.id) return response_({ ok: false, error: 'missing_lead_id' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var spreadsheet = SpreadsheetApp.openById(properties.getProperty('SPREADSHEET_ID'));
      var sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
      if (!sheet) throw new Error('Leads sheet is missing');

      if (action === 'send_confirmation') {
        return response_(sendConfirmationAction_(sheet, lead));
      }
      if (action !== 'upsert_lead') return response_({ ok: false, error: 'unsupported_action' });
      return response_(upsertLead_(sheet, lead));
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return response_({ ok: false, error: String(error && error.message || error) });
  }
}

function findLeadRow_(sheet, leadId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var match = sheet.getRange(2, column_('lead_id'), lastRow - 1, 1)
    .createTextFinder(String(leadId)).matchEntireCell(true).findNext();
  return match ? match.getRow() : null;
}

function upsertLead_(sheet, lead) {
  var existingRow = findLeadRow_(sheet, lead.id);
  var row = existingRow
    ? sheet.getRange(existingRow, 1, 1, HEADERS.length).getValues()[0]
    : emptyRow_();
  var createdAt = parseDate_(lead.created_at) || new Date();
  row[column_('lead_id') - 1] = lead.id || '';
  row[column_('date') - 1] = Utilities.formatDate(createdAt, CONFIG.timeZone, 'dd/MM/yyyy');
  row[column_('time') - 1] = Utilities.formatDate(createdAt, CONFIG.timeZone, 'HH:mm');
  row[column_('name') - 1] = lead.name || '';
  row[column_('email') - 1] = lead.email || '';
  row[column_('phone') - 1] = lead.phone || '';
  row[column_('shop_type') - 1] = lead.shop_type || '';
  row[column_('requested_platform') - 1] = lead.requested_platform || '';
  row[column_('status') - 1] = normalizeStatus_(lead.status || 'New');
  row[column_('source') - 1] = lead.source || '';
  row[column_('medium') - 1] = lead.medium || '';
  row[column_('campaign') - 1] = lead.campaign || '';
  row[column_('sheet_sync_status') - 1] = 'synced';
  if (existingRow) sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
  else {
    sheet.insertRowsBefore(2, 1);
    sheet.getRange(2, 1, 1, row.length).setValues([row]);
    applyStatusValidation_(sheet, 2);
  }
  sortAndGroupLeadSheet_(sheet);
  return { ok: true, upserted: Boolean(existingRow) };
}

function sendConfirmationAction_(sheet, lead) {
  var rowNumber = findLeadRow_(sheet, lead.id);
  if (!rowNumber) {
    upsertLead_(sheet, lead);
    rowNumber = findLeadRow_(sheet, lead.id);
  }
  var sentCell = sheet.getRange(rowNumber, columnInSheet_(sheet, 'email_sent_at'));
  var email = String(lead.email || sheet.getRange(rowNumber, columnInSheet_(sheet, 'email')).getValue() || '').trim();
  var name = String(lead.name || sheet.getRange(rowNumber, columnInSheet_(sheet, 'name')).getValue() || '').trim();
  var trackedUrl = String(lead.tracked_url || '');
  var errorCell = sheet.getRange(rowNumber, columnInSheet_(sheet, 'email_error'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid or missing email address');
  if (!/^https:\/\/yousoft\.site\/storesoft\/try\/\?t=[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(trackedUrl)) throw new Error('Invalid tracked download URL');
  try {
    sendConfirmedEmail_(email, name, trackedUrl);
    sentCell.setValue(Utilities.formatDate(new Date(), CONFIG.timeZone, 'dd/MM/yyyy HH:mm'));
    errorCell.clearContent();
    sheet.getRange(rowNumber, columnInSheet_(sheet, 'status')).setValue('Confirmed');
    return { ok: true, already_sent: false };
  } catch (error) {
    errorCell.setValue(String(error && error.message || error).slice(0, 500));
    throw error;
  }
}

/**
 * Installable edit trigger. Do not rename this function without reinstalling
 * the trigger. It deliberately ignores programmatic edits and all statuses
 * other than a manual change to Confirmed.
 */
function handleLeadStatusEdit(event) {
  if (PropertiesService.getScriptProperties().getProperty('CRM_EMAIL_ENABLED') === 'true') return;
  if (!event || !event.range || event.range.getNumRows() !== 1 ||
      event.range.getNumColumns() !== 1 || event.range.getRow() < 2) return;
  var sheet = event.range.getSheet();
  if (sheet.getName() !== CONFIG.sheetName) return;
  var statusColumn = columnInSheet_(sheet, 'status');
  if (event.range.getColumn() !== statusColumn ||
      String(event.value || '').toLowerCase() !== 'confirmed') return;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var rowNumber = event.range.getRow();
    var emailSentCell = sheet.getRange(rowNumber, columnInSheet_(sheet, 'email_sent_at'));
    if (emailSentCell.getValue()) return;
    var email = String(sheet.getRange(rowNumber, columnInSheet_(sheet, 'email')).getValue() || '').trim();
    var name = String(sheet.getRange(rowNumber, columnInSheet_(sheet, 'name')).getValue() || '').trim();
    var errorCell = sheet.getRange(rowNumber, columnInSheet_(sheet, 'email_error'));
    if (!email) {
      errorCell.setValue('No email; contact by phone or WhatsApp');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorCell.setValue('Invalid or missing email address');
      return;
    }
    try {
      // During the brief cutover window, the legacy path keeps the ordinary
      // Play link. CRM-only mail always supplies the private tracked URL.
      sendConfirmedEmail_(email, name, CONFIG.downloadUrl);
      emailSentCell.setValue(Utilities.formatDate(new Date(), CONFIG.timeZone, 'dd/MM/yyyy HH:mm'));
      errorCell.clearContent();
    } catch (error) {
      errorCell.setValue(String(error && error.message || error).slice(0, 500));
      throw error;
    }
  } finally {
    lock.releaseLock();
  }
}

function sendConfirmedEmail_(email, name, downloadUrl) {
  downloadUrl = downloadUrl || CONFIG.downloadUrl;
  var greeting = name ? 'السلام عليكم ' + escapeHtml_(name) + '،' : 'السلام عليكم،';
  var subject = 'نسخة تجريبية من تطبيق StoreSoft ✅';
  var plainBody = [
    name ? 'السلام عليكم ' + name + '،' : 'السلام عليكم،',
    '',
    'شكرًا لاهتمامك بـ Store Soft. تم تأكيد طلبك وأصبح بإمكانك تحميل التطبيق:',
    '',
    'حمّل Store Soft من Google Play:',
    downloadUrl,
    '',
    'مهم: افتح الرابط باستعمال حساب Google Play نفسه الذي أدخلته في الطلب.',
    '',
    'بعد التثبيت، ابدأ بهذه الخطوات البسيطة:',
    '1. أضف أحد منتجات محلك.',
    '2. سجّل أول عملية بيع.',
    '3. راقب تحديث المخزون والمبيعات تلقائيًا.',
    '',
    'يعمل Store Soft دون إنترنت، ويساعدك على تسيير المبيعات والمخزون وديون الزبائن والموردين بسهولة.',
    '',
    'سعر التطبيق بعد التجربة:',
    '7000 دج مرة واحدة للجهاز الأول',
    '- 3000 دج سنويًا لكل جهاز إضافي',
    '',
    'تحتاج إلى مساعدة؟ رد مباشرة على هذا البريد أو تواصل معنا عبر واتساب:',
    CONFIG.whatsappUrl,
    '',
    'فريق Store Soft'
  ].join('\n');

  var htmlBody = '<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">' +
    '<p>' + greeting + '</p>' +
    '<p>شكرًا لاهتمامك بـ Store Soft. تم تأكيد طلبك وأصبح بإمكانك تحميل التطبيق:</p>' +
    '<p><strong><a href="' + escapeHtml_(downloadUrl) + '">حمّل Store Soft من Google Play</a></strong></p>' +
    '<p><strong>مهم:</strong> افتح الرابط باستعمال حساب Google Play نفسه الذي أدخلته في الطلب.</p>' +
    '<p>بعد التثبيت، ابدأ بهذه الخطوات البسيطة:</p>' +
    '<ol><li>أضف أحد منتجات محلك.</li><li>سجّل أول عملية بيع.</li>' +
    '<li>راقب تحديث المخزون والمبيعات تلقائيًا.</li></ol>' +
    '<p>يعمل Store Soft دون إنترنت، ويساعدك على تسيير المبيعات والمخزون وديون الزبائن والموردين بسهولة.</p>' +
    '<p><strong>السعر بعد التجربة:</strong><br>7000 دج مرة واحدة للجهاز الأول</p>' +
    '<ul><li>3000 دج سنويًا لكل جهاز إضافي</li></ul>' +
    '<p>تحتاج إلى مساعدة؟ رد مباشرة على هذا البريد أو <strong><a href="' +
    escapeHtml_(CONFIG.whatsappUrl) + '">تواصل معنا عبر واتساب</a></strong>.</p>' +
    '<p>فريق Store Soft</p></div>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: CONFIG.senderName,
    replyTo: CONFIG.replyTo
  });
}

function sortLeadSheet() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) throw new Error('Leads sheet is missing');
  sortAndGroupLeadSheet_(sheet);
}

function importArchivedLeads() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = spreadsheet.getSheetByName(CONFIG.archivedSheetName);
  var destinationSheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sourceSheet) throw new Error('Archived leads sheet is missing');
  if (!destinationSheet) throw new Error('Leads sheet is missing');

  var sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow < 1) return { imported: 0, skippedDuplicates: 0, skippedBlank: 0 };

  var oldHeaders = [
    'lead_id', 'created_at', 'name', 'email', 'phone', 'shop_type',
    'status', 'source', 'medium', 'campaign', 'sheet_sync_status'
  ];
  var sourceValues = sourceSheet.getRange(1, 1, sourceLastRow, oldHeaders.length).getValues();
  var existingIds = {};
  var destinationLastRow = destinationSheet.getLastRow();
  if (destinationLastRow > 1) {
    destinationSheet.getRange(2, column_('lead_id'), destinationLastRow - 1, 1)
      .getValues()
      .forEach(function (value) {
        var id = String(value[0] || '').trim();
        if (id) existingIds[id] = true;
      });
  }

  var rowsToImport = [];
  var skippedDuplicates = 0;
  var skippedBlank = 0;
  sourceValues.forEach(function (oldRow) {
    var leadId = String(oldRow[0] || '').trim();
    if (!leadId || leadId.toLowerCase() === 'lead_id') {
      skippedBlank++;
      return;
    }
    if (existingIds[leadId]) {
      skippedDuplicates++;
      return;
    }

    var createdAt = parseDate_(oldRow[1]);
    var newRow = emptyRow_();
    newRow[column_('lead_id') - 1] = leadId;
    if (createdAt) {
      newRow[column_('date') - 1] = Utilities.formatDate(createdAt, CONFIG.timeZone, 'dd/MM/yyyy');
      newRow[column_('time') - 1] = Utilities.formatDate(createdAt, CONFIG.timeZone, 'HH:mm');
    }
    newRow[column_('name') - 1] = oldRow[2] || '';
    newRow[column_('email') - 1] = oldRow[3] || '';
    newRow[column_('status') - 1] = normalizeStatus_(oldRow[6] || 'New');
    newRow[column_('phone') - 1] = oldRow[4] || '';
    newRow[column_('shop_type') - 1] = oldRow[5] || '';
    newRow[column_('source') - 1] = oldRow[7] || '';
    newRow[column_('medium') - 1] = oldRow[8] || '';
    newRow[column_('campaign') - 1] = oldRow[9] || '';
    newRow[column_('sheet_sync_status') - 1] = oldRow[10] || 'synced';
    rowsToImport.push(newRow);
    existingIds[leadId] = true;
  });

  if (rowsToImport.length) {
    var firstImportedRow = destinationSheet.getLastRow() + 1;
    var importedRange = destinationSheet.getRange(
      firstImportedRow, 1, rowsToImport.length, HEADERS.length
    );
    importedRange.setValues(rowsToImport);
    if (firstImportedRow > 2) {
      destinationSheet.getRange(2, 1, 1, HEADERS.length).copyTo(
        importedRange, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false
      );
    }
    applyStatusValidation_(destinationSheet, destinationSheet.getLastRow());
    sortAndGroupLeadSheet_(destinationSheet);
  }

  var result = {
    imported: rowsToImport.length,
    skippedDuplicates: skippedDuplicates,
    skippedBlank: skippedBlank
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function migrateLeadSheet_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  var oldValues = sheet.getDataRange().getValues();
  var oldHeaders = oldValues[0].map(function (value) { return String(value).trim(); });
  if (oldHeaders.join('|') === HEADERS.join('|')) return;

  var oldIndex = {};
  oldHeaders.forEach(function (header, index) { oldIndex[header] = index; });
  var newValues = [HEADERS];

  oldValues.slice(1).forEach(function (oldRow) {
    if (!oldRow.some(function (value) { return value !== ''; })) return;
    var newRow = emptyRow_();
    HEADERS.forEach(function (header, index) {
      if (oldIndex[header] !== undefined) newRow[index] = oldRow[oldIndex[header]];
    });

    var createdAt = oldIndex.created_at !== undefined ? parseDate_(oldRow[oldIndex.created_at]) : null;
    if (!newRow[column_('date') - 1] && createdAt) {
      newRow[column_('date') - 1] = Utilities.formatDate(createdAt, CONFIG.timeZone, 'dd/MM/yyyy');
    }
    if (!newRow[column_('time') - 1] && createdAt) {
      newRow[column_('time') - 1] = Utilities.formatDate(createdAt, CONFIG.timeZone, 'HH:mm');
    }
    newRow[column_('status') - 1] = normalizeStatus_(newRow[column_('status') - 1] || 'New');
    newValues.push(newRow);
  });

  sheet.clearContents();
  sheet.getRange(1, 1, newValues.length, HEADERS.length).setValues(newValues);
}

function formatLeadSheet_(sheet) {
  sheet.setRightToLeft(false);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setBackground('#142653')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.autoResizeColumns(1, HEADERS.length);
  applyStatusValidation_(sheet, Math.max(sheet.getMaxRows(), 1000));
}

function sortAndGroupLeadSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var rowCount = lastRow - 1;
  var dateColumn = columnInSheet_(sheet, 'date');
  var timeColumn = columnInSheet_(sheet, 'time');
  var dataRange = sheet.getRange(2, 1, rowCount, HEADERS.length);
  var values = dataRange.getValues();
  var displayValues = dataRange.getDisplayValues();

  var records = values.map(function (row, index) {
    var dateLabel = String(displayValues[index][dateColumn - 1] || '').trim();
    var timeLabel = String(displayValues[index][timeColumn - 1] || '').trim();
    return {
      row: row,
      originalIndex: index,
      dateLabel: dateLabel,
      timestamp: leadTimestamp_(dateLabel, timeLabel)
    };
  });

  records.sort(function (a, b) {
    if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
    return a.originalIndex - b.originalIndex;
  });
  dataRange.setValues(records.map(function (record) { return record.row; }));

  dataRange.setBorder(false, null, false, null, null, false);
  var groupColors = ['#e8f0fe', '#f3f6fb'];
  var groupStart = 0;
  var groupNumber = 0;

  for (var index = 1; index <= records.length; index++) {
    var groupEnded = index === records.length ||
      records[index].dateLabel !== records[groupStart].dateLabel;
    if (!groupEnded) continue;

    var firstSheetRow = groupStart + 2;
    var groupLength = index - groupStart;
    sheet.getRange(firstSheetRow, 1, 1, HEADERS.length)
      .setBorder(true, null, null, null, null, null,
        '#6b7fa8', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.getRange(firstSheetRow, dateColumn, groupLength, 1)
      .setBackground(groupColors[groupNumber % groupColors.length])
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    groupStart = index;
    groupNumber++;
  }
}

function applyStatusValidation_(sheet, lastRow) {
  if (lastRow < 2) return;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.statusValues, true)
    .setAllowInvalid(false)
    .setHelpText('Choose a status for the Sheet copy. Email moves to CRM after the explicit cutover.')
    .build();
  sheet.getRange(2, columnInSheet_(sheet, 'status'), lastRow - 1, 1).setDataValidation(rule);
}

function installStatusEditTrigger_(spreadsheet) {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'handleLeadStatusEdit') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('handleLeadStatusEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

function enableCrmEmailControl() {
  PropertiesService.getScriptProperties().setProperty('CRM_EMAIL_ENABLED', 'true');
  disableStatusEditTrigger_();
  SpreadsheetApp.getUi().alert(
    'Store Soft CRM',
    'Sheet confirmation email is disabled. CRM now controls delivery.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function disableStatusEditTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'handleLeadStatusEdit') ScriptApp.deleteTrigger(trigger);
  });
}

function showWebhookSettings() {
  var properties = PropertiesService.getScriptProperties();
  var message = 'Spreadsheet ID: ' + (properties.getProperty('SPREADSHEET_ID') || 'not configured') +
    '\nSender account: ' + (properties.getProperty('SENDER_ACCOUNT') || 'not configured') +
    '\nWebhook secret: ' + (properties.getProperty('WEBHOOK_SECRET') || 'not configured');
  SpreadsheetApp.getUi().alert('Store Soft settings', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

function normalizeStatus_(status) {
  var value = String(status || '').trim().toLowerCase();
  var statuses = {
    'new': 'New',
    'confirmed': 'Confirmed',
    'access_added': 'Confirmed',
    'email_sent': 'Confirmed',
    'rejected': 'Rejected',
    'installed': 'Installed',
    'paid': 'Paid',
    'lost': 'Lost'
  };
  return statuses[value] || 'New';
}

function parseDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function leadTimestamp_(dateLabel, timeLabel) {
  var dateMatch = String(dateLabel || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  var timeMatch = String(timeLabel || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!dateMatch) return -Infinity;

  var hour = timeMatch ? Number(timeMatch[1]) : 0;
  var minute = timeMatch ? Number(timeMatch[2]) : 0;
  return Date.UTC(
    Number(dateMatch[3]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[1]),
    hour,
    minute
  );
}

function column_(header) {
  var index = HEADERS.indexOf(header);
  if (index === -1) throw new Error('Unknown column: ' + header);
  return index + 1;
}

function columnInSheet_(sheet, header) {
  var lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || '').trim();
  });
  var index = headers.indexOf(header);
  if (index === -1) throw new Error('Missing sheet column: ' + header);
  return index + 1;
}

function emptyRow_() {
  return HEADERS.map(function () { return ''; });
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function response_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
