#!/bin/bash
# Compress a screen recording for the site + extract its poster frame.
#
#   ./videos/compress.sh ~/Desktop/SnapVideo2.mp4 snap-org-page
#
# Produces:
#   videos/snap-org-page.mp4          H.264, plays everywhere
#   videos/snap-org-page-poster.jpg   first frame, shows instantly
#
# Then add it to the case study in index.html:
#   vid:    "videos/snap-org-page.mp4",
#   poster: "videos/snap-org-page-poster.jpg",
#   aspect: "1 / 1",     <- must match the real shape, or it crops
#   narrow: true         <- caps width; use for square/phone clips
#
# Reference result: SnapVideo1.mp4 went 13 MB -> 767 KB.

set -euo pipefail

# ffmpeg comes bundled with the imageio-ffmpeg python package — nothing to install.
FF="$HOME/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"

SRC="${1:?usage: compress.sh <source-video> <output-name>}"
NAME="${2:?usage: compress.sh <source-video> <output-name>}"
SIZE="${3:-1080}"   # optional: long edge in px. 1080 is plenty.

OUT="$(cd "$(dirname "$0")" && pwd)"

[ -x "$FF" ] || { echo "ffmpeg not found at:"; echo "  $FF"; echo "Run: python3 -m pip install --user imageio-ffmpeg"; exit 1; }

"$FF" -y -i "$SRC" \
  -an \
  -vf "scale='min($SIZE,iw)':'min($SIZE,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,fps=30" \
  -c:v libx264 -profile:v high -crf 20 -preset slow \
  -pix_fmt yuv420p -movflags +faststart \
  "$OUT/$NAME.mp4"

"$FF" -y -i "$OUT/$NAME.mp4" -frames:v 1 -update 1 -q:v 3 "$OUT/$NAME-poster.jpg"

echo
echo "  $NAME.mp4          $(du -h "$OUT/$NAME.mp4" | cut -f1)"
echo "  $NAME-poster.jpg   $(du -h "$OUT/$NAME-poster.jpg" | cut -f1)"
echo "  was               $(du -h "$SRC" | cut -f1)"

# ── what each flag is doing ──────────────────────────────────────────
# -an                strip the audio track. These loops are silent, and an
#                    unused audio track still costs bandwidth.
# fps=30             source was 60fps. UI recordings don't need it; this
#                    alone removes half the frames.
# force_divisible_by=2
#                    x264 refuses odd dimensions. An unusual aspect ratio can
#                    scale to something like 1440x569 and fail the encode, so
#                    round both edges down to even.
# -c:v libx264       THE IMPORTANT ONE. Recordings off a Mac come out as
#                    HEVC, which Firefox can't play at all and Chrome only
#                    handles on some hardware. H.264 plays everywhere.
#                    Do this even if the file is already small.
# -crf 20            quality target, not a bitrate. Lower = better = bigger.
#                    20 keeps UI text crisp. 23 if you want smaller.
#                    Screen recordings are ~97% static frames, so they
#                    compress far better than real video at the same CRF.
# -preset slow       encoder works harder for a smaller file. Costs time
#                    at export only, never at playback.
# -pix_fmt yuv420p   required or Safari shows a black frame.
# -movflags +faststart
#                    moves the index to the front of the file so playback
#                    can start before the download finishes.
#
# Don't upscale. Recording small and scaling up looks mushy; record at full
# Retina resolution and let this script scale down.
