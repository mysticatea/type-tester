import assert from "assert"
import path from "path"
import ts from "typescript"
import { TypeTester } from "../src/index"

describe("TypeTester", () => {
    const errors: Error[] = []
    let tester: TypeTester

    beforeEach(() => {
        const stack: string[] = []
        tester = new TypeTester(ts, {
            describe(description, f) {
                stack.push(description)
                f()
                stack.pop()
            },

            it(description, f) {
                stack.push(description)
                try {
                    f()
                } catch (error) {
                    error.message = `${stack.join(" >> ")}: ${error.message}`
                    errors.push(error)
                }
                stack.pop()
            },
        })
        errors.length = 0
    })

    describe("verify()", () => {
        describe("with fixture 'event-target-shim'", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/event-target-shim/fixture.ts",
                        ),
                    ],
                    {
                        lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should not fail any test case.", () => {
                assert.strictEqual(errors.length, 0)
            })
        })

        describe("with fixture 'has-error-in-fixture'", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/has-error-in-fixture/fixture.ts",
                        ),
                    ],
                    {
                        lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should fail a test case.", () => {
                assert.strictEqual(errors.length, 1)
            })

            it("should contain location of the error in the test case.", () => {
                const message = (errors[0] && errors[0].message) || ""
                assert(
                    message.startsWith(
                        "fixture.ts >> should not have an error TS2345 at 98:17",
                    ),
                    message,
                )
            })
        })

        describe("with fixture 'has-error-in-source'", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/has-error-in-source/fixture.ts",
                        ),
                    ],
                    {
                        lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should fail a test case.", () => {
                assert.strictEqual(errors.length, 1)
            })

            it("should contain location of the error in the test case.", () => {
                const message = (errors[0] && errors[0].message) || ""
                assert(
                    message.startsWith(
                        "event-target.d.ts >> should not have an error TS7006 at 396:5",
                    ),
                    message,
                )
            })
        })

        describe("with fixture 'not-have-expected-error'", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/not-have-expected-error/fixture.ts",
                        ),
                    ],
                    {
                        lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should fail a test case.", () => {
                assert.strictEqual(errors.length, 1)
            })

            it("should contain location of the error in the test case.", () => {
                const message = (errors[0] && errors[0].message) || ""
                assert(
                    message.startsWith(
                        "fixture.ts >> should have an error TS2345 at L13",
                    ),
                    message,
                )
            })
        })

        describe("with fixture 'event-target-shim' (no @expected comments)", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/event-target-shim/event-target.d.ts",
                        ),
                    ],
                    {
                        lib: ["lib.es5.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should be work if fixture files are nothing.", () => {
                assert.strictEqual(errors.length, 0)
            })
        })

        describe("with fixture 'has-error-in-source' (no @expected comments)", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/has-error-in-source/event-target.d.ts",
                        ),
                    ],
                    {
                        strict: true,
                    },
                )
            })

            it("should be work if fixture files are nothing.", () => {
                assert.strictEqual(errors.length, 1)
            })
        })

        describe("with fixture 'event-target-shim' (with option error)", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/event-target-shim/event-target.d.ts",
                        ),
                    ],
                    {
                        lib: ["lib.unknown.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should have a misc error.", () => {
                assert.strictEqual(
                    errors.filter(e => e.message.startsWith("(misc)")).length,
                    1,
                )
            })
        })

        describe("with fixtures 'has-error-in-fixture' and `has-error-in-source`", () => {
            beforeEach(() => {
                tester.verify(
                    [
                        path.resolve(
                            __dirname,
                            "./fixtures/has-error-in-fixture/fixture.ts",
                        ),
                        path.resolve(
                            __dirname,
                            "./fixtures/has-error-in-source/fixture.ts",
                        ),
                    ],
                    {
                        lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
                        strict: true,
                    },
                )
            })

            it("should fail two test case.", () => {
                assert.strictEqual(errors.length, 2)
            })

            it("should contain location of the error in the test cases.", () => {
                const message1 = (errors[0] && errors[0].message) || ""
                const message2 = (errors[1] && errors[1].message) || ""
                assert(
                    message1.startsWith(
                        "has-error-in-fixture/fixture.ts >> should not have an error TS2345 at 98:17",
                    ),
                    message1,
                )
                assert(
                    message2.startsWith(
                        "has-error-in-source/event-target.d.ts >> should not have an error TS7006 at 396:5",
                    ),
                    message2,
                )
            })
        })
    })
})
