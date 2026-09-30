"""
The 'AI' layer, kept deliberately simple and explainable:

1. Lay a grid over the area between origin and destination.
2. Score every cell by how hazardous it is (ice concentration,
   iceberg proximity, wave height, storm flag).
3. Run A* over that cost grid. The cheapest path is the
   recommended route.
"""

import math
import networkx as nx


def frange(start, stop, step):
    vals = []
    v = start
    while v <= stop:
        vals.append(v)
        v += step
    return vals


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def build_cost_grid(lat_range, lon_range, step, ice_lookup, iceberg_points, weather_lookup):
    g = nx.Graph()
    lats = frange(lat_range[0], lat_range[1], step)
    lons = frange(lon_range[0], lon_range[1], step)

    def node_id(la, lo):
        return (round(la, 4), round(lo, 4))

    def cell_cost(la, lo):
        ice = ice_lookup(la, lo) or 0
        weather = weather_lookup(la, lo) or {}
        iceberg_penalty = 0
        for blat, blon, size in iceberg_points:
            dist_km = haversine(la, lo, blat, blon)
            if dist_km < 50:
                iceberg_penalty += (50 - dist_km) * (1 + (size or 1) / 2)
        storm_penalty = 40 if weather.get("storm_flag") else 0
        return 1 + ice * 0.6 + (weather.get("wave_height") or 0) * 2 + storm_penalty + iceberg_penalty

    for la in lats:
        for lo in lons:
            g.add_node(node_id(la, lo), cost=cell_cost(la, lo))

    for i, la in enumerate(lats):
        for j, lo in enumerate(lons):
            here = node_id(la, lo)
            for dla, dlo in [(0, 1), (1, 0), (1, 1), (1, -1)]:
                ni, nj = i + dla, j + dlo
                if 0 <= ni < len(lats) and 0 <= nj < len(lons):
                    there = node_id(lats[ni], lons[nj])
                    weight = (g.nodes[here]["cost"] + g.nodes[there]["cost"]) / 2
                    g.add_edge(here, there, weight=weight)

    return g, node_id


def shortest_route(g, node_id, origin, destination):
    src = min(g.nodes, key=lambda n: haversine(n[0], n[1], *origin))
    dst = min(g.nodes, key=lambda n: haversine(n[0], n[1], *destination))
    path = nx.astar_path(
        g, src, dst,
        heuristic=lambda a, b: haversine(a[0], a[1], b[0], b[1]),
        weight="weight",
    )
    total_cost = sum(g.edges[path[i], path[i + 1]]["weight"] for i in range(len(path) - 1))
    return path, total_cost
