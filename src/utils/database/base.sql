CREATE TABLE IF NOT EXISTS "user-preferences" (
  id INTEGER PRIMARY KEY,
  clan TEXT DEFAULT NULL,
  friends TEXT NOT NULL DEFAULT '[]',
  servers TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "game-clans" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "tag" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "serverInvite" TEXT DEFAULT NULL,
  "otherLinks" TEXT DEFAULT '[]',
  "description" TEXT DEFAULT NULL,
  "seal" TEXT DEFAULT NULL,
  "language" TEXT DEFAULT "en",
  "clanReps" TEXT DEFAULT '[]',
  "serverIDs" TEXT DEFAULT '[]', -- Following structure: [{"type": "BMID", "value": "identifier"}]
  `updated` INTEGER DEFAULT (strftime('%s', 'now')),
  `added` INTEGER DEFAULT (strftime('%s', 'now')),
  `added_by` TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS update_timestamp
AFTER UPDATE ON "game-clans"
FOR EACH ROW
BEGIN
  UPDATE "game-clans" SET `updated` = strftime('%s', 'now') WHERE id = OLD.id;
END;