'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchJSON } from '../_components/api';
import { Modal } from '../_components/Modal';
import { Toast } from '../_components/Toast';
import { DictionaryAddModal } from '../_components/DictionaryAddModal';
import { toCsv } from '../../lib/csv';
import Papa from 'papaparse';

const templateHeaders = [
  'network',
  'address',
  'entity_uid',
  'incident_type',
  'incident_date',
  'source',
  'wallet_role',
  'added_at',
  'analyst',
  'tx_hashes',
];

type FileItem = { id: number; month: string; file_name: string; created_at: string };

type Dicts = {
  networks: Array<{ code: string; title: string }>;
  incidentTypes: Array<{ code: string; title: string }>;
  entities: Array<{ entity_uid: string; entity_name: string }>;
  entityTypes: Array<{ code: string; title: string }>;
};

type Row = {
  id?: number;
  file_id: number;
  network_code: string;
  address: string;
  entity_uid?: string | null;
  incident_type_code: string;
  incident_date: string;
  source: string;
  wallet_role?: string | null;
  analyst?: string | null;
  added_at?: string;
  tx_hashes?: string | null;
};

type ImportPreview = {
  rows: Record<string, string>[];
  ok: number;
  errors: Array<{ row: number; error: string }>;
  unknownUids: string[];
};

