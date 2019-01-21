import assert from "assert"
import path from "path"

type TSC = typeof import("typescript")
type CompilerOptions = Parameters<TSC["createProgram"]>[1]
type Program = ReturnType<TSC["createProgram"]>
type Diagnostic = ReturnType<Program["getSemanticDiagnostics"]>[0]
type SourceFile = NonNullable<ReturnType<Program["getSourceFile"]>>

export class TypeTester {
    private readonly ts: TSC
    private readonly describe: (description: string, body: () => void) => void
    private readonly it: (description: string, body: () => void) => void

    /**
     * Initialize this instance.
     * @param ts The TypeScript compiler API.
     * @param options The configuration to initialize.
     */
    public constructor(ts: TSC, options?: TypeTester.Options) {
        this.ts = ts
        this.describe =
            (options && options.describe) || global.describe || fallback
        this.it = (options && options.it) || global.it || fallback
    }

    /**
     * Verify expected type errors.
     * @param fixtureFiles The fixture files to check type errors.
     * @param compilerOptions The compiler options.
     */
    public verify(
        fixtureFiles: ReadonlyArray<string>,
        compilerOptions: CompilerOptions,
    ): void {
        const allFiles = fixtureFiles.map(filePath => path.resolve(filePath))
        const program = this.ts.createProgram(allFiles, compilerOptions)
        const ancestorLength = getCommonAncestor(allFiles).length
        const isRoot = Set.prototype.has.bind(
            new Set(allFiles.map(f => f.replace(/\\/gu, "/"))),
        )

        this.describe("(misc)", () => {
            this.verifyMisc(program)
        })

        for (const file of program.getSourceFiles()) {
            const relative = file.fileName.slice(ancestorLength)
            if (isRoot(file.fileName)) {
                this.describe(relative, () => {
                    this.verifyFixture(program, file)
                })
            } else if (
                !program.isSourceFileDefaultLibrary(file) &&
                !program.isSourceFileFromExternalLibrary(file)
            ) {
                this.describe(relative, () => {
                    this.verifySource(program, file)
                })
            }
        }
    }

    private verifyMisc(program: Program): void {
        const diagnostics = new Set(
            [
                ...program.getOptionsDiagnostics(),
                ...program.getConfigFileParsingDiagnostics(),
            ].filter(d => d.category === this.ts.DiagnosticCategory.Error),
        )

        // Report.
        for (const diagnostic of diagnostics) {
            this.reportUnexpectedError(diagnostic)
        }
    }

    private verifyFixture(program: Program, file: SourceFile): void {
        const diagnostics = new Set(
            [
                ...program.getSyntacticDiagnostics(file),
                ...program.getDeclarationDiagnostics(file),
                ...program.getSemanticDiagnostics(file),
            ].filter(d => d.category === this.ts.DiagnosticCategory.Error),
        )

        // Find @expected comments
        const expectedDiagnostics = new Map<string, Diagnostic | null>()
        for (const { line, code } of this.collectExpectedErrors(file)) {
            let foundDiagnostic: Diagnostic | null = null
            for (const d of diagnostics) {
                if (d.start == null) {
                    continue
                }

                const { line: dLine } = file.getLineAndCharacterOfPosition(
                    d.start,
                )

                if (d.code === code && dLine === line) {
                    foundDiagnostic = d
                    diagnostics.delete(d)
                    break
                }
            }

            expectedDiagnostics.set(
                `TS${code} at L${line + 1}`,
                foundDiagnostic,
            )
        }

        // Report.
        for (const [key, diagnostic] of expectedDiagnostics) {
            this.reportExpectedError(key, diagnostic)
        }
        for (const diagnostic of diagnostics) {
            this.reportUnexpectedError(diagnostic)
        }
    }

    private verifySource(program: Program, file: SourceFile): void {
        const diagnostics = new Set(
            [
                ...program.getSyntacticDiagnostics(file),
                ...program.getDeclarationDiagnostics(file),
                ...program.getSemanticDiagnostics(file),
            ].filter(d => d.category === this.ts.DiagnosticCategory.Error),
        )

        // Report.
        for (const diagnostic of diagnostics) {
            this.reportUnexpectedError(diagnostic)
        }
    }

    private *collectExpectedErrors(
        file: SourceFile,
    ): IterableIterator<{ line: number; code: number }> {
        const scanner = this.ts.createScanner(
            file.languageVersion,
            false,
            file.languageVariant,
            file.getFullText(),
        )

        let kind = 0
        while ((kind = scanner.scan()) !== this.ts.SyntaxKind.EndOfFileToken) {
            if (
                kind === this.ts.SyntaxKind.SingleLineCommentTrivia ||
                kind === this.ts.SyntaxKind.MultiLineCommentTrivia
            ) {
                const comment = scanner.getTokenText()
                const m = /@expected\s+(\d+)/u.exec(comment)
                if (m != null) {
                    const code = Number(m[1])
                    const { line } = file.getLineAndCharacterOfPosition(
                        scanner.getTokenPos(),
                    )
                    yield { line, code }
                }
            }
        }
    }

    private reportExpectedError(
        key: string,
        diagnostic: Diagnostic | null,
    ): void {
        this.it(`should have an error ${key}.`, () => {
            assert(diagnostic != null)
        })
    }

    private reportUnexpectedError(diagnostic: Diagnostic): void {
        let description = `should not have an error TS${diagnostic.code}`
        if (diagnostic.file != null && diagnostic.start != null) {
            const loc = diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start,
            )
            description += ` at ${loc.line + 1}:${loc.character + 1}`
        }

        this.it(description, () => {
            assert(
                false,
                this.ts.flattenDiagnosticMessageText(
                    diagnostic.messageText,
                    "\n",
                ),
            )
        })
    }
}

export namespace TypeTester {
    /**
     * The options to construct a `TypeTester` instance.
     */
    export interface Options {
        /**
         * Function to declare test suites.
         * If omitted, it uses `global.describe`.
         */
        describe?: (description: string, body: () => void) => void

        /**
         * Function to declare test cases.
         * If omitted, it uses `global.it`.
         */
        it?: (description: string, body: () => void) => void
    }
}

function getCommonAncestor(files: ReadonlyArray<string>): string {
    let ancestor = path.dirname(files[0])

    for (let i = 1; i < files.length; ++i) {
        const filePath = files[i]

        for (let j = 0, lastSep = 0; j < ancestor.length; ++j) {
            if (ancestor[j] !== filePath[j]) {
                ancestor = ancestor.slice(0, lastSep)
                break
            }
            if (ancestor[j] === path.sep) {
                lastSep = j
            }
        }
    }

    if (ancestor && !ancestor.endsWith(path.sep)) {
        ancestor += path.sep
    }
    return ancestor
}

// istanbul ignore next
function fallback(_description: string, f: () => void): void {
    f()
}
