<script setup lang="ts">
import * as THREE from 'three'

const canvasHolder = ref<HTMLDivElement | null>(null)
const frameEl = ref<HTMLDivElement | null>(null)

// ---- reactive UI state (mirrors the original panel's checkboxes/sliders/switches) ----
const showPosts = ref(true)
const showRods = ref(true)
const showPanels = ref(true)
const showRivets = ref(true)
const showRails = ref(true)
const showFeet = ref(true)
const showDoor = ref(false)
const explodeValue = ref(0)
const doorValue = ref(0)
const variant = ref<Variant>('R1')
const finishKey = ref<Finish>('raw')
// Controls panel starts collapsed on mobile (sm: and up ignores this and stays open —
// see the template's panelOpen class binding) so the 3D model is visible first.
const panelOpen = ref(false)

const VARIANTS: Record<Variant, { height: number; numU: number; title: string; sub: string }> = {
  R1: { height: 500, numU: 10, title: 'Homerack R1', sub: '10U · recessed mounting rails · drag to orbit' },
  R5: { height: 250, numU: 5, title: 'Homerack R.5', sub: '5U · half-height variant' },
}

const modelTitle = computed(() => VARIANTS[variant.value].title)
const modelSub = computed(() => VARIANTS[variant.value].sub)
const doorLabel = computed(() => {
  if (doorValue.value === 0) return 'closed'
  if (doorValue.value === 100) return 'open'
  return `${doorValue.value}%`
})

// Exposed so LifestyleSection's room toggle can drive the same state a click on the
// in-panel buttons would.
defineExpose({
  applyFinish: (key: Finish) => {
    finishKey.value = key
  },
  selectVariant: (key: Variant) => {
    variant.value = key
  },
})

let cleanup: (() => void) | null = null

