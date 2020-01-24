# restrict-v

A lightweight, extensible set of tools for applying limitations to runtime values.

Use with security-critical applications or when accepting external arguments.

[![NPM](https://nodei.co/npm/restrict-v.png)](https://nodei.co/npm/restrict-v/)

[![NPM](https://img.shields.io/github/license/jpcx/restrict-v.svg)](https://www.npmjs.com/package/restrict-v/)
[![NPM](https://img.shields.io/node/v/restrict-v.svg)](https://www.npmjs.com/package/restrict-v/)
[![NPM](https://img.shields.io/npm/dm/restrict-v.svg)](https://www.npmjs.com/package/restrict-v/)
[![NPM](https://img.shields.io/github/last-commit/jpcx/restrict-v.svg)](https://www.npmjs.com/package/restrict-v/)
[![NPM](https://img.shields.io/david/jpcx/restrict-v.svg)](https://www.npmjs.com/package/restrict-v/)
[![NPM](https://img.shields.io/david/dev/jpcx/restrict-v.svg)](https://www.npmjs.com/package/restrict-v/)

## Index

 - API
   - [Restriction](#restriction) - Value limitiation framework
   - [restrict](#presets-and-factories) - Restriction instance presets and factories
   - [DeepFreeze](#deepfreeze) - Small, safe, deep property freezing class 
 - Project
   - [Contributing](#contributing)
   - [ChangeLog](ChangeLog)
   - [License](LICENSE)

# Restriction

## Usage Summary

```ts

type Predicate<T> = (...value: T[]) => boolean;
type Assertion<T> = (...value: T[]) => void;
interface PassthroughValidator<T> {
  <U extends T>(value: U): U;
  <U extends T[]>(...value: U): U;
}

type Conditional<T> =
  | Predicate<T>
  | Assertion<T>
  | PassthroughValidator<T>
  | Restriction<T>;

type SchemaValueType<T> =
  | Conditional<T>
  | Schema<T>;

type Schema<T extends SchemaTarget> = {
  [key in keyof T]: SchemaValueType<T[key]>
};

class Restriction<T> {
  constructor(message: string, ...conditionals: Array<Conditional<T>>);
  constructor(message: string, ...schemas: Array<Schema<T>>);
  constructor(
    message: string,
    ...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>
  );
  constructor(...conditionals: Array<Conditional<T>>);
  constructor(...schemas: Array<Schema<T>>);
  constructor(...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>);
}
```

`Restriction` instances are functions that either return the value(s) passed to them or throw a `RestrictionError`.
They can be created using an optional message and a list of functions.
When a restriction instance is called, any value(s) passed will be passed to the provided functions.
If any of these functions return a falsy value or throw, the restriction will throw.
 
Restrictions may also be constructed with a `Schema`- an `Object` or `Array` whose values are either Restrictions or Schemas.
Schema Restrictions will throw if a passed value's structure differs from the Schema or if any of the values fail the Schema's restrictions.

Restrictions may be combined or extended with new `Conditional` functions with `.and` and `.or`.
Both of these methods may be used in the same way as the base constructor.

Restriction messages may be changed using the `.msg` method or with `restriction.message = ` assignment.

```ts

import { restrict, Restriction } from 'restrict-v';

const rOddNumber = new Restriction(
  "Must be an odd 'number'",
  restrict.number,
  (v: number) => v % 2 === 1
);

// myOddNumber === 41
const myOddNumber = rOddNumber(41);

// throws RestrictionError [ERR_RESTRICTION]: Must be an odd 'number'
//   code: 'ERR_RESTRICTION',
//   messageStack: [ "Must be an odd 'number'" ],
//   value: 42,
//   root: 42
// }
rOddNumber(42);

const rUserData = new Restriction(
  "Must be a UserData object",
  {
    name: restrict.string,
    age: restrict.integer
      .and(
        'Must be a valid age < 200',
        restrict.range(1, 200)
      )
  }
);

// { name: 'John Smith', age: 20 }
rUserData({ name: 'John Smith', age: 20 });

// throws RestrictionError [ERR_RESTRICTION]: Must be a UserData object
//   code: 'ERR_RESTRICTION',
//   messageStack: [
//     'Must be a valid age < 200',
//     'Must be a UserData object'
//   ],
//   value: 2000,
//   root: { name: 'John Smith', age: 2000 }
// }
rUserData({ name: 'John Smith', age: 2000 });

```

## Examples

### Presets and Factories

The exported `restrict` object contains some preset Restriction instances and factories. 

Presets are standard Restrictions; Factories create Restrictions given some input.

```ts
import { restrict } from 'restrict-v';

// int === 24
const int: number = restrict.integer(24);

// intA === 11
// intB === 23
const [ intA, intB ]: [ number, number ] = restrict.integer(11, 23);

// throws RestrictionError: Must be an integer
const int: number = restrict.integer(24.42);

// TS compiler error:
//   Argument of type '"24.42"' is not assignable to parameter of type 'number'.
const int = restrict.integer("24.42");

// value === 10;
const value = restrict.lt(15)(10);

// throws RestrictionError [ERR_RESTRICTION]: Must be a 'number' greater than or equal to 15
const value = restrict.gte(15)(10);

```

#### List of Presets

```ts

   Preset             Message
   ------             -------
 - restrict.string    // Must be a 'string'
 - restrict.number    // Must be a 'number'
 - restrict.bigint    // Must be a 'bigint'
 - restrict.boolean   // Must be a 'boolean'
 - restrict.null      // Must be null
 - restrict.undefined // Must be undefined
 - restrict.symbol    // Must be a 'symbol'
 - restrict.integer   // Must be an integer
 - restrict.positive  // Must be a positive 'number' or 'bigint'
 - restrict.negative  // Must be a negative 'number' or 'bigint'
 - restrict.Object    // Must be an instance of Object
 - restrict.Array     // Must be an instance of Array

```

#### List of Factories

```ts

   Factory                           Message
   -------                           -------
 - restrict.eq(any)                  // Must be strictly equal to ${v}
 - restrict.neq(any)                 // Must not be strictly equal to ${v}
 - restrict.gt<                      // Must be a '${T}' greater than ${v}
     T extends number | bigint
   >(T)
 - restrict.lt<                      // Must be a '${T}' less than ${v}
     T extends number | bigint
   >(T)
 - restrict.gte<                     // Must be a '${T}' greater than or equal to ${v}
     T extends number | bigint
   >(T)
 - restrict.lte<                     // Must be a '${T}' less than or equal to ${v}
     T extends number | bigint
   >(T)
 - restrict.range<                   // Must be a '${T}' within the range ${'['|'('}${v0},${v1}${']'|')'}
     T extends number | bigint
   >(
     T, T,
     lowInclusive: boolean = true,
     upInclusive: boolean = false
   )
 - restrict.instanceof(new() => any) // Must be an instance of '${v.name}'
 - restrict.match(string | RegExp)   // Must be a 'string' matching ${v}

```

### Custom

```ts

import { Restriction } from 'restrict-v';

const rOddNumber = new Restriction(
  "Must be an odd 'number'",
  restrict.number,
  (v: number) => v % 2 === 1
)

const myOddNumber = rOddNumber(41);

// throws RestrictionError [ERR_RESTRICTION]: Must be an odd 'number'
rOddNumber(42)

```

### Schemas

```ts

import {
  restrict,
  Restriction,
  RestrictionTargetType,
  SchemaTargetType
} from 'restrict-v';

const SITE_CREATION_TIME = 1548174793502;
const rTimeWithinSiteExistence = restrict.range(SITE_CREATION_TIME, Date.now());

const sUserData = {
  name: restrict.string,
  age: restrict.number,
  joined: rTimeWithinSiteExistence,
  credentials: {
    sessionToken: restrict.match(
      /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/m
    )
  },
  history: {
    lastThreeVisits: [
      rTimeWithinSiteExistence,
      rTimeWithinSiteExistence,
      rTimeWithinSiteExistence
    ]
  }
};

const rUserData = new Restriction(sUserData)
  .and(
    (v: SchemaTargetType<typeof sUserData>) => // use SchemaTargetType to get
                                               // type from Schema object
      v.history.lastThreeVisits[2] >= v.joined &&
      v.history.lastThreeVisits[2] < v.history.lastThreeVisits[1] &&
      v.history.lastThreeVisits[1] < v.history.lastThreeVisits[0]
  )
  .msg("Must be a valid user data object");

// use RestrictionTargetType to get type from Restriction instance
type UserData = RestrictionTargetType<typeof rUserData>;

// --- //

const scaryUnknownJSONResponse = await (await fetch(...)).json();

const trustedExpectedResponse: UserData = rExpectedResponse(
  scaryUnknownJSONResponse
)

```

### Combinations 

```ts

const rNumberLike = restrict.number
  .or(restrict.bigint)
  .or(restrict.boolean)
  .msg("Must be a 'number', 'bigint', or 'boolean'")

// rNumberLike: Restriction<number | bigint | boolean>

// THROWS RestrictionError [ERR_RESTRICTION]: Must be a 'number', 'bigint', or 'boolean'
// @ts-ignore
rNumberLike('not any of those')

// ------------------ //
// Without .msg

// THROWS RestrictionError [ERR_RESTRICTION]: ((Must be a 'number' || Must be a 'bigint') || Must be a 'boolean')
restrict.number
  .or(restrict.bigint)
  .or(restrict.boolean)
  // @ts-ignore
  ('still not any of those')

```

### RestrictionErrors

```ts

class RestrictionError<T> extends Error {
  name: "RestrictionError"; // Error name
  code: "ERR_RESTRICTION";  // Error code
  message: string;          // Error message
  value: T;                 // Value responsible for throw
  root: any;                // Root Schema target object (.value if non-schema)
  messageStack: string[];   // Stack of parent restrictions; deepest first
}

```

# DeepFreeze

DeepFreeze is a small class that deeply freezes properties and prototypes without freezing any global objects.

```ts

import { DeepFreeze } from 'restrict-v';

// Whitelist all deep properties and prototypes attached to globalThis
const deepFreeze = new DeepFreeze();

// foo is attached to globalThis via module.exports
export const foo = (v: string) => v + '_bar';

// deep freeze globalThis-attached objects and prototypes
// (except for any references found during construction)
deepFreeze(this);

```

# TODO

 - Allow for circular references within Schema objects
 - Add a forEach factory
 - Add property restriction factory method
 - Create RestrictedObject class
 - Add parens simplification for default-generated `.and` and `.or` combination messages

# Contributing 

I'd like to expand this concept without introducing too much bloat.
If you have an idea that you'd like to contribute, or if you see any opportunities for better TypeScript usage, please make a pull request.

Rules:
 - All API arguments must be checked independent of TypeScript compiler
   - `typeof`, `instanceof`, `Restriction`, etc...
 - All API objects must be deeply frozen

# License

Licensed under GPL-3.0-or-later

Copyright (c) Justin Collier <jpcxist@gmail.com>

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.                                   
                                                                      
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the internalied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.                          
                                                                      
You should have received a copy of the GNU General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
