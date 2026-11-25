import { useCallback, useEffect, useState } from "react";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import PatientFormModal from "./components/PatientFormModal";
import PatientList from "./components/PatientList";
import { DEPARTMENTS, DOCTORS, WARDS } from "./constants";
import "./App.css";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [toast, setToast] = useState("");

  // Search and filter state
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deletingPatient, setDeletingPatient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (wardFilter) params.set("ward", wardFilter);
      if (departmentFilter) params.set("department", departmentFilter);
      if (doctorFilter) params.set("doctor", doctorFilter);

      const queryString = params.toString();
      const url = `${API_BASE}/api/patients${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load patients from server.");
      }
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      setApiError(err.message || "Unable to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  }, [search, wardFilter, departmentFilter, doctorFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => {
      setToast((current) => (current === message ? "" : current));
    }, 3000);
  }

  function openAddModal() {
    setEditingPatient(null);
    setIsFormOpen(true);
  }

  function openEditModal(patient) {
    setEditingPatient(patient);
    setIsFormOpen(true);
  }

  async function handleSavePatient(payload) {
    setSaving(true);
    try {
      const isEditing = Boolean(editingPatient);
      const url = isEditing
        ? `${API_BASE}/api/patients/${editingPatient.id}`
        : `${API_BASE}/api/patients`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          error: data.error || "Failed to save patient.",
          errors: data.errors || {},
        };
      }

      setIsFormOpen(false);
      setEditingPatient(null);
      showToast(
        isEditing
          ? "Patient details updated."
          : "New patient admitted successfully."
      );
      await fetchPatients();
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Network error while saving patient. Please check the server.",
      };
    } finally {
      setSaving(false);
    }
  }

  async function handleDischarge(patient) {
    setApiError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/patients/${patient.id}/discharge`,
        { method: "PATCH" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to discharge patient.");
      }
      showToast(`${patient.name} marked as Discharged.`);
      await fetchPatients();
    } catch (err) {
      setApiError(err.message);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingPatient) return;
    setDeleting(true);
    setApiError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/patients/${deletingPatient.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete patient.");
      }
      const deletedName = deletingPatient.name;
      setDeletingPatient(null);
      showToast(`${deletedName} has been deleted.`);
      await fetchPatients();
    } catch (err) {
      setApiError(err.message);
      setDeletingPatient(null);
    } finally {
      setDeleting(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setWardFilter("");
    setDepartmentFilter("");
    setDoctorFilter("");
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(wardFilter) ||
    Boolean(departmentFilter) ||
    Boolean(doctorFilter);

  const admittedCount = patients.filter((p) => p.status === "Admitted").length;
  const dischargedCount = patients.filter(
    (p) => p.status === "Discharged"
  ).length;

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1>Patient Admission Management</h1>
          <p className="subtitle">
            Manage hospital admissions, ward assignments, and patient discharges
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddModal}
        >
          + Add Patient
        </button>
      </header>

      {toast && <div className="toast-success">{toast}</div>}
      {apiError && <div className="alert-error">{apiError}</div>}

      {/* Summary Cards */}
      <section className="stats-grid" aria-label="Patient statistics">
        <div className="stat-card">
          <span className="stat-label">Total Patients</span>
          <span className="stat-value">{patients.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Currently Admitted</span>
          <span className="stat-value stat-admitted">{admittedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Discharged</span>
          <span className="stat-value stat-discharged">{dischargedCount}</span>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="controls-card" aria-label="Search and filter patients">
        <div className="controls-grid">
          <div className="control-group control-search">
            <label htmlFor="search-name">Search by Name</label>
            <input
              id="search-name"
              type="text"
              placeholder="Search patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="control-group">
            <label htmlFor="filter-ward">Ward</label>
            <select
              id="filter-ward"
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
            >
              <option value="">All Wards</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="filter-department">Department</label>
            <select
              id="filter-department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="filter-doctor">Doctor</label>
            <select
              id="filter-doctor"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="">All Doctors</option>
              {DOCTORS.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="control-reset">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Patient List */}
      <main className="list-card">
        <PatientList
          patients={patients}
          loading={loading}
          onEdit={openEditModal}
          onDelete={(patient) => setDeletingPatient(patient)}
          onDischarge={handleDischarge}
        />
      </main>

      {/* Add / Edit Modal */}
      <PatientFormModal
        isOpen={isFormOpen}
        patient={editingPatient}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePatient}
        submitting={saving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        patient={deletingPatient}
        onCancel={() => setDeletingPatient(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
