-- ============================================
-- MIGRATION V2 — Nouvelles fonctionnalités
-- ============================================

-- Documents de cours (liés aux UE)
CREATE TABLE IF NOT EXISTS cours_documents (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    fichier_url VARCHAR(500) NOT NULL,
    fichier_type VARCHAR(50),
    fichier_nom VARCHAR(200),
    taille INTEGER,
    ue_id INTEGER NOT NULL REFERENCES unites_enseignement(id) ON DELETE CASCADE,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id),
    niveau_id INTEGER NOT NULL REFERENCES niveaux(id),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Permissions de discussion par filière/niveau
CREATE TABLE IF NOT EXISTS discussion_permissions (
    id SERIAL PRIMARY KEY,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
    niveau_id INTEGER NOT NULL REFERENCES niveaux(id),
    ouvert_a_tous BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(filiere_id, niveau_id)
);

-- Notifications lues par utilisateur
CREATE TABLE IF NOT EXISTS notifications_lu (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    notification_id INTEGER NOT NULL,
    lu_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, notification_type, notification_id)
);

-- Fiches de compétences
CREATE TABLE IF NOT EXISTS competences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    titre VARCHAR(200),
    bio TEXT,
    telephone VARCHAR(50),
    email_contact VARCHAR(150),
    linkedin VARCHAR(300),
    github VARCHAR(300),
    portfolio VARCHAR(300),
    disponible BOOLEAN DEFAULT TRUE,
    banniere_url VARCHAR(500),
    avatar_url VARCHAR(500),
    note_moyenne DECIMAL(3,2) DEFAULT 0,
    nb_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Compétences individuelles
CREATE TABLE IF NOT EXISTS competence_items (
    id SERIAL PRIMARY KEY,
    competence_id INTEGER NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('technique', 'pratique', 'specialisation', 'certification', 'etudes')),
    libelle VARCHAR(200) NOT NULL,
    niveau_maitrise VARCHAR(50) DEFAULT 'intermediaire',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fichiers de compétences (CV, portfolio, etc.)
CREATE TABLE IF NOT EXISTS competence_fichiers (
    id SERIAL PRIMARY KEY,
    competence_id INTEGER NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
    titre VARCHAR(200),
    fichier_url VARCHAR(500) NOT NULL,
    fichier_type VARCHAR(50),
    fichier_nom VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Votes/ratings des compétences
CREATE TABLE IF NOT EXISTS competence_ratings (
    id SERIAL PRIMARY KEY,
    competence_id INTEGER NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
    voter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(competence_id, voter_id)
);

-- Messages privés
CREATE TABLE IF NOT EXISTS messages_prives (
    id SERIAL PRIMARY KEY,
    expediteur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destinataire_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    lu_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index performances
CREATE INDEX IF NOT EXISTS idx_cours_docs_ue ON cours_documents(ue_id);
CREATE INDEX IF NOT EXISTS idx_cours_docs_filiere_niveau ON cours_documents(filiere_id, niveau_id);
CREATE INDEX IF NOT EXISTS idx_notifs_lu_user ON notifications_lu(user_id);
CREATE INDEX IF NOT EXISTS idx_competences_user ON competences(user_id);
CREATE INDEX IF NOT EXISTS idx_competence_items ON competence_items(competence_id);
CREATE INDEX IF NOT EXISTS idx_competence_ratings ON competence_ratings(competence_id);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages_prives(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages_prives(destinataire_id);

-- Ajouter colonne actif_jusqu_au à users pour expiration auto
ALTER TABLE users ADD COLUMN IF NOT EXISTS actif_jusqu_au DATE;

-- Mettre à jour les users existants avec la date de fin de leur année scolaire
UPDATE users u
SET actif_jusqu_au = (
    SELECT date_fin FROM annees_scolaires WHERE id = u.annee_scolaire_id
)
WHERE actif_jusqu_au IS NULL AND annee_scolaire_id IS NOT NULL;