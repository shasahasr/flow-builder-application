/**
 * Utility functions for condition evaluation in workflow nodes
 */

export interface ConditionEvaluationResult {
  result: boolean;
  debug: string;
  error?: string;
}

/**
 * Evaluates a condition string against a given context
 * Supports comparison operators: ==, !=, >, <, >=, <=
 * Supports variable substitution using ${variableName} syntax
 */
export const evaluateCondition = (
  conditionText: string,
  context: Record<string, unknown>,
): ConditionEvaluationResult => {
  try {
    if (!conditionText || conditionText.trim() === "") {
      return {
        result: false,
        debug: "Empty condition",
        error: "Condition cannot be empty",
      };
    }

    // Process variables in condition text
    const processedCondition = conditionText.replace(
      /\${([^}]+)}/g,
      (match, varName) => {
        return context[varName] !== undefined
          ? String(context[varName])
          : match;
      },
    );

    // Check for comparison patterns
    const comparison = processedCondition.match(/(.*?)(==|!=|>|<|>=|<=)(.*)/);

    if (comparison) {
      const [, left, operator, right] = comparison;
      const leftValue = left.trim();
      const rightValue = right.trim();

      // Get actual values, handling string literals and numbers
      const getComparisonValue = (val: string) => {
        if (val.startsWith('"') && val.endsWith('"')) {
          return val.slice(1, -1); // Remove quotes
        }
        if (val.startsWith("'") && val.endsWith("'")) {
          return val.slice(1, -1); // Remove quotes
        }
        if (!isNaN(Number(val))) {
          return Number(val); // Convert to number
        }
        // Try to find in context
        return context[val] !== undefined ? context[val] : val;
      };

      const leftEval = getComparisonValue(leftValue);
      const rightEval = getComparisonValue(rightValue);

      let result = false;
      switch (operator) {
        case "==":
          result = leftEval == rightEval;
          break;
        case "!=":
          result = leftEval != rightEval;
          break;
        case ">":
          result = Number(leftEval) > Number(rightEval);
          break;
        case "<":
          result = Number(leftEval) < Number(rightEval);
          break;
        case ">=":
          result = Number(leftEval) >= Number(rightEval);
          break;
        case "<=":
          result = Number(leftEval) <= Number(rightEval);
          break;
      }

      return {
        result,
        debug: `${leftEval} ${operator} ${rightEval} = ${result}`,
      };
    }

    // Try to evaluate as boolean expression
    if (processedCondition in context) {
      const result = Boolean(context[processedCondition]);
      return {
        result,
        debug: `Variable '${processedCondition}' is ${
          result ? "truthy" : "falsy"
        }`,
      };
    }

    // Handle boolean literals
    if (processedCondition.toLowerCase() === "true") {
      return { result: true, debug: "Boolean literal: true" };
    }
    if (processedCondition.toLowerCase() === "false") {
      return { result: false, debug: "Boolean literal: false" };
    }

    // Simple boolean conversion for non-empty strings
    const result = Boolean(
      processedCondition && processedCondition !== "false",
    );
    return {
      result,
      debug: `'${processedCondition}' evaluated as ${result}`,
    };
  } catch (error) {
    return {
      result: false,
      debug: `Evaluation failed`,
      error: String(error),
    };
  }
};

/**
 * Validates a condition string for syntax errors
 */
export const validateCondition = (
  conditionText: string,
): { isValid: boolean; error?: string } => {
  if (!conditionText || conditionText.trim() === "") {
    return { isValid: false, error: "Condition cannot be empty" };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of conditionText) {
    if (char === "(") parenCount++;
    if (char === ")") parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: "Unmatched closing parenthesis" };
    }
  }
  if (parenCount > 0) {
    return { isValid: false, error: "Unmatched opening parenthesis" };
  }

  // Check for valid operators
  const hasValidOperator = /(?:==|!=|>=|<=|>|<)/.test(conditionText);
  const hasVariables = /\${[^}]+}/.test(conditionText);
  const isBoolean = ["true", "false"].includes(conditionText.toLowerCase());

  if (
    !hasValidOperator &&
    !hasVariables &&
    !isBoolean &&
    !conditionText.match(/^\w+$/)
  ) {
    return { isValid: false, error: "Invalid condition syntax" };
  }

  return { isValid: true };
};

/**
 * Gets examples of valid condition syntax
 */
export const getConditionExamples = (): string[] => {
  return [
    "temperature > 25",
    "temperature >= 20",
    'city == "New York"',
    'weather != "rainy"',
    "${userAge} >= 18",
    "${score} > 100",
    "isLoggedIn",
    "true",
    "false",
  ];
};
