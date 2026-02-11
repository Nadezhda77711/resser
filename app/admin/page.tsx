'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchJSON } from '../_components/api';
import { Toast } from '../_components/Toast';

type Role = { id: number; code: string; title: string; description?: string | null };
type User = { id: number; email: string; name?: string | null; roles: Array<{ role: Role }> };

export default function AdminPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState('');

  const [newRole, setNewRole] = useState({ code: '', title: '', description: '' });
  const [newUser, setNewUser] = useState({ email: '', name: '' });
  const [assign, setAssign] = useState<{ userId: number; roleId: number }>({ userId: 0, roleId: 0 });

  async function load() {
    const [r, u] = await Promise.all([
      fetchJSON<{ roles: Role[] }>('/api/admin/roles'),
      fetchJSON<{ users: User[] }>('/api/admin/users'),
    ]);
    setRoles(r.roles);
    setUsers(u.users);
  }

  useEffect(() => {
    load();
  }, []);

  const roleOptions = useMemo(() => roles.map((r) => ({ id: r.id, label: `${r.title} (${r.code})` })), [roles]);

  async function addRole() {
    if (!newRole.code.trim() || !newRole.title.trim()) return;
    await fetchJSON('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(newRole),
    });
    setNewRole({ code: '', title: '', description: '' });
    setToast('Role added');
    load();
  }

  async function addUser() {
    if (!newUser.email.trim()) return;
    await fetchJSON('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });
    setNewUser({ email: '', name: '' });
    setToast('User added');
    load();
  }

  async function assignRole() {
    if (!assign.userId || !assign.roleId) return;
    await fetchJSON('/api/admin/user-roles', {
      method: 'POST',
      body: JSON.stringify({ user_id: assign.userId, role_id: assign.roleId }),
    });
    setToast('Role assigned');
    load();
  }

  async function removeRole(userId: number, roleId: number) {
    await fetchJSON('/api/admin/user-roles', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId, role_id: roleId }),
    });
    setToast('Role removed');
    load();
  }

  return (
    <div>
      <div className="section">
        <h1 className="section-title">Admin / Users & Roles</h1>
      </div>

      <div className="section">
        <h2>Roles</h2>
        <div className="form-grid">
          <div>
            <label>Code</label>
            <input className="input" value={newRole.code} onChange={(e) => setNewRole({ ...newRole, code: e.target.value })} />
          </div>
          <div>
            <label>Title</label>
            <input className="input" value={newRole.title} onChange={(e) => setNewRole({ ...newRole, title: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <input className="input" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={addRole}>Add role</button>
        </div>
        <div className="card-grid" style={{ marginTop: 12 }}>
          {roles.map((r) => (
            <div className="card" key={r.id}>
              <h3>{r.title}</h3>
              <p>{r.code}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Users</h2>
        <div className="form-grid">
          <div>
            <label>Email</label>
            <input className="input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div>
            <label>Name</label>
            <input className="input" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={addUser}>Add user</button>
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name ?? ''}</td>
                  <td>
                    {u.roles.map((ur) => (
                      <span className="badge" key={`${u.id}-${ur.role.id}`}>
                        {ur.role.code}
                        <button className="ghost" style={{ marginLeft: 8 }} onClick={() => removeRole(u.id, ur.role.id)}>x</button>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>Assign Role</h2>
        <div className="form-grid">
          <div>
            <label>User</label>
            <select value={assign.userId} onChange={(e) => setAssign({ ...assign, userId: Number(e.target.value) })}>
              <option value={0}>Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Role</label>
            <select value={assign.roleId} onChange={(e) => setAssign({ ...assign, roleId: Number(e.target.value) })}>
              <option value={0}>Select role</option>
              {roleOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button onClick={assignRole}>Assign</button>
        </div>
      </div>

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}
    </div>
  );
}
