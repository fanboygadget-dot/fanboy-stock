// ============================================
// FANBOY STOCK MANAGER - Server Side
// ============================================

var SS_ID = '1BB9PaP_iLoM9A1uYWXAZtnDYKqgfmVNJwi4Q5XraO-0';

// Kolom Inventaris_Laptop:
// 0=ID_Laptop 1=Merk_Model 2=Spesifikasi 3=Kondisi 4=Harga_Beli
// 5=Biaya_Servis 6=Total_Modal 7=Harga_Jual 8=Status
// 9=Tanggal_Masuk 10=Suplier 11=Lokasi_Saat_Ini 12=history_lokasi
// 13=Staff_input 14=Staff_handle 15=Foto_Barang

// Helper: parse "Rp2,800,000" → 2800000
function parseHarga(s) {
  if (!s) return 0;
  return Number(String(s).replace(/[^0-9]/g, '')) || 0;
}

function formatRupiah(n) {
  if (!n || n === 0) return '0';
  return 'Rp' + String(n).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Read sheet data as displayed strings (no auto Date conversion)
function getRawSheetData(sheetName, range) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getDisplayValues();
  // Pad all rows to max columns (trailing empty cells are dropped by API)
  var maxCols = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].length > maxCols) maxCols = data[i].length;
  }
  for (var i = 0; i < data.length; i++) {
    while (data[i].length < maxCols) data[i].push('');
  }
  return data;
}

function parseRawDate(val) {
  if (!val) return '';
  return String(val); // already display string
}

// --- WEB APP ---
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'main';
  if (page === 'pdf') {
    var invNo = e.parameter.inv || '';
    var snParam = e.parameter.sn || '';
    var data = getInvoiceData(invNo, snParam);
    if (!data) return HtmlService.createHtmlOutput('Invoice tidak ditemukan').setTitle('Error');
    var tpl = HtmlService.createTemplateFromFile('InvoicePDF');
    tpl.data = data;
    return tpl.evaluate().setTitle('Invoice ' + invNo)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'servis_pdf') {
    var sn = e.parameter.sn || '';
    var data = getServisInvoiceData(sn);
    if (!data) return HtmlService.createHtmlOutput('Invoice servis tidak ditemukan').setTitle('Error');
    var tpl = HtmlService.createTemplateFromFile('ServisInvoicePDF');
    tpl.data = data;
    return tpl.evaluate().setTitle('Invoice Servis ' + sn)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return HtmlService.createHtmlOutputFromFile('Page')
    .setTitle('Fanboy Stock Manager')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- DASHBOARD COUNTS ---
function getCounts() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var counts = {};
  for (var i = 1; i < data.length; i++) {
    var loc = String(data[i][11] || '').toUpperCase().trim();
    var st = String(data[i][8] || '').trim();
    if (!loc || !st) continue;
    if (!counts[loc]) counts[loc] = {};
    counts[loc][st] = (counts[loc][st] || 0) + 1;
  }
  return counts;
}

// --- GET ITEMS BY LOCATION & STATUS ---
function getItems(loc, st) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var rLoc = String(data[i][11] || '').toUpperCase().trim();
    var rSt = String(data[i][8] || '').trim();
    if (rLoc === loc.toUpperCase() && rSt === st) {
      items.push({
        sn: String(data[i][0] || ''),
        model: String(data[i][1] || ''),
        spec: String(data[i][2] || ''),
        modal: parseHarga(data[i][4]),
        harga: parseHarga(data[i][7]),
        status: rSt,
        lokasi: rLoc
      });
    }
  }
  return items;
}

// --- GET SINGLE ITEM ---
function getItem(sn) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === sn.toUpperCase()) {
      return {
        sn: String(data[i][0] || ''),
        model: String(data[i][1] || ''),
        spec: String(data[i][2] || ''),
        modal: parseHarga(data[i][4]),
        harga: parseHarga(data[i][7]),
        status: String(data[i][8] || ''),
        lokasi: String(data[i][11] || '').toUpperCase().trim()
      };
    }
  }
  return null;
}

// --- SEARCH ALL ---
function searchAll(q) {
  if (!q || q.length < 2) return [];
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var results = [];
  var query = q.toUpperCase();
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var line = (row[0] + ' ' + row[1] + ' ' + row[2]).toUpperCase();
    if (line.indexOf(query) !== -1) {
      results.push({
        sn: String(row[0] || ''),
        model: String(row[1] || ''),
        spec: String(row[2] || ''),
        harga: parseHarga(row[7]),
        status: String(row[8] || ''),
        lokasi: String(row[11] || '').toUpperCase().trim()
      });
    }
  }
  return results;
}

// --- ADD STOCK ---
function addStock(d) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  // Check duplicate SN
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === d.sn.toUpperCase()) {
      return {ok: false, msg: 'SN sudah ada: ' + d.sn};
    }
  }
  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
  var hargaBeli = parseHarga(d.hargaBeli);
  var hargaJual = parseHarga(d.hargaJual);
  var staff = getCurrentStaff(d.staff);
  // Kolom: 0=ID_Laptop 1=Merk_Model 2=Spesifikasi 3=Kondisi 4=Harga_Beli
  // 5=Biaya_Servis 6=Total_Modal 7=Harga_Jual 8=Status
  // 9=Tanggal_Masuk 10=Suplier 11=Lokasi_Saat_Ini 12=history_lokasi
  // 13=Staff_input 14=Staff_handle 15=Foto_Barang
  sheet.appendRow([
    d.sn, d.model, d.spec||'', d.kondisi||'',
    formatRupiah(hargaBeli), 0, formatRupiah(hargaBeli), formatRupiah(hargaJual),
    'Available', today, d.suplier||'', d.lokasi.toUpperCase(),
    '', staff, '', ''
  ]);
  return {ok: true, msg: 'Berhasil ditambahkan: ' + d.sn + ' (' + d.model + ')'};
}

// --- BATCH ADD STOCK ---
function batchAddStock(items) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var existing = sheet.getDataRange().getValues();
  var existingSNs = {};
  for (var i = 1; i < existing.length; i++) {
    existingSNs[String(existing[i][0]).toUpperCase()] = true;
  }
  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
  var results = [];
  var okCount = 0;
  
  for (var j = 0; j < items.length; j++) {
    var d = items[j];
    var snUp = d.sn.toUpperCase();
    if (existingSNs[snUp]) {
      results.push({sn: d.sn, ok: false, msg: 'SN sudah ada'});
      continue;
    }
    var hargaBeli = parseHarga(d.hargaBeli);
    var hargaJual = parseHarga(d.hargaJual);
    var staff = d.staff || 'Web';
    sheet.appendRow([
      d.sn, d.model, d.spec||'', d.kondisi||'',
      hargaBeli, 0, hargaBeli, hargaJual,
      'Available', today, d.suplier||'', d.lokasi.toUpperCase(),
      '', staff, '', ''
    ]);
    existingSNs[snUp] = true;
    results.push({sn: d.sn, ok: true, msg: 'Berhasil'});
    okCount++;
  }
  
  return {ok: true, msg: okCount + ' dari ' + items.length + ' unit berhasil ditambahkan', results: results};
}

// --- TRANSFER STOCK ---
// --- UPDATE MODAL STOK LAPTOP ---
function updateModalStok(sn, hargaBeli, biayaServis) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === sn.toUpperCase()) {
      var hb = Number(String(hargaBeli).replace(/[^0-9]/g, '')) || 0;
      var bs = Number(String(biayaServis).replace(/[^0-9]/g, '')) || 0;
      var total = hb + bs;
      sheet.getRange(i + 1, 5).setValue(hb);   // E: Harga_Beli
      sheet.getRange(i + 1, 6).setValue(bs);   // F: Biaya_Servis
      sheet.getRange(i + 1, 7).setValue(total); // G: Total_Modal
      return {ok: true, msg: 'Modal diupdate: ' + sn + ' (Total: Rp' + formatNumber(total) + ')'};
    }
  }
  return {ok: false, msg: 'SN tidak ditemukan'};
}

