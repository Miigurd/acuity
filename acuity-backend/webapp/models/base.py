from flask_sqlalchemy import SQLAlchemy
from flask_sqlalchemy.model import Model
from sqlalchemy.orm import DeclarativeBase


class Base(Model, DeclarativeBase):
    """Declarative base for ACUITY's typed SQLAlchemy models.

    Combines Flask-SQLAlchemy's ``Model`` (provides ``query``) with SQLAlchemy's
    ``DeclarativeBase`` (provides ``Mapped``-based type inference for Pyright).
    """


db = SQLAlchemy()
Base.__fsa__ = db
db.metadatas[None] = Base.metadata