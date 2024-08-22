import { PublicUserInfo } from '../../user';
import type { File } from '../../../middleware/minions';

declare global {
  namespace Express {
    interface Request {
      user: PublicUserInfo;
      file?: File;
      files?: File[];
    }
  }
}
