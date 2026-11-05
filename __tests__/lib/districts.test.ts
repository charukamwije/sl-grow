import { describe, expect, it } from "vitest";
import {
  betterCrop,
  bestDistricts,
  DISTRICTS,
  isDistrict,
  RATINGS,
  suitability,
} from "@/lib/data/districts";
import { CROPS } from "@/lib/data/plantation";
import { computePlantation } from "@/lib/plantation/calc";
import { buildEnquiryMessage } from "@/lib/order/whatsapp";

describe("district suitability", () => {
  it("covers all 25 districts for every crop", () => {
    expect(DISTRICTS).toHaveLength(25);
    for (const crop of CROPS) {
      for (const district of DISTRICTS) {
        const fit = suitability(crop.id, district);
        expect(RATINGS[fit.rating]).toBeDefined();
        expect(fit.reason.length).toBeGreaterThan(20);
      }
    }
  });

  it("calls cinnamon in Nuwara Eliya not viable, and says why", () => {
    const fit = suitability("cinnamon", "Nuwara Eliya");

    expect(fit.rating).toBe("unsuitable");
    expect(fit.reason).toMatch(/too high and too cold/i);
  });

  it("suggests tea for Nuwara Eliya instead", () => {
    expect(suitability("tea", "Nuwara Eliya").rating).toBe("suitable");
    expect(betterCrop("cinnamon", "Nuwara Eliya")).toBe("tea");
    expect(betterCrop("tea", "Nuwara Eliya")).toBeNull();
  });

  it("knows the south-west coast for cinnamon and the dry north for neither", () => {
    expect(bestDistricts("cinnamon")).toEqual(expect.arrayContaining(["Galle", "Matara", "Kalutara"]));
    expect(suitability("tea", "Jaffna").rating).toBe("unsuitable");
    expect(suitability("cinnamon", "Jaffna").rating).toBe("unsuitable");
  });

  it("checks district names", () => {
    expect(isDistrict("Kandy")).toBe(true);
    expect(isDistrict("Kandy town")).toBe(false);
  });

  it("makes a not-viable district lose money in the figures too", () => {
    const cinnamon = CROPS.find((crop) => crop.id === "cinnamon")!.defaults;
    const result = computePlantation({
      hectares: 1,
      rate: 0.12,
      years: 15,
      assumptions: { ...cinnamon, yieldKg: cinnamon.yieldKg * RATINGS.unsuitable.yieldFactor },
    });

    expect(result.npv).toBeLessThan(0);
    expect(result.paybackYear).toBeNull();
  });
});

describe("buildEnquiryMessage with a district", () => {
  it("names the district when one was chosen", () => {
    expect(buildEnquiryMessage("Tea (Ceylon)", 1, 2.47, "Badulla")).toContain("District: Badulla");
    expect(buildEnquiryMessage("Tea (Ceylon)", 1, 2.47)).not.toContain("District");
  });
});
