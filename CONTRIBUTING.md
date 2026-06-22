# Berkontribusi ke EDOM Auto-Fill

Terima kasih sudah mau ikut mengembangkan! Proyek ini adalah **userscript vanilla JS satu file**,
tanpa build step / dependency. Gampang dimodifikasi.

## Setup cepat
1. **Fork** & clone repo ini.
2. Pasang **Tampermonkey** → *Create a new script* → paste isi `edom-autofill.user.js`
   (atau drag file-nya ke Tampermonkey).
3. Aktifkan **Allow User Scripts** (lihat README bagian 1).

## Menguji perubahan
- Edit kode → simpan di Tampermonkey → **refresh** halaman EDOM.
- Pakai tombol **"Isi part ini saja"** untuk uji **aman** (mengisi tanpa submit).
- Ingat: **Submit bersifat permanen**. Uji alur penuh hanya saat kamu memang mau mengisi
  kuesionermu sendiri.

## Peta kode (`edom-autofill.user.js`)
| Bagian | Fungsi |
|--------|--------|
| `KONFIGURASI` (atas file) | Opsi yang bisa diubah: rating, esai, delay, dll. |
| `fillCurrentPart()` | Memilih radio target + mengisi textarea. |
| `optionTextOf()` | Mengambil teks opsi sebuah radio (untuk pencocokan). |
| `getUpdateBtn()` / `getSubmitBtn()` | Deteksi tombol **update** vs **Submit**. |
| `route()` | Otak alur otomatis: isi → update/Submit → buka berikutnya. |
| `buildPanel()` | UI panel kanan-bawah. |

## Gaya kode
- **Vanilla JS** saja — jangan menambah library/framework eksternal.
- Jaga selektor tetap **robust**: cocokkan **teks** (mis. "Sangat puas"), hindari bergantung
  pada hash/posisi yang rapuh.
- Beri komentar Bahasa Indonesia singkat untuk logika yang tidak jelas.

## Ide pengembangan
- Rating berbeda per pertanyaan (tidak semua "Sangat puas").
- Mode rating acak agar lebih natural.
- Dukungan jenis kuesioner lain di iGracias.
- Tombol "preview" / konfirmasi sebelum Submit.

## Pull Request
- Satu PR = satu perubahan yang jelas.
- Tulis **apa** yang diubah dan **cara mengujinya**.
