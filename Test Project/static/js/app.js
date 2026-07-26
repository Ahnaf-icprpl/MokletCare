// ==================== ELEMEN DOM ====================
const tabForm = document.getElementById('tabForm');
const tabDashboard = document.getElementById('tabDashboard');
const btnTabForm = document.getElementById('btnTabForm');
const btnTabDashboard = document.getElementById('btnTabDashboard');
const formLapor = document.getElementById('formLapor');
const btnSubmit = document.getElementById('btnSubmit');
const notifSukses = document.getElementById('notifSukses');
const tabelLaporan = document.getElementById('tabelLaporan');
const btnRefresh = document.getElementById('btnRefresh');
const btnClearCompleted = document.getElementById('btnClearCompleted');
const languageSelect = document.getElementById('languageSelect');

const i18nElements = document.querySelectorAll('[data-i18n]');
const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');

const translations = {
  id: {
    headerTitle: 'Pelaporan Kerusakan Sarana Prasarana',
    headerSubtitle: 'Sistem laporan kerusakan fasilitas sekolah',
    tabForm: 'Form Lapor',
    tabDashboard: 'Dashboard Petugas',
    languageLabel: 'Bahasa',
    formHeading: 'Formulir Laporan Kerusakan',
    labelNama: 'Nama Pelapor',
    placeholderNama: 'Masukkan nama lengkap',
    labelKelas: 'Kelas',
    placeholderKelas: 'Contoh: X RPL 1',
    labelLokasi: 'Lokasi Kerusakan',
    optionLokasiDefault: '-- Pilih Lokasi --',
    optionGedungA: 'Gedung 1',
    optionGedungB: 'Gedung 2',
    optionGedungC: 'Gedung Aula',
    optionGedungD: 'Gedung MTP',
    labelDeskripsi: 'Deskripsi Kerusakan',
    placeholderDeskripsi: 'Jelaskan kerusakan yang ditemukan...',
    labelSeverity: 'Tingkat Masalah',
    optionMinor: 'Minor',
    optionMedium: 'Medium',
    optionCritical: 'Critical',
    labelUpload: 'Upload Foto (Wajib 3 Foto)',
    hintUpload: '1 foto kerusakan utama + 2 foto lingkungan sekitar',
    labelFoto1: 'Foto Kerusakan Utama',
    labelFoto2: 'Foto Lingkungan 1',
    labelFoto3: 'Foto Lingkungan 2',
    uploadChoose: 'Pilih Foto',
    btnSubmit: 'Laporkan',
    notifSukses: '✓ Laporan berhasil dikirim! Terima kasih.',
    dashboardHeading: 'Dashboard Petugas Sarpras',
    btnRefresh: 'Refresh',
    btnClearCompleted: 'Clear',
    clearing: 'Membersihkan...',
    confirmClearCompleted: 'Apakah Anda yakin ingin menghapus semua laporan yang sudah selesai?',
    clearCompletedSuccess: 'Laporan selesai berhasil dibersihkan ({count} item).',
    clearCompletedError: 'Gagal membersihkan laporan selesai.',
    thNama: 'Nama Pelapor',
    thLokasi: 'Lokasi',
    thDeskripsi: 'Deskripsi',
    thSeverity: 'Tingkat',
    thStatus: 'Status',
    thAksi: 'Aksi',
    loadingData: 'Memuat data...',
    noReports: 'Belum ada laporan.',
    failedLoad: 'Gagal memuat data.',
    alertNoPhotos: 'Anda wajib mengupload tepat 3 foto!',
    alertSendError: 'Gagal mengirim laporan',
    alertStatusError: 'Gagal mengubah status',
    sending: 'Mengirim...',
    fileTooLarge: 'Ukuran file terlalu besar. Maksimum 10 MB.',
    statusPending: 'Menunggu',
    statusInProgress: 'Dikerjakan',
    statusCompleted: 'Selesai',
    severityMinor: 'Minor',
    severityMedium: 'Medium',
    severityCritical: 'Critical',
    actionWorking: 'Kerjakan',
    actionComplete: 'Selesai',
    viewPhotos: 'Lihat Foto',
    closeLabel: 'Tutup'
  },
  en: {
    headerTitle: 'Facility Damage Reporting',
    headerSubtitle: 'School facility damage report system',
    tabForm: 'Report Form',
    tabDashboard: 'Officer Dashboard',
    languageLabel: 'Language',
    formHeading: 'Damage Report Form',
    labelNama: 'Reporter Name',
    placeholderNama: 'Enter full name',
    labelKelas: 'Class',
    placeholderKelas: 'Example: X RPL 1',
    labelLokasi: 'Damage Location',
    optionLokasiDefault: '-- Select Location --',
    optionGedungA: 'Building 1',
    optionGedungB: 'Building 2',
    optionGedungC: 'Building Hall',
    optionGedungD: 'Building MTP',
    labelDeskripsi: 'Damage Description',
    placeholderDeskripsi: 'Describe the damage found...',
    labelSeverity: 'Problem Severity',
    optionMinor: 'Minor',
    optionMedium: 'Medium',
    optionCritical: 'Critical',
    labelUpload: 'Upload Photos (3 Required)',
    hintUpload: '1 main damage photo + 2 surrounding photos',
    labelFoto1: 'Main Damage Photo',
    labelFoto2: 'Surrounding Photo 1',
    labelFoto3: 'Surrounding Photo 2',
    uploadChoose: 'Choose Photo',
    btnSubmit: 'Submit Report',
    notifSukses: '✓ Report sent successfully! Thank you.',
    dashboardHeading: 'Facility Officer Dashboard',
    btnRefresh: 'Refresh',
    btnClearCompleted: 'Clear',
    clearing: 'Clearing...',
    confirmClearCompleted: 'Are you sure you want to delete all completed reports?',
    clearCompletedSuccess: 'Completed reports were cleared ({count} item(s)).',
    clearCompletedError: 'Failed to clear completed reports.',
    thNama: 'Reporter Name',
    thLokasi: 'Location',
    thDeskripsi: 'Description',
    thSeverity: 'Severity',
    thStatus: 'Status',
    thAksi: 'Action',
    loadingData: 'Loading data...',
    noReports: 'No reports yet.',
    failedLoad: 'Failed to load data.',
    alertNoPhotos: 'You must upload exactly 3 photos!',
    alertSendError: 'Failed to send report',
    alertStatusError: 'Failed to update status',
    sending: 'Sending...',
    fileTooLarge: 'File too large. Maximum 10 MB.',
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    severityMinor: 'Minor',
    severityMedium: 'Medium',
    severityCritical: 'Critical',
    actionWorking: 'Start',
    actionComplete: 'Complete',
    viewPhotos: 'View Photos',
    closeLabel: 'Close'
  }
};

