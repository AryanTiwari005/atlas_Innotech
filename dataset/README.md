# 📂 Forensic Evidence Datasets

The `dataset/` directory contains structured, realistic forensic investigation datasets used to benchmark graph ingestion, pattern detection, cross-case link discovery, and blockchain evidence integrity verification.

---

## 📁 Directory Contents

```
dataset/
├── case_001_homicide.json   # Multi-source homicide case (FIR, CDR, Bank, CCTV)
├── case_002_fraud.json      # Corporate money laundering & Hawala fraud ring
├── case_003_fictional_cargo_diversion.json # Synthetic training case (FIR, CDR, Bank, CCTV)
├── envelope_sample.json     # Standard streaming event envelope schema
└── README.md                # This guide
```

---

## 🔍 Dataset Breakdown

### 1. `case_001_homicide.json` (Homicide Investigation)
- **Case Summary**: A targeted homicide involving coordinated syndicate operatives, vehicle convoys, and burner SIM cards.
- **Evidence Streams**:
  - **FIR Data**: Case registration, incident date, police station jurisdiction, IPC sections.
  - **Call Detail Records (CDR)**: Timestamps, caller/receiver MSISDNs, duration, and cell tower IDs.
  - **Hardware Identifiers**: IMEI numbers linking suspects who swap SIM cards on shared physical devices.
  - **Bank Transactions**: Rapid fund transfers preceding the incident window.
  - **CCTV Sightings**: Automated number plate recognition (ANPR) logs tracking suspect vehicles at key intersections.

### 2. `case_002_fraud.json` (Corporate Fraud & Hawala Ring)
- **Case Summary**: Large-scale financial embezzlement and money laundering across multiple jurisdiction bank accounts.
- **Evidence Streams**:
  - **Corporate Entities**: Shell companies, registered physical business addresses, and dummy directors.
  - **Mule Bank Accounts**: High-velocity layer-and-integrate wire transfers.
  - **Cross-Case Overlap**: Shared phone numbers and bank accounts connecting directly to individuals in `case_001_homicide.json`. This proves the platform's ability to reveal multi-case syndicates automatically.

### 3. `case_003_fictional_cargo_diversion.json` (Synthetic Training Example)
- **Case Summary**: A fictional cargo-diversion scenario with connected people, phones, accounts, a vehicle, location, calls, transaction, surveillance note, and source records.
- **Safety**: Names, identifiers, references, and allegations are fabricated for software testing; do not treat them as real evidence.
- **Purpose**: Use this as a complete example when testing manual case ingestion. It is separate from the cross-case-linked first two sample cases.

### 4. `envelope_sample.json` (Streaming Event Envelope)
- **Schema**: Standardized streaming event envelope format for operational law enforcement feeds.
- **Fields**: `event_id`, `timestamp`, `event_type` (`FIR`, `ARREST`, `SEIZURE`, `CDR_CALL`, `TRANSACTION`), `case_id`, `data` payload, and `audit` fields.

---

## 📥 How to Ingest Datasets

### Option A: Via Web UI
1. Open the dashboard at [http://localhost:8002/](http://localhost:8002/).
2. Click **Data Ingestion** in the navigation.
3. Click **Select Files** (or drag the file into the upload area) and choose `case_003_fictional_cargo_diversion.json`.
4. The dashboard uploads and ingests the selected file; check the **Ingestion Summary** for the result.

To create your own structured case JSON, start from `case_003_fictional_cargo_diversion.json`. Give it a unique `case_metadata.case_id` and case name, then replace the synthetic details with information you are authorized to enter. Keep the JSON field names and nesting unchanged; optional entity and evidence lists may be empty.

### Option B: Via Terminal (PowerShell)
```powershell
# Ingest Case 001
Invoke-RestMethod -Uri "http://localhost:8002/api/cases/ingest" `
  -Method Post `
  -InFile "dataset/case_001_homicide.json" `
  -ContentType "application/json"

# Ingest Case 002 (Cross-Case Linking)
Invoke-RestMethod -Uri "http://localhost:8002/api/cases/ingest" `
  -Method Post `
  -InFile "dataset/case_002_fraud.json" `
  -ContentType "application/json"
```

### Option C: Via cURL
```bash
curl -X POST "http://localhost:8002/api/cases/ingest" \
  -H "Content-Type: application/json" \
  -d @dataset/case_001_homicide.json
```
