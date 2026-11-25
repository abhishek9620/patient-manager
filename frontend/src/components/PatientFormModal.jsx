import { useEffect, useState } from "react";
import { DEPARTMENTS, DOCTORS, GENDERS, STATUSES, WARDS } from "../constants";
import { getTodayDateString, validatePatientForm } from "../validation";

function getInitialFormState(patient) {
  if (patient) {
    return {
      name: patient.name,
      age: String(patient.age),
      gender: patient.gender,
      ward: patient.ward,
      department: patient.department,
      doctor: patient.doctor,
      admission_date: patient.admission_date,
      status: patient.status,
    };
  }
  return {
    name: "",
    age: "",
    gender: "",
    ward: "",
    department: "",
    doctor: "",
    admission_date: getTodayDateString(),
    status: "Admitted",
  };
}

export default function PatientFormModal({
  isOpen,
  patient,
  onClose,
  onSave,
  submitting,
}) {
  const [formData, setFormData] = useState(() => getInitialFormState(patient));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(patient));
      setErrors({});
      setServerError("");
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const isEditing = Boolean(patient);
  const today = getTodayDateString();

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const clientErrors = validatePatientForm(formData);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      age: Number(formData.age),
    };

    const result = await onSave(payload);
    if (!result.ok) {
      if (result.errors) {
        setErrors(result.errors);
      }
      if (result.error) {
        setServerError(result.error);
      }
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{isEditing ? "Edit Patient" : "Admit New Patient"}</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {serverError && <div className="alert-error">{serverError}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="patient-name">Patient Name *</label>
              <input
                id="patient-name"
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="patient-age">Age (0 - 120) *</label>
              <input
                id="patient-age"
                type="number"
                min="0"
                max="120"
                placeholder="e.g. 45"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
              />
              {errors.age && <span className="field-error">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="patient-gender">Gender *</label>
              <select
                id="patient-gender"
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <span className="field-error">{errors.gender}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="patient-ward">Ward *</label>
              <select
                id="patient-ward"
                value={formData.ward}
                onChange={(e) => handleChange("ward", e.target.value)}
              >
                <option value="">Select ward</option>
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              {errors.ward && <span className="field-error">{errors.ward}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="patient-department">Department *</label>
              <select
                id="patient-department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.department && (
                <span className="field-error">{errors.department}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="patient-doctor">Doctor *</label>
              <select
                id="patient-doctor"
                value={formData.doctor}
                onChange={(e) => handleChange("doctor", e.target.value)}
              >
                <option value="">Select doctor</option>
                {DOCTORS.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
              {errors.doctor && (
                <span className="field-error">{errors.doctor}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="patient-date">Admission Date *</label>
              <input
                id="patient-date"
                type="date"
                max={today}
                value={formData.admission_date}
                onChange={(e) => handleChange("admission_date", e.target.value)}
              />
              {errors.admission_date && (
                <span className="field-error">{errors.admission_date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="patient-status">Status *</label>
              <select
                id="patient-status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.status && (
                <span className="field-error">{errors.status}</span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Admit Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
