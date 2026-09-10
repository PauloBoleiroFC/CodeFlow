-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "cardNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'development',
    "branchType" TEXT NOT NULL DEFAULT 'task',
    "suggestedBranchType" TEXT,
    "branchTypeReason" TEXT,
    "slug" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "branchManual" BOOLEAN NOT NULL DEFAULT false,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("branchManual", "branchName", "branchType", "branchTypeReason", "cardNumber", "createdAt", "id", "projectId", "slug", "suggestedBranchType", "summary", "tagsJson", "title", "updatedAt") SELECT "branchManual", "branchName", "branchType", "branchTypeReason", "cardNumber", "createdAt", "id", "projectId", "slug", "suggestedBranchType", "summary", "tagsJson", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_branchType_idx" ON "Task"("branchType");
CREATE INDEX "Task_status_idx" ON "Task"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
