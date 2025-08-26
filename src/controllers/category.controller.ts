import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { categoryService } from '../services/';
import { CategorySortKey } from '../services/category.service.d';

export const getCategories = asyncCatch(async (req: Request, res: Response) => {
  const categories = await categoryService.getCategories({
    per_page: parseInt(req.query.per_page as string),
    page: parseInt(req.query.page as string),
    sort: req.query.sort as CategorySortKey,
  });

  return res.status(200).json({
    data: categories,
  });
});
