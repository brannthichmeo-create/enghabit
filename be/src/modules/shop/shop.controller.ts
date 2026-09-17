import type { Request, Response } from 'express';
import {
  shopItemQuerySchema,
  walletQuerySchema,
  type EquipItemInput,
  type ToggleFavoriteInput,
} from '@enghabit/shared';
import { BadRequestError } from '../../common/errors/app-error.js';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import * as shopService from './shop.service.js';

export async function listTypes(_req: Request, res: Response): Promise<void> {
  res.json(await shopService.listTypes());
}

export async function listItems(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery(req, shopItemQuerySchema);
  res.json(await shopService.listItems(currentUser(req).id, query));
}

export async function buyItem(req: Request, res: Response): Promise<void> {
  const user = currentUser(req);
  res.status(201).json(await shopService.buyItem(user.id, parseId(req.params.id), user.timezone));
}

export async function setFavorite(req: Request, res: Response): Promise<void> {
  const { favorite } = req.body as ToggleFavoriteInput;
  res.json(await shopService.setFavorite(currentUser(req).id, parseId(req.params.id), favorite));
}

export async function getInventory(req: Request, res: Response): Promise<void> {
  res.json(await shopService.getInventory(currentUser(req).id));
}

export async function equipItem(req: Request, res: Response): Promise<void> {
  const { itemId } = req.body as EquipItemInput;
  res.json(await shopService.equipItem(currentUser(req).id, parseId(req.params.typeId), itemId));
}

export async function unequipItem(req: Request, res: Response): Promise<void> {
  res.json(await shopService.unequipItem(currentUser(req).id, parseId(req.params.typeId)));
}

export async function getWallet(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery(req, walletQuerySchema);
  res.json(await shopService.getWallet(currentUser(req).id, query));
}

/**
 * Ảnh vật phẩm.
 *
 * Trả kèm ETag để lần tải sau nhận 304 thay vì cả tệp. Cache dài ngày an toàn vì URL
 * mang tham số `?v=<updatedAt>`: đổi ảnh là đổi URL, trình duyệt tải bản mới ngay.
 */
export async function getItemImage(req: Request, res: Response): Promise<void> {
  const image = await shopService.getItemImage(parseId(req.params.id));
  const etag = `"shop-item-${req.params.id}-${image.updatedAt.getTime()}"`;

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', image.mimeType);
  res.send(image.data);
}

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
