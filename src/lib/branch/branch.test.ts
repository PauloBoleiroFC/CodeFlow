import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBranchName,
  generateSlug,
  suggestBranchType,
  validateBranchName,
  formatApiError,
} from "./index";

describe("generateSlug", () => {
  it("removes accents and special chars", () => {
    assert.equal(
      generateSlug("Adicionar Nova Coluna de Investimento!!!"),
      "adicionar-nova-coluna-de-investimento",
    );
    assert.equal(
      generateSlug("Corrigir cálculo de investimento do relatório"),
      "corrigir-calculo-de-investimento-do-relatorio",
    );
  });
});

describe("buildBranchName", () => {
  it("builds with card number", () => {
    const result = buildBranchName({
      type: "feature",
      cardNumber: "123",
      slugSource: "Exportar relatório Excel",
    });
    assert.equal(result.branchName, "feature/123-exportar-relatorio-excel");
  });

  it("allows missing card number", () => {
    const result = buildBranchName({
      type: "feature",
      cardNumber: null,
      slugSource: "Adicionar filtro de clientes",
    });
    assert.equal(result.branchName, "feature/adicionar-filtro-de-clientes");
  });
});

describe("suggestBranchType", () => {
  it("suggests hotfix for production urgency", () => {
    const result = suggestBranchType({
      text: "Corrigir erro crítico no checkout em produção",
    });
    assert.equal(result.type, "hotfix");
  });

  it("falls back to task", () => {
    const result = suggestBranchType({ text: "algo indefinido xyz" });
    assert.equal(result.type, "task");
  });

  it("respects user choice", () => {
    const result = suggestBranchType({
      text: "Adicionar exportação",
      userChoice: "task",
    });
    assert.equal(result.type, "task");
    assert.equal(result.source, "user");
  });
});

describe("validateBranchName", () => {
  it("sanitizes spaces and uppercase instead of rejecting", () => {
    const result = validateBranchName("Feature/123 Bad Name!!!");
    assert.equal(result.ok, true);
    assert.equal(result.sanitized, "feature/123-bad-name");
  });

  it("rejects empty after sanitize", () => {
    const result = validateBranchName("!!!");
    assert.equal(result.ok, false);
  });
});

describe("formatApiError", () => {
  it("joins array errors", () => {
    assert.equal(formatApiError(["a", "b"], "x"), "a b");
  });
});
