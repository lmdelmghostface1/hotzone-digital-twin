"""Compose side-by-side and 50% overlay comparison images, and report
objective similarity metrics between a model render and a reference photo.

The metrics are NOT a fidelity verdict - they are reproducible numbers
(brightness, contrast, edge density, colour/histogram similarity) recorded as
evidence alongside the human visual review required by the fidelity gate.

Usage: python compare_images.py <render.png> <reference.jpg> <outdir> <basename>
"""
import json
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageStat


def metrics(model: Image.Image, ref: Image.Image) -> dict:
    ref_fit = ref.resize(model.size)
    g_model = model.convert("L")
    g_ref = ref_fit.convert("L")

    def stat(img):
        s = ImageStat.Stat(img)
        return {"mean": round(s.mean[0], 2), "stddev": round(s.stddev[0], 2)}

    def edges(img):
        e = img.filter(ImageFilter.FIND_EDGES)
        s = ImageStat.Stat(e)
        return round(s.mean[0], 2)

    def hist_cosine(a, b, bins=16):
        ha = a.histogram()[:256]
        hb = b.histogram()[:256]
        ga = [sum(ha[i * (256 // bins):(i + 1) * (256 // bins)]) for i in range(bins)]
        gb = [sum(hb[i * (256 // bins):(i + 1) * (256 // bins)]) for i in range(bins)]
        dot = sum(x * y for x, y in zip(ga, gb))
        na = sum(x * x for x in ga) ** 0.5
        nb = sum(y * y for y in gb) ** 0.5
        return round(dot / (na * nb), 4) if na and nb else 0.0

    def rgb_mean(img):
        s = ImageStat.Stat(img)
        return [round(v, 1) for v in s.mean[:3]]

    return {
        "luma": {"model": stat(g_model), "reference": stat(g_ref)},
        "edge_density": {"model": edges(g_model), "reference": edges(g_ref)},
        "rgb_mean": {"model": rgb_mean(model), "reference": rgb_mean(ref_fit)},
        "hist_cosine_gray": hist_cosine(g_model, g_ref),
        "hist_cosine_r": hist_cosine(model.getchannel("R"), ref_fit.getchannel("R")),
        "hist_cosine_g": hist_cosine(model.getchannel("G"), ref_fit.getchannel("G")),
        "hist_cosine_b": hist_cosine(model.getchannel("B"), ref_fit.getchannel("B")),
        "note": "Objective metrics only; fidelity requires human visual review. "
                "Not a match score - framing/pose differ from the photo.",
    }


def main() -> int:
    render_path, ref_path, outdir, base = sys.argv[1:5]
    render = Image.open(render_path).convert("RGB")
    ref = Image.open(ref_path).convert("RGB")

    h = render.height
    ref_scaled = ref.resize((int(ref.width * h / ref.height), h))

    gap = 8
    side = Image.new("RGB", (render.width + gap + ref_scaled.width, h + 34), (20, 24, 30))
    side.paste(render, (0, 34))
    side.paste(ref_scaled, (render.width + gap, 34))
    d = ImageDraw.Draw(side)
    d.text((8, 10), "model render (saved ref pose)", fill=(210, 210, 210))
    d.text((render.width + gap + 8, 10), "reference photo (crop = full frame)",
           fill=(210, 210, 210))
    side.save(f"{outdir}/{base}_side.png")

    ref_fit = ref_scaled.resize(render.size)
    overlay = Image.blend(render, ref_fit, 0.5)
    overlay.save(f"{outdir}/{base}_overlay.png")

    m = metrics(render, ref)
    with open(f"{outdir}/{base}_metrics.json", "w", encoding="utf-8") as fh:
        json.dump(m, fh, indent=2)
    print(f"composed {base}_side.png and {base}_overlay.png")
    print(f"metrics {base}_metrics.json: "
          f"luma(model)={m['luma']['model']['mean']} luma(ref)={m['luma']['reference']['mean']} "
          f"edges(model)={m['edge_density']['model']} edges(ref)={m['edge_density']['reference']} "
          f"hist_cos(gray)={m['hist_cosine_gray']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
