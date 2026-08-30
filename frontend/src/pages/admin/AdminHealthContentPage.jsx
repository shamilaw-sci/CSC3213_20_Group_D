/**
 * @file    AdminHealthContentPage.jsx
 * @module  Admin
 * @desc    CRUD management for health content articles, with a
 *          draft -> published workflow.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';
const CATEGORIES = ['first-aid', 'vaccine', 'nutrition', 'mental-health', 'dengue-alert'];

const emptyForm = { title: '', body: '', category: 'first-aid', source: '' };

const AdminHealthContentPage = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_URL}/api/admin/health-content?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load content');
        return;
      }

      setContent(data.data);
    } catch (err) {
      console.error('Fetch content error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({ title: item.title, body: item.body, category: item.category, source: item.source || '' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId
        ? `${API_URL}/api/admin/health-content/${editingId}`
        : `${API_URL}/api/admin/health-content`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Save failed');
        return;
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchContent();
    } catch (err) {
      console.error('Save content error:', err);
      alert('Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    setActioningId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/health-content/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Publish failed');
        return;
      }

      await fetchContent();
    } catch (err) {
      console.error('Publish error:', err);
      alert('Could not connect to the server.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content item? This cannot be undone.')) return;

    setActioningId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/health-content/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Delete failed');
        return;
      }

      await fetchContent();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not connect to the server.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading && content.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Health Content Management</h1>
          <p className="text-sm text-slate-500">{content.length} item(s)</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-[#1E3A5F] text-white text-sm rounded-lg hover:bg-[#16293f]"
        >
          + New Content
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 mb-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            {editingId ? 'Edit Content' : 'New Content'}
          </h2>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <textarea
            placeholder="Body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
            rows={5}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <div className="flex gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Source (e.g. WHO, Ministry of Health)"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Content List */}
      {content.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-600 font-medium">No content items.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {content.map((item) => {
            const isActioning = actioningId === item.id;
            return (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">{item.title}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{item.category}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{item.body}</p>
                    {item.source && <p className="text-xs text-slate-400 mt-1">Source: {item.source}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => openEditForm(item)}
                    disabled={isActioning}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  {item.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(item.id)}
                      disabled={isActioning}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isActioning ? 'Working...' : 'Publish'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isActioning}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isActioning ? 'Working...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHealthContentPage;