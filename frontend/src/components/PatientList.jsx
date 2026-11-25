export default function PatientList({
  patients,
  loading,
  onEdit,
  onDelete,
  onDischarge,
}) {
  if (loading) {
    return <div className="empty-state">Loading patients...</div>;
  }

  if (patients.length === 0) {
    return (
      <div className="empty-state">
        <p>No patients match your search or filters.</p>
      </div>
    );
  }

  function renderStatusBadge(status) {
    const isAdmitted = status === "Admitted";
    return (
      <span className={`badge ${isAdmitted ? "badge-admitted" : "badge-discharged"}`}>
        {status}
      </span>
    );
  }

  function renderActions(patient) {
    return (
      <div className="action-buttons">
        {patient.status === "Admitted" && (
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={() => onDischarge(patient)}
          >
            Discharge
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onEdit(patient)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-sm btn-danger-outline"
          onClick={() => onDelete(patient)}
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="table-wrapper">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Ward</th>
              <th>Department</th>
              <th>Doctor</th>
              <th>Admission Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="patient-name-cell">{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.ward}</td>
                <td>{patient.department}</td>
                <td>{patient.doctor}</td>
                <td>{patient.admission_date}</td>
                <td>{renderStatusBadge(patient.status)}</td>
                <td>{renderActions(patient)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-cards">
        {patients.map((patient) => (
          <div key={patient.id} className="patient-card">
            <div className="patient-card-top">
              <div>
                <h3 className="patient-card-name">{patient.name}</h3>
                <p className="patient-card-sub">
                  {patient.age} yrs • {patient.gender}
                </p>
              </div>
              {renderStatusBadge(patient.status)}
            </div>

            <div className="patient-card-details">
              <div>
                <span className="detail-label">Ward:</span> {patient.ward}
              </div>
              <div>
                <span className="detail-label">Department:</span>{" "}
                {patient.department}
              </div>
              <div>
                <span className="detail-label">Doctor:</span> {patient.doctor}
              </div>
              <div>
                <span className="detail-label">Admitted:</span>{" "}
                {patient.admission_date}
              </div>
            </div>

            <div className="patient-card-actions">{renderActions(patient)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
