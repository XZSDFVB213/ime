import {
  Component,
  computed,
  signal,
} from '@angular/core';

import {
  MatIconModule,
} from '@angular/material/icon';


export interface LibraryBook {
  id: string;

  title: string;

  authors?: string;

  publisher?: string;

  year?: number;

  isbn?: string;

  type?: string;

  imageUrl?: string;

  url?: string;
}


@Component({
  selector: 'app-student-library',

  standalone: true,

  imports: [
    MatIconModule,
  ],

  templateUrl:
    './student-library.html',

  styleUrl:
    './student-library.scss',
})
export class StudentLibrary {
  /*
   * Пока false.
   *
   * Когда подключим IPR API,
   * будем определять это уже
   * через backend.
   */
  readonly apiConnected =
    signal(false);


  readonly books =
    signal<LibraryBook[]>([]);


  readonly loading =
    signal(false);


  readonly search =
    signal('');


  readonly filteredBooks =
    computed(() => {
      const query =
        this.search()
          .trim()
          .toLowerCase();


      if (!query) {
        return this.books();
      }


      return this.books()
        .filter((book) => {
          return (
            book.title
              .toLowerCase()
              .includes(query) ||

            book.authors
              ?.toLowerCase()
              .includes(query) ||

            book.publisher
              ?.toLowerCase()
              .includes(query) ||

            book.isbn
              ?.toLowerCase()
              .includes(query)
          );
        });
    });


  setSearch(
    value: string,
  ): void {
    this.search.set(value);
  }
}