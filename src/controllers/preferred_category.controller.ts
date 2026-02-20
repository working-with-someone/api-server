import { Request, Response } from 'express';
import asyncCatch from '../utils/asyncCatch';
import { preferredCategoryService } from '../services';
import httpStatusCodes from 'http-status-codes';

export const getPreferredCategories = asyncCatch(
  async (req: Request, res: Response) => {
    const categories = await preferredCategoryService.getPreferredCategories({
      userId: res.locals.user.id,
    });

    return res.status(httpStatusCodes.OK).json({ data: categories });
  }
);

export const createPreferredCategory = asyncCatch(
  async (req: Request, res: Response) => {
    const created = await preferredCategoryService.createPreferredCategory({
      user_id: res.locals.user.id,
      category_label: req.params.category_label,
    });

    return res.status(httpStatusCodes.CREATED).json({ data: created });
  }
);

export const deletePreferredCategory = asyncCatch(
  async (req: Request, res: Response) => {
    await preferredCategoryService.deletePreferredCategory({
      user_id: res.locals.user.id,
      category_label: req.params.category_label,
    });

    return res.status(httpStatusCodes.NO_CONTENT).end();
  }
);

export const updatePreferredCategoryPriority = asyncCatch(
  async (req: Request, res: Response) => {
    const updated =
      await preferredCategoryService.updatePreferredCategoryPriority({
        user_id: res.locals.user.id,
        category_label: req.params.category_label,
        priority: Number(req.params.priority),
      });

    return res.status(httpStatusCodes.OK).json({ data: updated });
  }
);