// --- UPDATE MODAL SERVIS ---
function updateModalServis(sn, modalServis) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toUpperCase() === sn.toUpperCase()) {
      var modal = Number(String(modalServis).replace(/[^0-9]/g, '')) || 0;
      sheet.getRange(i + 1, 15).setValue(modal); // O: Modal Servis
      return {ok: true, msg: 'Modal servis diupdate: ' + sn + ' (Rp' + formatNumber(modal) + ')'};
    }
  }
  return {ok: false, msg: 'SN servis tidak ditemukan'};
}

function updateBiayaAktualServis(sn, biayaAktual) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toUpperCase() === sn.toUpperCase()) {
      var biaya = Number(String(biayaAktual).replace(/[^0-9]/g, '')) || 0;
      sheet.getRange(i + 1, 13).setValue(biaya); // M: Biaya Aktual
      return {ok: true, msg: 'Biaya aktual diupdate: ' + sn + ' (Rp' + formatNumber(biaya) + ')'};
    }
  }
  return {ok: false, msg: 'SN servis tidak ditemukan'};
}

// --- GET ITEM DETAIL WITH MODAL ---
function getItemDetail(sn) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === sn.toUpperCase()) {
      return {
        sn: String(rows[i][0] || ''),
        model: String(rows[i][1] || ''),
        spec: String(rows[i][2] || ''),
        hargaBeli: parseHarga(rows[i][4]),
        biayaServis: parseHarga(rows[i][5]),
        totalModal: parseHarga(rows[i][6]),
        hargaJual: parseHarga(rows[i][7]),
        status: String(rows[i][8] || ''),
        lokasi: String(rows[i][11] || '').toUpperCase().trim()
      };
    }
  }
  return null;
}

// --- BUYBACK ---
function getItemForBuyback(sn) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === sn.toUpperCase()) {
      return {
        sn: String(rows[i][0]||''),
        model: String(rows[i][1]||''),
        spec: String(rows[i][2]||''),
        kondisi: String(rows[i][3]||''),
        hargaBeli: parseHarga(rows[i][4]),
        hargaJual: parseHarga(rows[i][7]),
        status: String(rows[i][8]||''),
        lokasi: String(rows[i][11]||'').toUpperCase().trim()
      };
    }
  }
  return null;
}

function processBuyback(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  var sn = data.sn.toUpperCase();
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === sn) {
      var currentStatus = String(rows[i][8]||'');
      if (currentStatus === 'Available') return {ok:false, msg:'SN masih Available, tidak perlu buyback'};
      
      var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
      var hargaBeli = Number(String(data.hargaBeli).replace(/[^0-9]/g,'')) || 0;
      var hargaJual = data.hargaJual ? Number(String(data.hargaJual).replace(/[^0-9]/g,'')) : parseHarga(rows[i][7]);
      var lokasi = data.lokasi || String(rows[i][11]||'');
      var kondisi = data.kondisi || String(rows[i][3]||'');
      var row = i + 1;
      
      // Update: status=Available, hargaBeli=deal buyback, hargaJual, lokasi, kondisi, tanggalMasuk, history
      sheet.getRange(row, 5).setValue(hargaBeli);  // E: Harga Beli
      sheet.getRange(row, 6).setValue(0);           // F: Biaya Servis
      sheet.getRange(row, 7).setValue(hargaBeli);   // G: Total Modal
      sheet.getRange(row, 8).setValue(hargaJual);   // H: Harga Jual
      sheet.getRange(row, 9).setValue('Available');  // I: Status
      sheet.getRange(row, 10).setValue(today);       // J: Tanggal Masuk
      sheet.getRange(row, 12).setValue(lokasi);      // L: Lokasi
      sheet.getRange(row, 13).setValue(today + ' | Buyback dari customer (Rp' + formatNumber(hargaBeli) + ')'); // M: History
      
      return {ok:true, msg:'Buyback berhasil: ' + sn + ' (Rp' + formatNumber(hargaBeli) + ')'};
    }
  }
  return {ok:false, msg:'SN tidak ditemukan'};
}

// --- UPDATE HARGA JUAL ---
function updateHargaJual(sn, hargaJual) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === sn.toUpperCase()) {
      var hj = Number(String(hargaJual).replace(/[^0-9]/g, '')) || 0;
      sheet.getRange(i + 1, 8).setValue(hj); // H: Harga_Jual
      return {ok: true, msg: 'Harga jual diupdate: ' + sn + ' (Rp' + formatNumber(hj) + ')'};
    }
  }
  return {ok: false, msg: 'SN tidak ditemukan'};
}

// --- UPDATE STOCK FIELD (GENERIC) ---
// data: {sn, field, value}
// field: 'hargaBeli', 'hargaJual', 'spec', 'lokasi', 'suplier', 'kondisi'
function updateStockField(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  var fieldMap = {
    'model': 1, 'spec': 2, 'kondisi': 3, 'hargaBeli': 4, 'hargaJual': 5,
    'suplier': 6, 'lokasi': 7, 'status': 8
  };
  // Correct column mapping based on actual sheet:
  // A=SN(0), B=Model(1), C=Spec(2), D=Kondisi(3), E=Harga_Beli(4), F=Harga_Jual(5), G=Suplier(6), H=Lokasi(7)
  fieldMap = {
    'hargaBeli': 4, 'hargaJual': 5, 'spec': 2, 'lokasi': 7, 'suplier': 6, 'kondisi': 3
  };
  var col = fieldMap[data.field];
  if (col === undefined) return {ok: false, msg: 'Field tidak valid: ' + data.field};
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toUpperCase() === data.sn.toUpperCase()) {
      var val = data.value;
      if (data.field === 'hargaBeli' || data.field === 'hargaJual') {
        val = formatRupiah(parseHarga(val));
      }
      sheet.getRange(i + 1, col + 1).setValue(val);
      return {ok: true, msg: data.field + ' diupdate untuk ' + data.sn};
    }
  }
  return {ok: false, msg: 'SN tidak ditemukan: ' + data.sn};
}

// --- GET STOCK COUNTS PER LOCATION ---
function getStockCountsByLocation() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var counts = {};
  for (var i = 1; i < data.length; i++) {
    var loc = String(data[i][11] || '').toUpperCase().trim();
    var st = String(data[i][8] || '').trim();
    if (!loc || !st) continue;
    if (!counts[loc]) counts[loc] = {total:0, Available:0, Sold:0, Servis:0, Reserved:0};
    counts[loc].total++;
    counts[loc][st] = (counts[loc][st] || 0) + 1;
  }
  return counts;
}

