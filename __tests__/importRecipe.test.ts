import { scaleAmount, getIngredientEmoji, groupIngredientsBySections } from '../lib/importRecipe';
import { Ingredient } from '../db/schema';

describe('scaleAmount', () => {
  it('scales a whole number', () => {
    expect(scaleAmount('2', 2)).toBe('4');
  });

  it('scales a decimal', () => {
    expect(scaleAmount('1.5', 2)).toBe('3');
  });

  it('scales a simple fraction', () => {
    expect(scaleAmount('1/2', 2)).toBe('1');
  });

  it('scales a mixed fraction', () => {
    expect(scaleAmount('1 1/2', 2)).toBe('3');
  });

  it('halves a whole number', () => {
    expect(scaleAmount('4', 0.5)).toBe('2');
  });

  it('halves into a fraction', () => {
    expect(scaleAmount('1', 0.5)).toBe('1/2');
  });

  it('returns original if not a number', () => {
    expect(scaleAmount('to taste', 2)).toBe('to taste');
  });

  it('handles empty string', () => {
    expect(scaleAmount('', 2)).toBe('');
  });

  it('scales to 3x correctly', () => {
    expect(scaleAmount('2', 3)).toBe('6');
  });
});

describe('getIngredientEmoji', () => {
  it('returns chicken emoji', () => {
    expect(getIngredientEmoji('boneless chicken thighs')).toBe('🍗');
  });

  it('returns egg emoji', () => {
    expect(getIngredientEmoji('2 eggs')).toBe('🥚');
  });

  it('returns garlic emoji', () => {
    expect(getIngredientEmoji('3 cloves garlic')).toBe('🧄');
  });

  it('returns default for unknown ingredient', () => {
    expect(getIngredientEmoji('xanthan gum')).toBe('🥄');
  });

  it('returns tomato emoji', () => {
    expect(getIngredientEmoji('cherry tomatoes')).toBe('🍅');
  });

  it('returns oil emoji for olive oil', () => {
    expect(getIngredientEmoji('olive oil')).toBe('🫙');
  });
});

describe('groupIngredientsBySections', () => {
  const makeIng = (id: string, name: string, section: string): Ingredient => ({
    id, recipeId: 'r1', section, name,
    amount: '1', unit: 'cup', emoji: '🥄', order: 0,
  });

  it('groups ingredients by section', () => {
    const ings = [
      makeIng('1', 'Chicken', 'CHICKEN'),
      makeIng('2', 'Cornstarch', 'CHICKEN'),
      makeIng('3', 'Honey', 'SAUCE'),
      makeIng('4', 'Soy sauce', 'SAUCE'),
    ];
    const grouped = groupIngredientsBySections(ings);
    expect(Object.keys(grouped)).toContain('CHICKEN');
    expect(Object.keys(grouped)).toContain('SAUCE');
    expect(grouped['CHICKEN']).toHaveLength(2);
    expect(grouped['SAUCE']).toHaveLength(2);
  });

  it('groups no-section ingredients under empty string key', () => {
    const ings = [makeIng('1', 'Salt', ''), makeIng('2', 'Pepper', '')];
    const grouped = groupIngredientsBySections(ings);
    expect(grouped['']).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(groupIngredientsBySections([])).toEqual({});
  });
});
