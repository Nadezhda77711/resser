'use client';

import { useEffect, useState } from 'react';
import { fetchJSON } from '../_components/api';
import { normalizeCode } from '../../lib/normalization';

export default function SettingsPage() {
  const [dicts, setDicts] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    list: 'entity_types',
    code: '',
    title: '',
    description: '',
  });

  async function load() {
    const d = await fetchJSON('/api/dictionaries');
    setDicts(d);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem() {
    if (!newItem.code.trim() || !newItem.title.trim()) return;
    await fetchJSON('/api/dictionaries', {
      method: 'POST',
      body: JSON.stringify({
        list: newItem.list,
        code: normalizeCode(newItem.code),
        title: newItem.title.trim(),
        description: newItem.description || null,
      }),
    });
    setNewItem({ ...newItem, code: '', title: '', description: '' });
    load();
  }

  if (!dicts) return <div>Loading...</div>;

  return (
    <div>
      <div className="section">
        <h1 className="section-title">Settings / Dictionaries</h1>
      </div>

      <div className="section">
        <h2>Quick Add</h2>
        <div className="form-grid">
          <div>
            <label>Dictionary</label>
            <select value={newItem.list} onChange={(e) => setNewItem({ ...newItem, list: e.target.value })}>
              <option value="entity_types">Entity types</option>
              <option value="flags">Flags</option>
              <option value="address_roles">Address roles</option>
              <option value="incident_types">Incident types</option>
              <option value="networks">Networks</option>
              <option value="entity_categories">Entity categories</option>
            </select>
          </div>
          <div>
            <label>Code</label>
            <input className="input" value={newItem.code} onChange={(e) => setNewItem({ ...newItem, code: e.target.value })} />
          </div>
          <div>
            <label>Title</label>
            <input className="input" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <input className="input" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={addItem}>Add</button>
        </div>
      </div>

      <div className="section">
        <h2>Entity Types</h2>
        <div className="card-grid">
          {dicts.entityTypes.map((t: any) => (
            <div className="card" key={t.code}>
              <h3>{t.code}</h3>
              <p>{t.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Flags</h2>
        <div className="card-grid">
          {dicts.flags.map((t: any) => (
            <div className="card" key={t.code}>
              <h3>{t.code}</h3>
              <p>{t.title || ''}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Address Roles</h2>
        <div className="card-grid">
          {dicts.addressRoles.map((t: any) => (
            <div className="card" key={t.code}>
              <h3>{t.code}</h3>
              <p>{t.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Incident Types</h2>
        <div className="card-grid">
          {dicts.incidentTypes.map((t: any) => (
            <div className="card" key={t.code}>
              <h3>{t.code}</h3>
              <p>{t.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Networks</h2>
        <div className="card-grid">
          {dicts.networks.map((t: any) => (
            <div className="card" key={t.code}>
              <h3>{t.code}</h3>
              <p>{t.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Entity Categories</h2>
        <div className="card-grid">
          {dicts.categories.map((t: any) => (
            <div className="card" key={t.category_code}>
              <h3>{t.category_code}</h3>
              <p>{t.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
