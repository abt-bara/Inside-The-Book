export interface BookImage {
  id: number;
  image_url: string;
}

export interface BookVolume {
  id: number;
  title: string;
  number: number;
  images: BookImage[];
}

export interface Book {
  id: number;
  title: string;
  author: string;
  distributor: string;
  description: string;
  year: string;
  new: boolean;
  vols: BookVolume[];
  images: BookImage[];
}
