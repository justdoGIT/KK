#!/usr/bin/env python3
"""Convert ROS robot descriptions (URDF + STL/DAE meshes) into compact GLBs.

Each URDF link becomes a named glTF node nested under its parent link, so the
browser can articulate joints by rotating the child node about the joint axis.
A sibling ``<robot>.joints.json`` lists movable joints (child node + axis).

Usage:
    python scripts/assets/build_robot_glbs.py <robot-assets-dir>

``<robot-assets-dir>`` must contain sparse checkouts of:
    turtlebot3/turtlebot3_description  (ROBOTIS, Apache-2.0)
    husky/husky_description            (Clearpath Robotics, BSD-3-Clause)
    unitree_ros/robots/go2_description (Unitree Robotics, BSD-3-Clause)
and the downloaded third-party GLBs listed in ``compress_external``.

Requires: trimesh, pycollada, fast-simplification, numpy, lxml, and npx
(for ``@gltf-transform/cli`` meshopt compression).
"""

from __future__ import annotations

import json
import math
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

import fast_simplification
import numpy as np
import trimesh

REPO = Path(__file__).resolve().parents[2]
OUT_MODELS = REPO / "public" / "models" / "robots"
OUT_JOINTS = REPO / "src" / "scene" / "robots" / "joints"

# Z-up (ROS) -> Y-up (glTF): rotate -90 deg about X.
Z_UP_TO_Y_UP = trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0])


@dataclass
class Visual:
    path: Path
    origin: np.ndarray
    scale: np.ndarray
    color: tuple[float, float, float, float] | None


@dataclass
class Link:
    name: str
    visuals: list[Visual] = field(default_factory=list)


@dataclass
class Joint:
    name: str
    kind: str
    parent: str
    child: str
    origin: np.ndarray
    axis: list[float]


def origin_matrix(el: ET.Element | None) -> np.ndarray:
    if el is None:
        return np.eye(4)
    xyz = [float(v) for v in el.get("xyz", "0 0 0").split()]
    rpy = [float(v) for v in el.get("rpy", "0 0 0").split()]
    mat = trimesh.transformations.euler_matrix(rpy[0], rpy[1], rpy[2], "sxyz")
    mat[:3, 3] = xyz
    return mat


def parse_urdf(text: str, resolve) -> tuple[list[Link], list[Joint]]:
    root = ET.fromstring(text)
    colors: dict[str, tuple[float, float, float, float]] = {}
    for mat in root.findall("material"):
        rgba = mat.find("color")
        if rgba is not None:
            colors[mat.get("name", "")] = tuple(float(v) for v in rgba.get("rgba").split())
    links: list[Link] = []
    for link_el in root.findall("link"):
        link = Link(link_el.get("name"))
        for vis in link_el.findall("visual"):
            mesh_el = vis.find("geometry/mesh")
            if mesh_el is None:
                continue
            scale = np.array([float(v) for v in mesh_el.get("scale", "1 1 1").split()])
            mat_el = vis.find("material")
            color = None
            if mat_el is not None:
                c = mat_el.find("color")
                color = tuple(float(v) for v in c.get("rgba").split()) if c is not None else colors.get(mat_el.get("name", ""))
            link.visuals.append(Visual(resolve(mesh_el.get("filename")), origin_matrix(vis.find("origin")), scale, color))
        links.append(link)
    joints = []
    for j in root.findall("joint"):
        axis_el = j.find("axis")
        axis = [float(v) for v in axis_el.get("xyz").split()] if axis_el is not None else [1.0, 0.0, 0.0]
        joints.append(
            Joint(j.get("name"), j.get("type"), j.find("parent").get("link"), j.find("child").get("link"),
                  origin_matrix(j.find("origin")), axis)
        )
    return links, joints


