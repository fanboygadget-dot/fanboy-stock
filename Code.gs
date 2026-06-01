// FANBOY STOCK MANAGER - SPA Version (v2)
// Clean HTML output, no quoting issues, robust error handling

var SS_ID = '1BB9PaP_iLoM9A1uYWXAZtnDYKqgfmVNJwi4Q5XraO-0';

function doGet(e) {
  try {
    var appUrl = ScriptApp.getService().getUrl();
    return HtmlService.createHtmlOutputFromFile('Page')
      .setTitle('Fanboy Stock Manager')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch(err) {
    return HtmlService.createHtmlOutput('<h1>Error</h1><p>' + err.toString() + '</p>');
  }
}

// ============================================================
// SERVER FUNCTIONS (called via google.script.run)
// ============================================================
function getCounts() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
    var c = {JOGJA:{},SOLO:{},BALI:{}};
    var s = ['Available','Sold','problem','Returned'];
    for (var k in c) for (var j=0;j<s.length;j++) c[k][s[j]]=0;
    for (var r=1;r<data.length;r++) {
      var row=data[r]; if(!row||row.length<12) continue;
      var loc=String(row[11]||'').toUpperCase().trim();
      var st=String(row[8]||'').trim();
      if(c[loc]&&c[loc][st]!==undefined) c[loc][st]++;
    }
    return c;
  } catch(e) {
    return {JOGJA:{Available:0,Sold:0,problem:0,Returned:0},SOLO:{Available:0,Sold:0,problem:0,Returned:0},BALI:{Available:0,Sold:0,problem:0,Returned:0}};
  }
}

function getItems(loc, st) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
    var items = [];
    for (var r=1;r<data.length;r++) {
      var row=data[r]; if(!row||row.length<12) continue;
      if(String(row[11]||'').toUpperCase().trim()===loc.toUpperCase() && String(row[8]||'').trim()===st) {
        items.push({sn:String(row[0]||''),model:String(row[1]||''),spec:String(row[2]||''),kondisi:String(row[3]||''),harga:Number(row[7])||0,tgl:String(row[9]||''),supplier:String(row[10]||'')});
      }
    }
    items.sort(function(a,b){return a.model.localeCompare(b.model);});
    return items;
  } catch(e) {
    return [];
  }
}

function getItem(sn) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row || row.length < 12) continue;
      if (String(row[0] || '').toUpperCase() === sn.toUpperCase()) {
        return {
          sn: String(row[0] || ''), model: String(row[1] || ''), spec: String(row[2] || ''),
          kondisi: String(row[3] || ''), harga: Number(row[7]) || 0, modal: Number(row[6]) || 0,
          status: String(row[8] || ''), tgl: String(row[9] || ''), supplier: String(row[10] || ''),
          lokasi: String(row[11] || '')
        };
      }
    }
    return null;
  } catch(e) {
    return null;
  }
}

function searchAll(q) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
    var items = [];
    q = q.toLowerCase();
    for (var r=1;r<data.length;r++) {
      var row=data[r]; if(!row||row.length<12) continue;
      var s=String(row[0]||'').toLowerCase();
      var m=String(row[1]||'').toLowerCase();
      var sp=String(row[2]||'').toLowerCase();
      var k=String(row[3]||'').toLowerCase();
      if((s+" "+m+" "+sp+" "+k).indexOf(q)>-1) {
        items.push({sn:String(row[0]||''),model:String(row[1]||''),spec:String(row[2]||''),kondisi:String(row[3]||''),harga:Number(row[7])||0,status:String(row[8]||'').trim(),tgl:String(row[9]||''),supplier:String(row[10]||''),lokasi:String(row[11]||''),history:String(row[12]||'')});
      }
    }
    items.sort(function(a,b){return a.model.localeCompare(b.model);});
    return items;
  } catch(e) {
    return [];
  }
}

function addStock(data) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Inventaris_Laptop');
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    var totalModal = String(Number(data.hargaBeli) + Number(data.biayaServis));
    var row = [
      data.sn, data.model, data.spec, data.kondisi,
      data.hargaBeli, data.biayaServis, totalModal, data.hargaJual,
      'Available', today, data.supplier, data.lokasi, '', data.staff || ''
    ];
    sheet.appendRow(row);
    return {ok: true};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

function transferStock(data) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Inventaris_Laptop');
    var values = sheet.getDataRange().getValues();
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][0]).toUpperCase() === data.sn.toUpperCase()) {
        var oldLoc = String(values[r][11] || '');
        var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
        var history = String(values[r][12] || '');
        var newHistory = history + (history ? ' | ' : '') + today + ': ' + oldLoc + ' \u2192 ' + data.newLoc + (data.reason ? ' (' + data.reason + ')' : '');
        sheet.getRange(r + 1, 12).setValue(data.newLoc);
        sheet.getRange(r + 1, 13).setValue(newHistory);
        return {ok: true, oldLoc: oldLoc};
      }
    }
    return {ok: false, msg: 'SN tidak ditemukan'};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

