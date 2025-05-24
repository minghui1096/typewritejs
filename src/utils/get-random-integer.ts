/**
 * Return a random integer between min/max values
 *
 * @param {Number} min Minimum number to generate
 * @param {Number} max Maximum number to generate
 */
const getRandomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default getRandomInteger
