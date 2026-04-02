

## Plan: Simplify Authority Section + Update Video URLs

### 1. Authority Section Cleanup (lines 228-275)
- **Keep**: Person photo (`personImg`) and the Winner badge (`badge1Img` — blue "Architecture Construction & Design Awards WINNER" at top-right)
- **Remove**: `badge2Img` (DNA Paris Design Awards circle at bottom-left)
- **Remove**: All 4 award certificate cards (`award1Img`, `award2Img`, `award3Img`, `award4Img` — these include the turtle, turtle map, and building renders)
- Adjust layout: since removing the awards row, simplify the grid so the person photo is centered above the authority items list

### 2. Update Video URLs (lines 175-181)
Replace Google Drive preview links with YouTube embeds:
- **pt** → `https://www.youtube.com/embed/EpmPylLq2PI`
- **es** → `https://www.youtube.com/embed/LKHEwubIb0M`
- **fr** → `https://www.youtube.com/embed/vKkOWuJg5sg`
- **en** → `https://www.youtube.com/embed/n2dt_xUeY28`

### 3. Clean up unused imports
Remove imports for `award1Img`, `award2Img`, `award3Img`, `award4Img`, `badge2Img` since they will no longer be used.

