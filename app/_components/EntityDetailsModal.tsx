'use client';

import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { fetchJSON } from './api';
import { Modal } from './Modal';

type EntityDetails = {
  entity: {
    entity_uid: string;
    entity_name: string;
    entity_type: { code: string; title: string };
    parent?: { entity_uid: string; entity_name: string } | null;
    parent_entity_uid?: string | null;
    entity_description?: string | null;
    entity_country?: string | null;
    comment?: string | null;
    added_at: string;
  };
  flags: Array<{ code: string; source: string }>;
  categories: Array<{ category_code: string; title: string }>;
  affiliations: Array<{
    id: number;
    network_code: string;
    address: string;
    address_role_code?: string | null;
    source: string;
    analyst?: string | null;
    added_at: string;
    comment?: string | null;
  }>;
  incidents: Array<{
    id: number;
    network_code: string;
    address: string;
    incident_type_code: string;
    incident_date: string;
    source: string;
    analyst?: string | null;
  }>;
};

export function EntityDetailsModal({ uid, onClose }: { uid: string | null; onClose: () => void }) {
  const [details, setDetails] = useState<EntityDetails | null>(null);
  const [tab, setTab] = useState<'summary' | 'affiliations' | 'incidents'>('summary');
  const [report, setReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setDetails(null);
    setReport('');
    setTab('summary');
    fetchJSON<EntityDetails>(`/api/entities/${encodeURIComponent(uid)}/details`).then(setDetails);
  }, [uid]);

  async function generateReport() {
    if (!uid) return;
    setReportLoading(true);
    const md = await fetchJSON<{ markdown: string }>(`/api/reports/entity/${encodeURIComponent(uid)}`);
    setReport(md.markdown);
    setReportLoading(false);
  }

  function downloadPdf() {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(report || 'Empty report', 180);
    doc.text(lines, 10, 10);
    doc.save(`entity_${uid || 'report'}.pdf`);
  }

  return (
    <Modal open={!!uid} onClose={onClose} title="Entity details">
      {!uid || !details ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div className="subtabs">
            <button className={tab === 'summary' ? 'subtab active' : 'subtab'} onClick={() => setTab('summary')}>
              Summary
            </button>
            <button className={tab === 'affiliations' ? 'subtab active' : 'subtab'} onClick={() => setTab('affiliations')}>
              Affiliations ({details.affiliations.length})
            </button>
            <button className={tab === 'incidents' ? 'subtab active' : 'subtab'} onClick={() => setTab('incidents')}>
              Incidents ({details.incidents.length})
            </button>
          </div>

          {tab === 'summary' ? (
            <div>
              <div className="form-grid">
                <div>
                  <label>entity_uid</label>
                  <div>{details.entity.entity_uid}</div>
                </div>
                <div>
                  <label>entity_name</label>
                  <div>{details.entity.entity_name}</div>
                </div>
                <div>
                  <label>entity_type</label>
                  <div>{details.entity.entity_type.title} ({details.entity.entity_type.code})</div>
                </div>
                <div>
                  <label>parent</label>
                  <div>{details.entity.parent?.entity_uid || details.entity.parent_entity_uid || ''}</div>
                </div>
                <div>
                  <label>country</label>
                  <div>{details.entity.entity_country || ''}</div>
                </div>
                <div>
                  <label>added_at</label>
                  <div>{new Date(details.entity.added_at).toISOString().slice(0, 10)}</div>
                </div>
              </div>

              {details.entity.entity_description ? (
                <div style={{ marginTop: 12 }}>
                  <label>description</label>
                  <div>{details.entity.entity_description}</div>
                </div>
              ) : null}

              {details.categories.length ? (
                <div style={{ marginTop: 12 }}>
                  <label>categories</label>
                  <div>
                    {details.categories.map((c) => (
                      <span className="badge" key={c.category_code}>{c.category_code}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {details.flags.length ? (
                <div style={{ marginTop: 12 }}>
                  <label>flags</label>
                  <div>
                    {details.flags.map((f, idx) => (
                      <span className="badge" key={`${f.code}-${idx}`}>{f.code}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="btn-row" style={{ marginTop: 12 }}>
                <button onClick={generateReport} disabled={reportLoading}>
                  {reportLoading ? 'Generating...' : 'Generate report'}
                </button>
                <button className="secondary" onClick={() => navigator.clipboard.writeText(report)} disabled={!report}>
                  Copy Markdown
                </button>
                <button className="secondary" onClick={downloadPdf} disabled={!report}>
                  Download PDF
                </button>
              </div>

              {report ? <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{report}</pre> : null}
            </div>
          ) : null}

          {tab === 'affiliations' ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>network</th>
                    <th>address</th>
                    <th>address_role</th>
                    <th>source</th>
                    <th>analyst</th>
                    <th>added_at</th>
                  </tr>
                </thead>
                <tbody>
                  {details.affiliations.map((a) => (
                    <tr key={a.id}>
                      <td>{a.network_code}</td>
                      <td>{a.address}</td>
                      <td>{a.address_role_code ?? ''}</td>
                      <td>{a.source}</td>
                      <td>{a.analyst ?? ''}</td>
                      <td>{a.added_at ? new Date(a.added_at).toISOString().slice(0, 10) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'incidents' ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>network</th>
                    <th>address</th>
                    <th>incident_type</th>
                    <th>incident_date</th>
                    <th>source</th>
                    <th>analyst</th>
                  </tr>
                </thead>
                <tbody>
                  {details.incidents.map((i) => (
                    <tr key={i.id}>
                      <td>{i.network_code}</td>
                      <td>{i.address}</td>
                      <td>{i.incident_type_code}</td>
                      <td>{i.incident_date ? i.incident_date.slice(0, 10) : ''}</td>
                      <td>{i.source}</td>
                      <td>{i.analyst ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
