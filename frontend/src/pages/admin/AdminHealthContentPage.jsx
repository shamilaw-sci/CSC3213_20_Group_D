/**
 * @file    AdminHealthContentPage.jsx
 * @module  Admin
 * @desc    CRUD management for health content articles, with a
 *          draft -> published workflow.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import { FileText } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Health Content Management</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">{content.length} item(s)</p>
        </div>
        <Button onClick={openCreateForm} variant="brand">
          + New Content
        </Button>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-col sm:w-48 gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Filter by Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card title={editingId ? 'Edit Content' : 'New Content'} className="mb-8 border-primary/20 shadow-md">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Article Title"
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Body Content <span className="text-destructive ml-1">*</span>
              </label>
              <textarea
                placeholder="Write the health content here..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={5}
                className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-1.5 sm:w-1/3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <Input
                  label="Source (Optional)"
                  name="source"
                  placeholder="e.g. WHO, Ministry of Health"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                Save Content
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Content List */}
      {content.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
          <FileText className="w-10 h-10 text-muted-foreground mb-4 opacity-50" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-foreground">No content items found.</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm mx-auto">
            Click "+ New Content" above to draft a new health awareness article.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {content.map((item) => {
            const isActioning = actioningId === item.id;
            return (
              <Card key={item.id} className="p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2.5">
                    <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                    <div className="flex gap-2">
                      <Badge status="normal" label={item.category} />
                      <Badge 
                        status={item.status === 'published' ? 'active' : 'pending'} 
                        label={item.status} 
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {item.body}
                  </p>
                  {item.source && (
                    <p className="text-xs font-medium text-muted-foreground mt-3 pt-3 border-t border-border border-dashed">
                      <span className="text-foreground">Source:</span> {item.source}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditForm(item)}
                    disabled={isActioning}
                  >
                    Edit
                  </Button>
                  {item.status === 'draft' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePublish(item.id)}
                      disabled={isActioning}
                      loading={isActioning && actioningId === item.id} // Prevents loading state bleeding
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={isActioning}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHealthContentPage;