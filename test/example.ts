import path from "path"
import typescript from "typescript"
import { TypeTester } from "../src/index"

const tester = new TypeTester(typescript)

describe("this test runs the type tester merely.", () => {
    tester.verify(
        [path.resolve(__dirname, "./fixtures/event-target-shim/fixture.ts")],
        {
            lib: ["lib.es5.d.ts", "lib.dom.d.ts"],
            strict: true,
        },
    )
})
