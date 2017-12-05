'use strict';

function getValue(obj, path) {
  let val = obj;
  for (let idx = 0; idx < path.length; ++idx) {
    if (val == null)
      return;      
    val = val[path[idx]];
  }
  return val;
}

function formatHeader({ name, type, help }) {
  return `# HELP ${name} ${help}\n` +
         `# TYPE ${name} ${type}`;
}

function formatSingleValue(stat) {
  const val = getValue(stat, this.path);
  if (val === undefined)
    return '';
  return formatHeader(this) +
         `\n${this.name} ${val}`;
}

function formatHistogram(stat) {
  const obj = getValue(stat, this.path);
  if (obj === undefined)
    return '';
  let counts = obj.counts;
  if (counts.length != this.cuts.length + 1)
    throw `The number of values (${counts.length}) is incompatible with the number of cuts (${this.cuts.length}).`;

  let output = [formatHeader(this)];
  let cnt = 0;
  for (let i = 0; i < this.cuts.length; ++i) {
    cnt += counts[i];
    output.push(`${this.name}_bucket{le="${this.cuts[i]}"} ${cnt}`);
  }
  output.push(`${this.name}_bucket{le="+Inf"} ${obj.count}`);
  output.push(`${this.name}_count ${obj.count}`);
  output.push(`${this.name}_sum ${obj.sum}`);

  return output.join('\n');
}

function makeGauge(name, path, help) {
  return {
    name: name,
    path: path,
    help: help,
    type: 'gauge',
    format: formatSingleValue
  }
}

function makeCounter(name, path, help) {
  return {
    name: name,
    path: path,
    help: help,
    type: 'counter',
    format: formatSingleValue
  }
}

function makeHistogram(name, path, cuts, help) {
  return {
    name: name,
    path: path,
    help: help,
    type: 'histogram',
    cuts: cuts,
    format: formatHistogram
  }
}

let registry = [];

function registerGauge(...args) {
  registry.push(makeGauge(...args));
}

function registerCounter(...args) {
  registry.push(makeCounter(...args));
}

function registerHistogram(...args) {
  registry.push(makeHistogram(...args));
}

function clearRegistry() {
  registry = [];
}

function formatAll(stats) {
  if (stats === undefined)
    return '';

  let output = [];
  for (let i = 0; i < registry.length; ++i)
    output.push(registry[i].format(stats));

  output.push(''); // ensure that the result ends with a newline
  return output.join('\n');
}

module.exports = {
  getValue,
  formatHeader,
  makeGauge,
  makeCounter,
  makeHistogram,
  registerGauge,
  registerCounter,
  registerHistogram,
  formatAll
}