export default function IncidentsPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [month, setMonth] = useState('');

  async function load() {
    const data = await fetchJSON<FileItem[]>('/api/incidents/files');
    setFiles(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createFile() {
    if (!fileName.trim() || !month.trim()) return;
    await fetchJSON('/api/incidents/files', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName.trim(), month: month.trim() }),
    });
    setOpen(false);
    setFileName('');
    setMonth('');
    load();
  }

  return (
    <div>
      <div className="section">
        <h1 className="section-title">Incidents</h1>
        <div className="btn-row">
          <button onClick={() => setOpen(true)}>Add file</button>
        </div>
      </div>
      <div className="section">
        <div className="card-grid">
          {files.map((f) => (
            <Link className="card" key={f.id} href={`/incidents/${f.id}`}>
              <h3>{f.file_name}</h3>
              <p>{f.month}</p>
            </Link>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Incidents File">
        <div className="form-grid">
          <div>
            <label>File name</label>
            <input className="input" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div>
            <label>Month (YYYY-MM)</label>
            <input className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={createFile}>Create</button>
          <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

export function IncidentsFileClient({ fileId }: { fileId: number }) {
  const [file, setFile] = useState<FileItem | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [dicts, setDicts] = useState<Dicts | null>(null);
  const [edit, setEdit] = useState<Row | null>(null);
  const [toast, setToast] = useState('');
  const [unknownUid, setUnknownUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterNetwork, setFilterNetwork] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewCsv, setPreviewCsv] = useState('');
  const [dictModal, setDictModal] = useState<null | 'incident_types'>(null);
  const [unknownActions, setUnknownActions] = useState<Record<string, { action: 'create' | 'unknown' | 'skip'; entity_type_code?: string }>>({});
  const [applyAll, setApplyAll] = useState<'create' | 'unknown' | 'skip'>('skip');

  async function load() {
    const data = await fetchJSON<{ file: FileItem; rows: Row[] }>(`/api/incidents?fileId=${fileId}`);
    const d = await fetchJSON<Dicts>('/api/dictionaries?include=entities');
    setFile(data.file);
    setRows(data.rows);
    setDicts(d);
  }

  useEffect(() => {
    load();
  }, [fileId]);

  async function saveRow() {
    if (!edit) return;
    if (edit.entity_uid) {
      const exists = await fetchJSON<{ exists: boolean }>(`/api/entities/exists?uid=${encodeURIComponent(edit.entity_uid)}`);
      if (!exists.exists) {
        setUnknownUid(edit.entity_uid);
        return;
      }
    }
    const method = edit.id ? 'PATCH' : 'POST';
    const url = edit.id ? `/api/incidents/${edit.id}` : '/api/incidents';
    await fetchJSON(url, { method, body: JSON.stringify(edit) });
    setEdit(null);
    setToast('Saved');
    load();
  }

  async function deleteRow(id?: number) {
    if (!id) return;
    if (!confirm(`Delete incident #${id}?`)) return;
    await fetchJSON(`/api/incidents/${id}`, { method: 'DELETE' });
    if (edit?.id === id) setEdit(null);
    setToast('Deleted');
    load();
  }

  async function handleUnknown(action: 'create' | 'unknown' | 'fix', type?: string) {
    if (!unknownUid || !edit) return;
    if (action === 'create') {
      await fetchJSON('/api/entities', {
        method: 'POST',
        body: JSON.stringify({
          file_id: null,
          entity_uid: unknownUid,
          entity_name: unknownUid,
          entity_type_code: type || 'organization',
        }),
      });
    }
    if (action === 'unknown') {
      edit.entity_uid = 'UNKNOWN';
    }
    if (action === 'fix') {
      setUnknownUid(null);
      return;
    }
    setUnknownUid(null);
    await fetchJSON(edit.id ? `/api/incidents/${edit.id}` : '/api/incidents', {
      method: edit.id ? 'PATCH' : 'POST',
      body: JSON.stringify(edit),
    });
    setEdit(null);
    load();
  }

  async function exportCsv() {
    const csv = toCsv(
      rows.map((r) => ({
        network: r.network_code,
        address: r.address,
        entity_uid: r.entity_uid ?? '',
        incident_type: r.incident_type_code,
        incident_date: r.incident_date.slice(0, 10),
        source: r.source,
        wallet_role: r.wallet_role ?? '',
        added_at: r.added_at ?? '',
        analyst: r.analyst ?? '',
        tx_hashes: r.tx_hashes ?? '',
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${file?.file_name || 'incidents'}.csv`;
    a.click();
  }

  async function downloadTemplate() {
    const blob = new Blob([templateHeaders.join(',')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'incidents_template.csv';
    a.click();
  }

  async function handleImportPreview(files: FileList | null) {
    if (!files || !files[0]) return;
    const text = await files[0].text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const rowsPreview = (parsed.data as Record<string, string>[]).slice(0, 20);
    const res = await fetchJSON<{ ok: number; errors: Array<{ row: number; error: string }>; unknownUids: string[] }>(
      '/api/import',
      { method: 'POST', body: JSON.stringify({ type: 'incidents', file_id: fileId, csv: text, dry_run: true }) }
    );
    setPreview({ rows: rowsPreview, ok: res.ok, errors: res.errors, unknownUids: res.unknownUids });
    setPreviewCsv(text);
    if (res.unknownUids.length) {
      const initial: Record<string, { action: 'create' | 'unknown' | 'skip'; entity_type_code?: string }> = {};
      for (const uid of res.unknownUids) {
        initial[uid] = { action: 'skip' };
      }
      setUnknownActions(initial);
      setApplyAll('skip');
    } else {
      setUnknownActions({});
    }
  }

  async function confirmImport() {
    if (!previewCsv) return;
    const res = await fetchJSON<{ ok: number; errors: Array<{ row: number; error: string }>; unknownUids: string[]; skipped?: number }>(
      '/api/import',
      { method: 'POST', body: JSON.stringify({ type: 'incidents', file_id: fileId, csv: previewCsv, unknown_actions: unknownActions }) }
    );
    if (res.errors.length) {
      const errCsv = toCsv(res.errors.map((e) => ({ row: e.row, error: e.error })));
      const blob = new Blob([errCsv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'incidents_import_errors.csv';
      a.click();
    }
    setPreview(null);
    setPreviewCsv('');
    const skipped = res.skipped ? `, skipped: ${res.skipped}` : '';
    setToast(`Imported: ${res.ok}, errors: ${res.errors.length}${skipped}`);
    load();
  }

  if (!dicts || !file) return <div>Loading...</div>;

  const filtered = rows.filter((r) => {
    const hay = `${r.address} ${r.entity_uid ?? ''} ${r.source}`.toLowerCase();
    if (search && !hay.includes(search.toLowerCase())) return false;
    if (filterNetwork && r.network_code !== filterNetwork) return false;
    if (filterType && r.incident_type_code !== filterType) return false;
    if (filterSource && (r.source || '') !== filterSource) return false;
    if (filterFrom) {
      const d = r.incident_date ? new Date(r.incident_date) : null;
      if (!d || d < new Date(filterFrom)) return false;
    }
    if (filterTo) {
      const d = r.incident_date ? new Date(r.incident_date) : null;
      if (!d || d > new Date(filterTo)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="section">
        <h1 className="section-title">{file.file_name}</h1>
        <div className="btn-row">
          <button onClick={() => setEdit({ file_id: fileId, network_code: dicts.networks[0]?.code || 'EVM', address: '', incident_type_code: dicts.incidentTypes[0]?.code || 'scam', incident_date: new Date().toISOString().slice(0, 10), source: 'manual' })}>
            Add incident
          </button>
          <button className="secondary" onClick={exportCsv}>
            Export CSV
          </button>
          <label className="button secondary">
            Import CSV
            <input type="file" accept=".csv" hidden onChange={(e) => handleImportPreview(e.target.files)} />
          </label>
          <button className="ghost" onClick={downloadTemplate}>
            Download template CSV
          </button>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <div>
            <label>Search</label>
            <input className="input" placeholder="address / entity / source" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label>Network</label>
            <select value={filterNetwork} onChange={(e) => setFilterNetwork(e.target.value)}>
              <option value="">All</option>
              {dicts.networks.map((n) => (<option key={n.code} value={n.code}>{n.title}</option>))}
            </select>
          </div>
          <div>
            <label>Incident type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All</option>
              {dicts.incidentTypes.map((t) => (<option key={t.code} value={t.code}>{t.title}</option>))}
            </select>
          </div>
          <div>
            <label>Source</label>
            <input className="input" value={filterSource} onChange={(e) => setFilterSource(e.target.value)} placeholder="manual" />
          </div>
          <div>
            <label>From</label>
            <input className="input" type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div>
            <label>To</label>
            <input className="input" type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="section table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>network</th>
              <th>address</th>
              <th>entity_uid</th>
              <th>incident_type</th>
              <th>incident_date</th>
              <th>source</th>
              <th>wallet_role</th>
              <th>added_at</th>
              <th>analyst</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.network_code}</td>
                <td>{r.address}</td>
                <td>{r.entity_uid ?? ''}</td>
                <td>{r.incident_type_code}</td>
                <td>{r.incident_date ? r.incident_date.slice(0, 10) : ''}</td>
                <td>{r.source}</td>
                <td>{r.wallet_role ?? ''}</td>
                <td>{r.added_at ? new Date(r.added_at).toISOString().slice(0, 10) : ''}</td>
                <td>{r.analyst ?? ''}</td>
                <td>
                  <button className="secondary" onClick={() => setEdit(r)}>
                    Edit
                  </button>
                  <button className="ghost" onClick={() => deleteRow(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Incident">
        {edit ? (
          <div>
            <div className="form-grid">
              <div>
                <label>network</label>
                <select value={edit.network_code} onChange={(e) => setEdit({ ...edit, network_code: e.target.value })}>
                  {dicts.networks.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>address</label>
                <input className="input" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
              </div>
              <div>
                <label>entity_uid</label>
                <input className="input" value={edit.entity_uid ?? ''} onChange={(e) => setEdit({ ...edit, entity_uid: e.target.value || null })} />
              </div>
              <div>
                <label>incident_type</label>
                <select value={edit.incident_type_code} onChange={(e) => setEdit({ ...edit, incident_type_code: e.target.value })}>
                  {dicts.incidentTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <button className="ghost" style={{ marginTop: 6 }} onClick={() => setDictModal('incident_types')}>Add new incident type</button>
              </div>
              <div>
                <label>incident_date</label>
                <input className="input" type="date" value={edit.incident_date ? edit.incident_date.slice(0, 10) : ''} onChange={(e) => setEdit({ ...edit, incident_date: e.target.value })} />
              </div>
              <div>
                <label>source</label>
                <input className="input" value={edit.source} onChange={(e) => setEdit({ ...edit, source: e.target.value })} />
              </div>
              <div>
                <label>wallet_role</label>
                <input className="input" value={edit.wallet_role ?? ''} onChange={(e) => setEdit({ ...edit, wallet_role: e.target.value || null })} />
              </div>
              <div>
                <label>analyst</label>
                <input className="input" value={edit.analyst ?? ''} onChange={(e) => setEdit({ ...edit, analyst: e.target.value || null })} />
              </div>
              <div>
                <label>tx_hashes</label>
                <textarea className="input" value={edit.tx_hashes ?? ''} onChange={(e) => setEdit({ ...edit, tx_hashes: e.target.value || null })} />
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button onClick={saveRow}>Save</button>
              <button className="secondary" onClick={() => setEdit(null)}>Cancel</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!unknownUid} onClose={() => setUnknownUid(null)} title="Unknown entity_uid">
        <p className="notice">Entity with UID "{unknownUid}" not found. Choose an action:</p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={() => handleUnknown('create', 'organization')}>Create placeholder (organization)</button>
          <button className="secondary" onClick={() => handleUnknown('create', 'individual')}>Create placeholder (individual)</button>
          <button className="secondary" onClick={() => handleUnknown('create', 'address')}>Create placeholder (address)</button>
          <button className="ghost" onClick={() => handleUnknown('unknown')}>Set entity_uid = UNKNOWN</button>
          <button className="secondary" onClick={() => handleUnknown('fix')}>Fix manually</button>
        </div>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="CSV Import Preview">
        {preview ? (
          <div>
            <p>Valid rows: {preview.ok}. Errors: {preview.errors.length}.</p>
            {preview.unknownUids.length ? (
              <div className="notice">Unknown entity_uid: {preview.unknownUids.join(', ')}</div>
            ) : null}
            {preview.unknownUids.length ? (
              <div style={{ marginTop: 12 }}>
                <label>Unknown entity_uid actions</label>
                <div className="form-grid">
                  <div>
                    <label>Apply to all</label>
                    <select
                      value={applyAll}
                      onChange={(e) => {
                        const action = e.target.value as 'create' | 'unknown' | 'skip';
                        setApplyAll(action);
                        const next: Record<string, { action: 'create' | 'unknown' | 'skip'; entity_type_code?: string }> = {};
                        for (const uid of preview.unknownUids) {
                          next[uid] = { action, entity_type_code: action === 'create' ? 'organization' : undefined };
                        }
                        setUnknownActions(next);
                      }}
                    >
                      <option value="skip">Fix manually (skip rows)</option>
                      <option value="unknown">Set entity_uid = UNKNOWN</option>
                      <option value="create">Create placeholder (organization)</option>
                    </select>
                  </div>
                </div>
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>entity_uid</th>
                        <th>action</th>
                        <th>type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.unknownUids.map((uid) => (
                        <tr key={uid}>
                          <td>{uid}</td>
                          <td>
                            <select
                              value={unknownActions[uid]?.action || 'skip'}
                              onChange={(e) => {
                                const action = e.target.value as 'create' | 'unknown' | 'skip';
                                setUnknownActions({
                                  ...unknownActions,
                                  [uid]: { action, entity_type_code: action === 'create' ? (unknownActions[uid]?.entity_type_code || 'organization') : undefined },
                                });
                              }}
                            >
                              <option value="skip">Fix manually (skip)</option>
                              <option value="unknown">Set UNKNOWN</option>
                              <option value="create">Create placeholder</option>
                            </select>
                          </td>
                          <td>
                            <select
                              disabled={(unknownActions[uid]?.action || 'skip') !== 'create'}
                              value={unknownActions[uid]?.entity_type_code || 'organization'}
                              onChange={(e) => {
                                setUnknownActions({
                                  ...unknownActions,
                                  [uid]: { action: 'create', entity_type_code: e.target.value },
                                });
                              }}
                            >
                              {dicts.entityTypes.map((t) => (
                                <option key={t.code} value={t.code}>{t.title}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    {Object.keys(preview.rows[0] || {}).map((h) => (<th key={h}>{h}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, idx) => (
                    <tr key={idx}>
                      {Object.values(r).map((v, i) => (<td key={i}>{v}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button onClick={confirmImport}>Import</button>
              <button className="secondary" onClick={() => setPreview(null)}>Cancel</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <DictionaryAddModal
        open={!!dictModal}
        list={dictModal ?? 'incident_types'}
        onClose={() => setDictModal(null)}
        onAdded={() => load()}
      />

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}
