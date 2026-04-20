/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   GAMS N' ROSES — gams_bridge.js                            ║
 * ║   Python optimizasyon scripti ile tarayıcı arasında köprü   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * KULLANIM:
 *   <script src="js/gams_bridge.js"></script>
 *
 * Bu script, stage.html'e dahil edildiğinde iki şey yapar:
 *   1. EXPORT: stageOptimData'yı JSON dosyası olarak indirme butonu ekler
 *   2. IMPORT: optimize_stage.py çıktısını (gams_result.json) yükleyip
 *              result.html'de göstermek üzere localStorage'a yazar
 */

'use strict';

// ── 1. EXPORT: stageOptimData → stage_data.json ──────────────────────────────
window.GamsBridge = {

  /**
   * stage.html'deki stageOptimData'yı JSON olarak indir.
   * Python scripte verilecek --input dosyasıdır.
   */
  exportStageData() {
    const raw = localStorage.getItem('stageOptimData');
    if (!raw) {
      alert('Önce haritada bir konuma tıklayın!\n(stageOptimData henüz yok)');
      return;
    }
    const blob = new Blob([raw], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'stage_data.json';
    a.click();
    URL.revokeObjectURL(url);

    // Terminalde çalıştırılacak komutu göster
    setTimeout(() => {
      const msg = [
        '✅ stage_data.json indirildi!',
        '',
        'Şimdi terminalde şunu çalıştırın:',
        '  python optimize_stage.py --input stage_data.json',
        '',
        'Çıktı: gams_result.json',
        'Sonra: "Import GAMSPy Sonucu" butonuna basın.'
      ].join('\n');
      alert(msg);
    }, 200);
  },

  /**
   * gams_result.json'u dosya seçici aracılığıyla yükle.
   * localStorage'a yaz → result.html bunu kullanır.
   */
  importResult() {
    const input    = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json';
    input.onchange = (e) => {
      const file   = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);

          // result.html'nin beklediği format:
          //   gams_optimalData = { maxSeyirci, x, y, maxDb }
          const optimalData = {
            maxSeyirci: data.maxSeyirci || data.estimated_crowd || 0,
            x         : data.x          || data.stage_pos?.x    || 0,
            y         : data.y          || data.stage_pos?.y    || 0,
            maxDb     : data.maxDb      || data.audience_db     || 0,
            placement : data.placement  || {},
            violations: data.violations || 0,
            method    : data.method     || 'GAMSPy',
          };

          localStorage.setItem('gams_optimalData', JSON.stringify(optimalData));

          alert(
            `✅ GAMSPy sonucu yüklendi!\n\n` +
            `Yöntem:    ${optimalData.method}\n` +
            `Kalabalık: ${optimalData.maxSeyirci.toLocaleString('tr-TR')} 👥\n` +
            `Ses:       ${optimalData.maxDb} dB\n` +
            `İhlaller:  ${optimalData.violations}\n\n` +
            `"View Results →" butonuna basarak karşılaştırın!`
          );
        } catch (err) {
          alert('JSON parse hatası: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  /**
   * stage.html header'ına export/import butonlarını enjekte et.
   * stage.html'in <head> kapanışından önce bu scripti ekleyin,
   * ya da DOMContentLoaded'da çağırın.
   */
  injectUI() {
    const header = document.querySelector('header');
    if (!header) return;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:8px;align-items:center;';

    // Export butonu
    const expBtn = document.createElement('button');
    expBtn.className   = 'back-btn';
    expBtn.style.cssText = 'border-color:#bb44ff;color:#bb44ff;font-size:10px;';
    expBtn.textContent = '⬇ Export Data';
    expBtn.title       = 'stageOptimData.json olarak indir → python optimize_stage.py';
    expBtn.onclick     = () => GamsBridge.exportStageData();

    // Import butonu
    const impBtn = document.createElement('button');
    impBtn.className   = 'back-btn';
    impBtn.style.cssText = 'border-color:#00e5ff;color:#00e5ff;font-size:10px;';
    impBtn.textContent = '⬆ Import GAMSPy';
    impBtn.title       = 'gams_result.json dosyasını yükle';
    impBtn.onclick     = () => GamsBridge.importResult();

    wrap.appendChild(expBtn);
    wrap.appendChild(impBtn);

    // Header'ın sonundan önce (View Results butonunun yanına) ekle
    const lastBtn = header.querySelector('button:last-child');
    if (lastBtn) {
      header.insertBefore(wrap, lastBtn);
    } else {
      header.appendChild(wrap);
    }
  }
};

// Sayfa hazır olduğunda UI'ı otomatik enjekte et
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GamsBridge.injectUI());
} else {
  GamsBridge.injectUI();
}
