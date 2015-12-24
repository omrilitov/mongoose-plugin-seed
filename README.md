# mongoose-plugin-seed

Mongoose plugin to seed your models

## Overview

This module will seed your Mongoose models while using dependency management between them.
It will empty the collection and create the new given data.

#### To use:
1. `npm install --save mongoose-plugin-seed`
2. Use the plugin in the desired Models with given seed data
3. Call seed

## Examples

```js
var seedPlugin = require('mongoose-plugin-seed').plugin;
var mongooseSeed = require('mongoose-plugin-seed').seed;

// Define Schemas
var UserSchema = new Schema({...});
var RoleSchema = new Schema({...});

// Define users seed with dependency to roles
UserSchema
  .plugin(seedPlugin, {
    model: 'User',
    dependencies: ['Role'],
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
RoleSchema
  .plugin(seedPlugin, {
    model: 'Role',
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

### plugin

```js
var seedPlugin = require('mongoose-plugin-seed').plugin;
Schema.plugin(seedPlugin, options);
```

The plugin uses the following options:

 - `model` - name of the current model
 - `seed` - function that returns the seed data (using required dependencies)
 - `dependencies (optional)` - dependencies to seed the data
 
### seed

```js
var mongooseSeed = require('mongoose-plugin-seed').seed;
mongooseSeed();
```

The function seeds all the data in the correct order.
Returns a Promise.
