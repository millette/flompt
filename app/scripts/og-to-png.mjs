import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/og-image.svg')
const pngPath = resolve(__dirname, '../public/og-image.png')

const svg = readFileSync(svgPath, 'utf-8')

const fontFiles = [
  '/tmp/inter-fonts/inter-400.ttf',
  '/tmp/inter-fonts/inter-500.ttf',
  '/tmp/inter-fonts/inter-600.ttf',
  '/tmp/inter-fonts/inter-700.ttf',
  '/tmp/inter-fonts/inter-800.ttf',
]

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    fontFiles,
    loadSystemFonts: true,
    defaultFontFamily: 'Inter',
  },
})

const pngData = resvg.render()
const pngBuffer = pngData.asPng()

writeFileSync(pngPath, pngBuffer)
console.log(`✅ OG image saved to ${pngPath} (${(pngBuffer.length / 1024).toFixed(1)} KB)`)
