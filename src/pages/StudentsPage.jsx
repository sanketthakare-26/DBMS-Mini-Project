import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../components/shared';
import { BRANCHES, SEMESTERS, getStatus } from '../data/mockStudents';

const EMPTY_FORM = { name: '', branch: 'AI&DS', semester: 3, marks: '', attendance: '' };

export default function StudentsPage({ students, lastRefresh, onRefresh, onAdd, onUpdate, onDelete, isSyncing }) {
  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('');
  const [filterBranch, setBranch]   = useState('');
  const [filterSem, setSem]         = useState('');
  const [sortKey, setSortKey]       = useState('id');
  const [sortDir, setSortDir]       = useState('asc');

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modal, setModal]   = useState(null); // null | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState(null);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...students];
    if (search)       list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (filterBranch) list = list.filter(s => s.branch === filterBranch);
    if (filterSem)    list = list.filter(s => String(s.semester) === filterSem);

    list.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [students, search, filterBranch, filterSem, sortKey, sortDir]);

  // ── Sort toggle ────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIndicator = ({ col }) =>
    sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  // ── Form helpers ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('add');
  };

  const openEdit = (student) => {
    setEditTarget(student.id);
    setForm({ name: student.name, branch: student.branch, semester: student.semester, marks: student.marks, attendance: student.attendance });
    setFormError('');
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditTarget(null); };

  const validateForm = () => {
    if (!form.name.trim())                    return 'Name is required.';
    if (form.marks === '' || isNaN(Number(form.marks)) || form.marks < 0 || form.marks > 100)
                                              return 'Marks must be between 0 and 100.';
    if (form.attendance === '' || isNaN(Number(form.attendance)) || form.attendance < 0 || form.attendance > 100)
                                              return 'Attendance must be between 0 and 100.';
    return null;
  };

  const handleSubmit = () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    const data = {
      name: form.name.trim(),
      branch: form.branch,
      semester: Number(form.semester),
      marks: Number(form.marks),
      attendance: Number(form.attendance),
      status: getStatus(Number(form.marks), Number(form.attendance)),
    };

    if (modal === 'add')  onAdd(data);
    if (modal === 'edit') onUpdate(editTarget, data);
    closeModal();
  };

  const handleDelete = (id) => {
    onDelete(id);
    setDeleteId(null);
  };

  return (
    <div className="page">
      <PageHeader
        title="Students"
        subtitle="Search, filter, and manage student records."
        lastRefresh={lastRefresh}
        onRefresh={onRefresh}
        isSyncing={isSyncing}
      />

      {/* Controls */}
      <Card>
        <div className="controls-bar">
          {/* Search */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}><X size={14} /></button>
            )}
          </div>

          {/* Filters */}
          <select className="filter-select" value={filterBranch} onChange={e => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>

          <select className="filter-select" value={filterSem} onChange={e => setSem(e.target.value)}>
            <option value="">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>

          <button className="btn btn-primary ml-auto" onClick={openAdd}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card title={`Showing ${displayed.length} of ${students.length} students`}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable">ID<SortIndicator col="id" /></th>
                <th onClick={() => handleSort('name')} className="sortable">Name<SortIndicator col="name" /></th>
                <th>Branch</th>
                <th onClick={() => handleSort('semester')} className="sortable">Sem<SortIndicator col="semester" /></th>
                <th onClick={() => handleSort('marks')} className="sortable">Marks<SortIndicator col="marks" /></th>
                <th onClick={() => handleSort('attendance')} className="sortable">Attendance<SortIndicator col="attendance" /></th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan={8} className="td-empty">No students found.</td></tr>
              ) : displayed.map(s => (
                <tr key={s.id}>
                  <td className="td-id">#{s.id}</td>
                  <td className="td-name">{s.name}</td>
                  <td><span className="branch-tag">{s.branch}</span></td>
                  <td>{s.semester}</td>
                  <td>
                    <span className={`marks-cell ${s.marks >= 85 ? 'marks-high' : s.marks >= 60 ? 'marks-mid' : 'marks-low'}`}>
                      {s.marks}
                    </span>
                  </td>
                  <td>{s.attendance}%</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon edit" onClick={() => openEdit(s)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-icon delete" onClick={() => setDeleteId(s.id)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add New Student' : 'Edit Student'}</h3>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {formError && <div className="form-error">{formError}</div>}

              <label className="form-label">Student Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />

              <div className="form-row">
                <div>
                  <label className="form-label">Branch</label>
                  <select className="form-input" value={form.branch}
                    onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Semester</label>
                  <select className="form-input" value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="form-label">Marks (0–100) *</label>
                  <input className="form-input" type="number" min={0} max={100} value={form.marks}
                    onChange={e => setForm(f => ({ ...f, marks: e.target.value }))} placeholder="e.g. 82" />
                </div>
                <div>
                  <label className="form-label">Attendance % (0–100) *</label>
                  <input className="form-input" type="number" min={0} max={100} value={form.attendance}
                    onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))} placeholder="e.g. 91" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Check size={16} /> {modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{students.find(s => s.id === deleteId)?.name}</strong>?
                This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
