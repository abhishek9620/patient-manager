import os
import re
import sqlite3
from contextlib import closing
from datetime import date, datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database file stored on disk so patient records persist across server restarts
DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "patients.db")

# Allowed dropdown options (kept in sync with frontend/src/constants.js)
ALLOWED_GENDERS = ["Male", "Female", "Other"]
ALLOWED_WARDS = ["General Ward", "ICU", "Emergency", "Surgical Ward", "Maternity", "Pediatrics"]
ALLOWED_DEPARTMENTS = [
    "General Medicine",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Surgery",
    "Gynecology",
]
ALLOWED_DOCTORS = [
    "Dr. Aarav Sharma",
    "Dr. Priya Nair",
    "Dr. Rohan Verma",
    "Dr. Sneha Iyer",
    "Dr. Vikram Patel",
    "Dr. Ananya Rao",
]
ALLOWED_STATUSES = ["Admitted", "Discharged"]

# Letters and single/multiple spaces only (no digits or special characters)
NAME_PATTERN = re.compile(r"^[A-Za-z ]+$")


def get_db_path():
    """Return the configured SQLite database path."""
    return os.environ.get("DATABASE_PATH", DEFAULT_DB_PATH)


def get_connection():
    """Open a SQLite connection that returns rows as dictionaries."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the patients table if needed and seed initial sample data once."""
    with closing(get_connection()) as conn:
        table_exists = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='patients'"
        ).fetchone()

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT NOT NULL,
                ward TEXT NOT NULL,
                department TEXT NOT NULL,
                doctor TEXT NOT NULL,
                admission_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Admitted'
            )
            """
        )

        # Seed sample records only on first-ever database creation
        if not table_exists:
            today_str = date.today().isoformat()
            sample_patients = [
                ("Ramesh Kumar", 54, "Male", "ICU", "Cardiology", "Dr. Aarav Sharma", today_str, "Admitted"),
                ("Meera Joshi", 32, "Female", "Maternity", "Gynecology", "Dr. Priya Nair", today_str, "Admitted"),
                ("Arjun Mehta", 19, "Male", "Emergency", "Orthopedics", "Dr. Rohan Verma", today_str, "Admitted"),
                ("Kavita Nair", 67, "Female", "General Ward", "General Medicine", "Dr. Sneha Iyer", today_str, "Discharged"),
            ]
            conn.executemany(
                """
                INSERT INTO patients (name, age, gender, ward, department, doctor, admission_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                sample_patients,
            )
        conn.commit()


def validate_patient_data(data, is_update=False):
    """
    Validate patient fields on the backend.
    Returns (cleaned_data, errors_dict).
    """
    errors = {}

    if not isinstance(data, dict):
        return None, {"general": "Request body must be a JSON object."}

    # 1. Name: required, letters and spaces only
    raw_name = data.get("name", "")
    name = raw_name.strip() if isinstance(raw_name, str) else ""
    if not name:
        errors["name"] = "Name is required."
    elif not NAME_PATTERN.match(name):
        errors["name"] = "Name must contain letters only (no numbers or special characters)."

    # 2. Age: required, whole number between 0 and 120
    raw_age = data.get("age")
    age = None
    if raw_age is None or raw_age == "":
        errors["age"] = "Age is required."
    elif isinstance(raw_age, bool):
        errors["age"] = "Age must be a number between 0 and 120."
    else:
        try:
            # Reject decimals like "25.5" by checking float vs int
            age_num = float(raw_age)
            if not age_num.is_integer():
                errors["age"] = "Age must be a whole number between 0 and 120."
            else:
                age = int(age_num)
                if age < 0 or age > 120:
                    errors["age"] = "Age must be between 0 and 120."
        except (TypeError, ValueError):
            errors["age"] = "Age must be a valid number between 0 and 120."

    # 3. Gender, Ward, Department, Doctor: required, must be in allowed lists
    select_fields = [
        ("gender", "Gender", ALLOWED_GENDERS),
        ("ward", "Ward", ALLOWED_WARDS),
        ("department", "Department", ALLOWED_DEPARTMENTS),
        ("doctor", "Doctor", ALLOWED_DOCTORS),
    ]
    cleaned_selects = {}
    for key, label, allowed_values in select_fields:
        value = data.get(key, "")
        value = value.strip() if isinstance(value, str) else ""
        if not value:
            errors[key] = f"{label} is required."
        elif value not in allowed_values:
            errors[key] = f"{label} must be selected from the allowed list."
        else:
            cleaned_selects[key] = value

    # 4. Admission Date: required, valid YYYY-MM-DD, cannot be a future date
    raw_date = data.get("admission_date", "")
    admission_date = raw_date.strip() if isinstance(raw_date, str) else ""
    if not admission_date:
        errors["admission_date"] = "Admission date is required."
    else:
        try:
            parsed_date = datetime.strptime(admission_date, "%Y-%m-%d").date()
            if parsed_date > date.today():
                errors["admission_date"] = "Admission date cannot be a future date."
        except ValueError:
            errors["admission_date"] = "Admission date must be a valid date (YYYY-MM-DD)."

    # 5. Status: defaults to 'Admitted' on create, validated against allowed statuses
    raw_status = data.get("status")
    if raw_status is None or raw_status == "":
        status = "Admitted"
    elif isinstance(raw_status, str) and raw_status.strip() in ALLOWED_STATUSES:
        status = raw_status.strip()
    else:
        errors["status"] = "Status must be either Admitted or Discharged."
        status = "Admitted"

    if errors:
        return None, errors

    cleaned = {
        "name": " ".join(name.split()),
        "age": age,
        "gender": cleaned_selects["gender"],
        "ward": cleaned_selects["ward"],
        "department": cleaned_selects["department"],
        "doctor": cleaned_selects["doctor"],
        "admission_date": admission_date,
        "status": status if is_update or raw_status else "Admitted",
    }
    return cleaned, {}


