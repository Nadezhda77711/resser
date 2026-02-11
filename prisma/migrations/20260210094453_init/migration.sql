-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Affiliation" (
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
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Affiliation_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "AffiliationsFolder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Affiliation_network_code_fkey" FOREIGN KEY ("network_code") REFERENCES "Network" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Affiliation_entity_uid_fkey" FOREIGN KEY ("entity_uid") REFERENCES "Entity" ("entity_uid") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Affiliation_address_role_code_fkey" FOREIGN KEY ("address_role_code") REFERENCES "AddressRole" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Affiliation" ("added_at", "address", "address_role_code", "analyst", "comment", "entity_uid", "ext_category", "ext_label", "ext_name", "ext_wallet_name", "folder_id", "id", "is_hidden", "network_code", "source") SELECT "added_at", "address", "address_role_code", "analyst", "comment", "entity_uid", "ext_category", "ext_label", "ext_name", "ext_wallet_name", "folder_id", "id", "is_hidden", "network_code", "source" FROM "Affiliation";
DROP TABLE "Affiliation";
ALTER TABLE "new_Affiliation" RENAME TO "Affiliation";
CREATE INDEX "Affiliation_folder_id_idx" ON "Affiliation"("folder_id");
CREATE INDEX "Affiliation_network_code_idx" ON "Affiliation"("network_code");
CREATE INDEX "Affiliation_entity_uid_idx" ON "Affiliation"("entity_uid");
CREATE TABLE "new_EntitiesFileMap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_id" INTEGER NOT NULL,
    "entity_uid" TEXT NOT NULL,
    CONSTRAINT "EntitiesFileMap_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "EntitiesFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntitiesFileMap_entity_uid_fkey" FOREIGN KEY ("entity_uid") REFERENCES "Entity" ("entity_uid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EntitiesFileMap" ("entity_uid", "file_id", "id") SELECT "entity_uid", "file_id", "id" FROM "EntitiesFileMap";
DROP TABLE "EntitiesFileMap";
ALTER TABLE "new_EntitiesFileMap" RENAME TO "EntitiesFileMap";
CREATE UNIQUE INDEX "EntitiesFileMap_file_id_entity_uid_key" ON "EntitiesFileMap"("file_id", "entity_uid");
CREATE TABLE "new_EntityCategoryMap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity_uid" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    CONSTRAINT "EntityCategoryMap_entity_uid_fkey" FOREIGN KEY ("entity_uid") REFERENCES "Entity" ("entity_uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntityCategoryMap_category_code_fkey" FOREIGN KEY ("category_code") REFERENCES "EntityCategory" ("category_code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EntityCategoryMap" ("category_code", "entity_uid", "id") SELECT "category_code", "entity_uid", "id" FROM "EntityCategoryMap";
DROP TABLE "EntityCategoryMap";
ALTER TABLE "new_EntityCategoryMap" RENAME TO "EntityCategoryMap";
CREATE UNIQUE INDEX "EntityCategoryMap_entity_uid_category_code_key" ON "EntityCategoryMap"("entity_uid", "category_code");
CREATE TABLE "new_EntityFlag" (
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
    CONSTRAINT "EntityFlag_entity_uid_fkey" FOREIGN KEY ("entity_uid") REFERENCES "Entity" ("entity_uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntityFlag_flag_code_fkey" FOREIGN KEY ("flag_code") REFERENCES "Flag" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EntityFlag" ("added_at", "analyst", "comment", "entity_uid", "ext_category", "ext_label", "ext_name", "ext_wallet_name", "flag_code", "id", "source") SELECT "added_at", "analyst", "comment", "entity_uid", "ext_category", "ext_label", "ext_name", "ext_wallet_name", "flag_code", "id", "source" FROM "EntityFlag";
DROP TABLE "EntityFlag";
ALTER TABLE "new_EntityFlag" RENAME TO "EntityFlag";
CREATE INDEX "EntityFlag_entity_uid_idx" ON "EntityFlag"("entity_uid");
CREATE INDEX "EntityFlag_flag_code_idx" ON "EntityFlag"("flag_code");
CREATE UNIQUE INDEX "EntityFlag_entity_uid_flag_code_source_ext_name_key" ON "EntityFlag"("entity_uid", "flag_code", "source", "ext_name");
CREATE TABLE "new_Incident" (
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
    CONSTRAINT "Incident_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "IncidentsFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Incident_network_code_fkey" FOREIGN KEY ("network_code") REFERENCES "Network" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Incident_entity_uid_fkey" FOREIGN KEY ("entity_uid") REFERENCES "Entity" ("entity_uid") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Incident_incident_type_code_fkey" FOREIGN KEY ("incident_type_code") REFERENCES "IncidentType" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Incident" ("added_at", "address", "analyst", "entity_uid", "file_id", "id", "incident_date", "incident_type_code", "network_code", "source", "tx_hashes", "wallet_role") SELECT "added_at", "address", "analyst", "entity_uid", "file_id", "id", "incident_date", "incident_type_code", "network_code", "source", "tx_hashes", "wallet_role" FROM "Incident";
DROP TABLE "Incident";
ALTER TABLE "new_Incident" RENAME TO "Incident";
CREATE INDEX "Incident_file_id_idx" ON "Incident"("file_id");
CREATE INDEX "Incident_network_code_idx" ON "Incident"("network_code");
CREATE INDEX "Incident_entity_uid_idx" ON "Incident"("entity_uid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
