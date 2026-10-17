# ThreeDPaper integration

The six registered files in packages/threeui/src are copied verbatim from https://threeui.com/source-code/3d-paper.json. THREEUI-SOURCE.json records all supplied hashes; the build verifies each one before bundling.

src/Scene.tsx uses the requested @designcodeio/threeui component and style import with variant="original". The package name resolves to the verified local source package, rather than an unrelated registry release. The source includes Three.js r149, GLSL, CanvasTexture artwork, drag inertia, hover lighting, responsive fitting and reduced-motion handling.

The homepage places this as a clearly labelled interactive design study after the Tivoro introduction. motion.html provides an immersive view. Authored Nocturne artwork remains unchanged; it is not presented as an award for Tivoro.

Build: node build-paper.mjs. The main website stays a static multi-page site. The React island is limited to the paper scene. The original component pauses and unmounts its iframe when outside the viewport or when the document is hidden.

Browser checks: rendered scene, hover lighting and grab cursor, mobile fit, offscreen pause and runtime srcDoc hash. Native drag automation did not provide a conclusive gesture verification; manual drag verification remains appropriate. Source interaction handlers are unchanged.
