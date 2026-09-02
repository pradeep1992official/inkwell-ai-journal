# Inkwell

A quiet, thoughtful AI reflection journal built with **React**, **Express**, **Firebase Authentication**, **Cloud Firestore**, and **Gemini 3.6 Flash**.

Inkwell pairs the warmth of personal journaling with the analytical and empathetic perspective of Gemini AI, featuring 5 selectable themes, multi-tier typography scaling, internationalization across 5 languages, multi-turn reflective dialogue, executive insights extraction, and strict owner-bound Firestore persistence.

---

## Key Features & Settings

1. **User Identity & Federated Authentication**: Seamless Google Sign-In with Firebase Auth. Passwords and credentials are never handled by custom application code.
2. **Settings Panel (Modal / Slide-Over)**:
   - **5 Selectable Themes**:
     - **Light**: Clean neutral light canvas with calm blue accents (`#1A73E8`).
     - **Dark**: Warm ink-toned charcoal (`#1A1614`) with rich amber highlights (`#E8A33D`).
     - **Paper**: Cream parchment (`#FAF6EF`) with terracotta tones (`#B8722E`) and classic notebook warmth.
     - **Vellum**: Aged sepia (`#EFE6D8`) with warm burnt-orange accents (`#A8623B`) for a vintage tactile feel.
     - **Vivid**: High-energy canvas (`#F5F3FF`) with electric violet (`#7C5CFF`) and vibrant coral accents.
   - **3 Font Size Scales**:
     - **Small**: Compact density for high-information reading.
     - **Medium**: Balanced default scale for comfortable daily reflection.
     - **Large**: Spacious, high-legibility scale for relaxed reading.
   - **5-Language Internationalization (i18n)**: Full UI chrome translation for **English (en)**, **Spanish (es)**, **French (fr)**, **Hindi (hi)**, and **Tamil (ta)**.
3. **Cross-Device Firestore Settings Persistence**: User settings and preferences are synchronized to `/users/{userId}/settings/preferences`, following users across devices and login sessions.
4. **Strict User Isolation in Firestore**: Reflections stored at `/users/{userId}/entries/{entryId}` with owner-bound access rules (`request.auth.uid == userId`).
5. **Resilient Model Fallback Ladder**: High-availability AI generation wrapped with a 4-tier model fallback ladder:
   - Primary: `gemini-3.6-flash`
   - Fallback 1: `gemini-3.1-flash-lite`
   - Fallback 2: `gemini-flash-latest`
   - Fallback 3: `gemini-3.7-flash`
6. **Server-Side Secret Management**: Gemini API and Google Places API calls are securely proxied through the Express backend; secret keys are never exposed to client browsers.
7. **Zero-Crash Payload Hygiene**: Recursive `undefined`-stripping before saving to Firestore to protect against driver rejections.
8. **Location Memory (Opt-In Place Tagging & City Browsing)**:
   - **Privacy-First Tagging**: Manual, explicit place attachment using Google Places Autocomplete API.
   - **My Memories Hub**: Group and browse reflections by city/locality without leaking exact private GPS coordinates unless opted-in.
   - **Vault Search Integration**: Instant search across journal vault by place name or locality.
9. **Ambient Weather & Atmospheric Reflections (Open-Meteo Integration)**:
   - **Privacy-First Weather Derivation**: Fetches current ambient weather (condition, temperature, humidity) using the Open-Meteo API without storing raw GPS coordinates unless opted in.
   - **Settings Toggle & Historical Backfill**: Enable/disable automatic weather in Settings, plus a one-click backfill tool to enrich past reflections that have tagged cities or places with historical weather data.
   - **Writing Pattern Insights**: Mood Trends view surfaces observational correlations between ambient weather conditions, entry length, and emotional state.

---

## 1. Prerequisites & GCP API Setup

Ensure the following Google Cloud APIs are enabled in your GCP project:

```bash
# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Manager Configuration

Store your Gemini API key in Google Cloud Secret Manager and grant your Cloud Run compute service account access:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant your Cloud Run service account access to read the secret
# Replace YOUR_PROJECT_NUMBER with your actual Google Cloud Project Number
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Firestore Security Rules

Deploy the following security rules in your `firestore.rules` to enforce strict owner-bound isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User reflections and journal entries
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User preferences and settings
      match /settings/{settingDoc} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the application to Google Cloud Run:

```bash
# Deploy to Cloud Run from source with Secret Manager binding
gcloud run deploy inkwell \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Campaign Labeling (Verification Requirement)

Apply the mandatory challenge campaign resource label:

```bash
gcloud run services update inkwell \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Functional Walkthrough & Verification Steps

| Test ID | Interaction / Flow | Expected System Outcome |
| :--- | :--- | :--- |
| **TC-01** | Open Settings Panel via Gear Icon in Navbar | Modal opens displaying Theme Canvas (5 choices), Font Size (3 choices), and Interface Language (5 choices). |
| **TC-02** | Select "Paper", "Vellum", or "Vivid" Theme | Immediate visual palette and typography update across all UI elements; selection persists to Firestore `/users/{userId}/settings/preferences`. |
| **TC-03** | Select "Small", "Medium", or "Large" Font Size | Reading and reflection typography scales proportionally across the entire app interface. |
| **TC-04** | Change Language to Spanish, French, Hindi, or Tamil | All navigation, buttons, placeholders, dialogs, and labels translate immediately into the selected language. |
| **TC-05** | Quick Theme Toggle in Navbar (Sun/Moon) | Instantly alternates between Dark and Light while saving preference to cloud profile. |
| **TC-06** | Google Sign-In Authentication | Initiates Firebase Google popup, provisions user session, and fetches isolated reflections and saved preferences. |
| **TC-07** | Write & Send Reflection in Any Mode | Messages are securely saved in real time to `/users/{userId}/entries/{entryId}` and processed with Gemini 3.6 Flash fallback ladder. |
| **TC-08** | Executive Insights Extraction | Clicking "Insights" generates reflection synthesis, key realizations, and emotional tone with instant copyable summary. |
| **TC-09** | Tag Location via Google Places Modal | Tapping the "Location" button in the reflection editor opens the location search modal; selecting a place stores its name, locality, and address in the entry metadata. |
| **TC-10** | Browse Reflections by City in "My Memories" | Opening "My Memories" from the sidebar or profile menu displays grouped cards by city/locality with count pills, mood badges, and direct reflection links. |
| **TC-11** | Vault Search by Place / Locality | Typing a city name (e.g. "Coimbatore", "San Francisco") into the journal vault search immediately filters entries matching the tagged place. |
| **TC-12** | Ambient Weather Display & Opt-In | Opening a new reflection with location access displays an ambient weather badge (emoji + temperature + humidity) in the toolbar and saves it to metadata. |
| **TC-13** | Ambient Weather Toggle in Settings | Toggling off "Ambient Weather & Context" in Settings disables automatic ambient weather detection across new entries. |
| **TC-14** | Historical Weather Backfill | Clicking "Add Weather" under Settings triggers batch backfilling via Open-Meteo Archive API for all past entries with tagged places, showing live progress. |
| **TC-15** | Weather-Mood Correlative Insights | Opening Mood Trends shows atmospheric breakdown cards correlating weather conditions with word count and primary moods. |

