import assert from 'node:assert/strict';
import test from 'node:test';
import { lunarPhase, lunarPhaseName, lunarPath } from '../../../frontend/src/lib/moon.ts';

test('参考新月、半个朔望月和完整朔望月对应正确月相', () => {
  const reference = Date.UTC(2000, 0, 6, 18, 14);
  const cycle = 29.530588853 * 86_400_000;
  assert.equal(lunarPhase(reference), 0);
  assert.ok(Math.abs(lunarPhase(reference + cycle / 2) - 0.5) < 0.000001);
  const repeated = lunarPhase(reference + cycle);
  assert.ok(Math.min(repeated, 1 - repeated) < 0.000001);
  assert.ok(lunarPhase(reference - cycle / 4) > 0.74);
});

test('月相名称覆盖八个阶段及新月边界', () => {
  assert.deepEqual([0, .125, .25, .375, .5, .625, .75, .875].map(lunarPhaseName),
    ['新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月']);
  assert.equal(lunarPhaseName(.999), '新月');
});

test('月相图在满月和弦月生成有限数值，左右弦月轮廓不同', () => {
  for (const phase of [0, .25, .5, .75]) {
    assert.doesNotMatch(lunarPath(phase, 22), /NaN|Infinity/);
  }
  assert.notEqual(lunarPath(.25, 22), lunarPath(.75, 22));
});
