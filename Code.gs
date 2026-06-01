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
    return {ok: true, invoiceNo: invoiceNo};
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