// --- CREATE INVOICE ---
function createInvoice(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var invData = invSheet.getDataRange().getValues();
  // Find max invoice number to prevent reuse
  var maxNum = 0;
  for (var i = 1; i < invData.length; i++) {
    var inv = String(invData[i][0] || '');
    var match = inv.match(/INV-(\d+)/);
    if (match) {
      var n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  var nextNo = 'INV-' + String(maxNum + 1).padStart(4, '0');
  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  var staff = getCurrentStaff(data.staff);
  // Auto-fill sales/handler dari user login jika kosong
  if (!data.sales) data.sales = staff;
  if (!data.handler) data.handler = staff;

  var stSheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = stSheet.getDataRange().getValues();
  
  // Support both single-item (legacy) and multi-item
  var items = data.items || [{sn: data.sn, harga: Number(data.hargaFinal)||0}];
  var resultItems = [];
  var invItems = []; // for telegram
  
  for (var j = 0; j < items.length; j++) {
    var sn = items[j].sn;
    var harga = Number(items[j].harga) || 0;
    var item = null;
    var rowIndex = -1;
    
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toUpperCase() === sn.toUpperCase()) {
        item = {
          sn: String(rows[i][0]||''), model: String(rows[i][1]||''), spec: String(rows[i][2]||''),
          modal: parseHarga(rows[i][4]), harga: parseHarga(rows[i][7]),
          status: String(rows[i][8]||''), lokasi: String(rows[i][11]||'').toUpperCase().trim()
        };
        rowIndex = i;
        break;
      }
    }
    
    if (!item) { resultItems.push({sn:sn, ok:false, msg:'SN tidak ditemukan'}); continue; }
    if (item.status !== 'Available') { resultItems.push({sn:sn, ok:false, msg:'Status: '+item.status}); continue; }
    
    // Check for duplicate SN in invoice log
    var snUpper = sn.toUpperCase().trim();
    for (var d = 1; d < invData.length; d++) {
      if (String(invData[d][1] || '').toUpperCase().trim() === snUpper) {
        resultItems.push({sn:sn, ok:false, msg:'SN sudah ada di invoice: ' + String(invData[d][0] || '')}); 
        sn = null; break;
      }
    }
    if (!sn) continue;
    
    if (!harga) harga = item.harga;
    
    // Save invoice row: [invNo, SN, buyer, modal, harga, tanggal, sales, handler, status, margin, sales_fee, handling_fee, dp, sisa, catatan]
    var dpAmount = Number(data.dpAmount) || 0;
    var sisaBayar = Math.max(0, harga - dpAmount);
    var catatan = data.catatan || '';
    var buyerHP = data.buyer||'';
    if (data.hp) buyerHP += ' / ' + data.hp;
    invSheet.appendRow([nextNo, sn, buyerHP, '', harga, today, data.sales||'', data.handler||'', dpAmount > 0 ? 'DP' : 'Lunas', '', '', '', dpAmount, sisaBayar, catatan]);
    // VLOOKUP modal dari Inventaris_Laptop kolom E (Harga_Beli) berdasarkan SN
    var newRow = invSheet.getLastRow();
    invSheet.getRange(newRow, 4).setFormula('=IFERROR(VLOOKUP(B'+newRow+',Inventaris_Laptop!A:E,5,FALSE),0)');
    
    // Update status to Sold
    stSheet.getRange(rowIndex + 1, 9).setValue('Sold');
    
    resultItems.push({sn:sn, model:item.model, spec:item.spec, harga:harga, ok:true, msg:'Berhasil'});
    invItems.push({sn:sn, model:item.model, spec:item.spec, lokasi:item.lokasi, harga:harga});
  }
  
  // Handle Trade-In
  if (data.tradeIn) {
    var ti = data.tradeIn;
    var tiInvNo = 'TRD-' + String(invData.length + 1).padStart(4, '0');
    
    // Add trade-in device to inventory
    var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    stSheet.appendRow([
      ti.sn, ti.model, ti.spec || '', ti.kondisi || 'Baik',
      ti.hargaBeli, 0, ti.hargaBeli, 0, 'Available',
      now, 'Trade-In', data.tradeIn.location || 'TOKO FANBOY',
      now + ' | Trade-In dari ' + (data.buyer||'Customer'),
      '', (data.handler||'Staff')
    ]);
    
    // Log trade-in in invoice sheet
    invSheet.appendRow([tiInvNo, ti.sn, data.buyer||'', '', 0, today, data.sales||'', data.handler||'', 'Lunas (Trade-In)', '', '', '', 0, 0, '']);
    // VLOOKUP modal dari Inventaris_Laptop kolom E berdasarkan SN
    var tiRow = invSheet.getLastRow();
    invSheet.getRange(tiRow, 4).setFormula('=IFERROR(VLOOKUP(B'+tiRow+',Inventaris_Laptop!A:E,5,FALSE),0)');
    
    invItems.push({sn:ti.sn, model:ti.model, harga:-ti.hargaBeli}); // negative for telegram display
  }
  
  if (!resultItems.length || !resultItems.some(function(r){return r.ok;})) {
    return {ok:false, msg:'Semua item gagal', items:resultItems};
  }
  
  var tgResult = sendTelegramInvoice(nextNo, invItems, data.buyer||'', data);
  sendClosingReport(nextNo, invItems, data);
  return {ok:true, invoiceNo:nextNo, items:resultItems, tradeIn:data.tradeIn||null, telegramSent:tgResult};
}

// --- TELEGRAM HELPER ---
function sendTelegramInvoice(invNo, invItems, buyer, data) {
  try {
    var props = PropertiesService.getScriptProperties();
    var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
    var groupId = '-1002729631656';
    if (!botToken) return false;
    var totalHarga = 0;
    var itemLines = '';
    for (var i = 0; i < invItems.length; i++) {
      totalHarga += Number(invItems[i].harga) || 0;
      itemLines += (i+1) + '. ' + invItems[i].model + ' (SN: ' + invItems[i].sn + ') — Rp ' + formatNumber(invItems[i].harga) + '\n';
    }
    var dpAmt = Number(data.dpAmount) || 0;
    var sisaAmt = Math.max(0, totalHarga - dpAmt);
    var msg = 'INVOICE BARU\n\nNo: ' + invNo + '\nTanggal: ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm') + '\n\n' + itemLines + '\nTotal: Rp ' + formatNumber(totalHarga);
    if (dpAmt > 0) {
      msg += '\nDP: Rp ' + formatNumber(dpAmt) + '\nSisa Bayar: Rp ' + formatNumber(sisaAmt);
    }
    msg += '\nBuyer: ' + buyer + '\nPembayaran: ' + (data.payment || 'CASH') + '\nSales: ' + (data.sales || '-') + '\nHandler: ' + (data.handler || '-');
    if (data.catatan) msg += '\nCatatan: ' + data.catatan;
    var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    var resp = UrlFetchApp.fetch(url, {method:'post', contentType:'application/json', payload:JSON.stringify({chat_id:groupId, text:msg}), muteHttpExceptions:true});
    return JSON.parse(resp.getContentText()).ok === true;
  } catch(e) { return false; }
}

// --- LAPOR CLOSING ---
function sendClosingReport(invNo, invItems, data) {
  try {
    var props = PropertiesService.getScriptProperties();
    var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
    var groupId = '-1002729631656';
    if (!botToken) return false;
    
    for (var i = 0; i < invItems.length; i++) {
      var item = invItems[i];
      var unit = item.model + (item.spec ? ' | ' + item.spec : '');
      var buyerInfo = (data.buyer || '-') + (data.hp ? ' / ' + data.hp : '');
      var msg = '📢 LAPOR CLOSING\n\n' +
        'LOKASI : ' + (item.lokasi || '-') + '\n' +
        'SN : ' + item.sn + '\n' +
        'UNIT : ' + unit + '\n' +
        'HARGA : Rp ' + formatNumber(item.harga) + '\n' +
        'SALES : ' + (data.sales || '-') + '\n' +
        'HANDLE : ' + (data.handler || '-') + '\n' +
        'PEMBAYARAN : ' + (data.payment || 'CASH') + '\n' +
        'BUYER : ' + buyerInfo;
      
      var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
      UrlFetchApp.fetch(url, {method:'post', contentType:'application/json', payload:JSON.stringify({chat_id:groupId, text:msg}), muteHttpExceptions:true});
    }
    return true;
  } catch(e) { return false; }
}

