import { readFile } from 'fs/promises';
import faker from 'faker';

import { query, end } from './db.js';

const schemaFile = './sql/schema.sql';

async function mock(n) {
  const nationalIds = new Set();

  for (let i = 0; i < n; i++) {
    const name = faker.name.findName();
    const nationalId = Math.random().toString().slice(2, 12);
    if (nationalIds.has(nationalId)) {
      continue;
    }
    nationalIds.add(nationalId);
    let comment = '';
    if (Math.random() < 0.5) {
      comment = faker.lorem.sentence();
    }
    let anonymous = false;
    if (Math.random() < 0.5) {
      anonymous = true;
    }
    const dateSigned = faker.date.recent(14);

    const q = `
      INSERT INTO signatures (name, nationalId, comment, anonymous, signed)
      VALUES ($1, $2, $3, $4, $5);`;

    await query(q, [name, nationalId, comment, anonymous, dateSigned]);
  }

  const q2 = `
    INSERT INTO users (username, password)
    VALUES ('admin', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii');`;
  const q3 = `
    INSERT INTO users (username, password)
    VALUES ('jonjonsson', '$2a$11$pgj3.zySyFOvIQEpD7W6Aund1Tw.BFarXxgLJxLbrzIv/4Nteisii');`;

  await query(q2);
  await query(q3);
}

async function create() {
  const data = await readFile(schemaFile);

  await query(data.toString('utf-8'));

  console.info('Schema created');

  await mock(500);

  console.info('Mock data inserted');

  await end();
}

create().catch((e) => {
  console.error('Error creating schema', e);
});
