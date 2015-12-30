'use strict';

import {DepGraph} from 'dependency-graph';
import Promise from 'pinkie-promise';

const models = {};
const info = {};

const seedModel = function (Model, deps) {
  const seed = info[Model.modelName].seed;

  return Model.remove({}).exec()
    .then(() => {
      return Model.create(seed(...deps));
    });
};

const getSchemasOrder = () => {
  const graph = new DepGraph();

  Object.keys(models).forEach(modelName => graph.addNode(modelName));

  Object.keys(models).forEach(modelName => {
    info[modelName].dependencies.forEach(dep => graph.addDependency(modelName, dep));
  });

  return graph.overallOrder();
};

export function addSeed (Model, {seed, dependencies = []} = {}) {
  if (!Model) {
    throw new TypeError('mongoose-plugin-seed: Model must be provided');
  }
  else if (!seed) {
    throw new TypeError('mongoose-plugin-seed: seed function must be provided');
  }
  else if (typeof seed !== 'function') {
    throw new TypeError('mongoose-plugin-seed: seed must be a function');
  }
  else if (!Array.isArray(dependencies)) {
    throw new TypeError('mongoose-plugin-seed: dependencies must be an array');
  }

  models[Model.modelName] = Model;
  info[Model.modelName] = {dependencies: dependencies.map(model => model.modelName), seed};
}

export function seed () {
  const order = getSchemasOrder();
  const seeds = {};

  return Promise.all(order.map(modelName => {
    const Model = models[modelName];

    seeds[modelName] = Promise.all(info[modelName].dependencies.map(dep => seeds[dep]))
      .then(deps => seedModel(Model, deps));

    return seeds[modelName];
  }));
}
