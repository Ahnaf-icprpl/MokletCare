from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import sqlite3
import os
import threading
import time
from datetime import datetime, timedelta

app = Flask(__name__)

# Konfigurasi
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # max 10MB

# Buat folder upload jika belum ada
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==================== DATABASE ====================
def get_db():
    conn = sqlite3.connect('sarpras.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS laporan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            kelas TEXT NOT NULL,
            lokasi TEXT NOT NULL,
            deskripsi TEXT NOT NULL,
            status TEXT DEFAULT 'Menunggu',
            tingkat TEXT DEFAULT 'Medium',
            waktu_lapor TEXT,
            waktu_selesai TEXT,
            foto1 TEXT,
            foto2 TEXT,
            foto3 TEXT
        )
    ''')

    columns = [row[1] for row in conn.execute('PRAGMA table_info(laporan)')]
    if 'tingkat' not in columns:
        conn.execute("ALTER TABLE laporan ADD COLUMN tingkat TEXT DEFAULT 'Medium'")

    conn.commit()
    conn.close()

init_db()


def cleanup_completed_laporan(force=False, older_than_hours=24):
    conn = get_db()
    rows = conn.execute('''
        SELECT id, foto1, foto2, foto3, waktu_selesai
        FROM laporan
        WHERE status = 'Selesai'
    ''').fetchall()

    deleted_count = 0
    cutoff = datetime.now() - timedelta(hours=older_than_hours)

    for row in rows:
        try:
            selesai_time = datetime.strptime(row['waktu_selesai'], '%Y-%m-%d %H:%M:%S')
        except (TypeError, ValueError):
            selesai_time = None

        should_delete = force or (selesai_time is not None and selesai_time <= cutoff)
        if not should_delete:
            continue

        for foto in [row['foto1'], row['foto2'], row['foto3']]:
            if foto:
                foto_path = os.path.join(app.config['UPLOAD_FOLDER'], foto)
                if os.path.exists(foto_path):
                    os.remove(foto_path)

        conn.execute('DELETE FROM laporan WHERE id = ?', (row['id'],))
        deleted_count += 1

    conn.commit()
    conn.close()
    return deleted_count


def start_cleanup_scheduler():
    def runner():
        while True:
            cleanup_completed_laporan()
            time.sleep(60 * 60)

    threading.Thread(target=runner, daemon=True).start()


cleanup_completed_laporan()
start_cleanup_scheduler()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== ROUTES ====================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Ambil semua laporan (untuk dashboard)
@app.route('/api/laporan', methods=['GET'])
def get_laporan():
    cleanup_completed_laporan()
    conn = get_db()
    rows = conn.execute('SELECT * FROM laporan ORDER BY id DESC').fetchall()
    conn.close()

    data = []
    for row in rows:
        data.append({
            'id': row['id'],
            'nama': row['nama'],
            'kelas': row['kelas'],
            'lokasi': row['lokasi'],
            'deskripsi': row['deskripsi'],
            'status': row['status'],
            'tingkat': row['tingkat'] or 'Medium',
            'waktu_lapor': row['waktu_lapor'],
            'waktu_selesai': row['waktu_selesai'],
            'foto1': row['foto1'],
            'foto2': row['foto2'],
            'foto3': row['foto3']
        })
    return jsonify(data)

# Tambah laporan baru
@app.route('/api/laporan', methods=['POST'])
def tambah_laporan():
    nama = request.form.get('nama', '').strip()
    kelas = request.form.get('kelas', '').strip()
    lokasi = request.form.get('lokasi', '').strip()
    deskripsi = request.form.get('deskripsi', '').strip()
    tingkat = request.form.get('tingkat', 'Medium').strip()

    if tingkat not in ['Minor', 'Medium', 'Critical']:
        return jsonify({'error': 'Tingkat masalah tidak valid'}), 400

    # Validasi input teks
    if not all([nama, kelas, lokasi, deskripsi]):
        return jsonify({'error': 'Semua field wajib diisi'}), 400

    # Validasi 3 foto
    foto_files = []
    for i in range(1, 4):
        file = request.files.get(f'foto{i}')
        if not file or file.filename == '':
            return jsonify({'error': 'Wajib upload tepat 3 foto'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'Format foto tidak didukung'}), 400
        foto_files.append(file)

    # Simpan foto
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    foto_names = []
    for idx, file in enumerate(foto_files, 1):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f"{timestamp}_{idx}.{ext}")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        foto_names.append(filename)

    # Simpan ke database
    waktu_sekarang = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db()
    conn.execute('''
        INSERT INTO laporan (nama, kelas, lokasi, deskripsi, status, tingkat, waktu_lapor, foto1, foto2, foto3)
        VALUES (?, ?, ?, ?, 'Menunggu', ?, ?, ?, ?, ?)
    ''', (nama, kelas, lokasi, deskripsi, tingkat, waktu_sekarang, foto_names[0], foto_names[1], foto_names[2]))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Laporan berhasil dikirim'}), 201

# Update status laporan
@app.route('/api/laporan/<int:id>/status', methods=['PUT'])
def update_status(id):
    data = request.get_json()
    status_baru = data.get('status')

    if status_baru not in ['Dikerjakan', 'Selesai']:
        return jsonify({'error': 'Status tidak valid'}), 400

    conn = get_db()
    if status_baru == 'Selesai':
        waktu_selesai = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn.execute('UPDATE laporan SET status = ?, waktu_selesai = ? WHERE id = ?',
                     (status_baru, waktu_selesai, id))
    else:
        conn.execute('UPDATE laporan SET status = ?, waktu_selesai = ? WHERE id = ?', (status_baru, None, id))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Status berhasil diubah'})


@app.route('/api/laporan/clear-completed', methods=['POST'])
def clear_completed():
    deleted_count = cleanup_completed_laporan(force=True)
    return jsonify({'message': 'Laporan selesai berhasil dibersihkan', 'deleted': deleted_count})

# ==================== JALANKAN ====================
if __name__ == '__main__':
    app.run(debug=True, port=5000)