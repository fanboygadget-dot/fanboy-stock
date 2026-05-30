// FANBOY STOCK VIEWER - Single file version
// Tested: all JS syntax validated before delivery

function doGet(e) {
  var h = [];
  h.push('<!DOCTYPE html><html><head>');
  h.push('<meta charset="utf-8">');
  h.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
  h.push('<style>');
  h.push('*{margin:0;padding:0;box-sizing:border-box}');
  h.push('body{font-family:-apple-system,sans-serif;background:#f5f5f7;color:#1d1d1f}');
  h.push('.hdr{background:#007AFF;color:#fff;padding:20px;text-align:center;position:sticky;top:0;z-index:100}');
  h.push('.hdr h1{font-size:20px;font-weight:600}');
  h.push('.hdr .sub{font-size:12px;opacity:.8;margin-top:4px}');
  h.push('.bk{color:#fff;font-size:14px;padding:8px 16px;background:rgba(255,255,255,.2);border-radius:20px;cursor:pointer;border:none}');
  h.push('.w{max-width:600px;margin:0 auto;padding:16px}');
  h.push('.sr{width:100%;padding:14px 18px;border:1px solid #e5e5ea;border-radius:12px;font-size:16px;margin-bottom:16px;box-sizing:border-box;background:#fff}');
  h.push('.sr:focus{outline:none;border-color:#007AFF}');
  h.push('.mi{font-size:12px;color:#666;margin-top:6px}');
  h.push('.cd{background:#fff;border-radius:16px;padding:20px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer}');
  h.push('.lh{display:flex;justify-content:space-between;align-items:center}');
  h.push('.ln{font-size:22px;font-weight:700}');
  h.push('.lt{font-size:13px;color:#666;margin-top:4px}');
  h.push('.gr{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}');
  h.push('.bx{padding:12px;border-radius:12px;text-align:center}');
  h.push('.bg{background:#E8F5E9}');
  h.push('.bo{background:#FFF3E0}');
  h.push('.br{background:#FFEBEE}');
  h.push('.bb{background:#E3F2FD}');
  h.push('.nm{font-size:24px;font-weight:700}');
  h.push('.ng{color:#2E7D32}');
  h.push('.no{color:#E65100}');
  h.push('.nr{color:#C62828}');
  h.push('.nb{color:#1565C0}');
  h.push('.lb{font-size:11px;color:#666;margin-top:4px;text-transform:uppercase}');
  h.push('.it{background:#fff;border-radius:12px;padding:16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,.06);cursor:pointer}');
  h.push('.mn{font-size:16px;font-weight:600}');
  h.push('.ms{font-size:13px;color:#666;margin-top:4px}');
  h.push('.mp{font-size:18px;font-weight:700;color:#007AFF;margin-top:8px}');
  h.push('.tg{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}');
  h.push('.t{font-size:11px;padding:4px 8px;border-radius:6px;background:#f5f5f7;color:#666}');
  h.push('.dt{background:#fff;border-radius:16px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)}');
  h.push('.dtt{font-size:24px;font-weight:700;margin-bottom:4px}');
  h.push('.dts{font-size:15px;color:#666;margin-bottom:16px}');
  h.push('.dg{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}');
  h.push('.dl{font-size:12px;color:#999;text-transform:uppercase}');
  h.push('.dv{font-size:16px;font-weight:600;margin-top:4px}');
  h.push('.tb{background:#1d1d1f;color:#fff;padding:16px 20px;border-radius:12px;margin-top:16px;display:flex;justify-content:space-between}');
  h.push('.em{text-align:center;padding:40px;color:#999;font-size:16px}');
  h.push('.ld{text-align:center;padding:40px;color:#999}');
  h.push('.it-sold{background:#FFEBEE;border-left:4px solid #C62828}');
  h.push('.it-sold .mn{color:#C62828}');
  h.push('.ar{font-size:20px;color:#007AFF}');
  h.push('.fw{font-weight:700}');
  h.push('.pr{margin-top:20px;font-size:28px;font-weight:700;color:#007AFF}');
  h.push('.st-available{display:inline-block;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;background:#E8F5E9;color:#2E7D32}');
  h.push('.st-sold{display:inline-block;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;background:#FFF3E0;color:#E65100}');
  h.push('.st-problem{display:inline-block;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;background:#FFEBEE;color:#C62828}');
  h.push('.st-returned{display:inline-block;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;background:#E3F2FD;color:#1565C0}');
  h.push('</style></head><body>');
  h.push('<div id="app"><div class="ld">Loading...</div></div>');

  // Client-side JavaScript
  h.push('<script>');
  h.push('function fmt(n){if(!n)return"0";var s=String(n),r="",c=0;for(var i=s.length-1;i>=0;i--){r=s[i]+r;c++;if(c%3===0&&i>0)r="."+r}return r}');
  h.push('function esc(v){return String(v||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")}');

  // Status helper
  h.push('function stCls(s){s=s.toLowerCase();if(s==="sold")return"st-sold";if(s==="problem")return"st-problem";if(s==="returned")return"st-returned";return"st-available"}');
  h.push('function stLbl(s){s=s.toLowerCase();if(s==="sold")return"SOLD";if(s==="problem")return"PROBLEM";if(s==="returned")return"RETURN";return"AVAILABLE"}');

  // goHome
  h.push('function goHome(){');
  h.push('document.getElementById("app").innerHTML="<div class=ld>Loading...</div>";');
  h.push('google.script.run.withSuccessHandler(showHome).getCounts()');
  h.push('}');

  // showHome
  h.push('function showHome(c){');
  h.push('var s="";');
  h.push('s+="<div class=hdr><h1>Fanboy Stock Viewer</h1><div class=sub>Cek Stok Real-time</div></div>";');
  h.push('s+="<div class=w>";');
  h.push('s+="<input type=text class=sr placeholder=\\u200B Cari semua barang... data-act=gsearch>";');
  h.push('s+="<div id=gresults></div>";');
  h.push('var locs=["JOGJA","SOLO","BALI"]');
  h.push('for(var i=0;i<locs.length;i++){');
  h.push('var l=locs[i],x=c[l],t=(x.Available||0)+(x.Sold||0)+(x.problem||0)+(x.Returned||0)');
  h.push('s+="<div class=cd data-act=detail data-loc="+l+" data-st=Available>";');
  h.push('s+="<div class=lh><div><div class=ln>"+l+"</div><div class=lt>"+t+" unit total</div></div>";');
  h.push('s+="<div class=ar>&#10132;</div></div>";');
  h.push('s+="<div class=gr>";');
  h.push('s+="<div class=bx bg><div class=nm ng>"+(x.Available||0)+"</div><div class=lb>Available</div></div>";');
  h.push('s+="<div class=bx bo><div class=nm no>"+(x.Sold||0)+"</div><div class=lb>Sold</div></div>";');
  h.push('s+="<div class=bx br><div class=nm nr>"+(x.problem||0)+"</div><div class=lb>Problem</div></div>";');
  h.push('s+="<div class=bx bb><div class=nm nb>"+(x.Returned||0)+"</div><div class=lb>Return</div></div>";');
  h.push('s+="</div></div>"}');
  h.push('s+="</div>";');
  h.push('document.getElementById("app").innerHTML=s');
  h.push('}');

  // goDetail
  h.push('function goDetail(loc,st){');
  h.push('document.getElementById("app").innerHTML="<div class=ld>Loading...</div>";');
  h.push('google.script.run.withSuccessHandler(function(items){showDetail(loc,st,items)}).getItems(loc,st)');
  h.push('}');

  // showDetail
  h.push('function showDetail(loc,st,items){');
  h.push('var s="";');
  h.push('s+="<div class=hdr><button class=bk data-act=home>&#8592; Kembali</button>";');
  h.push('s+="<h1>"+esc(loc)+" - "+esc(st)+"</h1><div class=sub>"+items.length+" unit</div></div>";');
  h.push('s+="<div class=w>";');
  h.push('s+="<input type=text class=sr placeholder=\\u200B Cari model atau SN... data-act=search>";');
  h.push('if(!items.length)s+="<div class=em>Tidak ada item</div>";');
  h.push('var total=0;window._sdata=[];s+="<div id=list>";');
  h.push('for(var i=0;i<items.length;i++){');
  h.push('var it=items[i];total+=it.harga;');
  h.push('window._sdata.push((it.model+" "+it.sn+" "+it.spec+" "+it.kondisi).toLowerCase());');
  h.push('var ic=st==="Sold"?"it it-sold":"it";');
  h.push('s+="<div class="+ic+" data-act=item data-sn="+esc(it.sn)+">";');
  h.push('s+="<div class=mn>"+esc(it.model)+"</div>";');
  h.push('s+="<div class=ms>"+esc(it.spec)+"</div>";');
  h.push('s+="<div class=mp>Rp "+fmt(it.harga)+"</div>";');
  h.push('s+="<div class=tg><span class=t>SN: "+esc(it.sn)+"</span><span class=t>Grade: "+esc(it.kondisi)+"</span>";');
  h.push('if(it.supplier)s+="<span class=t>"+esc(it.supplier)+"</span>";');
  h.push('s+="</div></div>"}');
  h.push('s+="</div>";');
  h.push('if(st==="Available"&&items.length>0)s+="<div class=tb><div>Total Nilai Stok</div><div class=fw>Rp "+fmt(total)+"</div></div>";');
  h.push('document.getElementById("app").innerHTML=s');
  h.push('}');

  // goItem
  h.push('function goItem(sn){');
  h.push('document.getElementById("app").innerHTML="<div class=ld>Loading...</div>";');
  h.push('google.script.run.withSuccessHandler(showItem).getItem(sn)');
  h.push('}');

  // showItem
  h.push('function showItem(it){');
  h.push('if(!it){document.getElementById("app").innerHTML="<div class=em>Item tidak ditemukan</div>";return}');
  h.push('var s="";');
  h.push('s+="<div class=hdr><button class=bk data-act=home>&#8592; Back</button>";');
  h.push('s+="<h1>Detail Unit</h1></div>";');
  h.push('s+="<div class=w><div class=dt>";');
  h.push('s+="<div class=dtt>"+esc(it.model)+"</div>";');
  h.push('s+="<div class=dts>"+esc(it.spec)+"</div>";');
  h.push('s+="<span class="+stCls(it.status)+">"+stLbl(it.status)+"</span>";');
  h.push('s+="<div class=pr>Rp "+fmt(it.harga)+"</div>";');
  h.push('s+="<div class=dg>";');
  h.push('s+="<div><div class=dl>Serial Number</div><div class=dv>"+esc(it.sn)+"</div></div>";');
  h.push('s+="<div><div class=dl>Kondisi</div><div class=dv>"+esc(it.kondisi)+"</div></div>";');
  h.push('s+="<div><div class=dl>Lokasi</div><div class=dv>"+esc(it.lokasi)+"</div></div>";');
  h.push('s+="<div><div class=dl>Supplier</div><div class=dv>"+esc(it.supplier||"-")+"</div></div>";');
  h.push('s+="<div><div class=dl>Tanggal Masuk</div><div class=dv>"+esc(it.tgl||"-")+"</div></div>";');
  h.push('s+="</div></div></div>";');
  h.push('document.getElementById("app").innerHTML=s');
  h.push('}');

  // goSearch - global search
  h.push('var _searchTimer=null;');
  h.push('function goSearch(q){');
  h.push('if(!q){document.getElementById("gresults").innerHTML="";return}');
  h.push('document.getElementById("gresults").innerHTML="<div class=ld>Searching...</div>";');
  h.push('google.script.run.withSuccessHandler(showSearchResults).searchAll(q)');
  h.push('}');

  // showSearchResults
  h.push('function showSearchResults(items){');
  h.push('if(!items.length){document.getElementById("gresults").innerHTML="<div class=em>Tidak ditemukan</div>";return}');
  h.push('var s="";');
  h.push('for(var i=0;i<items.length;i++){');
  h.push('var it=items[i];');
  h.push('s+="<div class=it data-act=item data-sn="+esc(it.sn)+">";');
  h.push('s+="<div class=mn>"+esc(it.model)+"</div>";');
  h.push('s+="<div class=ms>"+esc(it.spec)+"</div>";');
  h.push('s+="<div class=mp>Rp "+fmt(it.harga)+"</div>";');
  h.push('s+="<div class=tg><span class="+stCls(it.status)+">"+stLbl(it.status)+"</span>";');
  h.push('s+="<span class=t>"+esc(it.lokasi)+"</span>";');
  h.push('s+="<span class=t>SN: "+esc(it.sn)+"</span></div>";');
  h.push('if(it.history)s+="<div class=mi>History: "+esc(it.history)+"</div>";');
  h.push('if(it.tgl)s+="<div class=mi>Masuk: "+esc(it.tgl)+"</div>";');
  h.push('s+="</div>"}');
  h.push('document.getElementById("gresults").innerHTML=s');
  h.push('}');

  // Event delegation
  h.push('document.addEventListener("click",function(e){');
  h.push('var el=e.target,act=el.getAttribute("data-act");');
  h.push('if(!act){el=el.closest("[data-act]");act=el?el.getAttribute("data-act"):null}');
  h.push('if(!act)return;');
  h.push('if(act==="home")goHome();');
  h.push('else if(act==="detail")goDetail(el.getAttribute("data-loc"),el.getAttribute("data-st"));');
  h.push('else if(act==="item")goItem(el.getAttribute("data-sn"))');
  h.push('});');

  // Search handler
  h.push('document.addEventListener("input",function(e){');
  h.push('var act=e.target.getAttribute("data-act");');
  h.push('if(act==="gsearch"){');
  h.push('clearTimeout(_searchTimer);');
  h.push('var q=e.target.value;');
  h.push('_searchTimer=setTimeout(function(){goSearch(q)},400);');
  h.push('return}');
  h.push('if(act!=="search")return;');
  h.push('var q=e.target.value.toLowerCase();');
  h.push('var items=document.querySelectorAll("#list .it");');
  h.push('var sdata=window._sdata||[];');
  h.push('for(var i=0;i<items.length;i++){');
  h.push('var m=q===""||sdata[i].indexOf(q)>-1;');
  h.push('items[i].style.display=m?"":"none"}');
  h.push('});');

  h.push('goHome()');
  h.push('</script>');
  h.push('</body></html>');

  return HtmlService.createHtmlOutput(h.join('\n'))
    .setTitle('Fanboy Stock Viewer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getCounts() {
  var ss = SpreadsheetApp.openById('1BB9PaP_iLoM9A1uYWXAZtnDYKqgfmVNJwi4Q5XraO-0');
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
}

function getItems(loc, st) {
  var ss = SpreadsheetApp.openById('1BB9PaP_iLoM9A1uYWXAZtnDYKqgfmVNJwi4Q5XraO-0');
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
}

function getItem(sn) {
  var ss = SpreadsheetApp.openById('1BB9PaP_iLoM9A1uYWXAZtnDYKqgfmVNJwi4Q5XraO-0');
  var data = ss.getSheetByName('Inventaris_Laptop').getDataRange().getValues();
  for (var r=1;r<data.length;r++) {
    var row=data[r]; if(!row||row.length<12) continue;
    if(String(row[0]||'').toUpperCase()===sn.toUpperCase()) {
      return {sn:String(row[0]||''),model:String(row[1]||''),spec:String(row[2]||''),kondisi:String(row[3]||''),harga:Number(row[7])||0,status:String(row[8]||''),tgl:String(row[9]||''),supplier:String(row[10]||''),lokasi:String(row[11]||'')};
    }
  }
  return null;
}

function searchAll(q) {
  var ss = SpreadsheetApp.openById('1BB9PaP_iLoM9A1uYWXAZtnDYKqgfmVNJwi4Q5XraO-0');
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
}
