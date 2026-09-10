-- CreateTable
CREATE TABLE "WikiArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WikiArticle_slug_key" ON "WikiArticle"("slug");

-- CreateIndex
CREATE INDEX "WikiArticle_category_idx" ON "WikiArticle"("category");

-- CreateIndex
CREATE INDEX "WikiArticle_projectId_idx" ON "WikiArticle"("projectId");

-- CreateIndex
CREATE INDEX "WikiArticle_updatedAt_idx" ON "WikiArticle"("updatedAt");