function createInvoice(data) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Inventaris_Laptop');
    var values = sheet.getDataRange().getValues();
    var rowIndex = -1;
    var item = null;
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][0]).toUpperCase() === data.sn.toUpperCase() && String(values[r][8]).trim() === 'Available') {
        rowIndex = r;
        item = values[r];
        break;
      }
    }
    if (rowIndex === -1) return {ok: false, msg: 'SN tidak ditemukan atau bukan Available'};
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    var invoiceNo = 'INV-FANBOY-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + data.sn;
    sheet.getRange(rowIndex + 1, 8).setValue(data.hargaFinal);
    sheet.getRange(rowIndex + 1, 9).setValue('Sold');
    var history = String(item[12] || '');
    sheet.getRange(rowIndex + 1, 13).setValue(history + (history ? ' | ' : '') + today + ': Sold to ' + data.buyer);
    var logSheet = ss.getSheetByName('Log_Penjualan_Invoice');
    var modal = Number(item[6]) || 0;
    var margin = Number(data.hargaFinal) - modal;
    var salesFee = margin > 0 ? Math.round(margin * 0.10) : 0;
    var handlingFee = margin > 0 ? Math.round(margin * 0.05) : 0;
    logSheet.appendRow([
      invoiceNo, data.sn, data.buyer, data.hargaFinal, today,
      data.sales, data.handler || '-', data.payment + ' (Web)', margin, salesFee, handlingFee
    ]);

    // Kirim notifikasi ke Telegram Invoice Group
    var tgSent = false;
    try {
      var props = PropertiesService.getScriptProperties();
      var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
      var invoiceGroupId = '-1003978471711';
      if (botToken) {
        var model = String(item[1] || '');
        var spec = String(item[2] || '');
        var msg = 'INVOICE WEB\n\n' +
                  'No: ' + invoiceNo + '\n' +
                  'Buyer: ' + data.buyer + '\n' +
                  'SN: ' + data.sn + '\n' +
                  'Model: ' + model + '\n' +
                  'Spec: ' + spec + '\n' +
                  'Harga: Rp ' + Number(data.hargaFinal).toLocaleString('id-ID') + '\n' +
                  'Bayar: ' + data.payment + '\n' +
                  'Sales: ' + data.sales + '\n' +
                  'Tanggal: ' + today;
        var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
        var payload = {
          'chat_id': invoiceGroupId,
          'text': msg
        };
        var options = {
          'method': 'post',
          'contentType': 'application/json',
          'payload': JSON.stringify(payload),
          'muteHttpExceptions': true
        };
        var resp = UrlFetchApp.fetch(url, options);
        var result = JSON.parse(resp.getContentText());
        tgSent = result.ok === true;
      }
    } catch(tgErr) {
      // Telegram gagal, tapi invoice tetap tersimpan
      tgSent = false;
    }

    return {ok: true, invoiceNo: invoiceNo, telegramSent: tgSent};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

// ============================================================
// SERVIS FUNCTIONS
// ============================================================
function addServis(data) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Servis');
    if (!sheet) return {ok: false, msg: 'Sheet Servis tidak ditemukan'};
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
    sheet.appendRow([
      today, data.lokasi, data.sn.toUpperCase(), data.model,
      data.kerusakan, data.estimasi || '-', data.nama, data.hp,
      'MASUK', '', '', 'Web'
    ]);
    return {ok: true};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

function getServisItems() {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Servis');
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    var items = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var status = String(row[8] || '');
      if (status === 'DIAMBIL' || status === '') continue;
      items.push({
        tglMasuk: String(row[0] || ''), lokasi: String(row[1] || ''),
        sn: String(row[2] || ''), model: String(row[3] || ''),
        kerusakan: String(row[4] || ''), estimasi: String(row[5] || '-'),
        nama: String(row[6] || ''), hp: String(row[7] || ''),
        status: status, catatan: String(row[9] || ''),
        tglSelesai: String(row[10] || ''), staff: String(row[11] || '')
      });
    }
    var order = {'MASUK': 0, 'PROSES': 1, 'SELESAI': 2};
    items.sort(function(a, b) { return (order[a.status]||9) - (order[b.status]||9); });
    return items;
  } catch(e) {
    return [];
  }
}

