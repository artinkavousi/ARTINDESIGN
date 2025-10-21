/**
 * WebGPU pointer helper adapted for unified compute systems.
 * Minimal copy of Portfolio Main pointer utilities.
 */
import { uniform } from 'three/tsl'
import { Camera, Plane, Raycaster, Vector2, Vector3, WebGPURenderer } from 'three/webgpu'

export class WebGPUPointer {
  private camera: Camera
  private renderer: WebGPURenderer
  private delta = 0
  private rayCaster = new Raycaster()
  private initialPlane: Plane
  private intersectPlane: Plane
  private clientPointer = new Vector2(-999, -999)
  private pointer = new Vector2()
  private scenePointer = new Vector3()
  private pointerDown = false

  readonly uPointerDown = uniform(0)
  readonly uPointer = uniform(new Vector3())
  readonly uPointerVelocity = uniform(new Vector3())

  constructor(renderer: WebGPURenderer, camera: Camera, plane: Plane) {
    this.camera = camera
    this.renderer = renderer
    this.initialPlane = plane
    this.intersectPlane = plane.clone()

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)

    renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    renderer.domElement.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointermove', this.onPointerMove)
  }

  destroy() {
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointermove', this.onPointerMove)
  }

  update(delta?: number) {
    if (typeof delta === 'number') {
      this.delta = delta
    }

    this.intersectPlane.normal.copy(this.initialPlane.normal).applyEuler(this.camera.rotation)
    this.updateScreenPointer()
  }

  private onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || event.button === 0) {
      this.pointerDown = true
      this.uPointerDown.value = 1
    }

    this.clientPointer.set(event.clientX, event.clientY)
    this.updateScreenPointer(event)
  }

  private onPointerUp(event: PointerEvent) {
    this.clientPointer.set(event.clientX, event.clientY)
    this.updateScreenPointer(event)
    this.pointerDown = false
    this.uPointerDown.value = 0
  }

  private onPointerMove(event: PointerEvent) {
    this.clientPointer.set(event.clientX, event.clientY)
    this.updateScreenPointer(event)
  }

  private updateScreenPointer(event?: PointerEvent) {
    const evt = event ?? ({
      clientX: this.clientPointer.x,
      clientY: this.clientPointer.y,
    } as PointerEvent)

    const dom = this.renderer.domElement

    this.pointer.set((evt.clientX / dom.offsetWidth) * 2 - 1, -(evt.clientY / dom.offsetHeight) * 2 + 1)
    this.rayCaster.setFromCamera(this.pointer, this.camera)
    this.rayCaster.ray.intersectPlane(this.intersectPlane, this.scenePointer)

    this.uPointerVelocity.value.addScalar(this.scenePointer.distanceTo(this.uPointer.value))

    const damp = 1 - Math.exp(-0.55 * 1000 * Math.max(0.001, this.delta))
    this.uPointerVelocity.value.multiplyScalar(damp)

    this.uPointer.value.copy(this.scenePointer)
  }
}

