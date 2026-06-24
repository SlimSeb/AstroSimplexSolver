import { describe, it, expect } from "vitest";
import { fmt, term, linearExpr } from "./format";

describe("fmt", () => {
  it("renders integers and negatives plainly", () => {
    expect(fmt(2)).toBe("2");
    expect(fmt(-3.5)).toBe("-3.5");
  });

  it("collapses zero and negative zero to \"0\"", () => {
    expect(fmt(0)).toBe("0");
    expect(fmt(-0)).toBe("0");
  });

  it("rounds to three decimals", () => {
    expect(fmt(0.123456)).toBe("0.123");
    expect(fmt(1 / 3)).toBe("0.333");
  });

  it("renders infinities and NaN with symbols", () => {
    expect(fmt(Infinity)).toBe("∞");
    expect(fmt(-Infinity)).toBe("-∞");
    expect(fmt(NaN)).toBe("-");
  });
});

describe("term", () => {
  it("omits a unit coefficient", () => {
    expect(term(1, "x1")).toBe("x1");
    expect(term(-1, "x2")).toBe("-x2");
  });

  it("joins a non-unit coefficient with a dot", () => {
    expect(term(3, "x1")).toBe("3·x1");
  });
});

describe("linearExpr", () => {
  it("drops zero terms and signs the rest", () => {
    expect(linearExpr([3, 0, -1], ["x1", "x2", "x3"])).toBe("3·x1 - x3");
  });

  it("uses bare names for unit coefficients", () => {
    expect(linearExpr([1, 2], ["x1", "x2"])).toBe("x1 + 2·x2");
  });

  it("returns \"0\" when every coefficient is zero", () => {
    expect(linearExpr([0, 0], ["x1", "x2"])).toBe("0");
  });
});
