#!/usr/bin/env python3
"""Download the approved La Lima PBR texture channels with mat-vis."""

from pathlib import Path

from mat_vis_client import MatVisClient, MatVisError


TIER = "512"
OUTPUT_ROOT = Path(__file__).resolve().parents[2] / "public" / "materials" / "la-lima"
MATERIALS = {
    "roadAsphalt": ("ambientcg", "Asphalt007", "road-asphalt", ("color", "normal")),
    "parkingAsphalt": ("ambientcg", "Asphalt005", "parking-asphalt", ("color", "normal")),
    "grass": ("ambientcg", "Grass001", "grass", ("color",)),
    "industrialConcrete": (
        "ambientcg",
        "Concrete003",
        "industrial-concrete",
        ("color", "normal"),
    ),
    "corporateConcrete": (
        "polyhaven",
        "brushed_concrete",
        "corporate-concrete",
        ("color", "normal"),
    ),
    "industrialMetal": (
        "ambientcg",
        "CorrugatedSteel005",
        "industrial-metal",
        ("color", "normal", "metalness"),
    ),
    "corporateFacade": (
        "ambientcg",
        "Facade001",
        "corporate-facade",
        ("color", "normal", "metalness"),
    ),
    "roofProfile": (
        "polyhaven",
        "box_profile_metal_sheet",
        "roof-profile",
        ("normal", "roughness", "metalness"),
    ),
}


def format_bytes(size: int) -> str:
    value = float(size)
    for unit in ("B", "KiB", "MiB"):
        if value < 1024 or unit == "MiB":
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} B"
        value /= 1024
    return f"{value:.1f} MiB"


def main() -> None:
    client = MatVisClient()
    total_bytes = 0
    summaries: list[tuple[str, str, str, list[str], int]] = []

    for key, (source, material_id, folder, requested_channels) in MATERIALS.items():
        available = set(client.channels(source, material_id, TIER))
        output_dir = OUTPUT_ROOT / folder
        output_dir.mkdir(parents=True, exist_ok=True)
        payloads: dict[str, bytes] = {}

        for channel in requested_channels:
            if channel not in available:
                continue
            try:
                payloads[channel] = client.fetch_texture(source, material_id, channel, TIER)
            except MatVisError as error:
                print(f"warning: {key}/{channel}: {error}")
                existing = output_dir / f"{channel}.png"
                if existing.exists():
                    payloads[channel] = existing.read_bytes()

        for stale_file in output_dir.glob("*.png"):
            if stale_file.stem not in payloads:
                stale_file.unlink()
        for channel, payload in payloads.items():
            (output_dir / f"{channel}.png").write_bytes(payload)

        downloaded = list(payloads)
        material_bytes = sum(map(len, payloads.values()))

        summaries.append((key, source, material_id, downloaded, material_bytes))
        total_bytes += material_bytes

    print("La Lima material assets")
    for key, source, material_id, channels, material_bytes in summaries:
        print(
            f"- {key}: {source}/{material_id} | "
            f"channels={','.join(channels) or 'none'} | bytes={material_bytes} "
            f"({format_bytes(material_bytes)})"
        )
    print(f"Total asset footprint: {total_bytes} bytes ({format_bytes(total_bytes)})")


if __name__ == "__main__":
    main()