def load_parts(visual: Visual) -> list[tuple[trimesh.Trimesh, tuple[float, ...]]]:
    """Load a mesh file with its scene transforms baked, returning (mesh, rgba) parts."""
    loaded = trimesh.load(visual.path, force=None)
    geoms = []
    if isinstance(loaded, trimesh.Scene):
        for node in loaded.graph.nodes_geometry:
            transform, geom_name = loaded.graph[node]
            geoms.append(loaded.geometry[geom_name].copy().apply_transform(transform))
    else:
        geoms.append(loaded)
    parts: list[tuple[trimesh.Trimesh, tuple[float, ...]]] = []
    for geom in geoms:
        if not isinstance(geom, trimesh.Trimesh) or len(geom.faces) == 0:
            continue
        rgba = visual.color
        if rgba is None:
            try:
                rgba = tuple(np.asarray(geom.visual.material.main_color, dtype=float) / 255.0)
            except AttributeError:
                rgba = (0.55, 0.58, 0.62, 1.0)
        geom.merge_vertices()
        parts.append((geom, rgba))
    return parts


def decimate(geom: trimesh.Trimesh, budget: int) -> trimesh.Trimesh:
    """Quadric decimation to `budget` faces, then split vertices at hard edges for CAD-like shading."""
    if len(geom.faces) > budget:
        verts, faces = fast_simplification.simplify(
            geom.vertices.astype(np.float32), geom.faces.astype(np.int32), 1.0 - budget / len(geom.faces)
        )
        geom = trimesh.Trimesh(verts, faces, process=True)
    return geom.smooth_shaded


def build(name: str, urdf_text: str, resolve, face_budget: int) -> None:
    links, joints = parse_urdf(urdf_text, resolve)
    child_links = {j.child for j in joints}
    root_link = next(link.name for link in links if link.name not in child_links)
    scene = trimesh.Scene(base_frame="robot_root")
    scene.graph.update(frame_from="robot_root", frame_to=root_link, matrix=Z_UP_TO_Y_UP)
    for j in joints:
        scene.graph.update(frame_from=j.parent, frame_to=j.child, matrix=j.origin)
    loaded = [(link, vi, visual, load_parts(visual)) for link in links for vi, visual in enumerate(link.visuals)]
    total_source = sum(len(mesh.faces) for *_, parts in loaded for mesh, _ in parts) or 1
    total_visual_faces = 0
    for link, vi, visual, parts in loaded:
        for pi, (source, rgba) in enumerate(parts):
            budget = max(400, int(face_budget * len(source.faces) / total_source))
            mesh = decimate(source, budget)
            mesh = trimesh.Trimesh(mesh.vertices * visual.scale, mesh.faces, process=False)
            mesh.apply_transform(visual.origin)
            mesh.visual = trimesh.visual.TextureVisuals(
                material=trimesh.visual.material.PBRMaterial(
                    baseColorFactor=[int(c * 255) for c in rgba], metallicFactor=0.35, roughnessFactor=0.5
                )
            )
            total_visual_faces += len(mesh.faces)
            scene.add_geometry(mesh, node_name=f"{link.name}__v{vi}_{pi}", geom_name=f"{link.name}_{vi}_{pi}",
                               parent_node_name=link.name)
    OUT_MODELS.mkdir(parents=True, exist_ok=True)
    OUT_JOINTS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / f"{name}.glb"
        raw.write_bytes(scene.export(file_type="glb"))
        subprocess.run(
            ["npx", "-y", "@gltf-transform/cli@4", "meshopt", str(raw), str(OUT_MODELS / f"{name}.glb")],
            check=True, stdout=subprocess.DEVNULL,
        )
    movable = [
        {"name": j.name, "type": j.kind, "child": j.child, "axis": j.axis}
        for j in joints if j.kind in ("revolute", "continuous", "prismatic")
    ]
    (OUT_JOINTS / f"{name}.json").write_text(json.dumps({"root": root_link, "joints": movable}, indent=2) + "\n")
    print(f"{name}: {total_visual_faces} faces, {len(movable)} movable joints")


