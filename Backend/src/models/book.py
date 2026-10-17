from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    author: Mapped[str] = mapped_column(String(100), default="")
    editor: Mapped[str] = mapped_column(String(100), default="")
    distributor: Mapped[str] = mapped_column(String(100), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    year: Mapped[str] = mapped_column(String(10), default="")
    new: Mapped[bool] = mapped_column(default=False)

    vols: Mapped[list["Vol"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )
    images: Mapped[list["BookImage"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )


class Vol(Base):
    __tablename__ = "vols"

    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    title: Mapped[str] = mapped_column(String(200))
    number: Mapped[int] = mapped_column(default=0)

    book: Mapped["Book"] = relationship(back_populates="vols")
    images: Mapped[list["VolImage"]] = relationship(
        back_populates="vol",
        cascade="all, delete-orphan",
    )


class VolImage(Base):
    __tablename__ = "vol_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    vol_id: Mapped[int] = mapped_column(ForeignKey("vols.id"))
    image_url: Mapped[str]
    storage_key: Mapped[str | None] = mapped_column(String, nullable=True)

    vol: Mapped["Vol"] = relationship(back_populates="images")


class BookImage(Base):
    __tablename__ = "book_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    image_url: Mapped[str]
    storage_key: Mapped[str | None] = mapped_column(String, nullable=True)

    book: Mapped["Book"] = relationship(back_populates="images")
