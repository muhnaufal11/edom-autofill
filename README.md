# EDOM Auto-Fill — iGracias Telkom University (v2)

Userscript (Tampermonkey) untuk mengisi kuesioner **EDOM** secara otomatis: memilih
**"Sangat puas"** di semua pertanyaan + mengisi esai dengan **"-"**, lalu menyelesaikan
seluruh alur sampai status **"Selesai"**. Mode **"Mulai Isi Semua"** mengerjakan semua
kuesioner yang masih "Belum Mengisi" satu per satu otomatis.

> ⚠️ **Penting:** Kuesioner yang sudah ter-**Submit** **tidak bisa diubah lagi**.
> Pastikan `TARGET_LABEL` & `ESSAY_COMMENT` sudah sesuai sebelum menjalankan mode otomatis.

---

## Alur EDOM yang ditangani (penting dipahami)

Tiap dosen = **2 part + finalisasi**:

1. **Part 1** (soal 1–10): isi radio → klik **update** (simpan & lanjut).
2. **Part 2** (soal 11–16 + esai soal 17): isi radio + esai → klik **update**.
3. Halaman kembali menampilkan tombol **Submit** → klik **Submit** → status jadi **"Selesai"**.

Script mendeteksi langkah secara otomatis: selama belum muncul tombol **Submit**, ia klik
**update** (maju antar-part); begitu tombol **Submit** muncul (artinya semua part sudah
tersimpan), ia klik **Submit**. Setelah itu kembali ke daftar dan membuka kuesioner berikutnya.

---

## 1. Pasang Tampermonkey

1. Install ekstensi **Tampermonkey**: <https://www.tampermonkey.net/>
2. Menu Tampermonkey → **Create a new script…**
3. Hapus isi default, **tempel** seluruh isi [`edom-autofill.user.js`](edom-autofill.user.js).
4. **Ctrl + S** untuk simpan. Pastikan **Enabled**.

---

## 2. Cara pakai

1. Login iGracias → buka **Survey → Kuesioner** (daftar EDOM).
2. Panel **EDOM Auto-Fill v2** muncul di kanan-bawah.
3. Klik salah satu:
   - **▶ Mulai Isi Semua** — otomatis kerjakan semua kuesioner "Belum Mengisi" sampai habis.
   - **Isi part ini saja** — hanya mengisi part yang sedang tampil (kamu klik tombol sendiri).
   - **⏹ Stop** — hentikan mode otomatis.

Saat membuka form manual, script juga otomatis **pra-isi** part yang tampil (tanpa klik tombol).

---

## 3. Pengaturan (atur di bagian atas file `.user.js`)

| Konstanta            | Default          | Fungsi |
|----------------------|------------------|--------|
| `TARGET_LABEL`       | `'Sangat puas'`  | Jawaban radio yang dipilih. |
| `ESSAY_COMMENT`      | `'-'`            | Isi untuk pertanyaan esai (mis. "Masukan/saran untuk dosen"). |
| `DELAY`              | `900`            | Jeda antar-aksi (ms). Perbesar bila koneksi lambat. |
| `MAX_CHAIN`          | `40`             | Batas aman jumlah kuesioner difinalisasi per sesi. |
| `AUTO_FILL_ON_LOAD`  | `true`           | Pra-isi part yang tampil saat form dibuka. |

---

## 4. Cara kerja teknis (ringkas, hasil reverse-engineering)

- Pertanyaan radio = grup `Answer{n}`, opsi urut: Sangat tidak puas → Tidak puas → Puas →
  **Sangat puas**. Script memilih radio yang teks `<li>`-nya = `TARGET_LABEL` (fallback: opsi terakhir).
- Esai = `<textarea>` (mis. `Answer17`), diisi `ESSAY_COMMENT`.
- Tombol **update** = `input[type=image]` src `btn2.png` (class `floatL3`).
- Tombol **Submit** (finalisasi) = `input[type=image]` src `btn_submit.gif` (class `floatL4`).
- Server menyimpan jawaban dari radio `Answer{n}` (hidden `QuestionAnswer{n}` dibiarkan kosong).
  Submit = identik dengan pengisian manual; **tidak ada manipulasi data tersembunyi**.

## 5. Catatan

- Hanya berjalan di `https://igracias.telkomuniversity.ac.id/survey/*`.
- Gunakan untuk akun & kuesioner milikmu sendiri.
- Sudah teruji end-to-end pada 2 kuesioner (ROX & ZQI) hingga berstatus "Selesai".
