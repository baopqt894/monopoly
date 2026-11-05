# Runtime art assets

All selected bitmap assets were generated with the built-in image_gen tool and copied into the project. No assets are loaded from the generated-images folder at runtime.

| Asset                            | Saved project path                             | Prompt and provenance                                  |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| Minimal travel background        | `public/assets/backgrounds/travel-minimal.png` | [Final prompt](../public/assets/backgrounds/README.md) |
| Four player portraits, 2×2 atlas | `public/assets/characters/investors-v2.png`    | [Final prompt](../public/assets/characters/README.md)  |

The earlier detailed coastal illustration was discarded for this revision. The runtime background intentionally keeps the center empty and decoration at the edges. Portraits use CSS background positioning without slicing or editing the source image.

Board tiles, buildings, playing pieces, card decks, and dice remain code-native in `features/scene3d`. The board contract is unchanged: 40 tiles and the two event decks at their standard positions.
