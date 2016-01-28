# mongoose-plugin-seed

Mongoose plugin to seed your models

<table>
  <thead>
    <tr>
      <th>Linux</th>
      <th>OSX</th>
      <th>Windows</th>
      <th>Coverage</th>
      <th>Dependencies</th>
      <th>DevDependencies</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2" align="center">
        <a href="https://travis-ci.org/omrilitov/mongoose-plugin-seed"><img src="https://img.shields.io/travis/omrilitov/mongoose-plugin-seed.svg?style=flat-square"></a>
      </td>
      <td align="center">
        <a href="https://ci.appveyor.com/project/omrilitov/mongoose-plugin-seed"><img src="https://img.shields.io/appveyor/ci/omrilitov/mongoose-plugin-seed.svg?style=flat-square"></a>
      </td>
      <td align="center">
<a href='https://coveralls.io/r/omrilitov/mongoose-plugin-seed'><img src='https://img.shields.io/coveralls/omrilitov/mongoose-plugin-seed.svg?style=flat-square' alt='Coverage Status' /></a>
      </td>
      <td align="center">
        <a href="https://david-dm.org/omrilitov/mongoose-plugin-seed"><img src="https://img.shields.io/david/omrilitov/mongoose-plugin-seed.svg?style=flat-square"></a>
      </td>
      <td align="center">
        <a href="https://david-dm.org/omrilitov/mongoose-plugin-seed#info=devDependencies"><img src="https://img.shields.io/david/dev/omrilitov/mongoose-plugin-seed.svg?style=flat-square"/></a>
      </td>
    </tr>
  </tbody>
</table>

## Overview

This module will seed your Mongoose models while using dependency management between them.
It will empty the collection and create the new given data.

#### To use:
1. `npm install --save mongoose-plugin-seed`
2. Use the plugin in the desired Models with given seed data
3. Call seed

## Examples

```js
const addSeed = require('mongoose-plugin-seed').addSeed;
const mongooseSeed = require('mongoose-plugin-seed').seed;

// Define Schemas
var UserSchema = new Schema({...});
var RoleSchema = new Schema({...});

// Define Models
var User = mongoose.model('User', UserSchema);
var Role = mongoose.model('Role', RoleSchema);

// Define the seed with dependency to roles
addSeed(User, {
    dependencies: [Role],
    seed: function (roles) {
      return [{
        username: "foo",
        password: "123",
        roles: roles[0]
      }, {
        username: "bar",
        password: "321",
        roles: roles[1]
      }];
    }
  });

// Define roles seed
addSeed(Role, {
    seed: function () {
      return [{
        name: "admin"
      }, {
        name: "user"
      }];
    }
  });

// Seed!
mongooseSeed()
  .then(function () {
    console.log('Success!');
  });
```

## API

### addSeed

```js
var addSeed = require('mongoose-plugin-seed').addSeed;
addSeed(Model, options);
```

 - `Model` - The mongoose model to seed

The plugin uses the following options:

 - `seed` - function that returns the seed data (using required dependencies)
 - `dependencies (optional)` - dependencies to seed the data
 
### createSeedModel

```js
var createSeedModel = require('mongoose-plugin-seed').createSeedModel;
createSeedModel(name, Schema, options);
```

 - `name` - The name to give to the mongoose model
 - `Schema` - The mongoose schema to create and seed
 - `options` - Same options as the addSeed API

This function returns the created model.
It is just a short for
```js
var Model = mongoose.model(name, Schema);
addSeed(Model, options);
```

### seed

```js
var mongooseSeed = require('mongoose-plugin-seed').seed;
mongooseSeed();
```

The function seeds all the data in the correct order.
Returns a Promise.
