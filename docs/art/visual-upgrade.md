# Visual upgrade — first playable sample

Direction: a bright Vietnamese travel board made as a miniature tabletop toy. Warm ivory faces, jade/turquoise edges, muted terracotta roofs, pastel facades, soft daylight and small brass details. Detail belongs to the board and pieces; the existing background stays sparse.

Technical frame: Three.js 0.180, React Three Fiber, fixed orthographic camera and existing framing. Keep all 40 tile IDs, deck positions, click targets and authoritative gameplay. No new raster downloads, packages, camera controls or instructional microcopy.

First batch:

- Layered board base, side inlay, small corner fittings and feet with a lower shadow receiver.
- Original canvas vector architecture postcards for the eight color groups, retaining tile names and prices.
- Authored residence/café/lodging model families with doors, windows, frames, awnings, roof shapes and a taller level-five model. Five merged geometry parts per model; geometry shared across instances; only wall and roof cast shadows.
- Central café and lodging samples using the same architecture family; a few park lamps and warmer plaza materials.
- Glossier dice, colored single pips, layered pawn bases and warm metallic trim.
- HUD surface/material polish without moving controls or adding explanatory text.

Provenance: all new geometry, vector postcard art and CSS authored in this repository. Existing portraits and background retained. No externally sourced assets added.

Review status: first in-game visual sample for user feedback, not completion of the entire 30-part art plan. Later batches: unique landmark props, special tiles, illustrated cards, contextual asset interactions and richer action effects. Check the sample at desktop and 390×844 before widening the asset set.

Observed QA: desktop 1707×960 and mobile viewport 390×844 with four player HUDs, mixed businesses, house levels and level-five hotels. Touching the hotel model opened the correct property (tile 37). No renderer errors/warnings were captured in that browser session. This is visual/input verification, not a physical-device FPS benchmark. Review screenshots are saved locally under artifacts/visual-upgrade-*.png.

## Second visual iteration

User rejected the first sample as insufficiently beautiful and clean. Rebuilt the architecture with bevelled surfaces, broad gable roofs, recessed contrasting glazing, continuous cornices, striped café canopies and balcony/terrace silhouettes. Replaced clusters of tiny houses with one larger building per developed plot; one to four colored plinth pips retain the exact level read, with the taller hotel at level five. No rules changed.

Removed the busy printed house postcards beneath physical models. Quiet inset plots separate the architecture, property name and price. Added contained landscaping beds, flowers and stone tree planters inside the board; kept the sparse outer background and fixed camera. Studio reflections use Three RoomEnvironment and a locally generated PMREM, with explicit cleanup and no remote texture download.

Source remains native authored geometry and canvas. Shared geometry stays cached per family; no new package or gameplay dependency. This iteration replaces the first sample's asset treatment.

## Country architecture

The Vietnam city metadata and level names in game-content/vietnam.ts supersede the first sample's generic property architecture. See [Vietnam art](vietnam.md) and the current asset manifest. Four basic house silhouettes lead to a city-specific landmark at level five. The prior ArchitectureModel and printed postcard art have been replaced.
