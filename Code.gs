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

        // Kirim PDF Invoice
        if (tgSent) {
          try {
            var buyer = data.buyer;
            var sales = data.sales;
            var handler = data.handler || '-';
            var model = String(item[1] || '');
            var spec = String(item[2] || '');
            var sn = data.sn;
            var harga = data.hargaFinal;
            var payment = data.payment;

            var pdfHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
              '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:0 auto}' +
              '.header{background:#1d1d1f;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}' +
              '.header h1{font-size:22px;margin:0}.header .sub{font-size:12px;opacity:.8;margin-top:4px}' +
              '.info{padding:12px 15px;border-bottom:1px solid #eee;font-size:13px}.info b{display:inline-block;width:110px}' +
              '.items{margin:15px 0}.item-row{display:flex;justify-content:space-between;padding:8px 15px;border-bottom:1px solid #f5f5f5;font-size:13px}' +
              '.total{background:#1d1d1f;color:#fff;padding:15px 20px;text-align:center;font-size:22px;font-weight:bold;border-radius:0 0 8px 8px}' +
              '.footer{text-align:center;margin-top:15px;font-size:11px;color:#999}</style></head><body>' +
              '<div class="header"><h1>FANBOY STORE</h1><div class="sub">Premium Used Device</div>' +
              '<div style="margin-top:8px;font-size:14px">INVOICE</div></div>' +
              '<div class="info"><b>Invoice No:</b> ' + invoiceNo + '</div>' +
              '<div class="info"><b>Tanggal:</b> ' + today + '</div>' +
              '<div class="info"><b>Buyer:</b> ' + buyer + '</div>' +
              '<div class="info"><b>Sales:</b> ' + sales + '</div>' +
              '<div class="info"><b>Handler:</b> ' + handler + '</div>' +
              '<div class="info"><b>Pembayaran:</b> ' + payment + '</div>' +
              '<div class="items"><div class="item-row"><b>Item</b><b>Harga</b></div>' +
              '<div class="item-row"><div>' + model + '<br><span style="color:#666">' + spec + '</span><br><span style="color:#999">SN: ' + sn + '</span></div>' +
              '<div style="font-weight:bold">Rp ' + Number(harga).toLocaleString('id-ID') + '</div></div></div>' +
              '<div class="total">TOTAL: Rp ' + Number(harga).toLocaleString('id-ID') + '</div>' +
              '<div class="footer">Terima kasih atas pembelian Anda<br>Fanboy Store - Premium Used Device</div>' +
              '</body></html>';

            var blob = HtmlService.createHtmlOutput(pdfHtml).getBlob();
            blob.setContentType('application/pdf');
            blob.setName('Invoice_' + invoiceNo + '.pdf');

            var sendUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
            var formData = {
              'chat_id': invoiceGroupId,
              'document': blob,
              'caption': 'Invoice ' + invoiceNo + '\nBuyer: ' + buyer + '\nTotal: Rp ' + Number(harga).toLocaleString('id-ID')
            };
            var sendOptions = {
              'method': 'post',
              'payload': formData,
              'muteHttpExceptions': true
            };
            var pdfResp = UrlFetchApp.fetch(sendUrl, sendOptions);
            var pdfResult = JSON.parse(pdfResp.getContentText());
            tgSent = pdfResult.ok === true;
          } catch(pdfErr) {
            // PDF gagal, tapi text notif sudah terkirim
          }
        }
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
    var sn = data.sn.toUpperCase();
    sheet.appendRow([
      today, data.lokasi, sn, data.model,
      data.kerusakan, data.estimasi || '-', data.nama, data.hp,
      'MASUK', '', '', 'Web'
    ]);

    // Kirim notifikasi Telegram (text dulu, baru PDF)
    var tgSent = false;
    var tgError = '';
    try {
      var props = PropertiesService.getScriptProperties();
      var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
      var staffGroupId = '-1003922936409';
      if (!botToken) {
        tgError = 'TELEGRAM_BOT_TOKEN not set';
      } else {
        // 1. Kirim text message dulu
        var msg = 'SERVIS MASUK\n\n' +
                  'Tanggal: ' + today + '\n' +
                  'Lokasi: ' + data.lokasi + '\n' +
                  'SN: ' + sn + '\n' +
                  'Model: ' + data.model + '\n' +
                  'Kerusakan: ' + data.kerusakan + '\n' +
                  'Estimasi: Rp ' + (data.estimasi || '-') + '\n' +
                  'Konsumen: ' + data.nama + '\n' +
                  'No. HP: ' + data.hp;
        var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
        var payload = {
          'chat_id': staffGroupId,
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

        // 2. Kirim PDF Servis Intake
        if (tgSent) {
          try {
            var pdfHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
              '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:0 auto}' +
              '.header{background:#E65100;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}' +
              '.header h1{font-size:22px;margin:0}.header .sub{font-size:12px;opacity:.8;margin-top:4px}' +
              '.info{padding:12px 15px;border-bottom:1px solid #eee;font-size:13px}.info b{display:inline-block;width:120px}' +
              '.status-box{background:#E65100;color:#fff;padding:12px;text-align:center;font-size:18px;font-weight:bold}' +
              '.footer{text-align:center;margin-top:15px;font-size:11px;color:#999}</style></head><body>' +
              '<div class="header"><h1>FANBOY STORE</h1><div class="sub">Premium Used Device</div>' +
              '<div style="margin-top:8px;font-size:14px">SERVIS INTAKE</div></div>' +
              '<div class="info"><b>Tanggal Masuk:</b> ' + today + '</div>' +
              '<div class="info"><b>Lokasi:</b> ' + data.lokasi + '</div>' +
              '<div class="info"><b>SN:</b> ' + sn + '</div>' +
              '<div class="info"><b>Model:</b> ' + data.model + '</div>' +
              '<div class="info"><b>Kerusakan:</b> ' + data.kerusakan + '</div>' +
              '<div class="info"><b>Estimasi:</b> Rp ' + (data.estimasi || '-') + '</div>' +
              '<div class="info"><b>Konsumen:</b> ' + data.nama + '</div>' +
              '<div class="info"><b>No. HP:</b> ' + data.hp + '</div>' +
              '<div class="status-box">STATUS: MASUK</div>' +
              '<div class="footer">Servis diterima oleh staff web<br>Fanboy Store - Premium Used Device</div></body></html>';

            var blob = HtmlService.createHtmlOutput(pdfHtml).getBlob();
            blob.setContentType('application/pdf');
            blob.setName('Servis_' + sn + '.pdf');

            var sendUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
            var formData = {
              'chat_id': staffGroupId,
              'document': blob,
              'caption': 'PDF Servis Intake - ' + sn
            };
            var sendOptions = {
              'method': 'post',
              'payload': formData,
              'muteHttpExceptions': true
            };
            var pdfResp = UrlFetchApp.fetch(sendUrl, sendOptions);
            var pdfResult = JSON.parse(pdfResp.getContentText());
            if (!pdfResult.ok) tgError = 'PDF send failed: ' + (pdfResult.description || 'unknown');
          } catch(pdfErr) {
            tgError = 'PDF error: ' + pdfErr.toString();
          }
        } else {
          tgError = 'Text send failed: ' + (result.description || JSON.stringify(result));
        }
      }
    } catch(tgErr) {
      tgError = tgErr.toString();
    }

    return {ok: true, telegramSent: tgSent, tgError: tgError};
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

    var result = {
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

    // Kirim notifikasi Telegram (text dulu, baru PDF)
    var tgSent = false;
    var tgError = '';
    try {
      var props = PropertiesService.getScriptProperties();
      var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
      var staffGroupId = '-1003922936409';
      if (!botToken) {
        tgError = 'TELEGRAM_BOT_TOKEN not set';
      } else {
        var d = result.data;
        var bayarLabel = statusBayar === 'CASH' ? 'Tunai' : (statusBayar === 'TRANSFER' ? 'Transfer' : 'Pending');
        var sisaTagihan = statusBayar === 'BELUM_LUNAS' ? cleanBiaya : '0';

        // 1. Kirim text message dulu
        var msg = 'SERVIS SELESAI\n\n' +
                  'SN: ' + d.sn + '\n' +
                  'Model: ' + d.model + '\n' +
                  'Kerusakan: ' + d.kerusakan + '\n' +
                  'Konsumen: ' + d.nama + '\n' +
                  'Biaya: Rp ' + Number(cleanBiaya).toLocaleString('id-ID') + '\n' +
                  'Bayar: ' + bayarLabel + '\n' +
                  (sisaTagihan !== '0' ? 'Sisa: Rp ' + Number(sisaTagihan).toLocaleString('id-ID') + '\n' : '') +
                  'Tgl Masuk: ' + d.tglMasuk + '\n' +
                  'Tgl Selesai: ' + d.tglSelesai;
        var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
        var payload = {
          'chat_id': staffGroupId,
          'text': msg
        };
        var options = {
          'method': 'post',
          'contentType': 'application/json',
          'payload': JSON.stringify(payload),
          'muteHttpExceptions': true
        };
        var resp = UrlFetchApp.fetch(url, options);
        var tgResult = JSON.parse(resp.getContentText());
        tgSent = tgResult.ok === true;

        // 2. Kirim PDF Servis Final Invoice
        if (tgSent) {
          try {
            var pdfHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
              '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:0 auto}' +
              '.header{background:#1a5276;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}' +
              '.header h1{font-size:22px;margin:0}.header .sub{font-size:12px;opacity:.8;margin-top:4px}' +
              '.info{padding:12px 15px;border-bottom:1px solid #eee;font-size:13px}.info b{display:inline-block;width:140px}' +
              '.total-box{background:#f8f9fa;padding:15px;font-size:15px;border-bottom:2px solid #1a5276}' +
              '.total-box .row{display:flex;justify-content:space-between;margin:4px 0}' +
              '.status-box{background:#27ae60;color:#fff;padding:12px;text-align:center;font-size:18px;font-weight:bold}' +
              '.footer{text-align:center;margin-top:15px;font-size:11px;color:#999}</style></head><body>' +
              '<div class="header"><h1>FANBOY STORE</h1><div class="sub">Premium Used Device</div>' +
              '<div style="margin-top:8px;font-size:14px">SERVIS FINAL INVOICE</div></div>' +
              '<div class="info"><b>Tanggal Masuk:</b> ' + d.tglMasuk + '</div>' +
              '<div class="info"><b>Tanggal Selesai:</b> ' + d.tglSelesai + '</div>' +
              '<div class="info"><b>SN:</b> ' + d.sn + '</div>' +
              '<div class="info"><b>Model:</b> ' + d.model + '</div>' +
              '<div class="info"><b>Kerusakan:</b> ' + d.kerusakan + '</div>' +
              '<div class="info"><b>Konsumen:</b> ' + d.nama + '</div>' +
              '<div class="info"><b>No. HP:</b> ' + d.hp + '</div>' +
              (d.catatan ? '<div class="info"><b>Catatan:</b> ' + d.catatan + '</div>' : '') +
              '<div class="total-box">' +
              '<div class="row"><span>Biaya Servis:</span><span>Rp ' + Number(cleanBiaya).toLocaleString('id-ID') + '</span></div>' +
              '<div class="row"><span>Metode Bayar:</span><span>' + bayarLabel + '</span></div>' +
              (sisaTagihan !== '0' ? '<div class="row"><span>Sisa Tagihan:</span><span>Rp ' + Number(sisaTagihan).toLocaleString('id-ID') + '</span></div>' : '') +
              '</div>' +
              '<div class="status-box">SERVIS SELESAI</div>' +
              '<div class="footer">Terima kasih atas kepercayaan Anda<br>Fanboy Store - Premium Used Device</div></body></html>';

            var blob = HtmlService.createHtmlOutput(pdfHtml).getBlob();
            blob.setContentType('application/pdf');
            blob.setName('Servis_Invoice_' + d.sn + '.pdf');

            var sendUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
            var formData = {
              'chat_id': staffGroupId,
              'document': blob,
              'caption': 'PDF Servis Invoice - ' + d.sn
            };
            var sendOptions = {
              'method': 'post',
              'payload': formData,
              'muteHttpExceptions': true
            };
            var pdfResp = UrlFetchApp.fetch(sendUrl, sendOptions);
            var pdfResult = JSON.parse(pdfResp.getContentText());
            if (!pdfResult.ok) tgError = 'PDF send failed: ' + (pdfResult.description || 'unknown');
          } catch(pdfErr) {
            tgError = 'PDF error: ' + pdfErr.toString();
          }
        } else {
          tgError = 'Text send failed: ' + (tgResult.description || JSON.stringify(tgResult));
        }
      }
    } catch(tgErr) {
      tgError = tgErr.toString();
    }

    result.telegramSent = tgSent;
    result.tgError = tgError;
    return result;
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

        // Kirim PDF Trade-In
        if (tgSent) {
          try {
            var pdfHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
              '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:0 auto}' +
              '.header{background:#C62828;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}' +
              '.header h1{font-size:22px;margin:0}.header .sub{font-size:12px;opacity:.8;margin-top:4px}' +
              '.section{margin:15px 0;font-size:13px}.section-title{font-weight:bold;font-size:14px;margin:10px 15px 5px;color:#333}' +
              '.info{padding:10px 15px;border-bottom:1px solid #eee;font-size:13px}.info b{display:inline-block;width:110px}' +
              '.items{margin:5px 15px}.item-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f5f5;font-size:13px}' +
              '.total-row{display:flex;justify-content:space-between;padding:8px 15px;font-size:13px}' +
              '.total-box{background:#1d1d1f;color:#fff;padding:15px 20px;text-align:center;border-radius:0 0 8px 8px}' +
              '.total-box .big{font-size:22px;font-weight:bold;margin-top:5px}' +
              '.footer{text-align:center;margin-top:15px;font-size:11px;color:#999}</style></head><body>' +
              '<div class="header"><h1>FANBOY STORE</h1><div class="sub">Premium Used Device</div>' +
              '<div style="margin-top:8px;font-size:14px">INVOICE TRADE-IN</div></div>' +
              '<div class="info"><b>Invoice No:</b> ' + invoiceNo + '</div>' +
              '<div class="info"><b>Tanggal:</b> ' + today + '</div>' +
              '<div class="info"><b>Buyer:</b> ' + data.buyer + '</div>' +
              '<div class="info"><b>Sales:</b> ' + data.sales + '</div>' +
              '<div class="section"><div class="section-title">BELI (Toko beli dari konsumen)</div><div class="items">';
            for (var b = 0; b < beliProcessed.length; b++) {
              var bp = beliProcessed[b];
              pdfHtml += '<div class="item-row"><div>' + bp.model + ' <span style="color:#999">SN: ' + bp.sn + '</span></div><div style="font-weight:bold">Rp ' + Number(bp.harga).toLocaleString('id-ID') + '</div></div>';
            }
            pdfHtml += '</div><div class="total-row"><b>Total Beli:</b><b>Rp ' + totalBeli.toLocaleString('id-ID') + '</b></div></div>';
            pdfHtml += '<div class="section"><div class="section-title">TUKAR (Konsumen kasih ke toko)</div><div class="items">';
            if (tukarProcessed.length > 0) {
              for (var t = 0; t < tukarProcessed.length; t++) {
                var tp = tukarProcessed[t];
                pdfHtml += '<div class="item-row"><div>' + tp.model + ' <span style="color:#999">SN: ' + tp.sn + '</span></div><div style="font-weight:bold">Rp ' + Number(tp.harga).toLocaleString('id-ID') + '</div></div>';
              }
            } else {
              pdfHtml += '<div class="item-row"><div style="color:#999">-</div><div>-</div></div>';
            }
            pdfHtml += '</div><div class="total-row"><b>Total Tukar:</b><b>Rp ' + totalTukar.toLocaleString('id-ID') + '</b></div></div>';
            pdfHtml += '<div class="total-box"><div>TOTAL DIBAYAR</div><div class="big">Rp ' + totalDibayar.toLocaleString('id-ID') + '</div></div>';
            pdfHtml += '<div class="footer">Terima kasih atas transaksi Trade-In<br>Fanboy Store - Premium Used Device</div></body></html>';

            var blob = HtmlService.createHtmlOutput(pdfHtml).getBlob();
            blob.setContentType('application/pdf');
            blob.setName('TradeIn_' + invoiceNo + '.pdf');

            var sendUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
            var formData = {
              'chat_id': invoiceGroupId,
              'document': blob,
              'caption': 'Trade-In ' + invoiceNo + '\nBuyer: ' + data.buyer + '\nDibayar: Rp ' + totalDibayar.toLocaleString('id-ID')
            };
            var sendOptions = {
              'method': 'post',
              'payload': formData,
              'muteHttpExceptions': true
            };
            var pdfResp = UrlFetchApp.fetch(sendUrl, sendOptions);
            var pdfResult = JSON.parse(pdfResp.getContentText());
            tgSent = pdfResult.ok === true;
          } catch(pdfErr) { /* PDF gagal, text notif sudah terkirim */ }
        }
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