function updateServisEntry(sn, action, value) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Servis');
    if (!sheet) return {ok: false, msg: 'Sheet Servis tidak ditemukan'};
    var values = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][2]).toUpperCase() === sn.toUpperCase()) {
        rowIndex = r;
        break;
      }
    }
    if (rowIndex === -1) return {ok: false, msg: 'SN tidak ditemukan'};
    if (action === 'STATUS') {
      sheet.getRange(rowIndex + 1, 9).setValue(value);
      if (value === 'SELESAI' || value === 'DIAMBIL') {
        var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
        sheet.getRange(rowIndex + 1, 11).setValue(today);
      }
    } else if (action === 'NOTE') {
      var existing = String(values[rowIndex][9] || '');
      var todayShort = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM');
      var newNote = existing + (existing ? '\n' : '') + '[' + todayShort + ' Web] ' + value;
      sheet.getRange(rowIndex + 1, 10).setValue(newNote);
    }
    return {ok: true};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

function completeServis(sn, biaya, statusBayar) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Servis');
    if (!sheet) return {ok: false, msg: 'Sheet Servis tidak ditemukan'};
    var values = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][2]).toUpperCase() === sn.toUpperCase()) {
        rowIndex = r;
        break;
      }
    }
    if (rowIndex === -1) return {ok: false, msg: 'SN tidak ditemukan'};
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
    var cleanBiaya = String(biaya).replace(/[.,]/g, '');
    sheet.getRange(rowIndex + 1, 9).setValue('DIAMBIL');
    sheet.getRange(rowIndex + 1, 11).setValue(today);
    sheet.getRange(rowIndex + 1, 13).setValue(cleanBiaya);
    sheet.getRange(rowIndex + 1, 14).setValue(statusBayar);
    var row = values[rowIndex];
    return {
      ok: true,
      data: {
        sn: String(row[2] || ''), model: String(row[3] || ''),
        kerusakan: String(row[4] || ''), estimasi: String(row[5] || '-'),
        nama: String(row[6] || ''), hp: String(row[7] || ''),
        catatan: String(row[9] || ''), biayaAktual: cleanBiaya,
        statusBayar: statusBayar, tglMasuk: String(row[0] || ''),
        tglSelesai: today
      }
    };
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

// ============================================================
// TRADE-IN FUNCTIONS
// ============================================================
function lookupTradeInSn(sn) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
    sn = sn.toUpperCase().trim();
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row || row.length < 12) continue;
      if (String(row[0] || '').toUpperCase().trim() === sn) {
        var status = String(row[8] || '').trim();
        return {
          found: true, sn: String(row[0] || ''), model: String(row[1] || ''),
          spec: String(row[2] || ''), harga: Number(row[7]) || 0,
          modal: Number(row[6]) || 0, status: status, lokasi: String(row[11] || '')
        };
      }
    }
    return {found: false};
  } catch(e) {
    return {found: false, error: e.toString()};
  }
}

