# 📖 OpenZupu Digital Genealogy Management System — User Guide (Clan Associations & Archives Edition)

Welcome to **OpenZupu**, an open-source digital genealogy management and verification system! This system is specifically designed for **clan associations, family councils, local archives, and history offices** to convert fragile, paper-based genealogies into secure, permanent, and searchable digital databases.

This guide is written in plain, non-technical language to help you get started without any programming experience.

---

## 📌 Table of Contents
1. [Core Concepts](#1-core-concepts)
2. [Daily Usage: Creating Projects & Setup](#2-daily-usage-creating-projects--setup)
3. [Core Operations: Adding Persons & Building Kinship](#3-core-operations-adding-persons--building-kinship)
4. [Advanced Features: Sources & OCR Text Extraction](#4-advanced-features-sources--ocr-text-extraction)
5. [Data Layout: Pedigrees & Printing](#5-data-layout-pedigrees--printing)
6. [Frequently Asked Questions (FAQ)](#6-frequently-asked-questions-faq)
7. [Technical Appendix: Deployment Guide](#7-technical-appendix-deployment-guide)

---

## 1. Core Concepts

Understanding these basic terms will help you navigate the system:
*   **Project**: Represents **a single, independent pedigree book** (e.g., *Li Clan Genealogy - Southern Branch*). You can create multiple projects for separate branches.
*   **Person**: An individual in the family tree.
*   **Kinship Relation**: The relationship linking individuals (e.g., father, mother, spouse, etc.).
*   **Source**: The historical evidence for the records you enter (e.g., an old paper book page, a gravestone inscription, or an ancestral hall stone carving).
*   **Revision**: Any modifications are tracked as versions, making it easy to see "who changed what and when."

---

## 2. Daily Usage: Creating Projects & Setup

### Step 1: Sign Up & Log In
1. Open your browser and navigate to the system URL provided by your administrator.
2. Click **"Sign Up"**, then fill in your username, email, and password.
   > [!IMPORTANT]
   > Keep your password secure to prevent unauthorized changes to your family records.
3. Log in with your registered credentials.

### Step 2: Create a "New Pedigree Book"
1. In the main dashboard, click **"New Project"**.
2. Type in a name (e.g., `Zhang Clan Genealogy - Xuancheng Branch`) and its description.
3. Click submit to enter the project administration panel.

---

## 3. Core Operations: Adding Persons & Building Kinship

### Adding a Person
Under your project page, click **"Add Person"** to enter their details:
1.  **Name**: The system separates Surname (e.g., `Zhang`) and Given Name (e.g., `Haoran`) for structured sorting.
2.  **Generation & Character**: If the person has a generation name/character, record it to distinguish them from relatives with similar names.
3.  **Gender**: Select Male, Female, or Unknown.
4.  **Birth & Death Dates (Supports Non-standard Dates)**:
    *   In addition to standard Gregorian dates (like `1920-05-12`), the system supports **traditional text descriptions** (e.g., `Late Qing Dynasty - Guangxu 30th year`).
    *   Toggle **"Is Living"**. Unchecking it marks the ancestor as deceased.
5.  **Places**: Record native places, residences, or burial locations.
6.  **🖼️ Multimedia Portraits (V1.4)**:
    *   On the top left of the person details profile card, click **"Upload Photo"**.
    *   Select an image file. The system will encode it to a highly-compatible Base64 string and save it to the database.
    *   The uploaded photo will render in the person profile card and tree nodes. Click **"Delete"** to remove it.

### Creating a Parent-Child or Marriage Chain
OpenZupu makes establishing relationships simple:
1.  Go to the **"Kinship Relations"** panel, click **"Add Relation"**.
2.  **Select Source & Target**: e.g., Source: `Zhang Jianguo` -> Target: `Zhang Xiaoming`.
3.  **Select Relationship Type**:
    *   `BIOLOGICAL_CHILD_OF` (Biological child)
    *   `SPOUSE_OF` (Spouse / Husband & Wife)
    *   `ADOPTED_TO` (Adopted / Heired to uncle/branch)
4.  Click save. The system automatically computes siblings, grandparents, and cousin relations.

---

## 4. Advanced Features: Sources & OCR Text Extraction

### Managing Sources (Proof)
Good genealogies require evidence. Link historical sources to individuals:
1.  Create a source in **"Sources"** (e.g., *Lin Clan Pedigree, Vol 3, Page 12*).
2.  Link this source when creating or updating a person profile.
3.  Future researchers will instantly see the source references, raising the scholarly value of the database.

### Scanned Book Character Extraction (OCR)
If you have photos of scanned traditional Chinese books, you can use the built-in OCR tool:
1.  Click **"New OCR Task"** and upload a photo of the book page.
2.  The background processor will extract Simplified and Traditional Chinese characters.
3.  Copy and paste the output text directly into biography notes, saving hours of manual typing.

---

## 5. Data Layout: Pedigrees & Printing

### Generating Trees
1.  Go to **"Family Tree View"**.
2.  Enter the name of a root ancestor (e.g., `Zhang Shouren`).
3.  The system renders an interactive **Descendant Tree** or **Ancestry Tree** showing circular avatars and biological lifespans.
4.  **🪭 SVG Concentric Fan Chart (V1.6)**:
    *   Select **"Fan Chart"** in the subtabs. The system will render a beautiful concentric radial fan diagram centered around the selected root ancestor.
    *   The concentric rings propagate outwards to represent children, grandchildren, and great-grandchildren, with hover triggers highlighting the lineages. Click on any slice to navigate directly to their profile card.

### 🏮 Chinese Vertical Pedigrees & Printing (V1.5)
For printing lineage charts, the system provides traditional vertical right-to-left layout exports:
1.  In "Family Tree View", choose **"Su-Style Pedigree"** (Vertical Tree) or **"Ou-Style Registry"** (Vertical Columns).
2.  **🏮 Su-Style Pedigree**: Mimics classic "行序版" folding books. Text is written vertically and generations flow from right to left.
3.  **📜 Ou-Style Registry**: Mimics the narrative "房志版" book columns. Renders details of each individual (Courtesy names, parents, spouses, children, biographies) in red-bordered columns flowing right-to-left.
4.  **⚙️ Filter Settings**:
    *   **Branch Founder**: Select a specific ancestor branch to print, avoiding cluttered displays.
    *   **Generation Range**: Input starting and ending generations (e.g., Gen 12 to 15).
    *   **Privacy Filter**: Exclude living members to protect modern privacy.
5.  **🖨️ Print to Paper / PDF**:
    *   Set your filters and click **"Print Pedigree Layout"**.
    *   The browser print preview will launch. Sidebars, headers, and buttons are hidden. The page layout automatically scales to fit standard **A4 landscape printing**.

### 📊 Statistics Dashboard & Migration Timeline (V1.6)
OpenZupu incorporates premium analytical dashboards and geospatial tracking features:
1.  **📊 Statistics Dashboard**:
    *   Click the **"Statistics"** tab to access the dashboard.
    *   The system calculates: total members in the book, DNA sample coverage, average lifespan (calculated from deceased ancestors with verified birth/death years), and generational range.
    *   Includes interactive charts for gender distribution ratios, member counts per generation, and a tabular Y-DNA and mtDNA haplogroup breakdown.
2.  **🗺️ Migration Timeline**:
    *   Click the **"Migration"** tab. The system aggregates all birthplaces, residences, and burial locations.
    *   These locations are sorted chronologically in a vertical family timeline with detailed generation markers and dates.
    *   Clicking a name in the migration timeline redirects to their biography sheet, providing a geo-historical record of how the clan branches migrated across regions.

---

## 6. Frequently Asked Questions (FAQ)

#### Q1: A person's birth date is unknown, e.g. " sekitar Daoguang era". How do I input this?
*   **A**: You can leave the birth date empty and type the approximate time in the "Notes" or "Biography" fields.

#### Q2: How do I handle adoptions (A-to-B heirs)?
*   **A**: Link the child to their adoptive parents using `ADOPTIVE_FATHER_OF` / `ADOPTIVE_MOTHER_OF` relations, and their biological parents using biological relations. The system Y-DNA logic will match them correctly.

#### Q3: Will simultaneous logins mess up the data?
*   **A**: No. The database handles transaction locks and keeps all history changes recorded safely in versions.

---

## 7. Technical Appendix: Deployment Guide

Administrators can deploy the system locally or on a private server using these quick steps:

### Prerequisites
*   [Docker](https://www.docker.com/)
*   [Docker Compose](https://docs.docker.com/compose/)

### Simple Steps
1.  Download and unpack the code.
2.  Create a `.env` file in the directory containing `docker-compose.yml`:
    ```env
    JWT_SECRET=zupu-secure-secret-key-change-me
    DATABASE_URL="file:./dev.db"
    PORT=3000
    ```
3.  Run the command:
    ```bash
    docker-compose up -d --build
    ```
4.  Access the system in your browser at `http://localhost:3000`. All data is stored in the local SQLite database.
