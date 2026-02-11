'use client';

import { useEffect, useState } from 'react';
import { fetchJSON } from './api';
import { Modal } from './Modal';

type DictList =
  | 'entity_types'
  | 'flags'
  | 'address_roles'
  | 'incident_types'
  | 'networks'
  | 'entity_categories';

export function DictionaryAddModal({
  open,
  list,
  onClose,
  onAdded,
}: {
  open: boolean;
  list: DictList;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCode('');
    setTitle('');
    setDescription('');
    setError('');
  }, [open]);

  async function submit() {
    if (!code.trim() || !title.trim()) return;
    try {
      await fetchJSON('/api/dictionaries', {
        method: 'POST',
        body: JSON.stringify({
          list,
          code,
          title,
          description: description || null,
        }),
      });
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to add');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add dictionary item">
      <div className="form-grid">
        <div>
          <label>Code</label>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label>Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      {error ? <div className="notice" style={{ marginTop: 12 }}>{error}</div> : null}
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button onClick={submit}>Add</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
