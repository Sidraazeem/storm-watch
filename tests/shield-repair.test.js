const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const circuit = require('../shield-repair.js');

test('the designed route powers all three east-facing banks', () => {
  const connected = circuit.powered(circuit.solution);
  for (const cell of [2,5,8]) {
    assert.ok(connected.has(cell));
    assert.ok(circuit.solution[cell] & 2);
  }
});

test('generated boards start unpowered and retain a solvable orientation for every tile', () => {
  let seed = 43;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let board = 0; board < 200; board++) {
    const cells = circuit.createBoard(random);
    assert.equal(circuit.powered(cells).size, 0);
    cells.forEach((mask,i) => {
      assert.ok(mask === circuit.solution[i] || circuit.rotate(mask) === circuit.solution[i], 'each initial tile needs at most one turn');
      let found = false;
      for (let turn = 0; turn < 4; turn++) {
        found ||= mask === circuit.solution[i]; mask = circuit.rotate(mask);
      }
      assert.ok(found, `tile ${i} on board ${board} must retain its route`);
    });
  }
});

test('power requires reciprocal ports and cannot wrap between grid rows', () => {
  const cells = Array(9).fill(0);
  cells[3] = 10; cells[4] = 1;
  assert.deepEqual([...circuit.powered(cells)], [3]);
  cells[4] = 10; cells[5] = 10; cells[6] = 10;
  assert.ok(circuit.powered(cells).has(5));
  assert.ok(!circuit.powered(cells).has(6));
});

test('saved practice signal is traceable to linked DONKI records and a 19-minute interval', () => {
  const record = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/donki-2017.json'),'utf8').replace(/^\uFEFF/,''));
  assert.equal(record.flare.classType, 'X8.2');
  assert.ok(record.particle.linkedEvents.some(e => e.activityID === record.flare.flrID));
  assert.equal((Date.parse(record.particle.eventTime)-Date.parse(record.flare.peakTime))/60000,19);
  const source = fs.readFileSync(path.join(__dirname,'../shield-showcase.js'),'utf8');
  for (const value of [record.flare.classType,record.particle.instruments[0].displayName,record.flare.link]) assert.ok(source.includes(value));
  assert.match(source,/mins:\s*19/);
});
