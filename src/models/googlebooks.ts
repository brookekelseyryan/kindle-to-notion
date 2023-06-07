import axios, { AxiosResponse } from 'axios';
import { GroupedClipping } from "../interfaces";
import { writeToFile } from '../utils';

export class GoogleBooks {
    private TRIES = 2;  // set pretty low right now cause there's a low limit for google books. 
    private TIMEOUT = 1000;
  
    /* Given the Google Books ID, return a large or medium image link if it exists. */
    private getQualityImage = async (ID: string): Promise<string | undefined> => {
      await new Promise((resolve) => setTimeout(resolve, this.TIMEOUT));
      const apiUrl = `https://www.googleapis.com/books/v1/volumes/${ID}?fields=id,volumeInfo(title,imageLinks)`;
      console.log("volume apiURL: " + apiUrl);
  
      try {
        const response: AxiosResponse = await axios.get(apiUrl);
        const { large, medium } = response.data?.volumeInfo?.imageLinks ?? {};
  
        return large ?? medium ?? undefined;
      } catch (error) {
        console.log("Error:" + error);
        return undefined;
      }
    };

    private getQualityImageForItem = async (bookData : any, i: number): Promise<string | undefined> => {
        if (!bookData || !bookData[i]) {
            console.log("No book data");
            return "";
        }
        const id = bookData[i]?.id;
        if (id) {
            return await this.getQualityImage(id);
        } else {
            return undefined;
        }
    };

    public removeQuestionMarks(input: string): string {
        return input.replace(/[?:]/g, '');
    };

    /* Function to find a high-resolution book cover image from Google Books API. Returns blank string if not found after X tries. */
    public getBookCoverUrl = async (title: string, author: any): Promise<string> => {
        title = this.removeQuestionMarks(title);
        let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${title}`; 
        if (author) {
            apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${title}+inauthor:${author}`;
        }
        console.log("apiURL: " + apiUrl);

        const response = await this.getBookData(apiUrl);
        const bookData = response !== null ? response.items : null;

        if (bookData) {
            for (let i = 0; i < this.TRIES; i++) {
                const imgUrlBook1 = await this.getQualityImageForItem(bookData, i);
    
                if (imgUrlBook1) {
                    console.log(`🔥 Medium/Large URL (i=${i}):`);
                    return imgUrlBook1;
                }
            }

            // If we can't find any large images after X tries, use the thumbnail image instead. 
            const thumbnail = bookData[0]?.volumeInfo?.imageLinks?.thumbnail;
            if (thumbnail) {
                console.log("🎞 Thumbnail URL: ");
                return thumbnail;
            } 
        }
        return "";       
    };
  
    private getBookData = async (apiUrl: string): Promise<any> => {
      await new Promise((resolve) => setTimeout(resolve, this.TIMEOUT));
      try {
        const response: AxiosResponse = await axios.get(apiUrl);
        return response.data;
      } catch (error) {
        console.error("Error retrieving book data:", error);
        return undefined;
      }
    };

    /* Method to export the final grouped clippings to a file */
    exportGroupedClippings = (books: GroupedClipping[]) => {
        writeToFile(books, "grouped-clippings-covers.json", "data");
    };

    /* Method to add book covers to all books. */
    getBookCovers = async (books: GroupedClipping[]): Promise<GroupedClipping[]> => {
        const updatedBooks: GroupedClipping[] = [];
      
        for (const book of books) {
          const { title, author, highlights } = book;
          console.log("---------------------");
          console.log("📝 Title: " + title);
          console.log("🙋 Author: " + author);
          let bookCoverUrl = await this.getBookCoverUrl(title, undefined);
          console.log(bookCoverUrl);
          console.log();
          const updatedBook: GroupedClipping = {
              title,
              author,
              highlights,
              bookCoverUrl
          };
          updatedBooks.push(updatedBook);
        }
      
        return updatedBooks;
    };

    /* Wrapper method to process clippings */
    processCovers = async (books: GroupedClipping[]): Promise<GroupedClipping[]> => {
        const processedBooks = await this.getBookCovers(books);
        this.exportGroupedClippings(processedBooks);
        return processedBooks;
    };

  }
  