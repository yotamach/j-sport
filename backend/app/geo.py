from geoalchemy2 import Geography, Geometry
from sqlalchemy import cast, func


def make_point(lat: float, lng: float):
    """Geography point from lat/lng (PostGIS takes lng first)."""
    return cast(func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326), Geography)


def lat_of(col):
    return func.ST_Y(cast(col, Geometry))


def lng_of(col):
    return func.ST_X(cast(col, Geometry))
