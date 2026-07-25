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

// Preview foto
const foto1 = document.getElementById('foto1');
const foto2 = document.getElementById('foto2');
const foto3 = document.getElementById('foto3');
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const preview3 = document.getElementById('preview3');

// ==================== NAVIGASI TAB ====================
btnTabForm.addEventListener('click', () => {
  tabForm.classList.remove('hidden');
  tabDashboard.classList.add('hidden');
  btnTabForm.classList.add('active');
  btnTabDashboard.classList.remove('active');
});

btnTabDashboard.addEventListener('click', () => {
  tabForm.classList.add('hidden');
  tabDashboard.classList.remove('hidden');
  btnTabDashboard.classList.add('active');
  btnTabForm.classList.remove('active');
  loadLaporan(); // muat data saat buka dashboard
});

// ==================== PREVIEW FOTO ====================
function setupPreview(input, preview) {
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) {
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

// ==================== SUBMIT FORM ====================
formLapor.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validasi 3 foto
  if (!foto1.files[0] || !foto2.files[0] || !foto3.files[0]) {
    alert('Anda wajib mengupload tepat 3 foto!');
    return;
  }

  const formData = new FormData();
  formData.append('nama', document.getElementById('nama').value.trim());
  formData.append('kelas', document.getElementById('kelas').value.trim());
  formData.append('lokasi', document.getElementById('lokasi').value);
  formData.append('deskripsi', document.getElementById('deskripsi').value.trim());
  formData.append('foto1', foto1.files[0]);
  formData.append('foto2', foto2.files[0]);
  formData.append('foto3', foto3.files[0]);

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Mengirim...';

  try {
    const res = await fetch('/api/laporan', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Gagal mengirim laporan');
    }

    // Sukses
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
    btnSubmit.textContent = 'Laporkan';
  }
});

// ==================== LOAD LAPORAN (DASHBOARD) ====================
async function loadLaporan() {
  tabelLaporan.innerHTML = '<tr><td colspan="5" class="loading">Memuat data...</td></tr>';

  try {
    const res = await fetch('/api/laporan');
    const data = await res.json();

    if (data.length === 0) {
      tabelLaporan.innerHTML = '<tr><td colspan="5" class="loading">Belum ada laporan.</td></tr>';
      return;
    }

    let html = '';
    data.forEach(item => {
      const deskripsiSingkat = item.deskripsi.length > 55
        ? item.deskripsi.substring(0, 55) + '...'
        : item.deskripsi;

      let statusClass = 'status-menunggu';
      if (item.status === 'Dikerjakan') statusClass = 'status-dikerjakan';
      if (item.status === 'Selesai') statusClass = 'status-selesai';

      let aksi = '';
      if (item.status === 'Menunggu') {
        aksi = `<button class="btn btn-sm btn-blue" onclick="ubahStatus(${item.id}, 'Dikerjakan')">Kerjakan</button>`;
      } else if (item.status === 'Dikerjakan') {
        aksi = `<button class="btn btn-sm btn-green" onclick="ubahStatus(${item.id}, 'Selesai')">Selesai</button>`;
      } else {
        aksi = `<span style="color:#9ca3af;font-size:0.8rem;">Selesai</span>`;
      }

      html += `
        <tr>
          <td>
            <strong>${item.nama}</strong>
            <div class="sub-text">${item.kelas}</div>
          </td>
          <td>${item.lokasi}</td>
          <td>${deskripsiSingkat}</td>
          <td><span class="status ${statusClass}">${item.status}</span></td>
          <td>${aksi}</td>
        </tr>
      `;
    });

    tabelLaporan.innerHTML = html;

  } catch (err) {
    tabelLaporan.innerHTML = '<tr><td colspan="5" class="loading">Gagal memuat data.</td></tr>';
  }
}

// ==================== UBAH STATUS ====================
async function ubahStatus(id, status) {
  try {
    const res = await fetch(`/api/laporan/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!res.ok) throw new Error('Gagal mengubah status');

    loadLaporan(); // refresh tabel
  } catch (err) {
    alert(err.message);
  }
}

// Tombol refresh
btnRefresh.addEventListener('click', loadLaporan);