function formatNumber(n) {
  return String(n).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function fmtDate(d) {
  if (!d) return '';
  if (typeof d === 'string') return d; // sudah string
  // Date object dari Sheets → format singkat
  return Utilities.formatDate(d, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
}

// --- GET SALES HISTORY ---
function getSalesHistory() {
  var data = getRawSheetData('Log_Penjualan_Invoice');
  
  // Build SN→Model lookup from inventory
  var invData = getRawSheetData('Inventaris_Laptop');
  var snModel = {};
  for (var j = 1; j < invData.length; j++) {
    var sn = String(invData[j][0] || '').toUpperCase().trim();
    if (sn) snModel[sn] = String(invData[j][1] || '');
  }
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue;
    var sn = String(r[1] || '').toUpperCase().trim();
    var tanggal = parseRawDate(r[5]);
    result.push({
      tanggal: String(tanggal || ''),
      invNo: String(r[0] || ''),
      model: snModel[sn] || '-',
      buyer: String(r[2] || ''),
      modal: parseHarga(r[3]),
      harga: parseHarga(r[4]),
      sales: String(r[6] || ''),
      handler: String(r[7] || ''),
      sn: String(r[1] || ''),  // hidden, for download
      status: String(r[8] || ''),
      dpAmount: parseHarga(r[12] || '0'),
      sisaBayar: parseHarga(r[13] || '0'),
      catatan: String(r[14] || ''),
      rowIndex: i + 1
    });
  }
  return result.reverse(); // newest first
}

// --- SALES REPORT CSV ---
function generateSalesReportCSV() {
  var data = getRawSheetData('Log_Penjualan_Invoice');
  
  // Build SN→Lokasi from inventory
  var invData = getRawSheetData('Inventaris_Laptop');
  var snLokasi = {};
  for (var j = 1; j < invData.length; j++) {
    var sn = String(invData[j][0] || '').toUpperCase().trim();
    if (sn) snLokasi[sn] = String(invData[j][11] || '').toUpperCase().trim();
  }
  
  // Current month range
  var now = new Date();
  var bulan = now.getMonth();
  var tahun = now.getFullYear();
  var currentMonth = now.getMonth(); // 0-indexed
  var currentYear = now.getFullYear();
  var labelBulan = Utilities.formatDate(now, 'Asia/Jakarta', 'MMMM yyyy');
  
  var tokoStats = {};   // lokasi → {count, total}
  var salesStats = {};  // sales → {count, total, items:[{model}]}
  
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue;
    
    // Parse date - all strings now
    var tanggalRaw = String(r[5] || '');
    var isCurrentMonth = false;
    // Try dd/MM/yyyy format
    var parts = tanggalRaw.split(' ')[0].split('/');
    if (parts.length === 3) {
      var month = parseInt(parts[1], 10) - 1;
      var year = parseInt(parts[2], 10);
      isCurrentMonth = (month === currentMonth && year === currentYear);
    }
    // Try yyyy-MM-dd format
    if (!isCurrentMonth && tanggalRaw.indexOf('-') > 0) {
      var dashParts = tanggalRaw.split(' ')[0].split('-');
      if (dashParts.length === 3) {
        var month2 = parseInt(dashParts[1], 10) - 1;
        var year2 = parseInt(dashParts[0], 10);
        isCurrentMonth = (month2 === currentMonth && year2 === currentYear);
      }
    }
    // Try dd MMMM yyyy format
    if (!isCurrentMonth && tanggalRaw.indexOf(' ') > 0) {
      var months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      var sp = tanggalRaw.split(' ');
      if (sp.length >= 3) {
        var mi = months.indexOf(sp[1].toLowerCase());
        if (mi >= 0) {
          isCurrentMonth = (mi === currentMonth && parseInt(sp[2],10) === currentYear);
        }
      }
    }
    if (!isCurrentMonth) continue;
    
    var sn = String(r[1] || '').toUpperCase().trim();
    var lokasi = snLokasi[sn] || '-';
    var harga = parseHarga(r[4]);
    var sales = String(r[6] || '-');
    
    if (!tokoStats[lokasi]) tokoStats[lokasi] = {count:0, total:0};
    tokoStats[lokasi].count++;
    tokoStats[lokasi].total += harga;
    
    if (!salesStats[sales]) salesStats[sales] = {count:0, total:0};
    salesStats[sales].count++;
    salesStats[sales].total += harga;
  }
  
  // Build CSV
  var csv = '';
  csv += 'LAPORAN PENJUALAN ' + labelBulan.toUpperCase() + '\n';
  csv += 'Fanboy Store\n\n';
  
  // Per Toko
  csv += 'OMSET PER TOKO\n';
  csv += 'Lokasi,Unit Terjual,Omset\n';
  var tokoOrder = ['SOLO','JOGJA','BALI'];
  tokoOrder.forEach(function(loc) {
    var s = tokoStats[loc] || {count:0, total:0};
    csv += loc + ',' + s.count + ',' + s.total + '\n';
  });
  Object.keys(tokoStats).sort().forEach(function(loc) {
    if (tokoOrder.indexOf(loc) >= 0 || loc === '-') return;
    csv += loc + ',' + tokoStats[loc].count + ',' + tokoStats[loc].total + '\n';
  });
  var totalCount = 0, totalOmset = 0;
  Object.values(tokoStats).forEach(function(s){ totalCount += s.count; totalOmset += s.total; });
  csv += 'TOTAL,' + totalCount + ',' + totalOmset + '\n\n';
  
  // Per Sales (ranking)
  csv += 'RANKING SALES\n';
  csv += 'Rank,Sales,Unit Terjual,Omset\n';
  var sorted = Object.keys(salesStats).sort(function(a,b){ return salesStats[b].total - salesStats[a].total; });
  sorted.forEach(function(s, idx) {
    csv += (idx+1) + ',"' + s + '",' + salesStats[s].count + ',' + salesStats[s].total + '\n';
  });
  
  return csv;
}

// --- UPDATE INVOICE PRICE ---
function updateInvoicePrice(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var rows = invSheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.invNo && String(rows[i][1]).toUpperCase() === data.sn.toUpperCase()) {
      invSheet.getRange(i + 1, 5).setValue(Number(data.newHarga));
      return {ok: true, msg: 'Harga diupdate'};
    }
  }
  return {ok: false, msg: 'Invoice tidak ditemukan'};
}

// --- UPDATE INVOICE DATE (ADMIN) ---
function updateInvoiceDate(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var rows = invSheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.invNo && String(rows[i][1]).toUpperCase() === data.sn.toUpperCase()) {
      invSheet.getRange(i + 1, 6).setValue(data.newDate);
      return {ok: true, msg: 'Tanggal diupdate'};
    }
  }
  return {ok: false, msg: 'Invoice tidak ditemukan'};
}

// --- UPDATE TRADE-IN PRICE (ADMIN) ---
function updateTradeInPrice(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var rows = invSheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    var invNo = String(rows[i][0] || '');
    var sn = String(rows[i][1] || '').toUpperCase();
    if (invNo === data.invNo && sn === data.sn.toUpperCase()) {
      invSheet.getRange(i + 1, 5).setValue(Number(data.newHarga));
      return {ok: true, msg: 'Harga Trade-In diupdate'};
    }
  }
  var tiSheet = ss.getSheetByName('Trade_In');
  if (tiSheet) {
    var tiRows = tiSheet.getDataRange().getValues();
    for (var j = 1; j < tiRows.length; j++) {
      if (String(tiRows[j][0]) === data.invNo) {
        tiSheet.getRange(j + 1, 5).setValue(Number(data.newHarga));
        return {ok: true, msg: 'Harga Trade-In diupdate'};
      }
    }
  }
  return {ok: false, msg: 'Trade-In tidak ditemukan'};
}

// --- UPDATE FULL INVOICE (ADMIN) ---
// data: {invNo, sn, field, value}
// field: 'buyer', 'sales', 'handler', 'harga', 'tanggal', 'catatan', 'dp', 'sisa'
function updateInvoiceField(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var rows = invSheet.getDataRange().getValues();
  var fieldMap = {
    'buyer': 2, 'modal': 3, 'harga': 4, 'tanggal': 5, 'sales': 6, 'handler': 7,
    'status': 8, 'catatan': 14, 'dp': 12, 'sisa': 13
  };
  var col = fieldMap[data.field];
  if (col === undefined) return {ok: false, msg: 'Field tidak valid: ' + data.field};
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.invNo && String(rows[i][1]).toUpperCase() === data.sn.toUpperCase()) {
      var val = data.value;
      if (data.field === 'harga' || data.field === 'dp' || data.field === 'sisa') {
        val = parseHarga(val);
        invSheet.getRange(i + 1, col + 1).setValue(val);
      } else {
        invSheet.getRange(i + 1, col + 1).setValue(String(val));
      }
      return {ok: true, msg: data.field + ' diupdate'};
    }
  }
  return {ok: false, msg: 'Invoice tidak ditemukan'};
}

// --- UPDATE TRADE-IN (FULL EDIT) ---
function updateTradeInField(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var rows = invSheet.getDataRange().getValues();
  var fieldMap = {
    'buyer': 2, 'modal': 3, 'harga': 4, 'tanggal': 5, 'sales': 6, 'handler': 7,
    'status': 8, 'catatan': 14, 'dp': 12, 'sisa': 13
  };
  var col = fieldMap[data.field];
  if (col === undefined) return {ok: false, msg: 'Field tidak valid'};
  
  for (var i = 1; i < rows.length; i++) {
    var invNo = String(rows[i][0] || '');
    var sn = String(rows[i][1] || '').toUpperCase();
    if (invNo === data.invNo && sn === data.sn.toUpperCase()) {
      var val = data.value;
      if (data.field === 'harga' || data.field === 'dp' || data.field === 'sisa') {
        val = parseHarga(val);
      }
      invSheet.getRange(i + 1, col + 1).setValue(val);
      return {ok: true, msg: data.field + ' Trade-In diupdate'};
    }
  }
  return {ok: false, msg: 'Trade-In tidak ditemukan'};
}

