import type { Book } from "../types/Book";

export interface BookFilters {
  query: string;
  title: string;
  author: string;
  editor: string;
  distributor: string;
  description: string;
  year: string;
  volume: string;
  newStatus: "any" | "new" | "not-new";
  imageStatus: "any" | "with-images" | "without-images";
}

export const emptyBookFilters: BookFilters = {
  query: "",
  title: "",
  author: "",
  editor: "",
  distributor: "",
  description: "",
  year: "",
  volume: "",
  newStatus: "any",
  imageStatus: "any",
};

function includes(value: string, search: string): boolean {
  return value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
}

export function filterBooks(books: Book[], filters: BookFilters): Book[] {
  return books.filter((book) => {
    const imageCount =
      book.images.length +
      book.vols.reduce((count, volume) => count + volume.images.length, 0);
    const searchable = [
      book.id,
      book.title,
      book.author,
      book.editor,
      book.distributor,
      book.description,
      book.year,
      book.new ? "new" : "not new",
      ...book.vols.flatMap((volume) => [volume.title, volume.number]),
      ...book.images.flatMap((image) => [image.id, image.image_url]),
      ...book.vols.flatMap((volume) =>
        volume.images.flatMap((image) => [image.id, image.image_url]),
      ),
    ].join(" ");

    return (
      includes(searchable, filters.query) &&
      includes(book.title, filters.title) &&
      includes(book.author, filters.author) &&
      includes(book.editor, filters.editor) &&
      includes(book.distributor, filters.distributor) &&
      includes(book.description, filters.description) &&
      includes(book.year, filters.year) &&
      includes(
        book.vols.map((volume) => `${volume.title} ${volume.number}`).join(" "),
        filters.volume,
      ) &&
      (filters.newStatus === "any" ||
        book.new === (filters.newStatus === "new")) &&
      (filters.imageStatus === "any" ||
        (filters.imageStatus === "with-images"
          ? imageCount > 0
          : imageCount === 0))
    );
  });
}
