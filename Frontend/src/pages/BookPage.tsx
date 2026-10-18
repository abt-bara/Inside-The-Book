import { useLoaderData } from "react-router-dom";
import BookGridElement from "../Components/BookGridElement";
import type { Book } from "../types/Book";

function BooksPage() {
    const books = useLoaderData();  

    return(
        <div className="books-grid">
            {books.map(
                (book : Book) => <BookGridElement key={book.id}{...book}  />
            )}
        </div>
    )
}
export default BooksPage;
