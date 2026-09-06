import type { Request, Response } from 'express';
import {
  postQuerySchema,
  type CreateCommentInput,
  type CreatePostInput,
  type UserRole,
} from '@enghabit/shared';
import { currentUser } from '../../common/middlewares/auth-guard.js';
import { getValidatedQuery } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as communityService from './community.service.js';

/** Người đang xem — quyền xoá bài và bình luận phụ thuộc cả id lẫn vai trò. */
function viewer(req: Request): { id: number; role: UserRole } {
  const user = currentUser(req);
  return { id: user.id, role: user.role };
}

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await communityService.listPosts(viewer(req), getValidatedQuery(req, postQuerySchema)));
}

export async function detail(req: Request, res: Response): Promise<void> {
  res.json(await communityService.getPost(parseId(req.params.id), viewer(req)));
}

export async function create(req: Request, res: Response): Promise<void> {
  const post = await communityService.createPost(viewer(req), req.body as CreatePostInput);
  res.status(201).json(post);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await communityService.deletePost(parseId(req.params.id), viewer(req));
  res.status(204).send();
}

export async function comment(req: Request, res: Response): Promise<void> {
  const created = await communityService.createComment(
    parseId(req.params.id),
    currentUser(req).id,
    req.body as CreateCommentInput,
  );
  res.status(201).json(created);
}

export async function removeComment(req: Request, res: Response): Promise<void> {
  await communityService.deleteComment(parseId(req.params.id), viewer(req));
  res.status(204).send();
}

export async function like(req: Request, res: Response): Promise<void> {
  res.json(await communityService.toggleLike(parseId(req.params.id), currentUser(req).id));
}

/**
 * Trả nội dung một tệp đính kèm.
 *
 * Bốn header ở đây đều có lý do bảo mật, đừng bỏ bớt:
 *  - `Content-Type` lấy từ giá trị ĐÃ LƯU (qua danh sách trắng lúc đăng), không phải
 *    thứ client gửi lên, nên không ép trình duyệt diễn giải tệp thành HTML được.
 *  - `nosniff` chặn trình duyệt tự đoán kiểu khác với kiểu ta khai báo.
 *  - `Content-Disposition: attachment` cho mọi thứ không phải ảnh — tệp chỉ tải về,
 *    không bao giờ mở trong tab và chạy trong ngữ cảnh trang.
 *  - Tên tệp mã hoá theo RFC 5987 vì tên tiếng Việt có dấu không nằm trong latin-1.
 */
export async function attachment(req: Request, res: Response): Promise<void> {
  const file = await communityService.getAttachmentContent(parseId(req.params.id), currentUser(req).id);

  const asciiName = file.fileName.replace(/[^\x20-\x7E]/g, '_');
  const disposition = file.isImage ? 'inline' : 'attachment';

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
  );
  // Tệp không đổi sau khi đăng nên cho phép lưu đệm; `private` vì cần đăng nhập mới xem được.
  res.setHeader('Cache-Control', 'private, max-age=3600');

  res.send(file.data);
}

function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('ID không hợp lệ');
  return id;
}
