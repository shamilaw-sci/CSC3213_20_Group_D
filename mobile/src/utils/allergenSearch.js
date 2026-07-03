/**
 * @file    allergenSearch.js
 * @module  Patient (Mobile)
 * @desc    Local dataset of common allergens with a fuzzy-search utility.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import Fuse from 'fuse.js';

const commonAllergens = [
  { name: 'Penicillin', category: 'Medication' },
  { name: 'Amoxicillin', category: 'Medication' },
  { name: 'Aspirin', category: 'Medication' },
  { name: 'Ibuprofen (NSAIDs)', category: 'Medication' },
  { name: 'Sulfonamides (Sulfa drugs)', category: 'Medication' },
  { name: 'Cephalosporins', category: 'Medication' },
  { name: 'Tetracycline', category: 'Medication' },
  { name: 'Anticonvulsants', category: 'Medication' },
  { name: 'Insulin', category: 'Medication' },
  { name: 'Iodine (Contrast dye)', category: 'Medication' },
  { name: 'Morphine', category: 'Medication' },
  { name: 'Codeine', category: 'Medication' },
  { name: 'ACE Inhibitors', category: 'Medication' },
  { name: 'Local Anesthetics (e.g., Lidocaine)', category: 'Medication' },
  { name: 'Peanuts', category: 'Food' },
  { name: 'Tree Nuts (Almonds, Walnuts, Cashews, etc.)', category: 'Food' },
  { name: 'Cow’s Milk', category: 'Food' },
  { name: 'Eggs', category: 'Food' },
  { name: 'Soy', category: 'Food' },
  { name: 'Wheat', category: 'Food' },
  { name: 'Fish', category: 'Food' },
  { name: 'Shellfish (Shrimp, Crab, Lobster)', category: 'Food' },
  { name: 'Sesame', category: 'Food' },
  { name: 'Mustard', category: 'Food' },
  { name: 'Celery', category: 'Food' },
  { name: 'Lupin', category: 'Food' },
  { name: 'Sulfites (Preservative)', category: 'Food' },
  { name: 'Corn', category: 'Food' },
  { name: 'Citrus Fruits', category: 'Food' },
  { name: 'Strawberries', category: 'Food' },
  { name: 'Tomatoes', category: 'Food' },
  { name: 'Dust Mites', category: 'Environmental' },
  { name: 'Pollen (Grass, Tree, Weed)', category: 'Environmental' },
  { name: 'Mold / Spores', category: 'Environmental' },
  { name: 'Pet Dander (Cats/Dogs)', category: 'Environmental' },
  { name: 'Cockroaches', category: 'Environmental' },
  { name: 'Feathers', category: 'Environmental' },
  { name: 'Fungi', category: 'Environmental' },
  { name: 'Bee Stings', category: 'Insects' },
  { name: 'Wasp Stings', category: 'Insects' },
  { name: 'Hornet Stings', category: 'Insects' },
  { name: 'Yellow Jacket Stings', category: 'Insects' },
  { name: 'Fire Ant Stings', category: 'Insects' },
  { name: 'Mosquito Bites', category: 'Insects' },
  { name: 'Flea Bites', category: 'Insects' },
  { name: 'Latex', category: 'Contact' },
  { name: 'Nickel', category: 'Contact' },
  { name: 'Poison Ivy / Oak / Sumac', category: 'Contact' },
  { name: 'Fragrances / Perfumes', category: 'Contact' },
  { name: 'Cosmetics', category: 'Contact' },
  { name: 'Hair Dyes', category: 'Contact' },
  { name: 'Sunscreen', category: 'Contact' },
  { name: 'Laundry Detergents', category: 'Contact' },
  { name: 'Chlorine', category: 'Contact' }
];

const fuseOptions = { keys: ['name'], threshold: 0.3 };
const fuse = new Fuse(commonAllergens, fuseOptions);

export const searchAllergens = (query) => {
  if (!query || query.trim() === '') return commonAllergens.slice(0, 5);
  return fuse.search(query).map(result => result.item).slice(0, 5);
};