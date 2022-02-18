import { Color, Matrix, Vec3 } from './geometry'
import Model from './model'
import { drawTriangle, drawTriangleTexture } from './renderer.js'

const buildViewport = (x: number, y: number, w: number, h: number, depth: number) => {
  const m = Matrix.identity(4)

  m.data[0][3] = x+w/2
  m.data[1][3] = y+h/2
  m.data[2][3] = depth/2

  m.data[0][0] = w/2
  m.data[1][1] = h/2
  m.data[2][2] = depth/2

  return m
}

export default class Engine {
  camera?: Vec3
  canvas: HTMLCanvasElement
  lightDirection?: Vec3

  private fpsContainer: HTMLElement
  private lastFrameTime = 0
  private projection: Matrix
  private viewport: Matrix

  constructor (canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.canvas.style.backgroundColor = 'slategrey'
    this.canvas.style.width = '800'
    this.canvas.style.height = '800'
    this.canvas.style.margin = '0 auto'
    this.canvas.style.display = 'block'

    this.projection = Matrix.identity(4)

    if (this.camera) {
      this.projection.data[3][2] = -1 / this.camera.z
    }

    this.viewport = buildViewport(this.canvas.width / 8, this.canvas.height / 8, this.canvas.width * 3/4, this.canvas.height * 3/4, 255)

    this.fpsContainer = document.createElement('div')
    document.body.appendChild(this.fpsContainer)
  }

  baseTransformations () {
    return this.viewport.multiply(this.projection)
  }

  renderModel (model: Model) {
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    const canvasData = this.getCanvasContext().getImageData(0, 0, canvasWidth, canvasHeight)
    const zBuffer = {}

    const transformations = this.baseTransformations()

    for (const faceIndex in model.faces) {
      const face = model.faces[faceIndex]
      const facetTexture = model.textureFacets[faceIndex]

      let lightIntensities = new Vec3(0, 0, 0)

      if (this.lightDirection) {
        lightIntensities = new Vec3(
          ...face.map(vertexIndex =>
            model.verticesNormals[vertexIndex].normalize().multiply(this.lightDirection!.normalize())
          )
        ).abs()
      }

      const trianglePoints = face.map(vertexIndex => {
        const vertex = model.vertices[vertexIndex]
        const v = transformations.multiply(Matrix.fromVector(vertex)).toVector()
        v.y = canvasHeight - v.y

        v.roundCoordinates()
        return v
      })

      if (model.texture) {
        const texturePoints = facetTexture.map(vertexIndex => {
          const vertex = model.textureVertices[vertexIndex]

          return new Vec3(
            vertex.x * model.texture!.width,
            model.texture!.height - vertex.y * model.texture!.height,
            vertex.z
          ).roundCoordinates()
        })

        drawTriangleTexture(trianglePoints, texturePoints, canvasData, model.texture, zBuffer, lightIntensities)
      } else {
        drawTriangle(trianglePoints, canvasData, Color.WHITE, zBuffer, lightIntensities)
      }
    }

    this.updateCanvas(canvasData)
  }

  private getCanvasContext () {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Cant obtain canvas context')
    }

    return ctx
  }

  updateCanvas (canvasData: ImageData) {
    this.getCanvasContext().putImageData(canvasData, 0, 0)
  }

  animate () {
    window.requestAnimationFrame((time) => {
      const fps = 1 / ((performance.now() - this.lastFrameTime) / 1000)
      this.lastFrameTime = time
      this.fpsContainer.innerHTML = fps.toFixed(0)

      // this.renderModel(model)
    })
  }
}
