'use strict';

import {DepGraph} from 'dependency-graph';
import mongoose from 'mongoose';
import pify from 'pify';
import Promise from 'pinkie-promise';

const models = {};
const info = {};

const seedModel = function (Model, deps) {
  const modelInfo = info[Model.modelName];
  const dropPromise = pify(Model.collection.drop.bind(Model.collection), Promise);
  const removePromise = modelInfo.drop ? dropPromise() : Model.remove({}).exec();

  return removePromise
    .then(() => Model.create(modelInfo.seed(...deps)));
};

const getSchemasOrder = () => {
  const graph = new DepGraph();

  Object.keys(models).forEach(modelName => graph.addNode(modelName));

  Object.keys(models).forEach(modelName => {
    info[modelName].dependencies.forEach(dep => graph.addDependency(modelName, dep));
  });

  return graph.overallOrder();
};

export function addSeed (Model, {drop = false, seed, dependencies = []} = {}) {
  if (!Model) {
    throw new TypeError('mongoose-plugin-seed: Model must be provided');
  }
  if (!seed) {
    throw new TypeError('mongoose-plugin-seed: seed function must be provided');
  }
  if (typeof seed !== 'function') {
    throw new TypeError('mongoose-plugin-seed: seed must be a function');
  }
  if (!Array.isArray(dependencies)) {
    throw new TypeError('mongoose-plugin-seed: dependencies must be an array');
  }

  models[Model.modelName] = Model;
  info[Model.modelName] = {drop, dependencies: dependencies.map(model => model.modelName), seed};
}

export function createSeedModel (name, Schema, opts) {
  if (!name) {
    throw new TypeError('mongoose-plugin-seed: name must be provided');
  }
  else if (typeof name !== 'string') {
    throw new TypeError('mongoose-plugin-seed: name must be a string');
  }
  else if (!Schema) {
    throw new TypeError('mongoose-plugin-seed: Schema must be provided');
  }

  const Model = mongoose.model(name, Schema);

  addSeed(Model, opts);

  return Model;
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