def error_response(errors, status_code=400):
    """Format validation errors with both a clear summary message and field map."""
    first_message = next(iter(errors.values()), "Invalid input data.")
    return jsonify({"error": first_message, "errors": errors}), status_code


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})


@app.route("/api/options", methods=["GET"])
def get_options():
    return jsonify(
        {
            "genders": ALLOWED_GENDERS,
            "wards": ALLOWED_WARDS,
            "departments": ALLOWED_DEPARTMENTS,
            "doctors": ALLOWED_DOCTORS,
            "statuses": ALLOWED_STATUSES,
        }
    )


@app.route("/api/patients", methods=["GET"])
def list_patients():
    search = request.args.get("search", "").strip()
    ward = request.args.get("ward", "").strip()
    department = request.args.get("department", "").strip()
    doctor = request.args.get("doctor", "").strip()

    query = "SELECT * FROM patients WHERE 1=1"
    params = []

    if search:
        query += " AND LOWER(name) LIKE ?"
        params.append(f"%{search.lower()}%")
    if ward:
        query += " AND ward = ?"
        params.append(ward)
    if department:
        query += " AND department = ?"
        params.append(department)
    if doctor:
        query += " AND doctor = ?"
        params.append(doctor)

    query += " ORDER BY id DESC"

    with closing(get_connection()) as conn:
        rows = conn.execute(query, params).fetchall()

    return jsonify([dict(row) for row in rows])


@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json(silent=True)
    cleaned, errors = validate_patient_data(data, is_update=False)
    if errors:
        return error_response(errors, 400)

    with closing(get_connection()) as conn:
        cursor = conn.execute(
            """
            INSERT INTO patients (name, age, gender, ward, department, doctor, admission_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cleaned["name"],
                cleaned["age"],
                cleaned["gender"],
                cleaned["ward"],
                cleaned["department"],
                cleaned["doctor"],
                cleaned["admission_date"],
                cleaned["status"],
            ),
        )
        conn.commit()
        new_patient = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return jsonify(dict(new_patient)), 201


@app.route("/api/patients/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    data = request.get_json(silent=True)
    cleaned, errors = validate_patient_data(data, is_update=True)
    if errors:
        return error_response(errors, 400)

    with closing(get_connection()) as conn:
        existing = conn.execute(
            "SELECT id FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "Patient not found."}), 404

        conn.execute(
            """
            UPDATE patients
            SET name = ?, age = ?, gender = ?, ward = ?, department = ?,
                doctor = ?, admission_date = ?, status = ?
            WHERE id = ?
            """,
            (
                cleaned["name"],
                cleaned["age"],
                cleaned["gender"],
                cleaned["ward"],
                cleaned["department"],
                cleaned["doctor"],
                cleaned["admission_date"],
                cleaned["status"],
                patient_id,
            ),
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()

    return jsonify(dict(updated))


@app.route("/api/patients/<int:patient_id>/discharge", methods=["PATCH"])
def discharge_patient(patient_id):
    with closing(get_connection()) as conn:
        existing = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "Patient not found."}), 404

        conn.execute(
            "UPDATE patients SET status = 'Discharged' WHERE id = ?", (patient_id,)
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()

    return jsonify(dict(updated))


@app.route("/api/patients/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    with closing(get_connection()) as conn:
        existing = conn.execute(
            "SELECT id FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
        if not existing:
            return jsonify({"error": "Patient not found."}), 404

        conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        conn.commit()

    return jsonify({"message": "Patient deleted successfully.", "id": patient_id})


# Initialize database when app module loads (works for both `python app.py` and gunicorn)
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