// --- MARK INVOICE AS LUNAS (DP -> LUNAS) ---
function markInvoiceLunas(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');
  var rows = invSheet.getDataRange().getValues();
  // Layout: [invNo(0), SN(1), buyer(2), modal(3), harga(4), tanggal(5), sales(6), handler(7), status(8), margin(9), sales_fee(10), handling_fee(11), dp(12), sisa(13), catatan(14)]
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.invNo && String(rows[i][1]).toUpperCase() === data.sn.toUpperCase()) {
      var status = String(rows[i][8] || '').toUpperCase();
      if (status !== 'DP') return {ok: false, msg: 'Invoice ini bukan status DP'};
      var harga = Number(rows[i][4]) || 0;
      // Update: status=Lunas, dp=harga(full), sisa=0
      invSheet.getRange(i + 1, 9).setValue('Lunas');   // col 9 = Status_Pembayaran (I)
      invSheet.getRange(i + 1, 12).setValue(harga);     // col 12 = dp (full amount now paid)
      invSheet.getRange(i + 1, 13).setValue(0);          // col 13 = sisa
      return {ok: true, msg: 'Invoice ditandai LUNAS'};
    }
  }
  return {ok: false, msg: 'Invoice tidak ditemukan'};
}

// --- GET INVOICE DATA FOR PDF ---
function getInvoiceData(invoiceNo, snParam) {
  var invData = getRawSheetData('Log_Penjualan_Invoice');
  for (var i = 1; i < invData.length; i++) {
    var matchInv = String(invData[i][0]).toUpperCase() === invoiceNo.toUpperCase();
    var matchSn = !snParam || String(invData[i][1]).toUpperCase() === snParam.toUpperCase();
    if (matchInv && matchSn) {
      var sn = String(invData[i][1] || '');
      var status = String(invData[i][8] || '').toUpperCase();
      var isTradeIn = status.indexOf('TRADE-IN') >= 0;
      var model = '', spec = '', loc = '';
      if (sn) {
        var stData = getRawSheetData('Inventaris_Laptop');
        // For trade-in, find the Sold entry (original); for regular, find first match
        var bestIdx = -1;
        for (var j = 1; j < stData.length; j++) {
          if (String(stData[j][0]).toUpperCase() === sn.toUpperCase()) {
            if (isTradeIn) {
              // Prefer Sold status for trade-in (original entry)
              var st = String(stData[j][8] || '').toUpperCase();
              if (st === 'SOLD') { bestIdx = j; break; }
            }
            if (bestIdx < 0) bestIdx = j;
          }
        }
        if (bestIdx > 0) {
          model = String(stData[bestIdx][1] || '');
          spec = String(stData[bestIdx][2] || '');
          loc = String(stData[bestIdx][11] || '').toUpperCase().trim();
        }
      }
      // Parse TUKAR items from catatan for trade-in
      var tukarItems = [];
      var totalTukar = 0;
      var totalBayar = 0;
      var catatanRaw = String(invData[i][14] || '');
      if (isTradeIn && catatanRaw.indexOf('TUKAR:') === 0) {
        var tukarStr = catatanRaw.substring(6); // Remove 'TUKAR:'
        var parts = tukarStr.split('|');
        var itemsStr = parts[0] || '';
        var items = itemsStr.split(';');
        for (var k = 0; k < items.length; k++) {
          var itemParts = items[k].split('|');
          if (itemParts.length >= 4) {
            tukarItems.push({
              sn: itemParts[0],
              model: itemParts[1],
              spec: itemParts[2],
              price: parseHarga(itemParts[3])
            });
          }
        }
        // Parse total and bayar
        for (var k = 1; k < parts.length; k++) {
          if (parts[k].indexOf('total=') === 0) totalTukar = parseHarga(parts[k].substring(6));
          if (parts[k].indexOf('bayar=') === 0) totalBayar = parseHarga(parts[k].substring(6));
        }
      }
      
      // If no TUKAR data in catatan, try to find from inventory (trade-in items with Suplier=Trade-In)
      if (isTradeIn && tukarItems.length === 0) {
        var invDataAll = getRawSheetData('Inventaris_Laptop');
        var hargaBeli = parseHarga(invData[i][4]);
        for (var j = 1; j < invDataAll.length; j++) {
          var suplier = String(invDataAll[j][10] || '').toUpperCase().trim();
          var status = String(invDataAll[j][8] || '').toUpperCase().trim();
          if (suplier === 'TRADE-IN' && status === 'AVAILABLE') {
            var modal = parseHarga(invDataAll[j][6] || invDataAll[j][4]);
            if (modal === hargaBeli || hargaBeli === 0) {
              tukarItems.push({
                sn: String(invDataAll[j][0] || ''),
                model: String(invDataAll[j][1] || ''),
                spec: String(invDataAll[j][2] || ''),
                price: modal
              });
              totalTukar = modal;
              totalBayar = hargaBeli - modal;
              break;
            }
          }
        }
      }
      
      return {
        invoiceNo: String(invData[i][0] || ''),
        date: parseRawDate(invData[i][5]),
        sn: sn,
        model: model,
        spec: spec,
        buyer: String(invData[i][2] || ''),
        modal: parseHarga(invData[i][3]),
        harga: parseHarga(invData[i][4]),
        payment: String(invData[i][8] || 'CASH'),
        sales: String(invData[i][6] || ''),
        handler: String(invData[i][7] || ''),
        location: loc,
        dpAmount: parseHarga(invData[i][12] || '0'),
        sisaBayar: parseHarga(invData[i][13] || '0'),
        catatan: catatanRaw,
        isTradeIn: isTradeIn,
        tukarItems: tukarItems,
        totalTukar: totalTukar,
        totalBayar: totalBayar
      };
    }
  }
  return null;
}

// --- OPEN INVOICE PDF PAGE ---
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

function openInvoicePDF(invoiceNo) {
  var data = getInvoiceData(invoiceNo);
  if (!data) return {ok: false, msg: 'Invoice tidak ditemukan'};
  var tpl = HtmlService.createTemplateFromFile('InvoicePDF');
  tpl.data = data;
  var html = tpl.evaluate().setTitle('Invoice ' + invoiceNo).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Invoice ' + invoiceNo);
  return {ok: true};
}

// --- ADD STOCK (single) ---
function addStock(data) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Inventaris_Laptop');
    if (!sheet) return {ok: false, msg: 'Sheet tidak ditemukan'};
    var sn = String(data.sn || '').toUpperCase().trim();
    if (!sn) return {ok: false, msg: 'SN wajib diisi'};
    // Duplicate check
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toUpperCase().trim() === sn) {
        return {ok: false, msg: 'SN sudah ada: ' + sn};
      }
    }
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    var harga = String(data.hargaJual || data.harga || '0').replace(/[^0-9]/g, '');
    var modal = String(data.hargaBeli || data.modal || '0').replace(/[^0-9]/g, '');
    var staff = getCurrentStaff(data.staff);
    // 16 columns: A-P
    sheet.appendRow([
      sn,                           // A (0) SN
      data.model || '',             // B (1) Model
      data.spec || '',              // C (2) Spec
      data.kondisi || '',           // D (3) Kondisi
      modal,                        // E (4) Harga_Beli
      '0',                          // F (5) Biaya_Servis
      modal,                        // G (6) Total_Modal
      harga,                        // H (7) Harga_Jual
      'Available',                  // I (8) Status
      today,                        // J (9) Tanggal_Masuk
      data.suplier || '',           // K (10) Suplier
      (data.lokasi || 'JOGJA').toUpperCase(), // L (11) Lokasi
      '',                           // M (12) history_lokasi
      staff,                        // N (13) Staff_input
      '',                           // O (14) Staff_handle
      ''                            // P (15) Foto_Barang
    ]);
    return {ok: true, msg: 'Stok ditambahkan: ' + sn};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

