import './style.css'

import Engine from './engine'
import { Vec3 } from './geometry'
import Model from './model.js'

const main = async () => {
	const canvas = document.querySelector<HTMLCanvasElement>('#canvas')

  if (!canvas) {
    return
  }

  const engine = new Engine(canvas)
  engine.lightDirection = new Vec3(0, 0, 1)
  engine.camera = new Vec3(1, 1, 3)

	const model = new Model()
  await model.load('/assets/african_head/african_head.obj')
  // await model.loadTexture('/assets/african_head/african_head_diffuse.tga')

  engine.renderModel(model)
}

main()