def compress_external(src: Path) -> None:
    """Meshopt-compress the third-party character/vehicle GLBs (see public/models/CREDITS.md)."""
    targets = {
        "robot-expressive.glb": "characters/robot-expressive.glb",
        "nasa-astronaut.glb": "characters/nasa-astronaut.glb",
        "sportscar.glb": "vehicles/sports-car.glb",
    }
    for source, dest in targets.items():
        out = OUT_MODELS.parent / dest
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "meshopt", str(src / source), str(out)],
                       check=True, stdout=subprocess.DEVNULL)


HUSKY_URDF = """<robot name="husky">
  <material name="husky_yellow"><color rgba="0.98 0.72 0.1 1"/></material>
  <material name="dark"><color rgba="0.12 0.13 0.15 1"/></material>
  <link name="base_link"><visual><geometry><mesh filename="base_link.dae"/></geometry></visual></link>
  <link name="top_chassis_link"><visual><geometry><mesh filename="top_chassis.dae"/></geometry>
    <material name="husky_yellow"/></visual></link>
  <joint name="top_chassis_joint" type="fixed"><parent link="base_link"/><child link="top_chassis_link"/></joint>
  <link name="front_bumper_link"><visual><geometry><mesh filename="bumper.dae"/></geometry></visual></link>
  <joint name="front_bumper" type="fixed"><origin xyz="0.48 0 0.091"/><parent link="base_link"/>
    <child link="front_bumper_link"/></joint>
  <link name="rear_bumper_link"><visual><geometry><mesh filename="bumper.dae"/></geometry></visual></link>
  <joint name="rear_bumper" type="fixed"><origin xyz="-0.48 0 0.091" rpy="0 0 3.14159"/><parent link="base_link"/>
    <child link="rear_bumper_link"/></joint>
  <link name="user_rail_link"><visual><geometry><mesh filename="user_rail.dae"/></geometry></visual></link>
  <joint name="user_rail" type="fixed"><origin xyz="0.272 0 0.245"/><parent link="base_link"/>
    <child link="user_rail_link"/></joint>
  <link name="top_plate_link"><visual><geometry><mesh filename="top_plate.dae"/></geometry>
    <material name="dark"/></visual></link>
  <joint name="top_plate_joint" type="fixed"><origin xyz="0.0812 0 0.245"/><parent link="base_link"/>
    <child link="top_plate_link"/></joint>
  {wheels}
</robot>"""

HUSKY_WHEEL = """<link name="{p}_wheel_link"><visual><geometry><mesh filename="wheel.dae"/></geometry>
    <material name="dark"/></visual></link>
  <joint name="{p}_wheel" type="continuous"><origin xyz="{x} {y} 0.03282"/><axis xyz="0 1 0"/>
    <parent link="base_link"/><child link="{p}_wheel_link"/></joint>"""


def main() -> None:
    src = Path(sys.argv[1]).expanduser().resolve()
    tb3 = src / "turtlebot3" / "turtlebot3_description"
    tb3_text = (tb3 / "urdf" / "turtlebot3_waffle_pi.urdf").read_text().replace("${namespace}", "")
    build("turtlebot3", tb3_text, lambda f: tb3 / f.split("turtlebot3_description/")[1], 36000)

    husky = src / "husky" / "husky_description" / "meshes"
    wheels = "\n  ".join(
        HUSKY_WHEEL.format(p=p, x=x, y=y)
        for p, x, y in (("front_left", 0.256, 0.2775), ("front_right", 0.256, -0.2775),
                        ("rear_left", -0.256, 0.2775), ("rear_right", -0.256, -0.2775))
    )
    build("husky", HUSKY_URDF.replace("{wheels}", wheels), lambda f: husky / f, 30000)

    go2 = src / "unitree_ros" / "robots" / "go2_description"
    go2_text = (go2 / "urdf" / "go2_description.urdf").read_text()
    build("go2", go2_text, lambda f: go2 / f.split("go2_description/")[1], 48000)
    compress_external(src)


if __name__ == "__main__":
    main()
