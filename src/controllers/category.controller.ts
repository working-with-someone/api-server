import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { categoryService } from '../services/';

export const getCategories = asyncCatch(async (req: Request, res: Response) => {
  const follows = await categoryService.getCategories({
    per_page: parseInt(req.query.per_page as string),
    page: parseInt(req.query.page as string),
  });

  return res.status(200).json({
    data: follows,
  });
});
