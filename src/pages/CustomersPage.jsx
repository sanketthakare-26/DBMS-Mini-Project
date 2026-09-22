import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
} from 'lucide-react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/api';
import {
  Card,
  RiskBadge,
  ChurnBadge,
  PlanBadge,
  SkeletonLoader,
  ErrorState,
  EmptyState,
  formatCurrency,
} from '../components/shared';
import { useToast } from '../components/Toast';

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const { addToast } = useToast();

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [churnFilter, setChurnFilter] = useState('All');
  const [sortBy, setSortBy] = useState('customer_id');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    gender: 'Male',
    location: 'Mumbai',
    plan_name: 'Standard',
    billing_cycle: 'Monthly',
    monthly_charge: 49.99,
    payment_method: 'Credit Card',
  });

  // Edit Customer Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editData, setEditData] = useState({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const fetchCustomersList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers({ limit: 1000 });
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, []);

  // Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
        c.location?.toLowerCase().includes(search.toLowerCase());

      const matchPlan = planFilter === 'All' || c.plan_name === planFilter;
      const matchRisk = riskFilter === 'All' || c.risk_level === riskFilter;
      const matchGender = genderFilter === 'All' || c.gender === genderFilter;
      const matchChurn =
        churnFilter === 'All' ||
        (churnFilter === 'Churned' && c.churn === 1) ||
        (churnFilter === 'Active' && (c.churn === 0 || !c.churn));

      return matchSearch && matchPlan && matchRisk && matchGender && matchChurn;
    }).sort((a, b) => {
      let aVal = a[sortBy] ?? 0;
      let bVal = b[sortBy] ?? 0;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, search, planFilter, riskFilter, genderFilter, churnFilter, sortBy, sortOrder]);

  // Paginated chunk
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Handle Add Customer Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await addCustomer(formData);
      addToast(`Customer ${created.name} (${created.customer_code}) created successfully!`, 'success');
      setShowAddModal(false);
      setFormData({
        name: '',
        age: 30,
        gender: 'Male',
        location: 'Mumbai',
        plan_name: 'Standard',
        billing_cycle: 'Monthly',
        monthly_charge: 49.99,
        payment_method: 'Credit Card',
      });
      fetchCustomersList();
    } catch (err) {
      addToast(`Failed to add customer: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Open Edit Modal
  const openEdit = (c) => {
    setEditCustomer(c);
    setEditData({
      name: c.name,
      age: c.age,
      gender: c.gender,
      location: c.location,
      plan_name: c.plan_name || 'Standard',
      billing_cycle: c.billing_cycle || 'Monthly',
      monthly_charge: Number(c.monthly_charge) || 49.99,
    });
    setShowEditModal(true);
  };

  // Handle Edit Customer Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateCustomer(editCustomer.customer_id, editData);
      addToast(`Customer "${editData.name}" updated successfully in MySQL!`, 'success');
      setShowEditModal(false);
      setEditCustomer(null);
      fetchCustomersList();
    } catch (err) {
      addToast(`Failed to update customer: ${err.message}`, 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle Delete Customer
  const handleDelete = async (customerId, name) => {
    if (!window.confirm(`Are you sure you want to delete customer ${name} (ID: ${customerId})? This will cascade-delete all related usage and predictions.`)) {
      return;
    }
    try {
      await deleteCustomer(customerId);
      addToast(`Customer ${name} deleted successfully!`, 'success');
      fetchCustomersList();
    } catch (err) {
      addToast(`Failed to delete customer: ${err.message}`, 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">Customers</h1>
          <p className="page-lead">
            Manage customer accounts, monitor risk tiers, and update subscriptions
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={15} /> Add Customer
        </button>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchCustomersList} />
      ) : (
        <Card>
          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, code, or city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="All">All Risks</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="All">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>

              <select
                value={churnFilter}
                onChange={(e) => {
                  setChurnFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Churned">Churned</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="customer_id">Sort: ID</option>
                <option value="name">Sort: Name</option>
                <option value="churn_probability">Sort: Churn Probability</option>
                <option value="monthly_charge">Sort: Monthly Charge</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="results-summary">
            Showing <strong>{filteredCustomers.length}</strong> matching customers
          </div>

          {/* Table */}
          {loading ? (
            <SkeletonLoader rows={8} height={35} />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState message="No customers found" subtext="Try changing your search query or filters" />
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Demographics</th>
                      <th>Location</th>
                      <th>Plan</th>
                      <th>Monthly Fee</th>
                      <th>Status</th>
                      <th>Churn Probability</th>
                      <th>Risk Level</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((c) => (
                      <tr key={c.customer_id}>
                        <td>#{c.customer_id}</td>
                        <td>
                          <div className="customer-cell">
                            <Link to={`/customers/${c.customer_id}`} className="customer-name-link">
                              {c.name}
                            </Link>
                            <span className="customer-code">{c.customer_code}</span>
                          </div>
                        </td>
                        <td>{c.age} yrs • {c.gender}</td>
                        <td>{c.location}</td>
                        <td>
                          <PlanBadge plan={c.plan_name} />
                        </td>
                        <td>{formatCurrency(c.monthly_charge)}</td>
                        <td>
                          <ChurnBadge churn={c.churn} />
                        </td>
                        <td>
                          <div className="prob-meter">
                            <div
                              className={`prob-fill ${(c.risk_level || '').toLowerCase()}`}
                              style={{ width: `${Math.round((c.churn_probability || 0) * 100)}%` }}
                            />
                            <span>{((c.churn_probability || 0) * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <RiskBadge risk={c.risk_level} />
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link
                              to={`/customers/${c.customer_id}`}
                              className="btn btn-outline btn-xs"
                              title="View full 360 profile"
                            >
                              <ExternalLink size={13} />
                            </Link>
                            <button
                              className="btn btn-edit-outline btn-xs"
                              onClick={() => openEdit(c)}
                              title="Edit customer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-danger-outline btn-xs"
                              onClick={() => handleDelete(c.customer_id, c.name)}
                              title="Delete customer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-bar">
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Customer</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="form-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Subscription Plan</label>
                  <select
                    value={formData.plan_name}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const charges = { Basic: 19.99, Standard: 49.99, Premium: 99.99, Enterprise: 199.99 };
                      setFormData({
                        ...formData,
                        plan_name: plan,
                        monthly_charge: charges[plan] || 49.99,
                      });
                    }}
                    className="form-input"
                  >
                    <option value="Basic">Basic ($19.99)</option>
                    <option value="Standard">Standard ($49.99)</option>
                    <option value="Premium">Premium ($99.99)</option>
                    <option value="Enterprise">Enterprise ($199.99)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="form-input"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="form-input"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Customer — {editCustomer.name}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    value={editData.age}
                    onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editData.gender}
                    onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    required
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Subscription Plan</label>
                  <select
                    value={editData.plan_name}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const charges = { Basic: 19.99, Standard: 49.99, Premium: 99.99, Enterprise: 199.99 };
                      setEditData({ ...editData, plan_name: plan, monthly_charge: charges[plan] || editData.monthly_charge });
                    }}
                    className="form-input"
                  >
                    <option value="Basic">Basic ($19.99)</option>
                    <option value="Standard">Standard ($49.99)</option>
                    <option value="Premium">Premium ($99.99)</option>
                    <option value="Enterprise">Enterprise ($199.99)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select
                    value={editData.billing_cycle}
                    onChange={(e) => setEditData({ ...editData, billing_cycle: e.target.value })}
                    className="form-input"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monthly Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.monthly_charge}
                    onChange={(e) => setEditData({ ...editData, monthly_charge: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="edit-info-note">
                💾 Changes will be saved directly to MySQL and reflected in the dashboard immediately.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditSubmitting}
                >
                  <Save size={15} />
                  {isEditSubmitting ? 'Saving to MySQL...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
