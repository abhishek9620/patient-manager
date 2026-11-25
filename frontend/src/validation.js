import { DEPARTMENTS, DOCTORS, GENDERS, STATUSES, WARDS } from "./constants";

const NAME_REGEX = /^[A-Za-z ]+$/;

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validatePatientForm(values) {
  const errors = {};

  // 1. Name: required, letters and spaces only
  const trimmedName = (values.name || "").trim();
  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (!NAME_REGEX.test(trimmedName)) {
    errors.name = "Name must contain letters only (no numbers or symbols).";
  }

  // 2. Age: required, whole number between 0 and 120
  const rawAge = String(values.age ?? "").trim();
  if (rawAge === "") {
    errors.age = "Age is required.";
  } else {
    const numAge = Number(rawAge);
    if (!Number.isInteger(numAge) || numAge < 0 || numAge > 120) {
      errors.age = "Age must be a whole number between 0 and 120.";
    }
  }

  // 3. Required select fields from allowed lists
  if (!GENDERS.includes(values.gender)) {
    errors.gender = "Please select a valid gender.";
  }
  if (!WARDS.includes(values.ward)) {
    errors.ward = "Please select a valid ward.";
  }
  if (!DEPARTMENTS.includes(values.department)) {
    errors.department = "Please select a valid department.";
  }
  if (!DOCTORS.includes(values.doctor)) {
    errors.doctor = "Please select a valid doctor.";
  }

  // 4. Admission Date: required, cannot be in the future
  if (!values.admission_date) {
    errors.admission_date = "Admission date is required.";
  } else if (values.admission_date > getTodayDateString()) {
    errors.admission_date = "Admission date cannot be a future date.";
  }

  // 5. Status: Admitted or Discharged
  if (!STATUSES.includes(values.status)) {
    errors.status = "Please select a valid status.";
  }

  return errors;
}
