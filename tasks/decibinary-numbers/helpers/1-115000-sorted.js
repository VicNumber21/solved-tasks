let numbers = [];

for (let i = 0; i < 1115000; ++i) {
  numbers.push(i);
}

numbers.sort((a, b) => {
  const aDB = toDB(a);
  const bDB = toDB(b);
  let res = aDB - bDB;

  if (res === 0) {
    res = a - b;
  }

  return res;
});

for (let i = 0; i < 10000; ++i) {
  console.log(numbers[i]);
}

function toDB(decimal) {
  let power2 = 1;
  let db = 0;

  do {
    const digit = decimal % 10;
    db += digit * power2;
    power2 *= 2;
    decimal = Math.floor(decimal / 10);
  }
  while (decimal >= 1);

  return db;
}
