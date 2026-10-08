# ARCH_TECH Presentation Audio Assets

This directory accepts optional pre-recorded narration. The application always falls back to browser `SpeechSynthesis`, then captions-only playback, so missing audio never blocks the presentation.

## Expected Audio File Manifest

| Chapter | File Name |
| :--- | :--- | :--- | :--- |
| 01 The Problem | `01-problem.mp3` |
| 02 The Consequence | `02-consequence.mp3` |
| 03 The Solution | `03-solution.mp3` |
| 04 Multiple Perspectives | `04-multiple-perspectives.mp3` |
| 05 Project Intelligence | `05-project-intelligence.mp3` |
| 06 Digital Project | `06-digital-project.mp3` |
| 07 BIM Exploration | `07-bim-exploration.mp3` |
| 08 Analysis | `08-analysis.mp3` |
| 09 Visual Engine | `09-visual-engine.mp3` |
| 10 Artificial Intelligence | `10-artificial-intelligence.mp3` |
| 11 Interactive Explanation | `11-interactive-explanation.mp3` |
| 12 The Vision | `12-vision.mp3` |
| 13 Closing | `13-closing.mp3` |

## Fallback Behavior

- If an `.mp3` file is missing or fails to load, the presentation automatically falls back to browser `SpeechSynthesis` (Latin American Spanish voice preferred).
- If `SpeechSynthesis` is unavailable or blocked, the presentation continues seamlessly with synchronized on-screen captions.