// --- ADD STOCK BULK ---
function addStockBulk(text, defaultLokasi) {
  try {
    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheetByName('Inventaris_Laptop');
    if (!sheet) return {ok: false, msg: 'Sheet tidak ditemukan'};
    var lines = text.split('\n');
    var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
    var existingRows = sheet.getDataRange().getValues();
    var existingSNs = {};
    for (var i = 1; i < existingRows.length; i++) {
      existingSNs[String(existingRows[i][0]).toUpperCase().trim()] = true;
    }
    var results = [];
    var okCount = 0;
    var newRows = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var parts = line.split('|');
      for (var p = 0; p < parts.length; p++) parts[p] = parts[p].trim();
      if (parts.length < 6) {
        results.push('ERROR: ' + line.substring(0, 40) + ' (min 6 kolom)');
        continue;
      }
      var sn = parts[0].toUpperCase().trim();
      if (!sn) { results.push('ERROR: SN kosong'); continue; }
      if (existingSNs[sn]) { results.push('DUP: ' + sn); continue; }
      existingSNs[sn] = true;
      var model = parts[1] || '';
      var spec = parts[2] || '';
      var kondisi = parts[3] || '';
      var modal = String(parts[4] || '0').replace(/[^0-9]/g, '');
      var harga = String(parts[5] || '0').replace(/[^0-9]/g, '');
      var lokasi = (parts[6] || defaultLokasi || 'JOGJA').toUpperCase().trim();
      var suplier = parts[7] || '';
      var staff = getCurrentStaff();
      newRows.push([sn, model, spec, kondisi, formatRupiah(Number(modal)), '0', formatRupiah(Number(modal)), formatRupiah(Number(harga)), 'Available', today, suplier, lokasi, '', staff, '', '']);
      results.push('OK: ' + sn + ' | ' + model);
      okCount++;
    }
    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    return {ok: true, msg: okCount + ' item berhasil disimpan', details: results};
  } catch(e) {
    return {ok: false, msg: e.toString()};
  }
}

// --- SERVIS ---
function addServis(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return {ok: false, msg: 'Sheet Servis tidak ditemukan'};
  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  var sn = data.sn.toUpperCase().trim();
  
  // Check duplicate - SN masih dalam servis (MASUK/PROSES)
  var servisData = sheet.getDataRange().getValues();
  for (var i = 1; i < servisData.length; i++) {
    var existSn = String(servisData[i][2] || '').toUpperCase().trim();
    var existStatus = String(servisData[i][8] || '').toUpperCase().trim();
    if (existSn === sn && (existStatus === 'MASUK' || existStatus === 'PROSES')) {
      return {ok: false, msg: 'SN ' + sn + ' masih dalam servis (Status: ' + existStatus + '). Selesaikan dulu servis sebelumnya.'};
    }
  }
  
  var model = data.model || '';
  // Auto-detect model from inventory if not provided
  if (!model) {
    var invSheet = ss.getSheetByName('Inventaris_Laptop');
    if (invSheet) {
      var invData = invSheet.getDataRange().getValues();
      for (var i = 1; i < invData.length; i++) {
        if (String(invData[i][0]).toUpperCase().trim() === sn) {
          model = String(invData[i][1] || '');
          break;
        }
      }
    }
  }
  if (!model) model = '-';
  var staff = getCurrentStaff(data.staff);
  sheet.appendRow([today, data.lokasi, sn, model, data.kerusakan, data.estimasi || '-', data.nama, data.hp, 'MASUK', data.note || '', '', staff]);
  return {ok: true, data: {
    sn: sn, model: model, lokasi: data.lokasi,
    kerusakan: data.kerusakan, estimasi: data.estimasi || '-',
    nama: data.nama, hp: data.hp, tglMasuk: today, staff: staff
  }};
}

function getServisItems() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var status = String(data[i][8] || 'MASUK');
    items.push({
      tglMasuk: String(data[i][0] || ''), lokasi: String(data[i][1] || ''),
      sn: String(data[i][2] || ''), model: String(data[i][3] || ''),
      kerusakan: String(data[i][4] || ''), estimasi: String(data[i][5] || '-'),
      nama: String(data[i][6] || ''), hp: String(data[i][7] || ''),
      status: status, catatan: String(data[i][9] || ''),
      tglSelesai: String(data[i][10] || ''), staff: String(data[i][11] || '')
    });
  }
  var order = {'MASUK':0,'PROSES':1,'SELESAI':2};
  items.sort(function(a,b){return (order[a.status]||9)-(order[b.status]||9);});
  return items;
}

function updateServisEntry(sn, action, value) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return {ok: false, msg: 'Sheet Servis tidak ditemukan'};
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toUpperCase() === sn.toUpperCase()) {
      if (action === 'STATUS') {
        sheet.getRange(i + 1, 9).setValue(value);
        if (value === 'SELESAI' || value === 'DIAMBIL') {
          sheet.getRange(i + 1, 11).setValue(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm'));
        }
      } else if (action === 'NOTE') {
        var existing = String(data[i][9] || '');
        var todayShort = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM');
        sheet.getRange(i + 1, 10).setValue(existing + (existing ? '\n' : '') + '[' + todayShort + ' Web] ' + value);
      }
      return {ok: true};
    }
  }
  return {ok: false, msg: 'SN tidak ditemukan'};
}

function completeServis(sn, biaya, statusBayar) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return {ok: false, msg: 'Sheet Servis tidak ditemukan'};
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toUpperCase() === sn.toUpperCase()) {
      var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
      var cleanBiaya = String(biaya).replace(/[.,]/g, '');
      sheet.getRange(i + 1, 9).setValue('DIAMBIL');
      sheet.getRange(i + 1, 11).setValue(today);
      sheet.getRange(i + 1, 13).setValue(cleanBiaya);
      sheet.getRange(i + 1, 14).setValue(statusBayar);
      return {ok: true, data: {
        sn: String(data[i][2]), model: String(data[i][3]),
        lokasi: String(data[i][1] || ''),
        kerusakan: String(data[i][4]), estimasi: String(data[i][5] || '-'),
        nama: String(data[i][6]), hp: String(data[i][7]),
        tglMasuk: fmtDate(data[i][0]),
        staff: String(data[i][11] || 'Web'),
        biayaAktual: cleanBiaya, statusBayar: statusBayar, tglSelesai: today
      }};
    }
  }
  return {ok: false, msg: 'SN tidak ditemukan'};
}

// --- TRADE-IN ---
function lookupTradeInSn(sn) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() === sn.toUpperCase()) {
      return {
        found: true, sn: String(data[i][0]),
        model: String(data[i][1]), spec: String(data[i][2]),
        harga: parseHarga(data[i][7]), modal: parseHarga(data[i][4]),
        status: String(data[i][8]), lokasi: String(data[i][11] || '').toUpperCase().trim()
      };
    }
  }
  return {found: false};
}

