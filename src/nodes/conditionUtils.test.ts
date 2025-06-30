import { evaluateCondition, validateCondition } from './conditionUtils'

describe('evaluateCondition', () => {
  it('handles numeric comparisons', () => {
    expect(evaluateCondition('5 > 3', {})).toMatchObject({ result: true })
    expect(evaluateCondition('2 < 1', {})).toMatchObject({ result: false })
    expect(evaluateCondition('10 == 10', {})).toMatchObject({ result: true })
    expect(evaluateCondition('10 != 5', {})).toMatchObject({ result: true })
    expect(evaluateCondition('7 >= 7', {})).toMatchObject({ result: true })
    expect(evaluateCondition('7 <= 6', {})).toMatchObject({ result: false })
  })

  it('handles string comparisons', () => {
    expect(evaluateCondition('"foo" == "foo"', {})).toMatchObject({
      result: true
    })
    expect(evaluateCondition('"foo" != "bar"', {})).toMatchObject({
      result: true
    })
    expect(
      evaluateCondition('city == "London"', { city: 'London' })
    ).toMatchObject({ result: true })
    expect(
      evaluateCondition('city == "Paris"', { city: 'London' })
    ).toMatchObject({ result: false })
  })

  it('handles variable substitution', () => {
    expect(evaluateCondition('${score} > 50', { score: 75 })).toMatchObject({
      result: true
    })
    expect(evaluateCondition('${score} < 50', { score: 75 })).toMatchObject({
      result: false
    })
  })

  it('handles boolean variables', () => {
    expect(evaluateCondition('isLoggedIn', { isLoggedIn: true })).toMatchObject(
      { result: true }
    )
    expect(
      evaluateCondition('isLoggedIn', { isLoggedIn: false })
    ).toMatchObject({ result: false })
  })

  it('handles boolean literals', () => {
    expect(evaluateCondition('true', {})).toMatchObject({ result: true })
    expect(evaluateCondition('false', {})).toMatchObject({ result: false })
  })

  it('handles invalid/empty conditions', () => {
    expect(evaluateCondition('', {})).toMatchObject({ result: false })
    expect(evaluateCondition('   ', {})).toMatchObject({ result: false })
  })
})

describe('validateCondition', () => {
  it('validates correct syntax', () => {
    expect(validateCondition('temperature > 25').isValid).toBe(true)
    expect(validateCondition('city == "London"').isValid).toBe(true)
    expect(validateCondition('${score} > 100').isValid).toBe(true)
    expect(validateCondition('isLoggedIn').isValid).toBe(true)
    expect(validateCondition('true').isValid).toBe(true)
  })

  it('detects empty/invalid syntax', () => {
    expect(validateCondition('').isValid).toBe(false)
    expect(validateCondition('(').isValid).toBe(false)
    expect(validateCondition(')').isValid).toBe(false)
    expect(validateCondition('foo bar baz').isValid).toBe(false)
  })
})
