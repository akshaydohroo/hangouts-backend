import seedrandom from 'seedrandom';

const SEED = 42;
const NUM_USERS = 100;

export const rng = seedrandom(SEED.toString());
export const numUsers  = NUM_USERS;