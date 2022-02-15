import TgaLoader from './tga-loader.js'

import { Vec3 } from './geometry.js'

export default class Model {
  vertices = []
  textureVertices = []
  faces = []
  textureFacets = []

  constructor () {
  }

  load = async (url) => {
    const response = await fetch(url)
    this.parse(await response.text())
  }

  async loadTexture (url) {
    const tga = new TgaLoader();
    const canvas = await new Promise(resolve => {
      tga.open(url, () => {
        resolve(tga.getCanvas())
      })
    })

    const ctx = canvas.getContext('2d')

    this.texture = ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  parse = (data) => {
    data.split('\n').forEach(line => {
      const [ type, ...content ] = line.split(/\s+/)

      switch (type) {
        case 'v':
          this.vertices.push(new Vec3(...content.map(item => parseFloat(item))))
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
          }, [[], [], []])

          this.faces.push(all[0])
          this.textureFacets.push(all[1])

          break
      }
    })
  }
}
