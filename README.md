# type-tester

[![npm version](https://img.shields.io/npm/v/type-tester.svg)](https://www.npmjs.com/package/type-tester)
[![Downloads/month](https://img.shields.io/npm/dm/type-tester.svg)](http://www.npmtrends.com/type-tester)
[![Build Status](https://travis-ci.com/mysticatea/type-tester.svg?branch=master)](https://travis-ci.com/mysticatea/type-tester)
[![Coverage Status](https://codecov.io/gh/mysticatea/type-tester/branch/master/graph/badge.svg)](https://codecov.io/gh/mysticatea/type-tester)
[![Dependency Status](https://david-dm.org/mysticatea/type-tester.svg)](https://david-dm.org/mysticatea/type-tester)

A tester to check expected type errors.

## 🏁 Goal

This package provides utility to verify that the type you have written stricter reports expected type errors, for TypeScript.

## 💿 Installation

Use [npm] or a compatible tool to install this package.

```
npm install type-tester typescript
```

- Requires Node.js `>=6.0.0`.

## 📖 Usage

1. Write fixture files.
2. Write test files.
3. Run test files with test runner such as [mocha].

### 1. Write fixture files.

The fixture file should include the situation of type error.
You must add directive comments such as `// @expected 2345` for each line of expected errors.
The number is the error code of TypeScript.

For example: [test/fixtures/event-target-shim/fixture.ts](test/fixtures/event-target-shim/fixture.ts)

### 2. Write test files.

The test file should execute `TypeTester#verify()` method with the path to the fixture files and compiler options.

For example: [test/example.ts](test/example.ts)

### 3. Run test files with test runner such as [mocha].

Because the `TypeTester#verify()` method defines test cases with `describe` / `it` global functions, you must run it with test runners.

For example:

```
mocha test/example.ts --require ts-node/register

  this test runs the type tester merely.
    fixture.ts
      √ should have an error TS2345 at L98.
      √ should have an error TS2345 at L101.
      √ should have an error TS7006 at L102.
      √ should have an error TS2345 at L105.
      √ should have an error TS7006 at L106.
      √ should have an error TS2322 at L108.
      √ should have an error TS2322 at L109.
      √ should have an error TS2345 at L152.

  8 passing (11ms)
```

## 📚 API References

### `TypeTester` class

The class to verify expected type errors.

### `constructor(ts: typeof import("typescript"), options: TypeTester.Options)`

#### Parameters

Name | Description
:----|:-----------
`ts` | API to use type checking.
`options.describe` | Optional. Function to declare test suites. Use `global.describe` by default.
`options.it` | Optional. Function to declare test cases. Use `global.it` by default.

### `tester.verify(fixtureFiles: ReadonlyArray<string>, compilerOptions: ts.CompilerOptions): void`

Verify the given fixture files.

#### Parameters

Name | Description
:----|:-----------
`fixtureFiles` | Path to fixture files.
`compilerOptions` | Compiler options to verify the fixture files.

## 📰 Release notes

- https://github.com/mysticatea/type-tester/releases

## ❤️ Contributing

Contribution is welcome!

Please use GitHub issues and pull requests.

### Development tools

- `npm run build` generates files into `dist` directory.
- `npm run clean` removes temporary files.
- `npm run coverage` opens the coverage report the last `npm test` command generated.
- `npm run lint` runs ESLint.
- `npm test` runs tests.
- `npm run watch` runs tests on each file edits.

[mocha]: https://mochajs.org/
[npm]: https://www.npmjs.com/
