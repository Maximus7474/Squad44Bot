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
  "clanReps" TEXT DEFAULT '[]',
  "serverIDs" TEXT DEFAULT '[]' -- Following structure: [{"type": "BMID", "value": "identifier"}]
);