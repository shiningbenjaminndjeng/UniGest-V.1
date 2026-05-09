-- Supprimer les tables existantes (ordre inverse des dépendances)
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS evenements CASCADE;
DROP TABLE IF EXISTS etudiant_ue CASCADE;
DROP TABLE IF EXISTS professeur_ue CASCADE;
DROP TABLE IF EXISTS unites_enseignement CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS niveaux CASCADE;
DROP TABLE IF EXISTS filieres CASCADE;
DROP TABLE IF EXISTS facultes CASCADE;
DROP TABLE IF EXISTS annees_scolaires CASCADE;

-- ============================================
-- TABLE: ANNEES SCOLAIRES
-- ============================================
CREATE TABLE annees_scolaires (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(20) NOT NULL UNIQUE,       -- ex: "2024-2025"
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: FACULTES
-- ============================================
CREATE TABLE facultes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,          -- FLASH, FS, FMSB, FSE
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: FILIERES
-- ============================================
CREATE TABLE filieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    faculte_id INTEGER NOT NULL REFERENCES facultes(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: NIVEAUX (L1, L2, L3, M1, M2, Doctorat)
-- ============================================
CREATE TABLE niveaux (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,                 -- L1, L2, L3, M1, M2, DOCTORAT
    libelle VARCHAR(50) NOT NULL,
    ordre INTEGER NOT NULL                     -- pour trier (1=L1, 2=L2...)
);

-- ============================================
-- TABLE: USERS
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE,
    lieu_naissance VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rang VARCHAR(20) NOT NULL CHECK (rang IN ('etudiant', 'delegue', 'professeur')),
    matricule VARCHAR(50) UNIQUE,              -- unique, NULL si professeur
    niveau_id INTEGER REFERENCES niveaux(id), -- NULL si professeur
    filiere_id INTEGER REFERENCES filieres(id),
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    photo_url VARCHAR(255),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: UNITES D'ENSEIGNEMENT (UE / Cours)
-- ============================================
CREATE TABLE unites_enseignement (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    semestre INTEGER NOT NULL CHECK (semestre IN (1, 2)),
    filiere_id INTEGER NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
    niveau_id INTEGER NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: PROFESSEUR ↔ UE (un prof peut enseigner plusieurs UE)
-- ============================================
CREATE TABLE professeur_ue (
    id SERIAL PRIMARY KEY,
    professeur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ue_id INTEGER NOT NULL REFERENCES unites_enseignement(id) ON DELETE CASCADE,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id),
    UNIQUE(professeur_id, ue_id)
);

-- ============================================
-- TABLE: ETUDIANT ↔ UE (inscriptions)
-- ============================================
CREATE TABLE etudiant_ue (
    id SERIAL PRIMARY KEY,
    etudiant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ue_id INTEGER NOT NULL REFERENCES unites_enseignement(id) ON DELETE CASCADE,
    date_inscription TIMESTAMP DEFAULT NOW(),
    UNIQUE(etudiant_id, ue_id)
);

-- ============================================
-- TABLE: EVENEMENTS
-- ============================================
CREATE TABLE evenements (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50),                          -- evaluation, conference, fete, autre
    media_url VARCHAR(500),
    media_type VARCHAR(20),                    -- image, video, document
    filiere_id INTEGER NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
    niveau_id INTEGER NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    date_evenement TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: NOTES
-- ============================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('document', 'table', 'image')),
    contenu TEXT,                              -- JSON si table, URL si fichier
    filiere_id INTEGER NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
    niveau_id INTEGER NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    ue_id INTEGER REFERENCES unites_enseignement(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: DISCUSSIONS
-- ============================================
CREATE TABLE discussions (
    id SERIAL PRIMARY KEY,
    contenu TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('texte', 'vocal')),
    media_url VARCHAR(500),
    filiere_id INTEGER NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
    niveau_id INTEGER NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEX pour performances
-- ============================================
CREATE INDEX idx_users_filiere ON users(filiere_id);
CREATE INDEX idx_users_niveau ON users(niveau_id);
CREATE INDEX idx_users_rang ON users(rang);
CREATE INDEX idx_users_matricule ON users(matricule);
CREATE INDEX idx_ue_filiere_niveau ON unites_enseignement(filiere_id, niveau_id);
CREATE INDEX idx_evenements_filiere_niveau ON evenements(filiere_id, niveau_id);
CREATE INDEX idx_notes_filiere_niveau ON notes(filiere_id, niveau_id);
CREATE INDEX idx_discussions_filiere_niveau ON discussions(filiere_id, niveau_id);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Année scolaire active
INSERT INTO annees_scolaires (libelle, date_debut, date_fin, active) VALUES
('2024-2025', '2024-09-01', '2025-07-31', FALSE),
('2025-2026', '2025-09-01', '2026-07-31', TRUE),
('2026-2027', '2026-09-01', '2027-07-31', FALSE);

-- Niveaux
INSERT INTO niveaux (code, libelle, ordre) VALUES
('L1', 'Licence 1', 1),
('L2', 'Licence 2', 2),
('L3', 'Licence 3', 3),
('M1', 'Master 1', 4),
('M2', 'Master 2', 5),
('DOCTORAT', 'Cycle Doctorat', 6);

-- Facultés
INSERT INTO facultes (nom, code, description) VALUES
('Faculté des Arts, Lettres et Sciences Humaines', 'FLASH', 'Lettres, langues, sciences humaines et sociales'),
('Faculté des Sciences', 'FS', 'Sciences exactes et naturelles'),
('Faculté de Médecine et des Sciences Biomédicales', 'FMSB', 'Médecine, pharmacie et sciences biomédicales'),
('Faculté des Sciences de l''Éducation', 'FSE', 'Formation des enseignants et éducation');

-- Filières FLASH
INSERT INTO filieres (nom, code, faculte_id) VALUES
('Lettres Modernes', 'LM', (SELECT id FROM facultes WHERE code='FLASH')),
('Langues Étrangères', 'LE', (SELECT id FROM facultes WHERE code='FLASH')),
('Histoire', 'HIST', (SELECT id FROM facultes WHERE code='FLASH')),
('Géographie', 'GEO', (SELECT id FROM facultes WHERE code='FLASH')),
('Sociologie', 'SOCIO', (SELECT id FROM facultes WHERE code='FLASH')),
('Philosophie', 'PHILO', (SELECT id FROM facultes WHERE code='FLASH')),
('Tourisme et Hôtellerie', 'TH', (SELECT id FROM facultes WHERE code='FLASH')),
('Cinéma et Audiovisuel', 'CA', (SELECT id FROM facultes WHERE code='FLASH')),
('Urbanisme', 'URB', (SELECT id FROM facultes WHERE code='FLASH'));

-- Filières FS
INSERT INTO filieres (nom, code, faculte_id) VALUES
('Biochimie', 'BIOCH', (SELECT id FROM facultes WHERE code='FS')),
('Biologie et Physiologie Animales', 'BPA', (SELECT id FROM facultes WHERE code='FS')),
('Biologie et Physiologie Végétales', 'BPV', (SELECT id FROM facultes WHERE code='FS')),
('Chimie Inorganique', 'CHIMI', (SELECT id FROM facultes WHERE code='FS')),
('Chimie Organique', 'CHIMO', (SELECT id FROM facultes WHERE code='FS')),
('Informatique', 'INFO', (SELECT id FROM facultes WHERE code='FS')),
('Mathématiques', 'MATH', (SELECT id FROM facultes WHERE code='FS')),
('Microbiologie', 'MICRO', (SELECT id FROM facultes WHERE code='FS')),
('Physique', 'PHY', (SELECT id FROM facultes WHERE code='FS')),
('Sciences de la Terre', 'ST', (SELECT id FROM facultes WHERE code='FS'));

-- Filières FMSB
INSERT INTO filieres (nom, code, faculte_id) VALUES
('Études Médicales', 'MED', (SELECT id FROM facultes WHERE code='FMSB')),
('Études Pharmaceutiques', 'PHARMA', (SELECT id FROM facultes WHERE code='FMSB')),
('Soins Infirmiers', 'INF', (SELECT id FROM facultes WHERE code='FMSB')),
('Biologie Médicale', 'BIOMED', (SELECT id FROM facultes WHERE code='FMSB'));

-- Filières FSE
INSERT INTO filieres (nom, code, faculte_id) VALUES
('Sciences de l''Éducation', 'SED', (SELECT id FROM facultes WHERE code='FSE')),
('Psychologie de l''Éducation', 'PSYED', (SELECT id FROM facultes WHERE code='FSE')),
('Administration Scolaire', 'ADMIN', (SELECT id FROM facultes WHERE code='FSE'));

COMMIT;