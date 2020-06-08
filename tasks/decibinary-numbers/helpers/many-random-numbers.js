let length = 1e5;

console.log(length);

for (let i = 0; i < length; ++i) {
  console.log(getRandomInt(1e16) + 1)
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