function createTradeIn(data) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var stSheet = ss.getSheetByName('Inventaris_Laptop');
  var invSheet = ss.getSheetByName('Log_Penjualan_Invoice');

  var totalBeli = 0;
  var beliNotFound = [];
  var tukarAdded = [];

  // Process BELI items (mark as Sold)
  for (var i = 0; i < data.beliItems.length; i++) {
    var item = data.beliItems[i];
    totalBeli += Number(item.harga) || 0;
    var rows = stSheet.getDataRange().getValues();
    var found = false;
    for (var j = 1; j < rows.length; j++) {
      if (String(rows[j][0]).toUpperCase() === item.sn.toUpperCase()) {
        stSheet.getRange(j + 1, 9).setValue('Sold');
        found = true;
        break;
      }
    }
    if (!found) beliNotFound.push(item.sn);
  }

  // Process TUKAR items (add to inventory)
  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy');
  var defaultLoc = 'JOGJA';
  if (data.beliItems.length > 0) {
    var lookup = lookupTradeInSn(data.beliItems[0].sn);
    if (lookup.found) defaultLoc = lookup.lokasi;
  }
  for (var i = 0; i < data.tukarItems.length; i++) {
    var t = data.tukarItems[i];
    stSheet.appendRow([
      t.sn.toUpperCase(), t.model, t.spec || '-', '', Number(t.harga)||0, '', Number(t.harga)||0,
      'Rp' + formatNumber(Number(t.harga)||0), 'Available', today, '', defaultLoc, '', '', '', ''
    ]);
    tukarAdded.push(t.sn);
  }

  var totalTukar = 0;
  for (var i = 0; i < data.tukarItems.length; i++) totalTukar += Number(data.tukarItems[i].harga) || 0;
  var dibayar = Math.max(0, totalBeli - totalTukar);

  // Build trade-in note with TUKAR items info
  var tukarNote = '';
  if (data.tukarItems && data.tukarItems.length > 0) {
    var parts = [];
    for (var t = 0; t < data.tukarItems.length; t++) {
      var tk = data.tukarItems[t];
      parts.push(tk.sn + '|' + tk.model + '|' + (tk.spec||'') + '|' + (Number(tk.harga)||0));
    }
    tukarNote = 'TUKAR:' + parts.join(';') + '|total=' + totalTukar + '|bayar=' + dibayar;
  }
  var invData = invSheet.getDataRange().getValues();
  var invNo = 'TI-' + String(invData.length).padStart(4, '0');
  var beliSnList = data.beliItems.map(function(b){return b.sn}).join(', ');
  // Log each BELI item as separate row: [invNo, SN, buyer, modal=VLOOKUP, harga, tanggal, sales, handler, status, ...]
  for (var b = 0; b < data.beliItems.length; b++) {
    var bi = data.beliItems[b];
    invSheet.appendRow([invNo, bi.sn, data.buyer||'', '', Number(bi.harga)||0, today, data.sales||'', data.handler||'', 'Lunas (Trade-In)', '', '', '', 0, 0, tukarNote]);
    // VLOOKUP modal dari Inventaris_Laptop kolom E berdasarkan SN
    var bRow = invSheet.getLastRow();
    invSheet.getRange(bRow, 4).setFormula('=IFERROR(VLOOKUP(B'+bRow+',Inventaris_Laptop!A:E,5,FALSE),0)');
  }

  return {ok: true, invoiceNo: invNo, totalDibayar: dibayar, beliNotFound: beliNotFound, tukarAdded: tukarAdded};
}

// --- TELEGRAM SETUP ---
function setupTelegramToken(token) {
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_BOT_TOKEN', token);
  return {ok: true};
}

function testTelegram() {
  var props = PropertiesService.getScriptProperties();
  var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
  if (!botToken) return {ok: false, msg: 'Token belum di-set'};
  var url = 'https://api.telegram.org/bot' + botToken + '/getMe';
  var resp = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  var result = JSON.parse(resp.getContentText());
  return {ok: result.ok, bot: result.result ? result.result.username : 'unknown'};
}

// ============================================
// FUNCTIONS CALLED BY Page.html (google.script.run)
// ============================================

// Helper: status mapping for servis
function _mapServisStatus(s) {
  s = String(s||'').toUpperCase().trim();
  if (s==='MASUK') return 'Menunggu';
  if (s==='PROSES') return 'Proses';
  if (s==='SELESAI') return 'Selesai';
  if (s==='DIAMBIL') return 'Diambil';
  if (s==='CANCEL') return 'Batal';
  return s||'Menunggu';
}
function _unmapServisStatus(s) {
  s = String(s||'').trim();
  if (s==='Menunggu') return 'MASUK';
  if (s==='Proses') return 'PROSES';
  if (s==='Selesai') return 'SELESAI';
  if (s==='Diambil') return 'DIAMBIL';
  if (s==='Batal') return 'CANCEL';
  return s.toUpperCase();
}

// --- getStockData(loc?) ---
function getStockData(loc) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var rLoc = String(data[i][11]||'').toUpperCase().trim();
    var st = String(data[i][8]||'').trim();
    if (!rLoc || !st) continue;
    if (loc && rLoc !== loc.toUpperCase()) continue;
    var spec = String(data[i][2]||'');
    items.push({
      sn: String(data[i][0]||''),
      model: String(data[i][1]||''),
      spekSingkat: spec,
      hargaBeli: parseHarga(data[i][4]),
      hargaJual: parseHarga(data[i][7]),
      lokasi: rLoc,
      status: st
    });
  }
  return items;
}

// --- getDashboardStats() ---
function getDashboardStats() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var total=0, available=0, sold=0, returned=0, problems=0;
  var servis=0;
  var locStats = {};
  
  for (var i = 1; i < data.length; i++) {
    var st = String(data[i][8]||'').trim();
    var loc = String(data[i][11]||'').toUpperCase().trim() || 'UNKNOWN';
    if (!st) continue;
    total++;
    
    if (!locStats[loc]) locStats[loc] = {available:0, sold:0, servis:0, problem:0, returned:0};
    
    if (st==='Available') { available++; locStats[loc].available++; }
    else if (st==='Sold') { sold++; locStats[loc].sold++; }
    else if (st==='Returned') { returned++; locStats[loc].returned++; }
    else if (st==='problem') { problems++; locStats[loc].problem++; }
    else if (st==='Servis') { servis++; locStats[loc].servis++; }
  }
  
  return {
    total:total, tersedia:available, sold:sold, returned:returned, problems:problems, servis:servis,
    locStats: locStats
  };
}

// --- getLocations() ---
function getLocations() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var locs = {};
  for (var i = 1; i < data.length; i++) {
    var l = String(data[i][11]||'').toUpperCase().trim();
    if (l) locs[l] = true;
  }
  return Object.keys(locs).sort();
}

// --- GESER STOK: Get Available items at a location ---
function getTransferItems(loc) {
  if (!loc) return [];
  var ss = SpreadsheetApp.openById(SS_ID);
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var rLoc = String(data[i][11] || '').toUpperCase().trim();
    var st = String(data[i][8] || '').trim();
    if (rLoc === loc.toUpperCase() && st === 'Available') {
      items.push({
        sn: String(data[i][0] || ''),
        model: String(data[i][1] || ''),
        spec: String(data[i][2] || ''),
        hargaJual: parseHarga(data[i][7]),
        rowIndex: i + 1
      });
    }
  }
  return items;
}

// --- GESER STOK: Transfer items to new location ---
function transferStock(data) {
  var snList = data.snList;      // array of SNs
  var toLoc = data.toLocation;   // destination location
  var handler = getCurrentStaff(data.staff);
  if (!snList || !snList.length || !toLoc) return {ok: false, msg: 'Pilih item dan lokasi tujuan'};
  
  // Convert snList to uppercase for comparison
  var snListUpper = snList.map(function(s) { return String(s).toUpperCase().trim(); });
  
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Inventaris_Laptop');
  var rows = sheet.getDataRange().getValues();
  var moved = 0;
  var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  
  for (var i = 1; i < rows.length; i++) {
    var sn = String(rows[i][0] || '').toUpperCase().trim();
    if (snListUpper.indexOf(sn) === -1) continue;
    
    // Update location (col 11 = L, 1-indexed = 12)
    sheet.getRange(i + 1, 12).setValue(toLoc.toUpperCase().trim());
    
    // Update handler (col 14 = N, 1-indexed = 15)
    sheet.getRange(i + 1, 15).setValue(handler || 'Staff');
    
    // Append to location history (col 12 = M, 1-indexed = 13)
    var oldHistory = String(rows[i][12] || '');
    var fromLoc = String(rows[i][11] || '').toUpperCase().trim();
    var newEntry = now + ' | ' + fromLoc + ' → ' + toLoc.toUpperCase() + ' | by ' + (handler || 'Staff');
    sheet.getRange(i + 1, 13).setValue(oldHistory ? oldHistory + '\n' + newEntry : newEntry);
    
    moved++;
  }
  
  return {ok: true, msg: moved + ' item berhasil dipindah ke ' + toLoc.toUpperCase()};
}

// --- AUTH CONFIG: Save allowed Gmail addresses ---
function saveAuthConfig(data) {
  var props = PropertiesService.getScriptProperties();
  if (data.admins !== undefined) props.setProperty('AUTH_ADMINS', data.admins);
  if (data.staff !== undefined) props.setProperty('AUTH_STAFF', data.staff);
  return {ok: true, msg: 'Konfigurasi tersimpan'};
}

