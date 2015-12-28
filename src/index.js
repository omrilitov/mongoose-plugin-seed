'use strict';

import {DepGraph} from 'dependency-graph';

const schemasDependencies = {};

const getSchemasOrder = () => {
  const graph = new DepGraph();

  Object.keys(schemasDependencies).forEach(schema => graph.addNode(schema));

  Object.keys(schemasDependencies).forEach(schema => {
    schemasDependencies[schema].forEach(dep => graph.addDependency(schema, dep));
  });

  return graph.overallOrder();
};

export function plugin (schema, {model, seed, dependencies = []} = {}) {
  // No arrow function so `this` will be the model
  schema.statics.seed = function (deps) {
    return this.remove({}).exec()
      .then(() => {
        return this.create(seed(...deps));
      });
  };

  schemasDependencies[model] = dependencies;
}

export function seed (mongoose) {
  const order = getSchemasOrder();
  const seeds = {};

  return Promise.all(order.map(name => {
    const Model = mongoose.model(name);

    seeds[name] = Promise.all(schemasDependencies[name].map(dep => seeds[dep]))
      .then(deps => Model.seed(deps));

    return seeds[name];
  }));
}
