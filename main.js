import Engine from './engine.js'
import { Vec3 } from './geometry.js'
import Model from './model.js'

const main = async () => {
	const canvas = document.querySelector('#canvas')

  const engine = new Engine(canvas)
  engine.lightDirection = new Vec3(0, 0, -1)

	const model = new Model()
  await model.load('/tinyrenderer/obj/african_head/african_head.obj')
  await model.loadTexture('/tinyrenderer/obj/african_head/african_head_diffuse.tga')

  engine.renderModel(model)
}

main()
