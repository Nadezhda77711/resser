'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchJSON } from '../_components/api';
import { Modal } from '../_components/Modal';
import { Toast } from '../_components/Toast';
import { EntityDetailsModal } from '../_components/EntityDetailsModal';
import { DictionaryAddModal } from '../_components/DictionaryAddModal';
import { toCsv } from '../../lib/csv';
import Papa from 'papaparse';

type EntitiesFile = { id: number; file_name: string; description?: string | null; created_at: string };

type GlobalEntity = {
  entity_uid: string;
  entity_name: string;
  entity_type_code: string;
  entity_country?: string | null;
};

type Dicts = {
  entityTypes: Array<{ code: string; title: string }>;
  flags: Array<{ code: string; title?: string | null }>;
  categories: Array<{ category_code: string; title: string }>;
  entities: Array<{ entity_uid: string; entity_name: string }>;
};

type EntityRow = {
  entity_uid: string;
  entity_name: string;
  entity_type_code: string;
  parent_entity_uid?: string | null;
  entity_description?: string | null;
  entity_country?: string | null;
  added_at: string;
  comment?: string | null;
  flags?: string[];
  categories?: string[];
};

type ImportPreview = {
  rows: Record<string, string>[];
  ok: number;
  errors: Array<{ row: number; error: string }>;
};

