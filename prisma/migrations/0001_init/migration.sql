-- Initial schema
PRAGMA foreign_keys=OFF;

CREATE TABLE "EntityType" (
  "code" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "parent_code" TEXT
);

CREATE TABLE "Flag" (
  "code" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT,
  "description" TEXT,
  "severity" TEXT
);

CREATE TABLE "EntityCategory" (
  "category_code" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT
);

CREATE TABLE "Network" (
  "code" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT
);

CREATE TABLE "AddressRole" (
  "code" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT
);

CREATE TABLE "IncidentType" (
  "code" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT
);

CREATE TABLE "EntitiesFile" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "file_name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Entity" (
  "entity_uid" TEXT NOT NULL PRIMARY KEY,
  "entity_name" TEXT NOT NULL,
  "entity_type_code" TEXT NOT NULL,
  "parent_entity_uid" TEXT,
  "entity_description" TEXT,
  "entity_country" TEXT,
  "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "comment" TEXT,
  FOREIGN KEY ("entity_type_code") REFERENCES "EntityType"("code") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("parent_entity_uid") REFERENCES "Entity"("entity_uid") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "EntityFlag" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "entity_uid" TEXT NOT NULL,
  "flag_code" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "ext_name" TEXT,
  "ext_category" TEXT,
  "ext_wallet_name" TEXT,
  "ext_label" TEXT,
  "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "analyst" TEXT,
  "comment" TEXT,
  FOREIGN KEY ("entity_uid") REFERENCES "Entity"("entity_uid") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("flag_code") REFERENCES "Flag"("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "EntityCategoryMap" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "entity_uid" TEXT NOT NULL,
  "category_code" TEXT NOT NULL,
  FOREIGN KEY ("entity_uid") REFERENCES "Entity"("entity_uid") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("category_code") REFERENCES "EntityCategory"("category_code") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "EntitiesFileMap" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "file_id" INTEGER NOT NULL,
  "entity_uid" TEXT NOT NULL,
  FOREIGN KEY ("file_id") REFERENCES "EntitiesFile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("entity_uid") REFERENCES "Entity"("entity_uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AffiliationsFolder" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "network_code" TEXT NOT NULL,
  "folder_name" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("network_code") REFERENCES "Network"("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Affiliation" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "folder_id" INTEGER NOT NULL,
  "network_code" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "entity_uid" TEXT,
  "address_role_code" TEXT,
  "source" TEXT NOT NULL,
  "analyst" TEXT,
  "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "comment" TEXT,
  "ext_name" TEXT,
  "ext_category" TEXT,
  "ext_wallet_name" TEXT,
  "ext_label" TEXT,
  "is_hidden" BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY ("folder_id") REFERENCES "AffiliationsFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("network_code") REFERENCES "Network"("code") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("entity_uid") REFERENCES "Entity"("entity_uid") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("address_role_code") REFERENCES "AddressRole"("code") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "IncidentsFile" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "month" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Incident" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "file_id" INTEGER NOT NULL,
  "network_code" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "entity_uid" TEXT,
  "incident_type_code" TEXT NOT NULL,
  "incident_date" DATETIME NOT NULL,
  "source" TEXT NOT NULL,
  "wallet_role" TEXT,
  "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "analyst" TEXT,
  "tx_hashes" TEXT,
  FOREIGN KEY ("file_id") REFERENCES "IncidentsFile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("network_code") REFERENCES "Network"("code") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("entity_uid") REFERENCES "Entity"("entity_uid") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("incident_type_code") REFERENCES "IncidentType"("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EntityFlag_unique" ON "EntityFlag" ("entity_uid", "flag_code", "source", "ext_name");
CREATE UNIQUE INDEX "EntityCategoryMap_unique" ON "EntityCategoryMap" ("entity_uid", "category_code");
CREATE UNIQUE INDEX "EntitiesFileMap_unique" ON "EntitiesFileMap" ("file_id", "entity_uid");

CREATE INDEX "Entity_entity_type_code_idx" ON "Entity" ("entity_type_code");
CREATE INDEX "Entity_parent_entity_uid_idx" ON "Entity" ("parent_entity_uid");
CREATE INDEX "EntityFlag_entity_uid_idx" ON "EntityFlag" ("entity_uid");
CREATE INDEX "EntityFlag_flag_code_idx" ON "EntityFlag" ("flag_code");
CREATE INDEX "AffiliationsFolder_network_code_idx" ON "AffiliationsFolder" ("network_code");
CREATE INDEX "Affiliation_folder_id_idx" ON "Affiliation" ("folder_id");
CREATE INDEX "Affiliation_network_code_idx" ON "Affiliation" ("network_code");
CREATE INDEX "Affiliation_entity_uid_idx" ON "Affiliation" ("entity_uid");
CREATE INDEX "Incident_file_id_idx" ON "Incident" ("file_id");
CREATE INDEX "Incident_network_code_idx" ON "Incident" ("network_code");
CREATE INDEX "Incident_entity_uid_idx" ON "Incident" ("entity_uid");

PRAGMA foreign_keys=ON;
