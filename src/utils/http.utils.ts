import axios from 'axios';
import * as fs from 'node:fs';

export const downloadImage = (url: string, image_path: string) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    (response) =>
      new Promise<void>((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', (e: any) => reject(e));
      }),
  );
