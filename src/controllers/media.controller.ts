import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { loadImage } from '../lib/s3';

export const getImage = asyncCatch(async (req: Request, res: Response) => {
  const image = await loadImage({
    key: req.params.key,
  });

  // piping이 시작되면 socket통신으로 진행되기 때문에, header를 piping이 시작되기 전에 set해줘야한다.
  res.setHeader('Content-Type', 'image/jpeg');

  image.pipe(res);

  image.on('end', () => {
    res.status(200).end();
  });
});
