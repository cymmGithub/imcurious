import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SCENARIOS } from '../scenarios'

const mdxPath = resolve(__dirname, '../../posts/the-js-event-loop-works.mdx')
const mdxContent = readFileSync(mdxPath, 'utf-8')

/**
 * Extract StepList blocks from MDX and count numbered list items.
 * Each <StepList scenarioId="X"> ... </StepList> block should contain
 * exactly as many numbered items (lines starting with "N.") as
 * the scenario has syncOps.
 */
function extractStepLists(content: string) {
	const regex =
		/<StepList\s+scenarioId="([^"]+)">\s*([\s\S]*?)\s*<\/StepList>/g
	const results: { scenarioId: string; itemCount: number }[] = []
	let match

	while ((match = regex.exec(content)) !== null) {
		const scenarioId = match[1]
		const body = match[2]
		const items = body.split('\n').filter((line) => /^\d+\./.test(line.trim()))
		results.push({ scenarioId, itemCount: items.length })
	}

	return results
}

describe('StepList content matches scenario syncOps', () => {
	const stepLists = extractStepLists(mdxContent)

	it('finds all StepList blocks in the MDX', () => {
		expect(stepLists.length).toBeGreaterThan(0)
	})

	for (const { scenarioId, itemCount } of stepLists) {
		it(`"${scenarioId}" has ${SCENARIOS[scenarioId]?.syncOps?.length} list items matching syncOps`, () => {
			const scenario = SCENARIOS[scenarioId]
			expect(scenario).toBeDefined()
			expect(scenario.syncOps).toBeDefined()
			expect(itemCount).toBe(scenario.syncOps!.length)
		})
	}
})
