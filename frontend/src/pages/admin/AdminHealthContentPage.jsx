/**
 * @file    AdminHealthContentPage.jsx
 * @module  Admin
 * @desc    CRUD management for health content articles, with a
 *          draft -> published workflow.
 */

import {
  useEffect,
  useRef,
  useState
} from 'react';

import {
  FileImage,
  FileText,
  Filter,
  ImagePlus,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import PageHeader from '../../components/common/PageHeader';

const API_URL = 'http://localhost:5000';

const CATEGORIES = [
  'first-aid',
  'vaccine',
  'nutrition',
  'mental-health',
  'dengue-alert'
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const emptyForm = {
  title: '',
  body: '',
  category: 'first-aid',
  source: ''
};

const AdminHealthContentPage = () => {
  const [
    content,
    setContent
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  const [
    statusFilter,
    setStatusFilter
  ] = useState('');

  const [
    actioningId,
    setActioningId
  ] = useState(null);

  const [
    showForm,
    setShowForm
  ] = useState(false);

  const [
    editingId,
    setEditingId
  ] = useState(null);

  const [
    form,
    setForm
  ] = useState(
    emptyForm
  );

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    imageFile,
    setImageFile
  ] = useState(null);

  const [
    imagePreview,
    setImagePreview
  ] = useState('');

  const [
    existingImageUrl,
    setExistingImageUrl
  ] = useState('');

  const fileInputRef =
    useRef(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const params =
        new URLSearchParams();

      if (statusFilter) {
        params.append(
          'status',
          statusFilter
        );
      }

      const res =
        await fetch(
          `${API_URL}/api/admin/health-content?${params.toString()}`,
          {
            credentials: 'include',
          }
        );

      const data =
        await res.json();

      if (!data.success) {
        setError(
          data.message ||
          'Failed to load content'
        );

        return;
      }

      setContent(
        data.data
      );
    } catch (err) {
      console.error(
        'Fetch content error:',
        err
      );

      setError(
        'Could not connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        imagePreview.startsWith(
          'blob:'
        )
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  const clearImageSelection = () => {
    if (
      imagePreview &&
      imagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImageFile(null);

    setImagePreview(
      existingImageUrl || ''
    );

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  const resetForm = () => {
    if (
      imagePreview &&
      imagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setExistingImageUrl('');

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  const openCreateForm = () => {
    if (
      imagePreview &&
      imagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setExistingImageUrl('');
    setShowForm(true);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  const openEditForm = (
    item
  ) => {
    if (
      imagePreview &&
      imagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setEditingId(
      item.id
    );

    setForm({
      title:
        item.title,
      body:
        item.body,
      category:
        item.category,
      source:
        item.source || ''
    });

    setImageFile(null);

    setExistingImageUrl(
      item.image_url || ''
    );

    setImagePreview(
      item.image_url || ''
    );

    setShowForm(true);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  const handleImageChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      alert(
        'Please select a JPEG, PNG, or WebP image.'
      );

      e.target.value =
        '';

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      alert(
        'Article image must be 5 MB or smaller.'
      );

      e.target.value =
        '';

      return;
    }

    if (
      imagePreview &&
      imagePreview.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setImageFile(
      file
    );

    setImagePreview(
      previewUrl
    );
  };

  const handleSave = async (
    e
  ) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url =
        editingId
          ? `${API_URL}/api/admin/health-content/${editingId}`
          : `${API_URL}/api/admin/health-content`;

      const method =
        editingId
          ? 'PUT'
          : 'POST';

      const formData =
        new FormData();

      formData.append(
        'title',
        form.title
      );

      formData.append(
        'body',
        form.body
      );

      formData.append(
        'category',
        form.category
      );

      formData.append(
        'source',
        form.source || ''
      );

      if (imageFile) {
        formData.append(
          'image',
          imageFile
        );
      }

      const res =
        await fetch(
          url,
          {
            method,
            credentials: 'include',
            body:
              formData,
          }
        );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Save failed'
        );

        return;
      }

      resetForm();

      await fetchContent();
    } catch (err) {
      console.error(
        'Save content error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (
    id
  ) => {
    setActioningId(
      id
    );

    try {
      const res =
        await fetch(
          `${API_URL}/api/admin/health-content/${id}/publish`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Publish failed'
        );

        return;
      }

      await fetchContent();
    } catch (err) {
      console.error(
        'Publish error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setActioningId(
        null
      );
    }
  };

  const handleDelete = async (
    id
  ) => {
    if (
      !window.confirm(
        'Delete this content item? This cannot be undone.'
      )
    ) {
      return;
    }

    setActioningId(
      id
    );

    try {
      const res =
        await fetch(
          `${API_URL}/api/admin/health-content/${id}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Delete failed'
        );

        return;
      }

      await fetchContent();
    } catch (err) {
      console.error(
        'Delete error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setActioningId(
        null
      );
    }
  };

  if (
    loading &&
    content.length === 0
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading health content...
        </p>

      </div>
    );
  }

  const publishedCount =
    content.filter(
      item =>
        item.status ===
        'published'
    ).length;

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={ShieldCheck}
        title="Health Content Management"
        description="Create, review, publish, and maintain trusted health-awareness content shown across Care4U."
        actions={
          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="
              inline-flex
              items-center
              gap-2
              px-3.5 py-2.5
              rounded-xl
              bg-white/10
              border border-white/20
              text-white
              text-xs sm:text-sm
              font-semibold
              backdrop-blur-sm
              hover:bg-white/15
              hover:border-white/30
              transition-all
              focus:outline-none
              focus:ring-2
              focus:ring-white/30
            "
          >
            <Plus
              size={15}
            />
            New Content
          </button>
        }
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Items
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  content.length
                }
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                Published
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  publishedCount
                }
              </p>

            </div>

          </div>
        }
      />

      {/* Status filter */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <Filter
              size={18}
              className="text-primary"
            />
            Content Filter
          </span>
        }
      >

        <div className="max-w-xs flex flex-col gap-1.5">

          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Filter by Status
          </label>

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
          >
            <option value="">
              All statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="published">
              Published
            </option>

          </select>

        </div>

      </Card>

      {error && (
        <Alert
          type="error"
          message={
            error
          }
        />
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card
          title={
            editingId
              ? 'Edit Content'
              : 'New Content'
          }
        >

          <form
            onSubmit={
              handleSave
            }
            className="flex flex-col gap-5"
          >

            <Input
              label="Article Title"
              name="title"
              placeholder="Title"
              value={
                form.title
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  title:
                    e.target.value
                })
              }
              required
            />

            <div className="flex flex-col gap-1.5">

              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Body Content
                {' '}
                <span className="text-destructive ml-1">
                  *
                </span>
              </label>

              <textarea
                placeholder="Write the health content here..."
                value={
                  form.body
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    body:
                      e.target.value
                  })
                }
                required
                rows={6}
                className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground resize-y"
              />

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-4">

              <div className="flex flex-col gap-1.5">

                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Category
                </label>

                <select
                  value={
                    form.category
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category:
                        e.target.value
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
                >
                  {CATEGORIES.map(
                    category => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}
                </select>

              </div>

              <div>

                <Input
                  label="Source (Optional)"
                  name="source"
                  placeholder="e.g. WHO, Ministry of Health"
                  value={
                    form.source
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source:
                        e.target.value
                    })
                  }
                />

              </div>

            </div>

            <div className="flex flex-col gap-2">

              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Article Image
              </label>

              <div className="rounded-2xl border border-dashed border-border bg-secondary/35 p-4 sm:p-5">

                <div className="flex flex-col lg:flex-row gap-5">

                  <div className="flex-1 min-w-0">

                    <div className="flex items-start gap-3">

                      <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

                        <ImagePlus
                          size={19}
                        />

                      </div>

                      <div>

                        <p className="text-sm font-semibold text-foreground">
                          Upload an article image
                        </p>

                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          JPEG, PNG, or WebP. Maximum file size 5 MB.
                          {editingId && existingImageUrl
                            ? ' Leave this unchanged to keep the current image.'
                            : ''}
                        </p>

                      </div>

                    </div>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleImageChange
                      }
                      className="
                        mt-4
                        block
                        w-full
                        text-sm
                        text-muted-foreground
                        file:mr-4
                        file:rounded-lg
                        file:border-0
                        file:bg-primary
                        file:px-4
                        file:py-2
                        file:text-sm
                        file:font-semibold
                        file:text-primary-foreground
                        hover:file:opacity-90
                        file:cursor-pointer
                        cursor-pointer
                      "
                    />

                    {imageFile && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">

                        <FileImage
                          size={14}
                          className="text-primary"
                        />

                        <span className="truncate">
                          {
                            imageFile.name
                          }
                        </span>

                        <span>
                          (
                          {
                            (
                              imageFile.size /
                              1024 /
                              1024
                            ).toFixed(2)
                          }
                          {' '}
                          MB)
                        </span>

                      </div>
                    )}

                  </div>

                  {imagePreview && (
                    <div className="w-full lg:w-64 shrink-0">

                      <div className="relative overflow-hidden rounded-xl border border-border bg-card">

                        <img
                          src={
                            imagePreview
                          }
                          alt="Article preview"
                          className="w-full h-40 object-cover"
                        />

                        {imageFile && (
                          <button
                            type="button"
                            onClick={
                              clearImageSelection
                            }
                            className="
                              absolute
                              top-2 right-2
                              w-8 h-8
                              rounded-full
                              bg-black/60
                              text-white
                              flex items-center justify-center
                              hover:bg-black/75
                              transition-colors
                            "
                            aria-label="Remove selected image"
                          >
                            <X
                              size={16}
                            />
                          </button>
                        )}

                      </div>

                      <p className="text-[11px] text-muted-foreground mt-2">
                        {imageFile
                          ? 'New image preview'
                          : 'Current article image'}
                      </p>

                    </div>
                  )}

                </div>

              </div>

            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border mt-2">

              <Button
                type="button"
                variant="secondary"
                onClick={
                  resetForm
                }
                disabled={
                  saving
                }
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={
                  saving
                }
                className="w-full sm:w-auto"
              >
                Save Content
              </Button>

            </div>

          </form>

        </Card>
      )}

      {/* Content List */}
      {content.length === 0 ? (
        <Card>

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <FileText
                className="w-7 h-7"
                strokeWidth={1.8}
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No content items found
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              Create a new health-awareness item or adjust the current status filter.
            </p>

          </div>

        </Card>
      ) : (
        <Card
          title="Health Content Library"
        >

          <div className="space-y-4">

            {content.map(
              (
                item
              ) => {
                const isActioning =
                  actioningId ===
                  item.id;

                return (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl bg-secondary/45 overflow-hidden transition-colors hover:bg-secondary/65"
                  >

                    <div className="flex flex-col md:flex-row">

                      {item.image_url && (
                        <div className="md:w-56 lg:w-64 shrink-0">

                          <img
                            src={
                              item.image_url
                            }
                            alt={
                              item.title
                            }
                            className="w-full h-48 md:h-full min-h-[180px] object-cover"
                          />

                        </div>
                      )}

                      <div className="flex-1 min-w-0 p-4 sm:p-5">

                        <div className="flex flex-col gap-4">

                          <div>

                            <div className="flex flex-wrap items-center gap-2.5">

                              <h3 className="text-base sm:text-lg font-bold text-foreground">
                                {
                                  item.title
                                }
                              </h3>

                              <Badge
                                status="normal"
                                label={
                                  item.category
                                }
                              />

                              <Badge
                                status={
                                  item.status ===
                                  'published'
                                    ? 'active'
                                    : 'pending'
                                }
                                label={
                                  item.status
                                }
                              />

                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mt-3">
                              {
                                item.body
                              }
                            </p>

                            {item.source && (
                              <div className="mt-4 rounded-xl bg-card/70 px-3.5 py-3">

                                <p className="text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">
                                    Source:
                                  </span>
                                  {' '}
                                  {
                                    item.source
                                  }
                                </p>

                              </div>
                            )}

                          </div>

                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-4 border-t border-border/70">

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                openEditForm(
                                  item
                                )
                              }
                              disabled={
                                isActioning
                              }
                              className="w-full sm:w-auto"
                            >
                              Edit
                            </Button>

                            {item.status ===
                              'draft' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  handlePublish(
                                    item.id
                                  )
                                }
                                disabled={
                                  isActioning
                                }
                                loading={
                                  isActioning &&
                                  actioningId ===
                                    item.id
                                } // Prevents loading state bleeding
                                className="w-full sm:w-auto"
                              >
                                Publish
                              </Button>
                            )}

                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              disabled={
                                isActioning
                              }
                              className="w-full sm:w-auto"
                            >
                              Delete
                            </Button>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </Card>
      )}

    </div>
  );
};

export default AdminHealthContentPage;