function getBrowserLanguage() {
  const navLang = navigator.language || navigator.userLanguage || 'id';
  return navLang.toLowerCase().startsWith('en') ? 'en' : 'id';
}

let currentLang = localStorage.getItem('lang') || getBrowserLanguage();

function translatePage() {
  i18nElements.forEach(el => {
    const key = el.dataset.i18n;
    if (key && translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  placeholderElements.forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key && translations[currentLang] && translations[currentLang][key]) {
      el.placeholder = translations[currentLang][key];
    }
  });

  const optionElements = document.querySelectorAll('option[data-i18n]');
  optionElements.forEach(option => {
    const key = option.dataset.i18n;
    if (key && translations[currentLang] && translations[currentLang][key]) {
      option.textContent = translations[currentLang][key];
    }
  });

  document.documentElement.lang = currentLang;
  languageSelect.value = currentLang;
}

languageSelect.addEventListener('change', () => {
  currentLang = languageSelect.value;
  localStorage.setItem('lang', currentLang);
  translatePage();
});

translatePage();

// --- Floating language toggle elements ---
const langToggle = document.getElementById('langToggle');
const langButton = document.getElementById('langButton');
const langMenu = document.getElementById('langMenu');
const langShort = document.getElementById('langShort');

function updateLangShort() {
  langShort.textContent = currentLang.toUpperCase();
}

function toggleLangMenu(show) {
  if (!langMenu) return;
  if (show === undefined) show = langMenu.classList.contains('hidden');
  if (show) langMenu.classList.remove('hidden'); else langMenu.classList.add('hidden');
}

// Click the floating button to toggle menu
if (langButton) {
  langButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLangMenu();
  });
}

// Click language options
document.addEventListener('click', (e) => {
  if (!e.target.closest) return;
  const opt = e.target.closest('.lang-option');
  if (opt) {
    const chosen = opt.dataset.lang;
    if (chosen && translations[chosen]) {
      currentLang = chosen;
      localStorage.setItem('lang', currentLang);
      languageSelect.value = currentLang;
      translatePage();
      updateLangShort();
    }
    toggleLangMenu(false);
    return;
  }

  // close menu when clicking outside
  if (!e.target.closest('#langToggle')) {
    toggleLangMenu(false);
  }
});

// Keep select in sync (accessibility fallback)
languageSelect.addEventListener('change', () => {
  currentLang = languageSelect.value;
  localStorage.setItem('lang', currentLang);
  translatePage();
  updateLangShort();
});

updateLangShort();

const foto1 = document.getElementById('foto1');
const foto2 = document.getElementById('foto2');
const foto3 = document.getElementById('foto3');
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const preview3 = document.getElementById('preview3');

function setupPreview(input, preview) {
  input.addEventListener('change', () => {
    const file = input.files[0];
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file) {
      if (file.size > maxBytes) {
        alert(translations[currentLang].fileTooLarge);
        input.value = '';
        preview.classList.add('hidden');
        return;
      }
      preview.src = URL.createObjectURL(file);
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }
  });
}

setupPreview(foto1, preview1);
setupPreview(foto2, preview2);
setupPreview(foto3, preview3);

function showForm() {
  tabForm.classList.remove('hidden');
  tabDashboard.classList.add('hidden');
  btnTabForm.classList.add('active');
  btnTabDashboard.classList.remove('active');
}

function showDashboard() {
  tabForm.classList.add('hidden');
  tabDashboard.classList.remove('hidden');
  btnTabForm.classList.remove('active');
  btnTabDashboard.classList.add('active');
  loadLaporan();
}

btnTabForm.addEventListener('click', showForm);
btnTabDashboard.addEventListener('click', showDashboard);

formLapor.addEventListener('submit', async (e) => {
  e.preventDefault();

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (!foto1.files[0] || !foto2.files[0] || !foto3.files[0]) {
    alert(translations[currentLang].alertNoPhotos);
    return;
  }

  if (foto1.files[0].size > maxBytes || foto2.files[0].size > maxBytes || foto3.files[0].size > maxBytes) {
    alert(translations[currentLang].fileTooLarge);
    return;
  }

  const formData = new FormData();
  formData.append('nama', document.getElementById('nama').value.trim());
  formData.append('kelas', document.getElementById('kelas').value.trim());
  formData.append('lokasi', document.getElementById('lokasi').value);
  formData.append('deskripsi', document.getElementById('deskripsi').value.trim());
  formData.append('tingkat', document.getElementById('tingkat').value);
  formData.append('foto1', foto1.files[0]);
  formData.append('foto2', foto2.files[0]);
  formData.append('foto3', foto3.files[0]);

  btnSubmit.disabled = true;
  btnSubmit.textContent = translations[currentLang].sending;

  try {
    const res = await fetch('/api/laporan', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || translations[currentLang].alertSendError);
    }

    notifSukses.classList.remove('hidden');
    formLapor.reset();
    preview1.classList.add('hidden');
    preview2.classList.add('hidden');
    preview3.classList.add('hidden');

    setTimeout(() => {
      notifSukses.classList.add('hidden');
    }, 4000);
  } catch (err) {
    alert(err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = translations[currentLang].btnSubmit;
  }
});

function buildUploadUrl(filename) {
  if (!filename) return '';
  return `${window.location.origin}/uploads/${encodeURIComponent(filename)}`;
}

async function loadLaporan() {
  tabelLaporan.innerHTML = `<tr><td colspan="5" class="loading">${translations[currentLang].loadingData}</td></tr>`;

  try {
    const res = await fetch('/api/laporan');
    const data = await res.json();

    if (data.length === 0) {
      tabelLaporan.innerHTML = `<tr><td colspan="6" class="loading">${translations[currentLang].noReports}</td></tr>`;
      return;
    }

    let html = '';
    data.forEach(item => {
      const deskripsiSingkat = item.deskripsi.length > 50
        ? item.deskripsi.substring(0, 50) + '...'
        : item.deskripsi;

      let statusClass = 'status-menunggu';
      if (item.status === 'Dikerjakan') statusClass = 'status-dikerjakan';
      if (item.status === 'Selesai') statusClass = 'status-selesai';

      const severityValue = item.tingkat || 'Medium';
      let severityClass = 'severity-medium';
      if (severityValue === 'Minor') severityClass = 'severity-minor';
      if (severityValue === 'Critical') severityClass = 'severity-critical';

      let severityText = severityValue;
      if (severityValue === 'Minor') severityText = translations[currentLang].severityMinor;
      if (severityValue === 'Medium') severityText = translations[currentLang].severityMedium;
      if (severityValue === 'Critical') severityText = translations[currentLang].severityCritical;

      let statusText = item.status;
      if (item.status === 'Menunggu') statusText = translations[currentLang].statusPending;
      if (item.status === 'Dikerjakan') statusText = translations[currentLang].statusInProgress;
      if (item.status === 'Selesai') statusText = translations[currentLang].statusCompleted;

      let aksi = '';
      if (item.status === 'Menunggu') {
        aksi = `<button type="button" class="btn btn-sm btn-blue btn-change-status" data-id="${item.id}" data-status="Dikerjakan">${translations[currentLang].actionWorking}</button>`;
      } else if (item.status === 'Dikerjakan') {
        aksi = `<button type="button" class="btn btn-sm btn-green btn-change-status" data-id="${item.id}" data-status="Selesai">${translations[currentLang].actionComplete}</button>`;
      } else {
        aksi = `<span style="color:#9ca3af;font-size:0.8rem;">${translations[currentLang].statusCompleted}</span>`;
      }

      aksi += ` <button type="button" class="btn btn-sm btn-outline btn-view-photos" data-foto1="${item.foto1}" data-foto2="${item.foto2}" data-foto3="${item.foto3}">${translations[currentLang].viewPhotos}</button>`;

      html += `
        <tr>
          <td>
            <strong>${item.nama}</strong>
            <div class="sub-text">${item.kelas}</div>
          </td>
          <td>${item.lokasi}</td>
          <td>${deskripsiSingkat}</td>
          <td><span class="severity ${severityClass}">${severityText}</span></td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
          <td style="white-space: nowrap;">${aksi}</td>
        </tr>
      `;
    });

    tabelLaporan.innerHTML = html;

    document.querySelectorAll('.btn-view-photos').forEach(button => {
      button.addEventListener('click', () => {
        lihatFoto(button.dataset.foto1, button.dataset.foto2, button.dataset.foto3);
      });
    });

    document.querySelectorAll('.btn-change-status').forEach(button => {
      button.addEventListener('click', () => {
        ubahStatus(button.dataset.id, button.dataset.status);
      });
    });
  } catch (err) {
    tabelLaporan.innerHTML = `<tr><td colspan="6" class="loading">${translations[currentLang].failedLoad}</td></tr>`;
  }
}

async function ubahStatus(id, status) {
  try {
    const res = await fetch(`/api/laporan/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(translations[currentLang].alertStatusError);
    loadLaporan();
  } catch (err) {
    alert(err.message);
  }
}

btnRefresh.addEventListener('click', loadLaporan);

btnClearCompleted.addEventListener('click', async () => {
  const shouldClear = confirm(translations[currentLang].confirmClearCompleted);
  if (!shouldClear) return;

  btnClearCompleted.disabled = true;
  btnClearCompleted.textContent = translations[currentLang].clearing;

  try {
    const res = await fetch('/api/laporan/clear-completed', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || translations[currentLang].clearCompletedError);

    loadLaporan();
    alert(translations[currentLang].clearCompletedSuccess.replace('{count}', data.deleted));
  } catch (err) {
    alert(err.message);
  } finally {
    btnClearCompleted.disabled = false;
    btnClearCompleted.textContent = translations[currentLang].btnClearCompleted;
  }
});

function lihatFoto(foto1, foto2, foto3) {
  const modal = document.createElement('div');
  modal.id = 'modalFoto';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85); display: flex; justify-content: center;
    align-items: center; z-index: 9999; flex-direction: column; gap: 20px;
  `;

  modal.innerHTML = `
    <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; max-width: 90%;">
      <img src="${buildUploadUrl(foto1)}" style="max-width: 280px; max-height: 320px; border-radius: 8px; object-fit: cover; background: #222;">
      <img src="${buildUploadUrl(foto2)}" style="max-width: 280px; max-height: 320px; border-radius: 8px; object-fit: cover; background: #222;">
      <img src="${buildUploadUrl(foto3)}" style="max-width: 280px; max-height: 320px; border-radius: 8px; object-fit: cover; background: #222;">
    </div>
    <button type="button" onclick="document.getElementById('modalFoto').remove()" 
      style="padding: 10px 28px; background: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px;">
      ${translations[currentLang].closeLabel}
    </button>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}
