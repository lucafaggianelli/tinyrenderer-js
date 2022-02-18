/// @ts-ignore
import TgaLoader from 'tga-js'

import { Vec3 } from './geometry.js'

export default class Model {
  faces: [number, number, number][] = []
  textureFacets: [number, number, number][] = []
  textureVertices: Vec3[] = []
  texture?: ImageData
  vertices: Vec3[] = []
  verticesNormals: Vec3[] = []

  load = async (url: string) => {
    const response = await fetch(url)
    this.parse(await response.text())
  }

  async loadTexture (url: string) {
    const tga = new TgaLoader()
    const canvas: HTMLCanvasElement = await new Promise(resolve => {
      tga.open(url, () => {
        resolve(tga.getCanvas())
      })
    })

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Cant get context')
    }

    this.texture = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  parse (data: string) {
    data.split('\n').forEach(line => {
      const [ type, ...content ] = line.split(/\s+/)

      switch (type) {
        case 'v':
          this.vertices.push(new Vec3(...content.map(item => parseFloat(item))))
          break

        case 'vn':
          this.verticesNormals.push(new Vec3(...content.map(item => parseFloat(item))))
          break

        case 'vt':
          this.textureVertices.push(new Vec3(...content.map(item => parseFloat(item))))
          break

        case 'f':
          const all = content.reduce((all, item) => {
            const parts = item.split('/')

            for (const i in parts) {
              all[i].push(parseInt(parts[i]) - 1)
            }

            return all
          }, [[], [], []] as number[][])

          /// @ts-ignore
          this.faces.push(all[0])
          /// @ts-ignore
          this.textureFacets.push(all[1])

          break
      }
    })
  }
}
