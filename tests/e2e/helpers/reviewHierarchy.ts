import { expect, type Locator } from '@playwright/test';

/** Check both reading order and rendered order; CSS must not undo the review-first DOM. */
export async function reviewBeforeFacts(scope: Locator, reviewSelector = '.verified-reviews', factsSelector = '.catalog-decision') {
  const reviews = scope.locator(reviewSelector);
  const facts = scope.locator(factsSelector);
  await expect(reviews).toHaveCount(1);
  await expect(reviews).toBeVisible();
  await expect(facts).toHaveCount(1);
  await expect(facts).toBeVisible();
  const positions = await scope.evaluate((element, selectors) => {
    const review = element.querySelector(selectors.review)!;
    const fact = element.querySelector(selectors.facts)!;
    const bounds = (target: Element) => {
      const rect = target.getBoundingClientRect();
      return { top: rect.top + scrollY, bottom: rect.bottom + scrollY, height: rect.height };
    };
    return {
      reviews: bounds(review), facts: bounds(fact),
      reviewsPrecedeFactsInDOM: Boolean(review.compareDocumentPosition(fact) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  }, { review: reviewSelector, facts: factsSelector });
  expect(positions.reviewsPrecedeFactsInDOM).toBe(true);
  expect(positions.reviews.bottom).toBeLessThanOrEqual(positions.facts.top + 1);
  return positions;
}

export async function readableReviewText(locator: Locator) {
  const values = await locator.evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { text: element.textContent?.trim(), fontSize: parseFloat(style.fontSize), lineHeight: style.lineHeight, top: rect.top + scrollY, bottom: rect.bottom + scrollY };
  }));
  expect(values.length).toBeGreaterThan(0);
  for (const value of values) expect(value.fontSize, value.text).toBeGreaterThanOrEqual(16);
  return values;
}