function createTradeIn(data) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Inventaris_Laptop');
    var logSheet = ss.getSheetByName('Log_Penjualan_Invoice');
    var values = sheet.getDataRange().getValues();
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    var current_date = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMMM yyyy');
    var invoiceNo = 'TRD-FANBOY-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + data.beliItems[0].sn;

    var totalBeli = 0;
    var totalModalBeli = 0;
    var beliProcessed = [];
    var beliNotFound = [];

    // Process BELI items (cari di inventory, mark Sold)
    for (var i = 0; i < data.beliItems.length; i++) {
      var item = data.beliItems[i];
      var sn = item.sn.toUpperCase().trim();
      var found = false;
      for (var r = 1; r < values.length; r++) {
        var row = values[r];
        if (!row || row.length < 12) continue;
        if (String(row[0] || '').toUpperCase().trim() === sn) {
          var harga = item.harga || Number(row[7]) || 0;
          var modal = Number(row[6]) || 0;
          totalBeli += Number(harga);
          totalModalBeli += modal;
          beliProcessed.push({
            sn: sn, model: String(row[1] || ''), spec: String(row[2] || ''),
            harga: harga, modal: modal
          });
          // Mark as Sold
          sheet.getRange(r + 1, 9).setValue('Sold');
          // Update history
          var history = String(row[12] || '');
          sheet.getRange(r + 1, 13).setValue(history + (history ? ' | ' : '') + today + ': Trade-In to ' + data.buyer);
          found = true;
          break;
        }
      }
      if (!found) beliNotFound.push(sn);
    }

    if (beliProcessed.length === 0) return {ok: false, msg: 'SN tidak ditemukan: ' + beliNotFound.join(', ')};

    // Process TUKAR items (tambah ke inventory)
    var totalTukar = 0;
    var tukarProcessed = [];
    var tukarAdded = [];
    var existingSnSet = {};
    for (var r = 1; r < values.length; r++) {
      if (values[r] && values[r][0]) existingSnSet[String(values[r][0]).toUpperCase().trim()] = true;
    }
    var firstLoc = beliProcessed.length > 0 ? (function() {
      for (var r = 1; r < values.length; r++) {
        if (values[r] && String(values[r][0] || '').toUpperCase().trim() === beliProcessed[0].sn) return String(values[r][11] || 'JOGJA');
      }
      return 'JOGJA';
    })() : 'JOGJA';

    for (var j = 0; j < data.tukarItems.length; j++) {
      var tk = data.tukarItems[j];
      var tkSn = tk.sn.toUpperCase().trim();
      var tkHarga = Number(tk.harga) || 0;
      totalTukar += tkHarga;
      tukarProcessed.push({sn: tkSn, model: tk.model || 'TRADE-IN', spec: tk.spec || '-', harga: tk.harga});

      if (!existingSnSet[tkSn]) {
        // Tambah ke inventory
        sheet.appendRow([
          tkSn, tk.model || 'TRADE-IN', tk.spec || '-', 'C',
          String(tkHarga), '0', String(tkHarga), String(tkHarga),
          'Available', today, data.buyer, firstLoc, '', 'tradein_web'
        ]);
        existingSnSet[tkSn] = true;
        tukarAdded.push(tkSn);
      }
    }

    var margin = totalBeli - totalModalBeli;
    var salesFee = margin > 0 ? Math.round(margin * 0.10) : 0;
    var handlingFee = margin > 0 ? Math.round(margin * 0.05) : 0;
    var totalDibayar = Math.max(0, totalBeli - totalTukar);

    // Log BELI items
    for (var b = 0; b < beliProcessed.length; b++) {
      var bp = beliProcessed[b];
      logSheet.appendRow([
        invoiceNo, bp.sn, data.buyer, String(bp.harga), today,
        data.sales, data.handler || '-', 'Lunas (Trade-In)', margin, salesFee, handlingFee
      ]);
    }

    // Kirim notifikasi Telegram
    var tgSent = false;
    try {
      var props = PropertiesService.getScriptProperties();
      var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
      var invoiceGroupId = '-1003978471711';
      if (botToken) {
        var beliLines = [];
        for (var b = 0; b < beliProcessed.length; b++) {
          var bp = beliProcessed[b];
          beliLines.push('  - ' + bp.sn + ' | ' + bp.model + ' | Rp ' + Number(bp.harga).toLocaleString('id-ID'));
        }
        var tukarLines = [];
        for (var t = 0; t < tukarProcessed.length; t++) {
          var tp = tukarProcessed[t];
          tukarLines.push('  - ' + tp.sn + ' | ' + tp.model + ' | Rp ' + Number(tp.harga).toLocaleString('id-ID'));
        }
        var msg = 'TRADE-IN WEB\n\n' +
                  'No: ' + invoiceNo + '\n' +
                  'Buyer: ' + data.buyer + '\n' +
                  'Sales: ' + data.sales + '\n' +
                  'Tanggal: ' + today + '\n\n' +
                  'BELI (Toko beli):\n' + beliLines.join('\n') + '\n\n' +
                  'TUKAR (Konsumen tukar):\n' + (tukarLines.length ? tukarLines.join('\n') : '  -') + '\n\n' +
                  'Total Beli: Rp ' + totalBeli.toLocaleString('id-ID') + '\n' +
                  'Total Tukar: Rp ' + totalTukar.toLocaleString('id-ID') + '\n' +
                  'Dibayar: Rp ' + totalDibayar.toLocaleString('id-ID');
        var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
        var resp = UrlFetchApp.fetch(url, {
          'method': 'post', 'contentType': 'application/json',
          'payload': JSON.stringify({'chat_id': invoiceGroupId, 'text': msg}),
          'muteHttpExceptions': true
        });
        tgSent = JSON.parse(resp.getContentText()).ok === true;
      }
    } catch(tgErr) { tgSent = false; }

    return {
      ok: true, invoiceNo: invoiceNo, telegramSent: tgSent,
      totalBeli: totalBeli, totalTukar: totalTukar, totalDibayar: totalDibayar,
      beliNotFound: beliNotFound, tukarAdded: tukarAdded
    };
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

// ============================================================
// SETUP: Jalankan sekali untuk simpan bot token
// ============================================================
function setupTelegramToken(token) {
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_BOT_TOKEN', token);
  return 'Token tersimpan!';
}

function testTelegram() {
  var props = PropertiesService.getScriptProperties();
  var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  if (!botToken) return {ok: false, msg: 'Token belum diset. Jalankan setupTelegramToken(token) dulu.'};
  var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
  var payload = {
    'chat_id': '-1003978471711',
    'text': 'Test dari Apps Script - Invoice Web'
  };
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  var resp = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(resp.getContentText());
  return {ok: result.ok, result: result};
}