onMounted(() => {
  const holder = canvasHolder.value!
  const frame = frameEl.value!

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0e0f13)

  const viewerSize = () => ({ w: frame.clientWidth, h: frame.clientHeight })
  const sz0 = viewerSize()
  const camera = new THREE.PerspectiveCamera(42, sz0.w / sz0.h, 1, 5000)

  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
  renderer.setSize(sz0.w, sz0.h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  holder.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const key = new THREE.DirectionalLight(0xffffff, 0.9)
  key.position.set(500, 800, 600)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xaecfff, 0.35)
  fill.position.set(-600, 300, -400)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.25)
  rim.position.set(0, -400, -600)
  scene.add(rim)

  // ---- orbit controls ----
  const target = new THREE.Vector3(0, 250, 0)
  const spherical = new THREE.Spherical()
  spherical.setFromVector3(new THREE.Vector3(650, 500, 780).sub(target))
  let isDragging = false
  let activePointerId: number | null = null
  let lastX = 0
  let lastY = 0
  const dom = renderer.domElement

  function updateCam() {
    const pos = new THREE.Vector3().setFromSpherical(spherical).add(target)
    camera.position.copy(pos)
    camera.lookAt(target)
  }

  // Pointer capture (rather than window-level listeners) means this element keeps
  // receiving pointermove/pointerup/pointercancel for the drag even if the cursor
  // leaves the viewport or the browser window entirely — without it, releasing the
  // button outside the window never fires pointerup and the orbit is left spinning
  // on the next unrelated mouse movement. Tracking pointerId (rather than a single
  // shared isDragging flag) keeps a second simultaneous pointer (e.g. a pinch gesture
  // starting) from hijacking lastX/lastY mid-drag.
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    isDragging = true
    activePointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    dom.setPointerCapture(e.pointerId)
  }
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return
    isDragging = false
    activePointerId = null
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging || e.pointerId !== activePointerId) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    spherical.theta -= dx * 0.006
    spherical.phi -= dy * 0.006
    spherical.phi = Math.max(0.15, Math.min(Math.PI - 0.15, spherical.phi))
    updateCam()
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    spherical.radius *= 1 + e.deltaY * 0.001
    spherical.radius = Math.max(200, Math.min(2400, spherical.radius))
    updateCam()
  }
  dom.addEventListener('pointerdown', onPointerDown)
  dom.addEventListener('pointerup', onPointerUp)
  dom.addEventListener('pointercancel', onPointerUp)
  dom.addEventListener('pointermove', onPointerMove)
  dom.addEventListener('wheel', onWheel, { passive: false })
  updateCam()

  // ---- materials ----
  const alumMat = new THREE.MeshStandardMaterial({ color: 0xcfd3da, metalness: 0.75, roughness: 0.32 })
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xa9adb8,
    metalness: 0.7,
    roughness: 0.35,
    side: THREE.DoubleSide,
  })
  const railMat = new THREE.MeshStandardMaterial({ color: 0x9fb9bf, metalness: 0.55, roughness: 0.4 })

  function ventTexture(baseColor?: string, holeColor?: string) {
    baseColor = baseColor || '#6c7180'
    holeColor = holeColor || '#2e3138'
    const size = 512
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = holeColor
    const step = 16
    const r = 3.4
    const margin = 30
    for (let y = margin; y < size - margin; y += step) {
      for (let x = margin; x < size - margin; x += step) {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    return tex
  }

  const ventedPanelMat = new THREE.MeshStandardMaterial({
    map: ventTexture(),
    color: 0xffffff,
    metalness: 0.55,
    roughness: 0.55,
    side: THREE.DoubleSide,
  })
  const solidPanelMat = new THREE.MeshStandardMaterial({ color: 0x6c7180, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0xffcf5c,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0x442e00,
    emissiveIntensity: 0.25,
  })
  const rivetGeo = new THREE.CylinderGeometry(2, 2, 9, 12)
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.1, roughness: 0.9 })
  const footMat = new THREE.MeshStandardMaterial({ color: 0x121214, metalness: 0.05, roughness: 0.9 })
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x2b2e36, metalness: 0.65, roughness: 0.32 })
  const latchMat = new THREE.MeshStandardMaterial({ color: 0xc9524a, metalness: 0.5, roughness: 0.4 })

  // ---- constant geometry ----
  // Footprint is derived from the mounting-hole spacing rather than fixed directly:
  // the rails are centered on those holes and sit recessed GAP mm inward from the
  // posts' inner face, and the posts have to sit far enough out to leave room for
  // that recess.
  const POST = 15
  const TUBE_WALL = 1.5
  const HOLE_SPACING = 237 // mounting-hole center-to-center horizontal spacing (the actual spec — the rail is just centered on it, not itself the 237mm dimension)
  const HOLE_OFF = HOLE_SPACING / 2
  const GAP = 15 // recess: rail's outer face to post's inner face
  const POST_OFF = HOLE_OFF + POST / 2 + GAP + POST / 2 // post centerline
  const HALF = POST_OFF + POST / 2 // outer footprint half-width
  const FOOT = 2 * HALF
  const PANEL_T = 1.5
  const U = 44.45
  const FOOT_R = 11
  const FOOT_H = 8
  const postPositions = [
    { x: -POST_OFF, z: -POST_OFF },
    { x: POST_OFF, z: -POST_OFF },
    { x: -POST_OFF, z: POST_OFF },
    { x: POST_OFF, z: POST_OFF },
  ]
  // Rails are centered on the mounting holes, so their own centerline sits at ±HOLE_OFF.
  const railPositions = [
    { x: -HOLE_OFF, z: -POST_OFF },
    { x: HOLE_OFF, z: -POST_OFF },
    { x: -HOLE_OFF, z: POST_OFF },
    { x: HOLE_OFF, z: POST_OFF },
  ]

  const groupPosts = new THREE.Group()
  const groupRods = new THREE.Group()
  const groupRails = new THREE.Group()
  const groupPanels = new THREE.Group()
  const groupRivets = new THREE.Group()
  const groupFeet = new THREE.Group()
  const doorPivot = new THREE.Object3D() // rotates — the door leaf itself
  const groupDoorFixed = new THREE.Group() // stays put — hinge leaf + latch
  scene.add(groupPosts, groupRods, groupRails, groupPanels, groupRivets, groupFeet, doorPivot, groupDoorFixed)
  const grid = new THREE.GridHelper(1000, 20, 0x23262f, 0x181a20)
  scene.add(grid)

  // Disposes geometries (not materials — those are shared module-scoped instances
  // reused across rebuilds) before dropping each child, so toggling between R1 and
  // R.5 doesn't leak a fresh set of GPU buffers on every switch.
  function clearGroup(g: THREE.Object3D) {
    while (g.children.length) {
      const child = g.children[0]!
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
      })
      g.remove(child)
    }
  }

  function makeHollowPost(size: number, wall: number, length: number) {
    const g = new THREE.Group()
    const half = size / 2
    const walls = [
      { w: size, d: wall, x: 0, z: half - wall / 2 },
      { w: size, d: wall, x: 0, z: -half + wall / 2 },
      { w: wall, d: size - 2 * wall, x: half - wall / 2, z: 0 },
      { w: wall, d: size - 2 * wall, x: -half + wall / 2, z: 0 },
    ]
    walls.forEach((wd) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(wd.w, length, wd.d), alumMat)
      m.position.set(wd.x, 0, wd.z)
      g.add(m)
    })
    return g
  }

  // A true 45° miter, like a picture-frame corner — each piece is cut at 45° at both
  // ends so four of them meet flush at a corner with no gap, no overlap, and no step.
  // Built via THREE.Shape + ExtrudeGeometry rather than hand-rolled triangles, so
  // winding/normals are handled by Three.js itself.
  function axisVec3(name: 'x' | 'y' | 'z') {
    return name === 'x' ? new THREE.Vector3(1, 0, 0) : name === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
  }
  function buildMiterBar(
    crossAxis: 'x' | 'y' | 'z',
    crossCenter: number,
    crossWidth: number,
    runAxis: 'x' | 'y' | 'z',
    runHalf: number,
    inset: number,
    thickAxis: 'x' | 'y' | 'z',
    thickMin: number,
    thickMax: number,
    mat: THREE.Material,
  ) {
    const half = crossWidth / 2
    const sgn = crossCenter >= 0 ? 1 : -1 // "outer" = further from center, works for either side
    const outer = crossCenter + sgn * half
    const inner = crossCenter - sgn * half
    const shape = new THREE.Shape()
    shape.moveTo(inner, -runHalf + inset)
    shape.lineTo(outer, -runHalf)
    shape.lineTo(outer, runHalf)
    shape.lineTo(inner, runHalf - inset)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickMax - thickMin, bevelEnabled: false, steps: 1 })
    const mesh = new THREE.Mesh(geo, mat)

    // (crossAxis, runAxis, thickAxis) isn't always a right-handed triple — e.g. (x,z,y)
    // is a reflection, not a rotation, and Quaternion.setFromRotationMatrix silently
    // produces garbage for a reflection matrix. Detect it and flip the thickness axis
    // (and which end we extrude from) so the basis is always a proper rotation.
    const crossVec = axisVec3(crossAxis)
    const runVec = axisVec3(runAxis)
    const thickVec = axisVec3(thickAxis)
    const properRotation = new THREE.Vector3().crossVectors(crossVec, runVec).dot(thickVec) > 0
    const basisThickVec = properRotation ? thickVec : thickVec.clone().negate()
    const basis = new THREE.Matrix4().makeBasis(crossVec, runVec, basisThickVec)
    mesh.quaternion.setFromRotationMatrix(basis)
    mesh.position.copy(axisVec3(thickAxis).multiplyScalar(properRotation ? thickMin : thickMax))
    return mesh
  }

  function addRivet(x: number, y: number, z: number, axis: 'x' | 'z') {
    const m = new THREE.Mesh(rivetGeo, rivetMat)
    m.position.set(x, y, z)
    if (axis === 'x') m.rotation.z = Math.PI / 2
    if (axis === 'z') m.rotation.x = Math.PI / 2
    groupRivets.add(m)
  }

  function buildAssembly(height: number, numU: number) {
    clearGroup(groupPosts)
    clearGroup(groupRods)
    clearGroup(groupRails)
    clearGroup(groupPanels)
    clearGroup(groupRivets)
    clearGroup(groupFeet)
    clearGroup(doorPivot)
    clearGroup(groupDoorFixed)
    doorPivot.rotation.y = 0

    // 1. corner posts — structural only, no holes (mounting holes now live on the rails)
    postPositions.forEach((p) => {
      const g = makeHollowPost(POST, TUBE_WALL, height)
      g.position.set(p.x, height / 2, p.z)
      g.userData.base = g.position.clone()
      g.userData.dir = new THREE.Vector3(p.x, 0, p.z).normalize()
      groupPosts.add(g)
    })

    // 1b. feet — mounted on the underside of the bottom frame ring. The bottom mitered
    // ring spans Y:[-POST,0], so "the bottom side" of the case is at Y=-POST, not Y=0.
    const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 20)
    postPositions.forEach((p) => {
      const f = new THREE.Mesh(footGeo, footMat)
      f.position.set(p.x, -POST - FOOT_H / 2, p.z)
      f.userData.base = f.position.clone()
      f.userData.dir = new THREE.Vector3(0, -1, 0)
      groupFeet.add(f)
    })

    // 2. frame rods — true 45° miter, welded. Four pieces per level meet corner-to-corner
    // like picture-frame moulding; nothing to rivet here anymore.
    const levels = [
      { yMin: height, yMax: height + POST, dirY: 1 },
      { yMin: -POST, yMax: 0, dirY: -1 },
    ]
    levels.forEach((lvl) => {
      // depth-direction sides (left, right), running along Z
      ;[-1, 1].forEach((sx) => {
        const rod = buildMiterBar('x', sx * POST_OFF, POST, 'z', POST_OFF + POST / 2, POST, 'y', lvl.yMin, lvl.yMax, rodMat)
        rod.userData.base = rod.position.clone() // buildMiterBar sets a real position — don't stomp it back to origin
        rod.userData.dir = new THREE.Vector3(sx, lvl.dirY * 0.6, 0).normalize()
        groupRods.add(rod)
      })
      // width-direction sides (front, back), running along X
      ;[-1, 1].forEach((sz) => {
        const rod = buildMiterBar('z', sz * POST_OFF, POST, 'x', POST_OFF + POST / 2, POST, 'y', lvl.yMin, lvl.yMax, rodMat)
        rod.userData.base = rod.position.clone()
        rod.userData.dir = new THREE.Vector3(0, lvl.dirY * 0.6, sz).normalize()
        groupRods.add(rod)
      })
    })

    // 3. mounting rails — flat mounting strip, recessed inward from the posts. A rod
    // cross-section was never doing anything useful here (the rail just needs a flat
    // face to put holes in) — a simple flat bar is lighter and more standard for an
    // actual rack rail.
    const RAIL_T = 3 // flat plate thickness
    function eiaOffsets() {
      const offs: number[] = []
      for (let u = 0; u < numU; u++) {
        const b = u * U
        offs.push(b + 6.35, b + 22.225, b + 38.1)
      }
      return offs
    }
    const railStartY = (height - numU * U) / 2
    const holeYs = eiaOffsets().map((o) => railStartY + o)
    const holeGeo = new THREE.CylinderGeometry(2.1, 2.1, RAIL_T * 2.2, 14)
    const railGeo = new THREE.BoxGeometry(POST, height, RAIL_T)
    railPositions.forEach((p) => {
      const g = new THREE.Mesh(railGeo, railMat)
      g.position.set(p.x, height / 2, p.z)
      g.userData.base = g.position.clone()
      g.userData.dir = new THREE.Vector3(p.x, 0, p.z).normalize()
      groupRails.add(g)

      const outward = Math.sign(p.z)
      const dir = g.userData.dir
      ;[outward, -outward].forEach((faceDir) => {
        holeYs.forEach((y) => {
          const h = new THREE.Mesh(holeGeo, holeMat)
          h.rotation.x = Math.PI / 2
          h.position.set(p.x, y, p.z + faceDir * (RAIL_T / 2))
          h.userData.base = h.position.clone()
          h.userData.dir = dir
          groupRails.add(h)
        })
      })
    })

    // 4. panels — top panel sits ON TOP of the frame now (the mitered top rods have real
    // thickness, so tucking the panel underneath would look sunken from above). Bottom
    // panel stays inside-mounted, since that face isn't normally seen.
    const sidePanelGeo = new THREE.BoxGeometry(PANEL_T, height, FOOT)
    ;[-1, 1].forEach((sign) => {
      const m = new THREE.Mesh(sidePanelGeo, ventedPanelMat)
      m.position.set(sign * HALF, height / 2, 0)
      m.userData.base = m.position.clone()
      m.userData.dir = new THREE.Vector3(sign, 0, 0)
      m.userData.kind = 'side'
      m.userData.sign = sign
      groupPanels.add(m)
    })
    const topPanelGeo = new THREE.BoxGeometry(FOOT, PANEL_T, FOOT)
    const topPanel = new THREE.Mesh(topPanelGeo, solidPanelMat)
    topPanel.position.set(0, height + POST + PANEL_T / 2, 0) // resting on top of the mitered frame
    topPanel.userData.base = topPanel.position.clone()
    topPanel.userData.dir = new THREE.Vector3(0, 1, 0)
    topPanel.userData.kind = 'top'
    groupPanels.add(topPanel)

    const BOTTOM_CAP_SIZE = FOOT - 12
    const bottomPanelGeo = new THREE.BoxGeometry(BOTTOM_CAP_SIZE, PANEL_T, BOTTOM_CAP_SIZE)
    const bottomPanel = new THREE.Mesh(bottomPanelGeo, solidPanelMat)
    bottomPanel.position.set(0, -PANEL_T / 2, 0) // still tucked up inside the bottom frame
    bottomPanel.userData.base = bottomPanel.position.clone()
    bottomPanel.userData.dir = new THREE.Vector3(0, -1, 0)
    bottomPanel.userData.kind = 'bottom'
    groupPanels.add(bottomPanel)

    // 5. rivets — panels only. The frame itself (posts to rods, rod to rod at every
    // mitered corner) is welded, not riveted, so there's nothing to fasten there.
    groupPanels.children.forEach((panel) => {
      if (panel.userData.kind !== 'side') return
      const x = panel.userData.sign * HALF
      ;[-POST_OFF, POST_OFF].forEach((z) => {
        addRivet(x, POST + 4, z, 'x')
        addRivet(x, height - POST - 4, z, 'x')
      })
      addRivet(x, height / 2, -POST_OFF, 'x')
    })

    // 6. front door — true 45° miter, same as the main frame. Vented panel fills the
    // full inner opening with no border gap. Door spans the FULL case height and width
    // (including the top/bottom mitered frame rings, not just the post span) — covers
    // everything except the feet. Hinge sits AT the post's own outer corner (not pushed
    // out) — with the swing capped at 180° instead of 270°, the door never sweeps back
    // around near the post, so no wide-throw offset is needed.
    const DOOR_GAP = 6
    const doorRestX = -POST_OFF
    const doorRestZ = -HALF - DOOR_GAP - POST / 2
    const doorWidth = 2 * POST_OFF // matches the case's full outer width
    const DOOR_HEIGHT = height + 2 * POST // full case height: bottom ring to top ring
    const hingeFaceX = -HALF
    const PIVOT_X = -HALF - 2
    const PIVOT_Z = -HALF - 2 // right at the post's outer corner, small proud nudge
    doorPivot.position.set(PIVOT_X, 0, PIVOT_Z)
    const toLocal = (wx: number, wz: number): [number, number] => [wx - PIVOT_X, wz - PIVOT_Z]

    const doorHalfW = doorWidth / 2
    const doorHalfH = DOOR_HEIGHT / 2 - POST / 2 // rail's own half-width (POST/2) adds back on to reach the true outer span
    const [dcx, dcz] = toLocal(doorRestX + doorHalfW, doorRestZ)
    const doorFrameGroup = new THREE.Group()
    doorFrameGroup.position.set(dcx, height / 2, dcz) // case is symmetric about height/2 even with the taller door
    doorPivot.add(doorFrameGroup)

    // stiles (left, right) — cross axis X, run axis Y
    ;[-1, 1].forEach((sx) => {
      doorFrameGroup.add(
        buildMiterBar('x', sx * doorHalfW, POST, 'y', doorHalfH + POST / 2, POST, 'z', -POST / 2, POST / 2, alumMat),
      )
    })
    // rails (top, bottom) — cross axis Y, run axis X
    ;[-1, 1].forEach((sy) => {
      doorFrameGroup.add(
        buildMiterBar('y', sy * doorHalfH, POST, 'x', doorHalfW + POST / 2, POST, 'z', -POST / 2, POST / 2, alumMat),
      )
    })

    // vented panel — sized to the frame's actual inner opening (each mitered piece's
    // inner face sits POST/2 in from its own centerline), so it fills edge-to-edge.
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - POST, 2 * doorHalfH - POST, PANEL_T), ventedPanelMat)
    doorPanel.position.set(0, 0, -POST / 2 - PANEL_T / 2)
    doorFrameGroup.add(doorPanel)

    // hinge — short brackets, since the pivot sits right at the post's corner
    function makeBar(ax: number, az: number, bx: number, bz: number, thickness: number, mat: THREE.Material) {
      const dx = bx - ax
      const dz = bz - az
      const len = Math.hypot(dx, dz)
      const bar = new THREE.Mesh(new THREE.BoxGeometry(len, DOOR_HEIGHT, thickness), mat)
      bar.position.set((ax + bx) / 2, height / 2, (az + bz) / 2)
      bar.rotation.y = Math.atan2(-dz, dx)
      return bar
    }
    const hingeBarrel = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, DOOR_HEIGHT, 16), hingeMat)
    hingeBarrel.position.set(PIVOT_X, height / 2, PIVOT_Z)
    groupDoorFixed.add(hingeBarrel)

    const postMountZ = PIVOT_Z
    groupDoorFixed.add(makeBar(hingeFaceX, postMountZ, PIVOT_X, PIVOT_Z, 6, hingeMat))

    const doorMountWorldX = hingeFaceX
    const doorMountWorldZ = doorRestZ + 2
    const [pax, paz] = toLocal(doorMountWorldX, doorMountWorldZ)
    doorPivot.add(makeBar(pax, paz, 0, 0, 6, hingeMat))

    // magnetic latch — top and bottom, positioned near the door's (taller) top/bottom edges
    const latchGeo = new THREE.CylinderGeometry(4, 4, 3, 16)
    const latchZ = -HALF + 5
    ;[-POST / 2, height + POST / 2].forEach((y) => {
      const postSide = new THREE.Mesh(latchGeo, latchMat)
      postSide.rotation.z = Math.PI / 2
      postSide.position.set(HALF + 1.5, y, latchZ)
      groupDoorFixed.add(postSide)

      const [dx, dz] = toLocal(HALF + 1.5, latchZ)
      const doorSide = new THREE.Mesh(latchGeo, latchMat)
      doorSide.rotation.z = Math.PI / 2
      doorSide.position.set(dx, y, dz)
      doorPivot.add(doorSide)
    })

    doorPivot.visible = showDoor.value
    groupDoorFixed.visible = showDoor.value

    grid.position.y = -Math.max(60, height * 0.12) - FOOT_H
    applyExplode()
  }

  function applyExplode() {
    const amt = explodeValue.value * 1.4
    groupRivets.visible = amt === 0 && showRivets.value
    groupPosts.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt))
    groupRods.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt * 0.7))
    groupRails.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt))
    groupPanels.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt * 1.3))
    groupFeet.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt * 0.5))
  }

  function runSelectVariant(key: Variant) {
    const v = VARIANTS[key]
    buildAssembly(v.height, v.numU)
    explodeValue.value = 0
    doorValue.value = 0
    target.set(0, v.height / 2, 0)
    spherical.radius = Math.max(v.height * 1.9, FOOT * 2.2)
    updateCam()
  }

  // Swatch colors come from the shared FINISH_COLORS (also used by SiteFooter and the
  // room-mood panel) so there's one place to update if a finish's hex ever changes;
  // metalness/roughness/panel-texture colors are Three.js-specific and stay local.
  const hexToThree = (hex: string) => Number(`0x${hex.slice(1)}`)
  const FINISHES: Record<Finish, { color: number; metalness: number; roughness: number; panelBase: string; panelHole: string }> = {
    raw: { color: hexToThree(FINISH_COLORS.raw), metalness: 0.75, roughness: 0.32, panelBase: '#6c7180', panelHole: '#2e3138' },
    white: { color: hexToThree(FINISH_COLORS.white), metalness: 0.12, roughness: 0.6, panelBase: '#f1f0ec', panelHole: '#c7c6c0' },
    black: { color: hexToThree(FINISH_COLORS.black), metalness: 0.18, roughness: 0.55, panelBase: '#232529', panelHole: '#08080a' },
  }

  function runApplyFinish(key: Finish) {
    const f = FINISHES[key]
    ;[alumMat, rodMat, solidPanelMat].forEach((m) => {
      m.color.setHex(f.color)
      m.metalness = f.metalness
      m.roughness = f.roughness
    })
    ventedPanelMat.map?.dispose()
    ventedPanelMat.map = ventTexture(f.panelBase, f.panelHole)
    ventedPanelMat.map.needsUpdate = true
    ventedPanelMat.metalness = f.metalness
    ventedPanelMat.roughness = f.roughness
  }

  function onViewerResize() {
    const sz = viewerSize()
    if (sz.w < 10 || sz.h < 10) return
    camera.aspect = sz.w / sz.h
    camera.updateProjectionMatrix()
    renderer.setSize(sz.w, sz.h)
  }
  window.addEventListener('resize', onViewerResize)
  const resizeObserver = new ResizeObserver(onViewerResize)
  resizeObserver.observe(frame)

  // ---- wire reactive UI state to the engine ----
  watch(showPosts, (v) => (groupPosts.visible = v))
  watch(showRods, (v) => (groupRods.visible = v))
  watch(showPanels, (v) => (groupPanels.visible = v))
  watch(showRivets, applyExplode)
  watch(showRails, (v) => (groupRails.visible = v))
  watch(showFeet, (v) => (groupFeet.visible = v))
  watch(showDoor, (v) => {
    doorPivot.visible = v
    groupDoorFixed.visible = v
  })
  watch(explodeValue, applyExplode)
  watch(doorValue, (pct) => {
    doorPivot.rotation.y = (pct / 100) * Math.PI // swings outward, up to 180°
  })
  watch(variant, runSelectVariant)
  watch(finishKey, runApplyFinish, { immediate: true })

  runSelectVariant(variant.value)

  let rafId = 0
  function animate() {
    rafId = requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  animate()

  cleanup = () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onViewerResize)
    resizeObserver.disconnect()
    dom.removeEventListener('pointerdown', onPointerDown)
    dom.removeEventListener('pointerup', onPointerUp)
    dom.removeEventListener('pointercancel', onPointerUp)
    dom.removeEventListener('pointermove', onPointerMove)
    dom.removeEventListener('wheel', onWheel)
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat?.dispose()
    })
    ventedPanelMat.map?.dispose()
    renderer.dispose()
    holder.removeChild(renderer.domElement)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div
    ref="frameEl"
    class="relative h-[520px] w-full overflow-hidden rounded-2xl border border-line bg-[#0e0f13] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] sm:h-[560px] lg:h-[620px]"
  >
    <div ref="canvasHolder" class="absolute inset-0" />

    <!-- Mobile-only compact toggle. The full panel is opacity/pointer-events hidden
         (not just collapsed) below sm: by default — even a collapsed title strip was
         still obstructing the top of the model on a small screen — so this small
         floating button is all that sits over the canvas until the user asks for
         controls. Always sm:hidden: desktop shows the full panel unconditionally. -->
    <button
      v-if="!panelOpen"
      type="button"
      class="absolute top-4 left-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#33384a] bg-[rgba(20,22,30,0.9)] text-[#9aa0b4] backdrop-blur-md transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 sm:hidden"
      aria-label="Show model controls"
      aria-controls="rack-viewer-panel"
      :aria-expanded="panelOpen"
      @click="panelOpen = true"
    >
      <svg class="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
        <path d="M4 6h12M4 10h12M4 14h8" stroke-linecap="round" />
      </svg>
    </button>

    <div
      id="rack-viewer-panel"
      class="absolute top-4 left-4 max-h-[calc(100%-32px)] w-[calc(100%-2rem)] origin-top-left overflow-auto rounded-[10px] border border-[#33384a] bg-[rgba(20,22,30,0.9)] p-4 backdrop-blur-md transition-[opacity,transform] duration-220 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[262px] sm:pointer-events-auto sm:opacity-100 sm:scale-100"
      :class="panelOpen ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95 sm:pointer-events-auto'"
    >
      <div class="flex items-start justify-between gap-2">
        <span>
          <h2 class="font-display text-[15px] font-semibold text-white">{{ modelTitle }}</h2>
          <div class="mt-0.5 font-body text-[11.5px] text-[#9aa0b4]">{{ modelSub }}</div>
        </span>
        <button
          type="button"
          class="-mt-1 -mr-1 cursor-pointer rounded-md p-1.5 text-[#9aa0b4] transition-[color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-white active:scale-90 sm:hidden"
          aria-label="Hide model controls"
          @click="panelOpen = false"
        >
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="mt-3.5">
        <div class="flex rounded-lg bg-[#1c1f28] p-[3px]">
          <button
            class="flex-1 cursor-pointer rounded-md py-[7px] text-[11.5px] transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]"
            :class="variant === 'R1' ? 'bg-blue font-semibold text-white' : 'text-[#9aa0b4]'"
            @click="variant = 'R1'"
          >
            R1 · 500mm
          </button>
          <button
            class="flex-1 cursor-pointer rounded-md py-[7px] text-[11.5px] transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]"
            :class="variant === 'R5' ? 'bg-blue font-semibold text-white' : 'text-[#9aa0b4]'"
            @click="variant = 'R5'"
          >
            R.5 · 250mm
          </button>
        </div>

        <div class="mt-2 flex rounded-lg bg-[#1c1f28] p-[3px]">
          <button
            v-for="f in (['raw', 'white', 'black'] as const)"
            :key="f"
            class="flex-1 cursor-pointer rounded-md py-[7px] text-[11.5px] capitalize transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]"
            :class="finishKey === f ? 'bg-blue font-semibold text-white' : 'text-[#9aa0b4]'"
            @click="finishKey = f"
          >
            {{ f }}
          </button>
        </div>

        <div class="mt-3.5 space-y-1 text-[13px]">
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #cfd3da" />Posts</span>
            <input v-model="showPosts" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #a9adb8" />Frame rods</span>
            <input v-model="showRods" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #9fb9bf" />Mounting rails</span>
            <input v-model="showRails" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #6c7180" />Panels</span>
            <input v-model="showPanels" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #ffcf5c" />Panel rivets</span>
            <input v-model="showRivets" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #3a3c42" />Feet</span>
            <input v-model="showFeet" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
          <label class="flex cursor-pointer items-center justify-between py-1">
            <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #8fa8c9" />Front door</span>
            <input v-model="showDoor" type="checkbox" class="h-[18px] w-[18px] accent-blue" />
          </label>
        </div>

        <div v-if="showDoor" class="mt-3.5">
          <div class="flex items-center justify-between text-[13px]"><span>Door</span><span>{{ doorLabel }}</span></div>
          <input v-model.number="doorValue" type="range" min="0" max="100" class="w-full accent-blue" />
        </div>

        <div class="mt-3.5">
          <div class="flex items-center justify-between text-[13px]"><span>Exploded view</span><span>{{ explodeValue }}%</span></div>
          <input v-model.number="explodeValue" type="range" min="0" max="100" class="w-full accent-blue" />
        </div>

        <div class="mt-3.5 border-t border-[#2c303e] pt-3 text-[11.5px] leading-relaxed text-[#7a7f8c]">
          Frame is welded at every mitered joint — only the two side panels are riveted on.
          Materials and door placement are provisional and subject to change — will be updated
          after physical fitment testing.
        </div>
      </div>
    </div>

    <div
      class="absolute right-4 bottom-4 rounded-md border border-line bg-bg/70 px-2.5 py-1.5 font-mono text-[10.5px] text-[#565b68]"
    >
      live model — not a rendering
    </div>
  </div>
</template>
