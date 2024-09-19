import crypto from "crypto";
import { rng, numUsers as numUsersRaw } from "./variables";

const numUsers: number = Number(numUsersRaw);
import seedrandom from "seedrandom";
import User from "../../models/User";
import {
  Attributes,
  CreationAttributes,
} from "sequelize";

function getRandomVisibility() {
  return rng() > 0.5 ? "public" : "private"; // Use the seeded random generator
}
/**
 * Generates a random birth date within a specified range.
 *
 * @param {string} seed - The seed value for the random number generator.
 * @param {number} [minYears=18] - The minimum number of years ago for the birth date.
 * @param {number} [maxYears=50] - The maximum number of years ago for the birth date.
 * @returns {Date} The randomly generated birth date.
 */
function getRandomBirthDate(
  seed: seedrandom.PRNG,
  minYears = 18,
  maxYears = 50
): Date {
  // Initialize the seeded random number generator
  const currentDate = new Date();

  // Subtract 'minYears' from the current date to get the latest birthdate (18 years ago)
  const maxDate = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - minYears)
  );

  // Subtract 'maxYears' to get the earliest birthdate (e.g., 50 years ago)
  const minDate = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - (maxYears - minYears))
  );

  // Generate a seeded random timestamp between minDate and maxDate
  const randomTimestamp =
    minDate.getTime() + rng() * (maxDate.getTime() - minDate.getTime());

  // Convert the timestamp back to a Date object
  return new Date(randomTimestamp);
}

/**
 * Generates a random password of the specified length.
 * @param {number} length - The length of the password to generate. Default is 8.
 * @returns {string} - The generated password.
 */
function generatePassword(length = 8) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(rng() * characters.length));
  }
  return password;
}

/**
 * Generates a sample user data object with a random image URL.
 * @param {number} seed - Seed value for random generation.
 * @returns {object} - The generated user data.
 */
function generateUserData(): Attributes<User> | CreationAttributes<User> {
  return {
    id: crypto.randomUUID(), // Generates a UUID
    name: `User ${Math.floor(rng() * (9999 - 1000) + 1000)}`,
    email: `user${Math.floor(rng() * (99999 - 100) + 10000)}@example.com`,
    picture: `https://picsum.photos/200/300?random=${Math.floor(rng() * 1000)}`, // Random image from Picsum
    userName: `user${Math.floor(rng() * (999999 - 100) + 10000)}`,
    password: generatePassword(),
    birthDate: getRandomBirthDate(rng), // Replace with a valid birthdate
    gender: ["Male", "Female", "Other"][Math.floor(rng() * 3)], // Random gender selection
    visibility: getRandomVisibility(),
  };
}
export const users = Array.from({ length: numUsers }, () => generateUserData());
