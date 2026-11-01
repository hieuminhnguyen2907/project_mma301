// Automated ReMarket Condition Scoring (from the seller's own declaration)
import { getCategoryConditionSchema } from '../constants/categories.js';

// Severity of the seller's answers on the graded fields of the listing's own form:
// options are ordered best -> worst, so position 0 = 0 and the last option = 1.
// Returns null when the listing has no graded answers (legacy data).
const gradedSeverity = (product) => {
  if (!product.categoryId) return null;
  const schema = getCategoryConditionSchema(product.categoryId, product.subCategoryId);
  const cond = product.condition || {};
  const severities = schema
    .filter((f) => f.graded && f.type === 'select' && f.options?.length > 1)
    .map((f) => {
      const index = f.options.indexOf(cond[f.fieldKey]);
      return index === -1 ? null : index / (f.options.length - 1);
    })
    .filter((s) => s !== null);
  if (severities.length === 0) return null;
  return {
    average: severities.reduce((a, b) => a + b, 0) / severities.length,
    worst: Math.max(...severities),
  };
};

export const calculateConditionScore = (product) => {
  if (!product) return { score: 90, label: 'Đạt chuẩn', color: '#0F766E', badge: 'STANDARD' };

  let score = 70; // baseline

  const cond = product.condition || {};
  const details = product.conditionDetails || {};
  const defects = product.knownDefects || [];

  // 1. Overall rating weight (handles both Title Case & snake_case)
  const ratingNorm = (cond.overallRating || '').toLowerCase().replace(/_/g, ' ');
  if (ratingNorm.includes('like new') || ratingNorm.includes('như mới')) score += 25;
  else if (ratingNorm.includes('very good') || ratingNorm.includes('rất tốt')) score += 20;
  else if (ratingNorm.includes('good') || ratingNorm.includes('tốt')) score += 12;
  else if (ratingNorm.includes('acceptable') || ratingNorm.includes('chấp nhận')) score += 2;

  // 2. Battery health weight
  const batteryHealth = cond.batteryHealth || details.batteryHealth;
  if (batteryHealth) {
    if (batteryHealth >= 95) score += 5;
    else if (batteryHealth >= 85) score += 3;
    else if (batteryHealth < 75) score -= 8;
  }

  const graded = gradedSeverity(product);
  if (graded) {
    // 3+4. Every declared criterion of this product type: +5 when all are best,
    // down to -15 when all are worst, and -5 more if any criterion is at its worst
    score += Math.round(5 - 20 * graded.average);
    if (graded.worst === 1) score -= 5;
  } else {
    score += legacyCriteriaAdjustment(cond, details);
  }

  // 5. Known defects deduction
  if (defects.length === 0) {
    score += 5;
  } else {
    score -= defects.length * 6;
  }

  return finalize(score, batteryHealth);
};

// Keyword checks kept for listings created before the graded forms existed
const legacyCriteriaAdjustment = (cond, details) => {
  let score = 0;

  // 3. Screen condition weight
  const screenCondition = cond.screenCondition || details.screenCondition || '';
  if (screenCondition) {
    const sNorm = screenCondition.toLowerCase();
    if (sNorm.includes('không trầy') || sNorm.includes('như mới') || sNorm.includes('no_scratches')) score += 5;
    else if (sNorm.includes('nứt') || sNorm.includes('cấn') || sNorm.includes('cracked')) score -= 15;
  }

  // 4. Sub-category specific criteria checks (audio, shoes, cookware, furniture)
  const categorySpecificCondition =
    cond.structuralIntegrity ||
    cond.frameSturdiness ||
    cond.audioQuality ||
    cond.soleCondition ||
    cond.upperCondition ||
    cond.surfaceCondition ||
    '';
  if (categorySpecificCondition) {
    const cNorm = categorySpecificCondition.toLowerCase();
    if (
      cNorm.includes('nứt vỡ') ||
      cNorm.includes('hở keo') ||
      cNorm.includes('rè nặng') ||
      cNorm.includes('mòn nhiều') ||
      cNorm.includes('lung lay')
    ) {
      score -= 10;
    } else if (
      cNorm.includes('hoàn hảo') ||
      cNorm.includes('nguyên gai') ||
      cNorm.includes('không tì vết') ||
      cNorm.includes('vững chãi') ||
      cNorm.includes('sáng bóng')
    ) {
      score += 3;
    }
  }

  return score;
};

const finalize = (score, batteryHealth) => {
  // Cap between 45 and 100
  const finalScore = Math.min(100, Math.max(45, score));

  let label = 'Tốt';
  let badge = 'STANDARD';
  let color = '#2563EB';

  if (finalScore >= 92) {
    label = 'Xuất sắc';
    badge = 'SUPER_CLEAN';
    color = '#059669';
  } else if (finalScore >= 82) {
    label = 'Rất tốt';
    badge = 'VERY_GOOD';
    color = '#0F766E';
  } else if (finalScore >= 70) {
    label = 'Tốt';
    badge = 'GOOD';
    color = '#2563EB';
  } else {
    label = 'Cần lưu ý lỗi';
    badge = 'HAS_DEFECTS';
    color = '#D97706';
  }

  // No "market valuation" here: a range derived from the listing's own price is not a
  // market price and would mislead buyers
  return {
    score: finalScore,
    label,
    badge,
    color,
    hasWarrantyDoubt: Boolean(batteryHealth && batteryHealth < 80),
  };
};