export default function EntitiesPage() {
  const [files, setFiles] = useState<EntitiesFile[]>([]);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileDesc, setFileDesc] = useState('');
  const [toast, setToast] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState<GlobalEntity[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [detailsUid, setDetailsUid] = useState<string | null>(null);

  async function load() {
    const data = await fetchJSON<EntitiesFile[]>('/api/entities/files');
    setFiles(data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const q = globalSearch.trim();
    if (!q) {
      setGlobalResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setGlobalLoading(true);
      const res = await fetchJSON<{ items: GlobalEntity[] }>(`/api/entities/search?q=${encodeURIComponent(q)}`);
      setGlobalResults(res.items);
      setGlobalLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [globalSearch]);

  async function createFile() {
    if (!fileName.trim()) return;
    await fetchJSON('/api/entities/files', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName.trim(), description: fileDesc || null }),
    });
    setOpen(false);
    setFileName('');
    setFileDesc('');
    setToast('File created');
    load();
  }

  return (
    <div>
      <div className="section">
        <h1 className="section-title">Entities</h1>
        <div className="btn-row">
          <button onClick={() => setOpen(true)}>Add file</button>
        </div>
      </div>
      <div className="section">
        <h2>Global search</h2>
        <div className="form-grid">
          <div>
            <label>entity_uid / entity_name</label>
            <input
              className="input"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="example.org"
            />
          </div>
        </div>
        {globalLoading ? <p>Searching...</p> : null}
        {globalResults.length ? (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>entity_uid</th>
                  <th>entity_name</th>
                  <th>entity_type</th>
                  <th>country</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {globalResults.map((r) => (
                  <tr key={r.entity_uid}>
                    <td>{r.entity_uid}</td>
                    <td>{r.entity_name}</td>
                    <td>{r.entity_type_code}</td>
                    <td>{r.entity_country ?? ''}</td>
                    <td>
                      <button className="secondary" onClick={() => setDetailsUid(r.entity_uid)}>Open details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      <div className="section">
        <div className="card-grid">
          {files.map((f) => (
            <Link className="card" key={f.id} href={`/entities/${f.id}`}>
              <h3>{f.file_name}</h3>
              <p>{f.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Entities File">
        <div className="form-grid">
          <div>
            <label>File name</label>
            <input className="input" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div>
            <label>Description</label>
            <input className="input" value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={createFile}>Create</button>
          <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </Modal>
      <EntityDetailsModal uid={detailsUid} onClose={() => setDetailsUid(null)} />
      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}

export function EntitiesFileClient({ fileId }: { fileId: number }) {
  const [file, setFile] = useState<EntitiesFile | null>(null);
  const [rows, setRows] = useState<EntityRow[]>([]);
  const [dicts, setDicts] = useState<Dicts | null>(null);
  const [edit, setEdit] = useState<EntityRow | null>(null);
  const [toast, setToast] = useState('');
  const [detailsUid, setDetailsUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFlag, setFilterFlag] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewCsv, setPreviewCsv] = useState('');
  const [dictModal, setDictModal] = useState<null | 'entity_types' | 'flags' | 'entity_categories'>(null);

  const countryOptions = useMemo(
    () => ['US', 'GB', 'DE', 'FR', 'NL', 'CH', 'SG', 'HK', 'AE', 'CN', 'JP', 'KR', 'IN', 'TR', 'UA', 'RU'],
    []
  );

  async function load() {
    const data = await fetchJSON<{ file: EntitiesFile; rows: EntityRow[] }>('/api/entities?fileId=' + fileId);
    const d = await fetchJSON<Dicts>('/api/dictionaries?include=entities');
    setFile(data.file);
    setRows(data.rows);
    setDicts(d);
  }

  useEffect(() => {
    load();
  }, [fileId]);

  const templateCsv = useMemo(() => {
    const headers = [
      'entity_uid',
      'entity_name',
      'entity_type',
      'parent_entity',
      'entity_description',
      'entity_country',
      'flags',
      'categories',
      'comment',
    ];
    return headers.join(',');
  }, []);

  async function saveRow() {
    if (!edit) return;
    const payload = { ...edit, file_id: fileId };
    const method = rows.find((r) => r.entity_uid === edit.entity_uid) ? 'PATCH' : 'POST';
    const url = method === 'PATCH' ? `/api/entities/${encodeURIComponent(edit.entity_uid)}` : '/api/entities';
    await fetchJSON(url, { method, body: JSON.stringify(payload) });
    setEdit(null);
    setToast('Saved');
    load();
  }

  async function deleteRow(uid: string) {
    if (!confirm(`Delete entity "${uid}"? This will clear references in incidents/affiliations.`)) return;
    await fetchJSON(`/api/entities/${encodeURIComponent(uid)}`, { method: 'DELETE' });
    if (edit?.entity_uid === uid) setEdit(null);
    if (detailsUid === uid) setDetailsUid(null);
    setToast('Deleted');
    load();
  }

  async function exportCsv() {
    const csv = toCsv(rows.map((r) => ({
      entity_uid: r.entity_uid,
      entity_name: r.entity_name,
      entity_type: r.entity_type_code,
      parent_entity: r.parent_entity_uid ?? '',
      entity_description: r.entity_description ?? '',
      entity_country: r.entity_country ?? '',
      flags: (r.flags ?? []).join('|'),
      categories: (r.categories ?? []).join('|'),
      comment: r.comment ?? '',
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${file?.file_name || 'entities'}.csv`;
    a.click();
  }

  async function downloadTemplate() {
    const blob = new Blob([templateCsv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'entities_template.csv';
    a.click();
  }

  async function handleImportPreview(files: FileList | null) {
    if (!files || !files[0]) return;
    const text = await files[0].text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const rowsPreview = (parsed.data as Record<string, string>[]).slice(0, 20);
    const res = await fetchJSON<{ ok: number; errors: Array<{ row: number; error: string }> }>(
      '/api/import',
      { method: 'POST', body: JSON.stringify({ type: 'entities', file_id: fileId, csv: text, dry_run: true }) }
    );
    setPreview({ rows: rowsPreview, ok: res.ok, errors: res.errors });
    setPreviewCsv(text);
  }

  async function confirmImport() {
    if (!previewCsv) return;
    const res = await fetchJSON<{ ok: number; errors: Array<{ row: number; error: string }> }>(
      '/api/import',
      { method: 'POST', body: JSON.stringify({ type: 'entities', file_id: fileId, csv: previewCsv }) }
    );
    if (res.errors.length) {
      const errCsv = toCsv(res.errors.map((e) => ({ row: e.row, error: e.error })));
      const blob = new Blob([errCsv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'entities_import_errors.csv';
      a.click();
    }
    setPreview(null);
    setPreviewCsv('');
    setToast(`Imported: ${res.ok}, errors: ${res.errors.length}`);
    load();
  }

  if (!dicts || !file) return <div>Loading...</div>;

  const filtered = rows.filter((r) => {
    const hay = `${r.entity_uid} ${r.entity_name}`.toLowerCase();
    if (search && !hay.includes(search.toLowerCase())) return false;
    if (filterType && r.entity_type_code !== filterType) return false;
    if (filterCountry && (r.entity_country || '') !== filterCountry) return false;
    if (filterFlag && !(r.flags || []).includes(filterFlag)) return false;
    if (filterCategory && !(r.categories || []).includes(filterCategory)) return false;
    return true;
  });

  return (
    <div>
      <div className="section">
        <h1 className="section-title">{file.file_name}</h1>
        <p>{file.description}</p>
        <div className="btn-row">
          <button onClick={() => setEdit({ entity_uid: '', entity_name: '', entity_type_code: dicts.entityTypes[0]?.code || '' , added_at: new Date().toISOString(), flags: [], categories: [] })}>Add entity</button>
          <button className="secondary" onClick={exportCsv}>Export CSV</button>
          <label className="button secondary">
            Import CSV
            <input type="file" accept=".csv" hidden onChange={(e) => handleImportPreview(e.target.files)} />
          </label>
          <button className="ghost" onClick={downloadTemplate}>Download template CSV</button>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <div>
            <label>Search</label>
            <input className="input" placeholder="entity_uid or entity_name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All</option>
              {dicts.entityTypes.map((t) => (<option key={t.code} value={t.code}>{t.title}</option>))}
            </select>
          </div>
          <div>
            <label>Flag</label>
            <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value)}>
              <option value="">All</option>
              {dicts.flags.map((f) => (<option key={f.code} value={f.code}>{f.code}</option>))}
            </select>
          </div>
          <div>
            <label>Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All</option>
              {dicts.categories.map((c) => (<option key={c.category_code} value={c.category_code}>{c.title}</option>))}
            </select>
          </div>
          <div>
            <label>Country</label>
            <input className="input" value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} placeholder="US" />
          </div>
        </div>
      </div>

      <div className="section table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>entity_uid</th>
              <th>entity_name</th>
              <th>entity_type</th>
              <th>parent_entity</th>
              <th>entity_description</th>
              <th>entity_country</th>
              <th>flags</th>
              <th>added_at</th>
              <th>comment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.entity_uid}>
                <td>{r.entity_uid}</td>
                <td><button className="link" onClick={() => setDetailsUid(r.entity_uid)}>{r.entity_name}</button></td>
                <td>{r.entity_type_code}</td>
                <td>{r.parent_entity_uid || ''}</td>
                <td>{r.entity_description || ''}</td>
                <td>{r.entity_country || ''}</td>
                <td>{(r.flags || []).map((f) => <span className="badge" key={f}>{f}</span>)}</td>
                <td>{new Date(r.added_at).toISOString().slice(0, 10)}</td>
                <td>{r.comment || ''}</td>
                <td>
                  <button className="secondary" onClick={() => setEdit(r)}>Edit</button>
                  <button className="ghost" onClick={() => deleteRow(r.entity_uid)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Entity">
        {edit ? (
          <div>
            <div className="form-grid">
              <div>
                <label>entity_uid</label>
                <input
                  className="input"
                  list="entity-uids"
                  value={edit.entity_uid}
                  onChange={(e) => setEdit({ ...edit, entity_uid: e.target.value })}
                />
              </div>
              <div>
                <label>entity_name</label>
                <input
                  className="input"
                  list="entity-names"
                  value={edit.entity_name}
                  onChange={(e) => setEdit({ ...edit, entity_name: e.target.value })}
                />
              </div>
              <div>
                <label>entity_type</label>
                <select value={edit.entity_type_code} onChange={(e) => setEdit({ ...edit, entity_type_code: e.target.value })}>
                  {dicts.entityTypes.map((t) => (<option key={t.code} value={t.code}>{t.title}</option>))}
                </select>
                <button className="ghost" style={{ marginTop: 6 }} onClick={() => setDictModal('entity_types')}>Add new type</button>
              </div>
              <div>
                <label>parent_entity</label>
                <select value={edit.parent_entity_uid ?? ''} onChange={(e) => setEdit({ ...edit, parent_entity_uid: e.target.value || null })}>
                  <option value="">(none)</option>
                  {dicts.entities.map((e) => (<option key={e.entity_uid} value={e.entity_uid}>{e.entity_uid}</option>))}
                </select>
              </div>
              <div>
                <label>entity_country</label>
                <input
                  className="input"
                  list="country-list"
                  value={edit.entity_country ?? ''}
                  onChange={(e) => setEdit({ ...edit, entity_country: e.target.value || null })}
                />
              </div>
              <div>
                <label>flags</label>
                <select multiple value={edit.flags ?? []} onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setEdit({ ...edit, flags: values });
                }}>
                  {dicts.flags.map((f) => (<option key={f.code} value={f.code}>{f.code}</option>))}
                </select>
                <button className="ghost" style={{ marginTop: 6 }} onClick={() => setDictModal('flags')}>Add new flag</button>
              </div>
              <div>
                <label>categories</label>
                <select multiple value={edit.categories ?? []} onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setEdit({ ...edit, categories: values });
                }}>
                  {dicts.categories.map((c) => (<option key={c.category_code} value={c.category_code}>{c.title}</option>))}
                </select>
                <button className="ghost" style={{ marginTop: 6 }} onClick={() => setDictModal('entity_categories')}>Add new category</button>
              </div>
              <div>
                <label>description</label>
                <textarea className="input" value={edit.entity_description ?? ''} onChange={(e) => setEdit({ ...edit, entity_description: e.target.value || null })} />
              </div>
              <div>
                <label>comment</label>
                <textarea className="input" value={edit.comment ?? ''} onChange={(e) => setEdit({ ...edit, comment: e.target.value || null })} />
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button onClick={saveRow}>Save</button>
              <button className="secondary" onClick={() => setEdit(null)}>Cancel</button>
            </div>
            <datalist id="entity-uids">
              {dicts.entities.map((e) => (
                <option key={e.entity_uid} value={e.entity_uid} />
              ))}
            </datalist>
            <datalist id="entity-names">
              {dicts.entities.map((e) => (
                <option key={e.entity_uid} value={e.entity_name} />
              ))}
            </datalist>
            <datalist id="country-list">
              {countryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        ) : null}
      </Modal>

      <EntityDetailsModal uid={detailsUid} onClose={() => setDetailsUid(null)} />
      <DictionaryAddModal
        open={!!dictModal}
        list={dictModal ?? 'flags'}
        onClose={() => setDictModal(null)}
        onAdded={() => load()}
      />

      <Modal open={!!preview} onClose={() => setPreview(null)} title="CSV Import Preview">
        {preview ? (
          <div>
            <p>Valid rows: {preview.ok}. Errors: {preview.errors.length}.</p>
            {preview.errors.length ? (
              <div className="notice">Errors detected. You can still import valid rows. Error rows will be skipped.</div>
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

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}
