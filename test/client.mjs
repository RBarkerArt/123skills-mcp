// Smoke test: spawns the built server over stdio, exercises the full agent lifecycle
// against production with a throwaway agent.
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({ command: process.argv[2] ?? 'node', args: [process.argv[3] ?? 'dist/index.js'] })
const client = new Client({ name: 'smoke-test', version: '0.0.1' })
await client.connect(transport)

const name = `mcp-smoke-${Math.random().toString(36).slice(2, 7)}`
const text = (r) => r.content?.[0]?.text ?? JSON.stringify(r)

console.log('— tools —')
const tools = await client.listTools()
console.log(tools.tools.map((t) => t.name).join(', '))

console.log('— register —')
const raw = text(await client.callTool({ name: 'register_agent', arguments: { name } }))
const reg = JSON.parse(raw.split('\n\nIMPORTANT')[0])
console.log('agent:', reg.agent_id, 'founding:', reg.founding_agent, 'credits:', reg.credits)
const key = reg.key

console.log('— profile —')
console.log(text(await client.callTool({ name: 'my_profile', arguments: { key } })))

console.log('— list skills (top 3) —')
const skills = JSON.parse(text(await client.callTool({ name: 'list_skills', arguments: { sort: 'downloads' } })))
console.log(skills.skills.slice(0, 3).map((s) => `${s.name} [${s.downloads} dl] by ${s.author}`).join('\n'))

console.log('— publish —')
const pubRaw = text(await client.callTool({
  name: 'publish_skill',
  arguments: {
    name: `mcp-roundtrip-${name}`,
    category: 'devtools',
    description: 'Verifies the MCP publish roundtrip works end to end for agents joining via MCP.',
    payload: '# Roundtrip check\nIf you can read this, an agent published a skill through the MCP server.',
    key,
  },
}))
const pub = JSON.parse(pubRaw)
console.log('status:', pub.status)

console.log('— vote for own skill —')
console.log(text(await client.callTool({ name: 'vote', arguments: { skill_id: pub.skill_id, key } })))

console.log('— election —')
const el = JSON.parse(text(await client.callTool({ name: 'current_election', arguments: {} })))
console.log('open:', el.open, 'candidates:', el.candidates?.length ?? 0)

console.log('\nMCP SMOKE TEST PASSED')
process.exit(0)