// --- getServisData() ---
function getServisData() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < data.length; i++) {
    items.push({
      tglMasuk: fmtDate(data[i][0]),
      lokasi: String(data[i][1]||''),
      sn: String(data[i][2]||''),
      model: String(data[i][3]||''),
      kerusakan: String(data[i][4]||''),
      estimasi: String(data[i][5]||'-'),
      nama: String(data[i][6]||''),
      hp: String(data[i][7]||''),
      status: _mapServisStatus(data[i][8]),
      catatan: String(data[i][9]||''),
      tglSelesai: fmtDate(data[i][10]),
      staff: String(data[i][11]||''),
      biayaAktual: String(data[i][12]||''),
      statusPembayaran: String(data[i][13]||''),
      modalServis: String(data[i][14]||'')
    });
  }
  var order = {'Menunggu':0,'Proses':1,'Selesai':2,'Diambil':3,'Batal':4};
  items.sort(function(a,b){return (order[a.status]||9)-(order[b.status]||9);});
  return items;
}

// --- getServisDetail(sn) ---
function getServisDetail(sn) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toUpperCase() === sn.toUpperCase()) {
      var raw = String(data[i][9]||'');
      var notes = [];
      if (raw) {
        raw.split('\n').forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var m = line.match(/^\[([^\]]+)\s+([^\]]+)\]\s*(.*)$/);
          if (m) notes.push({date:m[1], staff:m[2], text:m[3]});
          else notes.push({date:'-', staff:'-', text:line});
        });
      }
      return {
        tglMasuk: fmtDate(data[i][0]),
        lokasi: String(data[i][1]||''),
        sn: String(data[i][2]||''),
        model: String(data[i][3]||''),
        kerusakan: String(data[i][4]||''),
        estimasi: String(data[i][5]||'-'),
        nama: String(data[i][6]||''),
        hp: String(data[i][7]||''),
        status: _mapServisStatus(data[i][8]),
        catatan: raw,
        notes: notes,
        tglSelesai: fmtDate(data[i][10]),
        staff: String(data[i][11]||''),
        biayaAktual: String(data[i][12]||''),
        statusPembayaran: String(data[i][13]||''),
        modalServis: String(data[i][14]||'')
      };
    }
  }
  return null;
}

// --- updateServisStatus(sn, status) ---
function updateServisStatus(sn, status) {
  var mapped = _unmapServisStatus(status);
  return updateServisEntry(sn, 'STATUS', mapped);
}

// --- addServisNote(sn, text) ---
function addServisNote(sn, text) {
  return updateServisEntry(sn, 'NOTE', text);
}

// --- GET SERVIS INVOICE DATA FOR PDF ---
function getServisInvoiceData(sn) {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('Servis');
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toUpperCase() === sn.toUpperCase()) {
      var biaya = String(data[i][12] || '0');
      var biayaNum = Number(biaya.replace(/[^0-9]/g, '')) || 0;
      var bayar = String(data[i][13] || '');
      var fmt = function(n) { return String(n).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); };
      return {
        sn: String(data[i][2] || ''),
        model: String(data[i][3] || ''),
        lokasi: String(data[i][1] || ''),
        kerusakan: String(data[i][4] || ''),
        estimasi: String(data[i][5] || '-'),
        nama: String(data[i][6] || ''),
        hp: String(data[i][7] || ''),
        tglMasuk: fmtDate(data[i][0]),
        tglSelesai: fmtDate(data[i][10]),
        staff: String(data[i][11] || 'Web'),
        biayaAktual: biaya,
        biayaFmt: fmt(biayaNum),
        statusBayar: bayar,
        isLunas: bayar.toUpperCase().indexOf('LUNAS') > -1
      };
    }
  }
  return null;
}

// ============================================
// AUTH SYSTEM
// ============================================

// Get current Google user email
function getGoogleUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch(e) { return ''; }
}

// Get staff identifier for logging
// Priority: client-passed data.staff > Google email > 'Web'
function getCurrentStaff(fallback) {
  var email = '';
  try { email = Session.getActiveUser().getEmail() || ''; } catch(e) {}
  if (email) return email.split('@')[0];
  if (fallback) return fallback;
  return 'Web';
}

// Check login: returns {loggedIn, role, email, name}
function checkLogin() {
  var props = PropertiesService.getScriptProperties();
  
  // Auto-init default accounts if none exist
  if (!props.getProperty('AUTH_USER_ADMIN')) {
    initDefaultAuth();
  }
  
  var email = getGoogleUserEmail();
  
  // Check Google OAuth user
  if (email) {
    var admins = (props.getProperty('AUTH_ADMINS') || '').toLowerCase().split(',');
    var staff = (props.getProperty('AUTH_STAFF') || '').toLowerCase().split(',');
    var allAllowed = admins.concat(staff).map(function(s){return s.trim();}).filter(Boolean);
    
    if (admins.map(function(s){return s.trim();}).indexOf(email.toLowerCase()) !== -1) {
      return {loggedIn:true, role:'admin', email:email, name:email.split('@')[0]};
    }
    if (staff.map(function(s){return s.trim();}).indexOf(email.toLowerCase()) !== -1) {
      return {loggedIn:true, role:'staff', email:email, name:email.split('@')[0]};
    }
    // If email is in allowed list at all
    if (allAllowed.indexOf(email.toLowerCase()) !== -1) {
      return {loggedIn:true, role:'staff', email:email, name:email.split('@')[0]};
    }
  }
  
  return {loggedIn:false, role:'', email:email||'', name:''};
}

// Login with username/password (fallback)
function loginWithPassword(username, password) {
  var props = PropertiesService.getScriptProperties();
  var u = (props.getProperty('AUTH_USER_' + username.toUpperCase()) || '');
  if (!u) return {ok:false, msg:'User tidak ditemukan'};
  var parts = u.split('|');
  if (parts[1] === password) {
    return {ok:true, role:parts[0]||'staff', name:parts[2]||username};
  }
  return {ok:false, msg:'Password salah'};
}

// Setup accounts (admin only)
function setupAccounts(config) {
  var props = PropertiesService.getScriptProperties();
  if (config.admins) props.setProperty('AUTH_ADMINS', config.admins);
  if (config.staff) props.setProperty('AUTH_STAFF', config.staff);
  if (config.users) {
    // config.users = [{username:'xxx', password:'xxx', role:'staff', name:'xxx'}]
    config.users.forEach(function(u) {
      props.setProperty('AUTH_USER_' + u.username.toUpperCase(), u.role + '|' + u.password + '|' + u.name);
    });
  }
  return {ok:true};
}

// Get current config (admin only)
function getAuthConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    admins: props.getProperty('AUTH_ADMINS') || '',
    staff: props.getProperty('AUTH_STAFF') || '',
    users: Object.keys(props.getProperties()).filter(function(k){return k.indexOf('AUTH_USER_')===0;}).map(function(k){
      var v = props.getProperty(k).split('|');
      return {username:k.replace('AUTH_USER_',''), role:v[0]||'staff', name:v[2]||''};
    })
  };
}

// Init default admin if no accounts exist
function initDefaultAuth() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('AUTH_USER_ADMIN')) return; // already set
  props.setProperty('AUTH_USER_ADMIN', 'admin|fanboy123|Admin');
  props.setProperty('AUTH_USER_STAFF', 'staff|staff123|Staff');
  return {ok:true, msg:'Default accounts created: admin/fanboy123, staff/staff123'};
}

// Add staff account (admin only)
function addStaffAccount(d) {
  var props = PropertiesService.getScriptProperties();
  var key = 'AUTH_USER_' + d.username.toUpperCase();
  if (props.getProperty(key)) return {ok:false, msg:'Username sudah ada: ' + d.username};
  props.setProperty(key, (d.role||'staff') + '|' + d.password + '|' + (d.name||d.username));
  return {ok:true, msg:'Akun dibuat: ' + d.username};
}

// Delete staff account (admin only)
function deleteStaffAccount(username) {
  var props = PropertiesService.getScriptProperties();
  var key = 'AUTH_USER_' + username.toUpperCase();
  if (!props.getProperty(key)) return {ok:false, msg:'Username tidak ditemukan'};
  if (username.toUpperCase() === 'ADMIN') return {ok:false, msg:'Tidak bisa hapus admin utama'};
  props.deleteProperty(key);
  return {ok:true, msg:'Akun dihapus: ' + username};
}
