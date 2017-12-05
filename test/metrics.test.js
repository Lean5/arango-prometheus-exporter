'use strict';
const assert = require('assert');
const metrics = require('../lib/metrics');

const trueThing = true;

describe('formatHeader', () => {
  it('returns correctly formatted metric header', () => {
    const expected = 
      '# HELP Foo helptext\n' +
      '# TYPE Foo counter';
    const actual = metrics.formatHeader({ name: 'Foo', type: 'counter', help: 'helptext'});
    assert.equal(actual, expected);
  });
});

describe('getValue', () => {
  it('returns the value of the according path', () => {
    assert.equal(2, metrics.getValue({a:{b:2}}, ['a', 'b']));
  });

  it('returns undefined for invalid paths', () => {
    assert.equal(undefined, metrics.getValue({a:{b:2}}, ['a', 'c']));
  });
});

describe('makeGauge', () => {
  it('returns a gauge metric object', () => {
    const metric = { name: 'metric', type: 'gauge', path: ['a', 'b'], help: 'help'};
    const actual = metrics.makeGauge(metric.name, metric.path, metric.help);
    assert.equal(actual.name, metric.name);
    assert.equal(actual.type, metric.type);
    assert.equal(actual.path, metric.path);
    assert.equal(actual.help, metric.help);
  });

  it('format function returns correctly formated metric', () => {
    const metric = metrics.makeGauge('metric', ['a', 'b'], '');
    const stats = {a: {b: 42}};
    const actual = metric.format(stats);
    assert.equal(actual, metrics.formatHeader(metric) + '\nmetric 42');
  });
});

describe('makeHistogram', () => {
  it('returns a histogram metric object', () => {
    const metric = { name: 'metric', type: 'histogram', path: ['a', 'b'], help: 'help', cuts: [0, 1]};
    const actual = metrics.makeHistogram(metric.name, metric.path, metric.cuts, metric.help);
    assert.equal(actual.name, metric.name);
    assert.equal(actual.type, metric.type);
    assert.equal(actual.path, metric.path);
    assert.equal(actual.help, metric.help);
    assert.equal(actual.cuts, metric.cuts);
  });

  it('format function returns correctly formated metric', () => {
    const metric = metrics.makeHistogram('metric', ['a', 'b'], [0.1, 0.2, 0.5], '');
    const stats = {
      a: {
        b: {
          sum: 42,
          count: 12,
          counts: [
            5,
            3,
            1,
            3
          ]
        }
      }
    };
    const actual = metric.format(stats);
    const expected = metrics.formatHeader(metric) +
      '\nmetric_bucket{le="0.1"} 5' +
      '\nmetric_bucket{le="0.2"} 8' +
      '\nmetric_bucket{le="0.5"} 9' +
      '\nmetric_bucket{le="+Inf"} 12' +
      '\nmetric_count 12' +
      '\nmetric_sum 42'
    assert.equal(actual, expected);
  });
});

describe('formatAll', () => {
  it('returns the formatted values of all registered metrics', () => {
    metrics.registerGauge('gauge_value', ['a', 'b'], '')
    metrics.registerCounter('counter_value', ['a', 'c'], '')

    const stats = {a: {b: 42, c: 123}};

    const expected = 
      '# HELP gauge_value \n' +
      '# TYPE gauge_value gauge\n' +
      'gauge_value 42\n' +
      '# HELP counter_value \n' +
      '# TYPE counter_value counter\n' +
      'counter_value 123\n';

    const actual = metrics.formatAll(stats);
    assert.equal(actual, expected);
  });
});