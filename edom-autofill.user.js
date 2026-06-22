// ==UserScript==
// @name         EDOM Auto-Fill iGracias (Telkom University)
// @namespace    https://igracias.telkomuniversity.ac.id/
// @version      2.0.0
// @description  Mengisi kuesioner EDOM otomatis (default "Sangat puas" + esai "-") mengikuti alur 2-part: Part 1 -> update -> Part 2 -> update -> Submit. Mode "Mulai Isi Semua" mengerjakan seluruh kuesioner "Belum Mengisi" secara berurutan.
// @author       kamu
// @match        https://igracias.telkomuniversity.ac.id/survey/*
// @match        https://igracias.telkomuniversity.ac.id/survey*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /* =========================== KONFIGURASI =========================== */
  const TARGET_LABEL  = 'Sangat puas'; // jawaban radio yang dipilih
  const ESSAY_COMMENT = '-';           // isi untuk pertanyaan esai (textarea), mis. "Masukan/saran untuk dosen"
  const DELAY         = 900;           // jeda antar-aksi (ms). Perbesar jika koneksi lambat.
  const MAX_CHAIN     = 40;            // batas aman jumlah kuesioner difinalisasi per sesi (anti-loop)
  const AUTO_FILL_ON_LOAD = true;      // pra-isi part yang tampil saat buka form manual (tanpa klik tombol)
  /* ================================================================== */

  const RUN_KEY = 'edomRun';        // '1' saat mode otomatis aktif
  const RET_KEY = 'edomReturnList'; // '1' tepat setelah klik Submit -> harus balik ke daftar
  const CNT_KEY = 'edomCount';      // jumlah Submit yang sudah dilakukan

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const ss = {
    get: (k) => sessionStorage.getItem(k),
    set: (k, v) => sessionStorage.setItem(k, v),
    del: (k) => sessionStorage.removeItem(k),
  };
  const isRunning = () => ss.get(RUN_KEY) === '1';

  /* ----------------------------- Deteksi DOM ----------------------------- */
  const getRadios = () => Array.from(document.querySelectorAll('input[type=radio]'));
  const getTextareas = () => Array.from(document.querySelectorAll('textarea'));
  const getActionLinks = () => Array.from(document.querySelectorAll('a[href*="lec_code"]'));

  // Tombol "update" (simpan part & maju): input image src btn2.png / class floatL3
  const getUpdateBtn = () =>
    getImageBtns().find((b) => (b.getAttribute('src') || '').includes('btn2')) ||
    document.querySelector('input[type=image].floatL3');
  // Tombol "Submit" (finalisasi): input image src btn_submit.gif / class floatL4
  const getSubmitBtn = () =>
    getImageBtns().find((b) => (b.getAttribute('src') || '').includes('btn_submit')) ||
    document.querySelector('input[type=image].floatL4');
  const getImageBtns = () => Array.from(document.querySelectorAll('input[type=image]'));

  const isFormPage = () => getRadios().length > 0 || getTextareas().length > 0;
  const isListPage = () => !isFormPage() && getActionLinks().length > 0;

  /* --------------------------- Isi part saat ini --------------------------- */
  function optionTextOf(radio) {
    const li = radio.closest('li');
    if (li) return norm(li.innerText);
    const lbl = radio.id ? document.querySelector('label[for="' + CSS.escape(radio.id) + '"]') : null;
    if (lbl) return norm(lbl.innerText);
    const wrap = radio.closest('label');
    if (wrap) return norm(wrap.innerText);
    return norm(radio.parentElement ? radio.parentElement.innerText : '');
  }

  function fillCurrentPart() {
    const want = norm(TARGET_LABEL);
    const radios = getRadios();
    const groups = {};
    radios.forEach((r) => { (groups[r.name] = groups[r.name] || []).push(r); });

    Object.values(groups).forEach((group) => {
      const target =
        group.find((r) => optionTextOf(r) === want) ||
        group.find((r) => optionTextOf(r).includes(want)) ||
        (group.length >= 4 ? group[group.length - 1] : null);
      if (target) {
        target.checked = true;
        target.click();
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    getTextareas().forEach((t) => {
      if (!t.value.trim()) {
        t.value = ESSAY_COMMENT;
        t.dispatchEvent(new Event('input', { bubbles: true }));
        t.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // verifikasi kelengkapan part ini
    const radioMissing = Object.values(groups).filter((g) => !g.some((r) => r.checked)).length;
    const taMissing = getTextareas().filter((t) => !t.value.trim()).length;
    const groupCount = Object.keys(groups).length;
    return { groupCount, complete: radioMissing === 0 && taMissing === 0 };
  }

  /* ------------------------------ Navigasi ------------------------------ */
  function goToList() {
    const menu = Array.from(document.querySelectorAll('a')).find(
      (a) => /^\s*kuesioner\s*$/i.test(a.innerText) && a.getAttribute('href')
    );
    if (menu) { menu.click(); return true; }
    return false;
  }

  function openNextQuestionnaire() {
    const link = getActionLinks()[0];
    if (link) { link.click(); return true; }
    return false;
  }

  /* ------------------------------ Panel UI ------------------------------ */
  let statusEl;
  function buildPanel() {
    if (document.getElementById('edom-panel')) return;
    const box = document.createElement('div');
    box.id = 'edom-panel';
    box.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#1f2937;color:#fff;' +
      'font:13px/1.45 system-ui,Arial,sans-serif;padding:12px 14px;border-radius:10px;' +
      'box-shadow:0 6px 24px rgba(0,0,0,.35);width:255px';
    box.innerHTML =
      '<div style="font-weight:700;margin-bottom:6px">EDOM Auto-Fill v2</div>' +
      '<div id="edom-status" style="margin-bottom:8px;opacity:.9">Siap.</div>' +
      '<button id="edom-start" style="width:100%;margin-bottom:6px;padding:7px;border:0;border-radius:6px;background:#16a34a;color:#fff;font-weight:600;cursor:pointer">▶ Mulai Isi Semua</button>' +
      '<button id="edom-once"  style="width:100%;margin-bottom:6px;padding:7px;border:0;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer">Isi part ini saja</button>' +
      '<button id="edom-stop"  style="width:100%;padding:7px;border:0;border-radius:6px;background:#dc2626;color:#fff;cursor:pointer">⏹ Stop</button>';
    document.body.appendChild(box);
    statusEl = box.querySelector('#edom-status');

    box.querySelector('#edom-start').onclick = () => {
      ss.set(RUN_KEY, '1'); ss.set(CNT_KEY, '0'); ss.del(RET_KEY);
      setStatus('Mode otomatis: ON');
      route();
    };
    box.querySelector('#edom-once').onclick = () => {
      const r = fillCurrentPart();
      setStatus('Part ini diisi (' + r.groupCount + ' soal). Lengkap: ' + r.complete);
    };
    box.querySelector('#edom-stop').onclick = () => {
      ss.del(RUN_KEY); ss.del(RET_KEY);
      setStatus('Dihentikan.');
    };
  }
  function setStatus(t) { if (statusEl) statusEl.textContent = t; console.log('[EDOM]', t); }

  /* ------------------------------ Router ------------------------------ */
  function route() {
    if (!isRunning()) return;

    // Tepat setelah Submit: apa pun halamannya, kembali ke daftar dulu.
    if (ss.get(RET_KEY) === '1') {
      if (isListPage()) {
        ss.del(RET_KEY);
        // lanjut ke kuesioner berikutnya di bawah
      } else {
        setStatus('Selesai 1 kuesioner, kembali ke daftar…');
        setTimeout(goToList, DELAY);
        return;
      }
    }

    if (isListPage()) {
      const remaining = getActionLinks().length;
      if (remaining > 0) {
        setStatus('Daftar: ' + remaining + ' belum diisi. Membuka berikutnya…');
        setTimeout(openNextQuestionnaire, DELAY);
      } else {
        ss.del(RUN_KEY);
        setStatus('✅ Semua kuesioner selesai!');
      }
      return;
    }

    if (isFormPage()) {
      const r = fillCurrentPart();
      if (!r.complete) { setStatus('⚠ Part belum lengkap terisi, berhenti untuk cek manual.'); ss.del(RUN_KEY); return; }
      const submitBtn = getSubmitBtn();
      const updateBtn = getUpdateBtn();
      if (submitBtn) {
        let cnt = parseInt(ss.get(CNT_KEY) || '0', 10) + 1;
        ss.set(CNT_KEY, String(cnt));
        if (cnt > MAX_CHAIN) { ss.del(RUN_KEY); setStatus('Batas aman tercapai, berhenti.'); return; }
        ss.set(RET_KEY, '1'); // setelah ini halaman hasil -> harus balik ke daftar
        setStatus('Finalisasi kuesioner #' + cnt + ' (Submit)…');
        setTimeout(() => submitBtn.click(), DELAY);
      } else if (updateBtn) {
        setStatus('Menyimpan part & lanjut (update)…');
        setTimeout(() => updateBtn.click(), DELAY);
      } else {
        // tidak ada tombol form -> mungkin halaman hasil; balik ke daftar
        setStatus('Tidak ada tombol form, kembali ke daftar…');
        setTimeout(goToList, DELAY);
      }
      return;
    }

    // halaman lain -> coba balik ke daftar
    setTimeout(goToList, DELAY);
  }

  /* ------------------------------- Init ------------------------------- */
  function init() {
    buildPanel();
    if (isRunning()) {
      route();
    } else if (AUTO_FILL_ON_LOAD && isFormPage()) {
      const r = fillCurrentPart();
      setStatus('Pra-isi part ini (' + r.groupCount + ' soal). Klik "Mulai Isi Semua" atau tombol form.');
    } else if (isListPage()) {
      setStatus('Daftar kuesioner. Klik "Mulai Isi Semua".');
    } else {
      setStatus('Siap.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 350));
  } else {
    setTimeout(init, 350);
  }
})();
