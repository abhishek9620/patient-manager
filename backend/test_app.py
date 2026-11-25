import os
import tempfile
import unittest
from datetime import date, timedelta

# Point DATABASE_PATH to a temp file before importing app
TEMP_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
TEMP_DB.close()
os.environ["DATABASE_PATH"] = TEMP_DB.name

import app as backend  # noqa: E402


class PatientApiTests(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEMP_DB.name):
            os.remove(TEMP_DB.name)
        backend.init_db()
        self.client = backend.app.test_client()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEMP_DB.name):
            os.remove(TEMP_DB.name)

    def valid_payload(self, **overrides):
        data = {
            "name": "Sonia Kapoor",
            "age": 29,
            "gender": "Female",
            "ward": "General Ward",
            "department": "Cardiology",
            "doctor": "Dr. Aarav Sharma",
            "admission_date": date.today().isoformat(),
            "status": "Admitted",
        }
        data.update(overrides)
        return data

    def test_health_and_initial_seed(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        patients = self.client.get("/api/patients").get_json()
        self.assertEqual(len(patients), 4)

    def test_create_and_persist_after_restart(self):
        res = self.client.post("/api/patients", json=self.valid_payload())
        self.assertEqual(res.status_code, 201)
        created = res.get_json()
        self.assertEqual(created["name"], "Sonia Kapoor")
        self.assertEqual(created["status"], "Admitted")

        # Simulate server restart by re-calling init_db()
        backend.init_db()
        patients = self.client.get("/api/patients").get_json()
        names = [p["name"] for p in patients]
        self.assertIn("Sonia Kapoor", names)
        self.assertEqual(len(patients), 5)

    def test_validation_rejects_invalid_inputs(self):
        invalid_cases = [
            {"name": ""},
            {"name": "John123"},
            {"name": "Jane@Doe"},
            {"age": ""},
            {"age": -1},
            {"age": 121},
            {"age": "abc"},
            {"age": 25.5},
            {"gender": "Unknown"},
            {"ward": "VIP Suite"},
            {"department": "Dental"},
            {"doctor": "Dr. Nobody"},
            {"admission_date": ""},
            {"admission_date": "not-a-date"},
            {"admission_date": (date.today() + timedelta(days=1)).isoformat()},
        ]
        for bad_fields in invalid_cases:
            res = self.client.post("/api/patients", json=self.valid_payload(**bad_fields))
            self.assertEqual(res.status_code, 400, f"Expected 400 for {bad_fields}")
            body = res.get_json()
            self.assertIn("error", body)
            self.assertTrue(len(body["error"]) > 0)

    def test_search_and_filters(self):
        self.client.post(
            "/api/patients",
            json=self.valid_payload(name="Anil Verma", ward="ICU", department="Neurology", doctor="Dr. Vikram Patel"),
        )
        res = self.client.get("/api/patients?search=anil&ward=ICU&department=Neurology&doctor=Dr. Vikram Patel")
        self.assertEqual(res.status_code, 200)
        results = res.get_json()
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Anil Verma")

    def test_edit_discharge_and_delete(self):
        created = self.client.post("/api/patients", json=self.valid_payload()).get_json()
        pid = created["id"]

        # Edit
        res = self.client.put(
            f"/api/patients/{pid}",
            json=self.valid_payload(name="Sonia Sharma", age=30, ward="ICU"),
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["name"], "Sonia Sharma")
        self.assertEqual(res.get_json()["age"], 30)

        # Discharge
        res = self.client.patch(f"/api/patients/{pid}/discharge")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "Discharged")

        # Delete
        res = self.client.delete(f"/api/patients/{pid}")
        self.assertEqual(res.status_code, 200)

        # Confirm deleted
        patients = self.client.get("/api/patients").get_json()
        self.assertFalse(any(p["id"] == pid for p in patients))


if __name__ == "__main__":
    unittest.main()
